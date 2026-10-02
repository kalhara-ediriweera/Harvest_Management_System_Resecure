const jwt = require("jsonwebtoken");
const User = require("../models/User");
const googleOidc = require("../utils/googleOidc");
const { generators } = require("openid-client");
const { generateToken, setAuthCookie } = require("../utils/session");
const { getCookie } = require("../utils/cookies");

const OIDC_TX_COOKIE_NAME = "harvest_oidc_tx";
const OIDC_TX_COOKIE_PATH = "/api/auth/google";
const OIDC_TX_MAX_AGE = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Initiates the Google OpenID Connect Authorization Code Flow with PKCE (S256).
 */
exports.googleStart = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.warn("Google sign-in is disabled: missing Google OAuth configuration");
    return res.redirect(`${frontendUrl}/login?error=google_failed`);
  }

  let client;
  try {
    client = await googleOidc.getClient();
  } catch (err) {
    console.warn("Google sign-in is disabled: unable to initialize client", err.name);
    return res.redirect(`${frontendUrl}/login?error=google_failed`);
  }

  // Sanitize requested role: allow only 'farmer' or 'buyer', default to 'farmer'
  const requestedRole = req.query.role;
  const role = requestedRole === "buyer" ? "buyer" : "farmer";

  // Generate PKCE code verifier and challenge (S256), state, and nonce
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const state = generators.state();
  const nonce = generators.nonce();

  // Create signed transaction token
  const txToken = jwt.sign(
    {
      purpose: "oidc_tx",
      state,
      nonce,
      cv: codeVerifier,
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  // Store transaction state in HttpOnly, SameSite=Lax cookie
  res.cookie(OIDC_TX_COOKIE_NAME, txToken, {
    httpOnly: true,
    sameSite: "lax",
    path: OIDC_TX_COOKIE_PATH,
    secure: process.env.NODE_ENV === "production",
    maxAge: OIDC_TX_MAX_AGE,
  });

  const authorizationUrl = client.authorizationUrl({
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  return res.redirect(authorizationUrl);
};

/**
 * Handles callback from Google OIDC provider.
 */
exports.googleCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  // Helper to unconditionally clear the single-use transaction cookie
  const clearTxCookie = () => {
    res.clearCookie(OIDC_TX_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      path: OIDC_TX_COOKIE_PATH,
      secure: process.env.NODE_ENV === "production",
    });
  };

  // Helper to handle failure outcomes
  const failRedirect = (errorCode) => {
    clearTxCookie();
    return res.redirect(`${frontendUrl}/login?error=${errorCode}`);
  };

  // 1. Read transaction cookie
  const rawTxCookie = getCookie(req, OIDC_TX_COOKIE_NAME);
  if (!rawTxCookie) {
    return failRedirect("google_state");
  }

  // 2. Verify transaction JWT
  let tx;
  try {
    tx = jwt.verify(rawTxCookie, process.env.JWT_SECRET);
  } catch (err) {
    return failRedirect("google_state");
  }

  if (
    !tx ||
    tx.purpose !== "oidc_tx" ||
    !tx.state ||
    !tx.cv ||
    !tx.nonce
  ) {
    return failRedirect("google_state");
  }

  // 3. Check for error response from Google
  if (req.query.error) {
    if (req.query.error === "access_denied") {
      return failRedirect("google_denied");
    }
    return failRedirect("google_failed");
  }

  // 4. Validate state parameter
  if (!req.query.state || req.query.state !== tx.state) {
    return failRedirect("google_state");
  }

  // 5. Get client and exchange authorization code with PKCE
  let client;
  try {
    client = await googleOidc.getClient();
  } catch (err) {
    console.error("Failed to get Google OIDC client:", err.name);
    return failRedirect("google_failed");
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const params = client.callbackParams(req);

  let tokenSet;
  try {
    tokenSet = await client.callback(redirectUri, params, {
      code_verifier: tx.cv,
      state: tx.state,
      nonce: tx.nonce,
    });
  } catch (err) {
    console.error("OIDC callback exchange/validation error:", err.name);
    return failRedirect("google_state");
  }

  const claims = typeof tokenSet.claims === "function" ? tokenSet.claims() : null;
  if (!claims) {
    return failRedirect("google_failed");
  }

  // 6. Verify verified email claim
  if (claims.email_verified !== true) {
    return failRedirect("google_unverified_email");
  }

  const sub = claims.sub;
  const rawEmail = claims.email;
  if (!sub || typeof sub !== "string" || !rawEmail || typeof rawEmail !== "string") {
    return failRedirect("google_failed");
  }

  const email = rawEmail.trim().toLowerCase();

  // 7. Find or create local user
  let user;
  try {
    // 7.1. Look up by googleId === sub
    user = await User.findOne({ googleId: sub }).select("+googleId");

    if (!user) {
      // 7.2. Look up by normalized email
      const existingUser = await User.findOne({ email }).select("+googleId");

      if (existingUser) {
        // Refuse linking admin accounts
        if (existingUser.role === "admin") {
          return failRedirect("google_admin_link_blocked");
        }
        // Link existing farmer or buyer
        existingUser.googleId = sub;
        await existingUser.save();
        user = existingUser;
      } else {
        // 7.3. Create new user
        const userName =
          typeof claims.name === "string" && claims.name.trim()
            ? claims.name.trim()
            : email.split("@")[0];
        const assignedRole = tx.role === "buyer" ? "buyer" : "farmer";

        user = await User.create({
          name: userName,
          email,
          googleId: sub,
          role: assignedRole,
        });
      }
    }
  } catch (err) {
    console.error("User provisioning error in Google callback:", err.name);
    return failRedirect("google_failed");
  }

  // 8. Clear transaction cookie on success
  clearTxCookie();

  // 9. Generate token and redirect to frontend with token in URL
  const token = generateToken(user._id, user.role);

  return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
};
