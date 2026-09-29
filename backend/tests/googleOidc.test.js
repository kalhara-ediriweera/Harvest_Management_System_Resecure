const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Set test environment variables before requiring any modules
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_super_secret_key_at_least_32_characters_long_12345";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.GOOGLE_CLIENT_ID = "mock_client_id.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "mock_client_secret_xyz";
process.env.GOOGLE_REDIRECT_URI = "http://localhost:5000/api/auth/google/callback";

// In-memory fake User model
class FakeUser {
  static users = [];

  static reset() {
    FakeUser.users = [];
  }

  static findOne(query) {
    const executeQuery = async () => {
      let match = null;
      if (query.googleId) {
        match = FakeUser.users.find((u) => u.googleId === query.googleId);
      } else if (query.email) {
        if (typeof query.email === "string") {
          match = FakeUser.users.find(
            (u) => u.email.toLowerCase() === query.email.toLowerCase()
          );
        } else if (query.email.$regex) {
          const pattern = query.email.$regex.replace(/^\^|\$$/g, "");
          match = FakeUser.users.find(
            (u) => u.email.toLowerCase() === pattern.toLowerCase()
          );
        }
      }
      return match || null;
    };

    return {
      select: () => executeQuery(),
      then: (resolve, reject) => executeQuery().then(resolve, reject),
    };
  }

  static findById(id) {
    const executeQuery = async () => {
      const match = FakeUser.users.find((u) => u._id === id);
      return match || null;
    };
    return {
      select: () => executeQuery(),
      then: (resolve, reject) => executeQuery().then(resolve, reject),
    };
  }

  static async create(data) {
    const user = new FakeUser(data);
    FakeUser.users.push(user);
    return user;
  }

  constructor(data) {
    this._id = "user_" + Math.random().toString(36).substring(2, 10);
    Object.assign(this, data);
  }

  async save() {
    const index = FakeUser.users.findIndex((u) => u._id === this._id);
    if (index !== -1) {
      FakeUser.users[index] = this;
    } else {
      FakeUser.users.push(this);
    }
    return this;
  }

  toObject() {
    return { ...this };
  }

  async correctPassword(candidatePassword, userPassword) {
    if (!userPassword) return false;
    return bcrypt.compare(candidatePassword, userPassword);
  }

  async matchPassword(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }
}

// Stub User in require.cache
const userModelPath = require.resolve("../models/User");
require.cache[userModelPath] = {
  id: userModelPath,
  filename: userModelPath,
  loaded: true,
  exports: FakeUser,
};

// Stub googleOidc.getClient
const googleOidc = require("../utils/googleOidc");

let mockClaims = null;
let callbackShouldThrow = null;

const mockClient = {
  authorizationUrl: (opts) => {
    return `https://accounts.google.com/o/oauth2/v2/auth?response_type=${opts.response_type}&client_id=${process.env.GOOGLE_CLIENT_ID}&scope=${encodeURIComponent(opts.scope)}&state=${opts.state}&nonce=${opts.nonce}&code_challenge=${opts.code_challenge}&code_challenge_method=${opts.code_challenge_method}&prompt=${opts.prompt}`;
  },
  callbackParams: (req) => {
    return {
      code: req.query.code,
      state: req.query.state,
      error: req.query.error,
    };
  },
  callback: async (redirectUri, params, checks) => {
    if (callbackShouldThrow) {
      throw callbackShouldThrow;
    }
    if (checks && checks.state && params.state && checks.state !== params.state) {
      const err = new Error("state mismatch");
      err.name = "RPError";
      throw err;
    }
    return {
      access_token: "mock_google_access_token_secret_12345",
      id_token: "mock_google_id_token_secret_67890",
      claims: () => mockClaims,
    };
  },
};

googleOidc.getClient = async () => mockClient;

// Build clean test Express app mounting authRoute
const authRoute = require("../routes/authRoute");
const app = express();
app.use(express.json());
app.use("/api/auth", authRoute);

// Helper to extract cookie from Set-Cookie headers
const getSetCookieHeader = (res, cookieName) => {
  const raw = res.headers["set-cookie"];
  if (!raw) return null;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.find((c) => c.startsWith(`${cookieName}=`)) || null;
};

// Helper to sign a mock valid transaction cookie
const createTxCookie = (payloadOverrides = {}) => {
  const payload = {
    purpose: "oidc_tx",
    state: "test_state_123",
    nonce: "test_nonce_456",
    cv: "test_code_verifier_789",
    role: "farmer",
    ...payloadOverrides,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" });
};

describe("Google OIDC Authentication & Security Tests", () => {
  beforeEach(() => {
    FakeUser.reset();
    mockClaims = {
      sub: "google_sub_1001",
      email: "testuser@gmail.com",
      name: "Test User",
      email_verified: true,
    };
    callbackShouldThrow = null;
  });

  // 1. Start endpoint URL and cookie verification
  it("1. GET /api/auth/google returns 302 to Google with PKCE, state, nonce, and harvest_oidc_tx cookie", async () => {
    const res = await request(app).get("/api/auth/google");

    assert.equal(res.status, 302);
    const location = res.headers.location;
    assert.ok(location.startsWith("https://accounts.google.com"));
    assert.ok(location.includes("response_type=code"));
    assert.ok(location.includes("scope=openid%20email%20profile") || location.includes("scope=openid+email+profile"));
    assert.ok(location.includes("state="));
    assert.ok(location.includes("nonce="));
    assert.ok(location.includes("code_challenge="));
    assert.ok(location.includes("code_challenge_method=S256"));

    const txCookie = getSetCookieHeader(res, "harvest_oidc_tx");
    assert.ok(txCookie, "harvest_oidc_tx cookie must be set");
    assert.ok(txCookie.includes("HttpOnly"));
    assert.ok(txCookie.includes("Path=/api/auth/google"));
    assert.ok(txCookie.toLowerCase().includes("samesite=lax"));

    // Verify max-age <= 600 seconds
    const maxAgeMatch = txCookie.match(/Max-Age=(\d+)/i);
    if (maxAgeMatch) {
      assert.ok(parseInt(maxAgeMatch[1], 10) <= 600);
    }
  });

  // 2. Role parameter sanitization
  it("2. ?role=admin and ?role=garbage are ignored (set to farmer); ?role=buyer is accepted", async () => {
    // Admin query attempt -> should become farmer
    const resAdmin = await request(app).get("/api/auth/google?role=admin");
    const cookieAdmin = getSetCookieHeader(resAdmin, "harvest_oidc_tx");
    const tokenAdmin = cookieAdmin.split(";")[0].split("=")[1];
    const decodedAdmin = jwt.verify(tokenAdmin, process.env.JWT_SECRET);
    assert.equal(decodedAdmin.role, "farmer");

    // Garbage query attempt -> should become farmer
    const resGarbage = await request(app).get("/api/auth/google?role=attacker_role");
    const cookieGarbage = getSetCookieHeader(resGarbage, "harvest_oidc_tx");
    const tokenGarbage = cookieGarbage.split(";")[0].split("=")[1];
    const decodedGarbage = jwt.verify(tokenGarbage, process.env.JWT_SECRET);
    assert.equal(decodedGarbage.role, "farmer");

    // Buyer query -> buyer accepted
    const resBuyer = await request(app).get("/api/auth/google?role=buyer");
    const cookieBuyer = getSetCookieHeader(resBuyer, "harvest_oidc_tx");
    const tokenBuyer = cookieBuyer.split(";")[0].split("=")[1];
    const decodedBuyer = jwt.verify(tokenBuyer, process.env.JWT_SECRET);
    assert.equal(decodedBuyer.role, "buyer");
  });

  // 3. Callback without transaction cookie
  it("3. Callback without the transaction cookie -> 302 to /login?error=google_state", async () => {
    const res = await request(app)
      .get("/api/auth/google/callback?code=mock_code&state=mock_state");

    assert.equal(res.status, 302);
    assert.equal(res.headers.location, "http://localhost:5173/login?error=google_state");
    assert.equal(getSetCookieHeader(res, "harvest_access_token"), null);
  });

  // 4. Callback with tampered or expired transaction cookie
  it("4. Callback with a tampered or expired transaction cookie -> google_state", async () => {
    // Tampered cookie
    const resTampered = await request(app)
      .get("/api/auth/google/callback?code=mock_code&state=test_state_123")
      .set("Cookie", "harvest_oidc_tx=tampered_invalid_token;");

    assert.equal(resTampered.status, 302);
    assert.equal(resTampered.headers.location, "http://localhost:5173/login?error=google_state");

    // Expired cookie
    const expiredToken = jwt.sign(
      { purpose: "oidc_tx", state: "test_state_123", nonce: "n", cv: "cv", role: "farmer" },
      process.env.JWT_SECRET,
      { expiresIn: "-1s" }
    );
    const resExpired = await request(app)
      .get("/api/auth/google/callback?code=mock_code&state=test_state_123")
      .set("Cookie", `harvest_oidc_tx=${expiredToken};`);

    assert.equal(resExpired.status, 302);
    assert.equal(resExpired.headers.location, "http://localhost:5173/login?error=google_state");
  });

  // 5. State mismatch protection
  it("5. Callback with a state different from the cookie -> failure and no session cookie", async () => {
    const txCookie = createTxCookie({ state: "expected_state_abc" });
    const res = await request(app)
      .get("/api/auth/google/callback?code=mock_code&state=mismatched_state_xyz")
      .set("Cookie", `harvest_oidc_tx=${txCookie};`);

    assert.equal(res.status, 302);
    assert.equal(res.headers.location, "http://localhost:5173/login?error=google_state");
    assert.equal(getSetCookieHeader(res, "harvest_access_token"), null);
  });

  // 6. Google error=access_denied
  it("6. Google error=access_denied -> google_denied", async () => {
    const txCookie = createTxCookie({ state: "state_123" });
    const res = await request(app)
      .get("/api/auth/google/callback?error=access_denied&state=state_123")
      .set("Cookie", `harvest_oidc_tx=${txCookie};`);

    assert.equal(res.status, 302);
    assert.equal(res.headers.location, "http://localhost:5173/login?error=google_denied");
    assert.equal(getSetCookieHeader(res, "harvest_access_token"), null);
  });

  // 7. email_verified: false
  it("7. email_verified: false -> google_unverified_email, no user created, no session cookie", async () => {
    mockClaims = {
      sub: "google_unverified_sub",
      email: "unverified@gmail.com",
      email_verified: false,
    };
    const txCookie = createTxCookie({ state: "valid_state" });

    const res = await request(app)
      .get("/api/auth/google/callback?code=valid_code&state=valid_state")
      .set("Cookie", `harvest_oidc_tx=${txCookie};`);

    assert.equal(res.status, 302);
    assert.equal(res.headers.location, "http://localhost:5173/login?error=google_unverified_email");
    assert.equal(FakeUser.users.length, 0);
    assert.equal(getSetCookieHeader(res, "harvest_access_token"), null);
  });

  // 8. New user provisioning
  it("8. New user: created with googleId, no password, role farmer or buyer, session cookie set, redirect to /auth/callback", async () => {
    mockClaims = {
      sub: "google_new_sub_999",
      email: "newuser@example.com",
      name: "New Google Farmer",
      email_verified: true,
    };
    const txCookie = createTxCookie({ state: "new_user_state", role: "farmer" });

    const res = await request(app)
      .get("/api/auth/google/callback?code=code123&state=new_user_state")
      .set("Cookie", `harvest_oidc_tx=${txCookie};`);

    assert.equal(res.status, 302);
    assert.equal(res.headers.location, "http://localhost:5173/auth/callback");

    // Verify user in memory
    assert.equal(FakeUser.users.length, 1);
    const created = FakeUser.users[0];
    assert.equal(created.googleId, "google_new_sub_999");
    assert.equal(created.email, "newuser@example.com");
    assert.equal(created.role, "farmer");
    assert.equal(created.password, undefined);

    // Verify session cookie
    const sessionCookie = getSetCookieHeader(res, "harvest_access_token");
    assert.ok(sessionCookie, "Session cookie harvest_access_token must be set");
    assert.ok(sessionCookie.includes("HttpOnly"));
    assert.ok(sessionCookie.toLowerCase().includes("samesite=lax"));

    // Verify session token contents
    const token = sessionCookie.split(";")[0].split("=")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(decoded.id, created._id);
    assert.equal(decoded.role, "farmer");
  });

  // 9. Existing user found by googleId
  it("9. Existing user found by googleId is logged in with the existing role", async () => {
    const existing = await FakeUser.create({
      name: "Existing Buyer",
      email: "buyer@example.com",
      googleId: "google_sub_existing_buyer",
      role: "buyer",
    });

    mockClaims = {
      sub: "google_sub_existing_buyer",
      email: "buyer@example.com",
      name: "Existing Buyer",
      email_verified: true,
    };
    // Tx cookie requests 'farmer', but existing role 'buyer' must be preserved!
    const txCookie = createTxCookie({ state: "state_buyer", role: "farmer" });

    const res = await request(app)
      .get("/api/auth/google/callback?code=code123&state=state_buyer")
      .set("Cookie", `harvest_oidc_tx=${txCookie};`);

    assert.equal(res.status, 302);
    assert.equal(res.headers.location, "http://localhost:5173/auth/callback");

    const sessionCookie = getSetCookieHeader(res, "harvest_access_token");
    assert.ok(sessionCookie);
    const token = sessionCookie.split(";")[0].split("=")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(decoded.id, existing._id);
    assert.equal(decoded.role, "buyer"); // Preserved
  });

  // 10. Existing local farmer with verified email is linked
  it("10. Existing local farmer with the same verified email is linked (googleId set, password kept)", async () => {
    const existingFarmer = await FakeUser.create({
      name: "Local Farmer",
      email: "localfarmer@example.com",
      password: "$2a$12$somehashedpasswordstring12345",
      role: "farmer",
    });

    mockClaims = {
      sub: "google_sub_to_link",
      email: "localfarmer@example.com",
      email_verified: true,
    };
    const txCookie = createTxCookie({ state: "state_link" });

    const res = await request(app)
      .get("/api/auth/google/callback?code=code123&state=state_link")
      .set("Cookie", `harvest_oidc_tx=${txCookie};`);

    assert.equal(res.status, 302);
    assert.equal(res.headers.location, "http://localhost:5173/auth/callback");

    assert.equal(existingFarmer.googleId, "google_sub_to_link");
    assert.equal(existingFarmer.password, "$2a$12$somehashedpasswordstring12345");
  });

  // 11. Existing local admin with same email -> google_admin_link_blocked
  it("11. Existing local admin with the same email -> google_admin_link_blocked, no session", async () => {
    const existingAdmin = await FakeUser.create({
      name: "System Administrator",
      email: "admin@example.com",
      password: "$2a$12$someadminhashedpasswordstring",
      role: "admin",
    });

    mockClaims = {
      sub: "google_attacker_sub",
      email: "admin@example.com",
      email_verified: true,
    };
    const txCookie = createTxCookie({ state: "state_admin_attempt" });

    const res = await request(app)
      .get("/api/auth/google/callback?code=code123&state=state_admin_attempt")
      .set("Cookie", `harvest_oidc_tx=${txCookie};`);

    assert.equal(res.status, 302);
    assert.equal(res.headers.location, "http://localhost:5173/login?error=google_admin_link_blocked");

    // Admin account must not be linked
    assert.equal(existingAdmin.googleId, undefined);
    assert.equal(getSetCookieHeader(res, "harvest_access_token"), null);
  });

  // 12. Google-only account cannot sign in through POST /api/auth/login
  it("12. A Google-only account cannot sign in through POST /api/auth/login (any password, including empty)", async () => {
    // User without password (created through Google)
    await FakeUser.create({
      name: "Google Only User",
      email: "googleonly@example.com",
      googleId: "google_sub_xyz",
      role: "farmer",
    });

    // Attempt 1: empty password
    const res1 = await request(app)
      .post("/api/auth/login")
      .send({ email: "googleonly@example.com", password: "" });
    assert.equal(res1.status, 401);
    assert.equal(getSetCookieHeader(res1, "harvest_access_token"), null);

    // Attempt 2: random password
    const res2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "googleonly@example.com", password: "Password123!" });
    assert.equal(res2.status, 401);
    assert.equal(getSetCookieHeader(res2, "harvest_access_token"), null);

    // Attempt 3: omitted password
    const res3 = await request(app)
      .post("/api/auth/login")
      .send({ email: "googleonly@example.com" });
    assert.equal(res3.status, 401);
    assert.equal(getSetCookieHeader(res3, "harvest_access_token"), null);
  });

  // 13. Transaction cookie cleared on both success and failure
  it("13. The transaction cookie is cleared on both success and failure", async () => {
    // 13a. On Success
    mockClaims = {
      sub: "google_clear_test_sub",
      email: "cleartest@example.com",
      email_verified: true,
    };
    const successTx = createTxCookie({ state: "success_state" });
    const resSuccess = await request(app)
      .get("/api/auth/google/callback?code=code123&state=success_state")
      .set("Cookie", `harvest_oidc_tx=${successTx};`);

    assert.equal(resSuccess.status, 302);
    const successClearedCookie = getSetCookieHeader(resSuccess, "harvest_oidc_tx");
    assert.ok(successClearedCookie, "harvest_oidc_tx must be cleared on success");
    assert.ok(
      successClearedCookie.includes("Max-Age=0") ||
      successClearedCookie.includes("Expires=")
    );

    // 13b. On Failure (e.g. state mismatch)
    const failTx = createTxCookie({ state: "expected_state" });
    const resFail = await request(app)
      .get("/api/auth/google/callback?code=code123&state=wrong_state")
      .set("Cookie", `harvest_oidc_tx=${failTx};`);

    assert.equal(resFail.status, 302);
    const failClearedCookie = getSetCookieHeader(resFail, "harvest_oidc_tx");
    assert.ok(failClearedCookie, "harvest_oidc_tx must be cleared on failure");
    assert.ok(
      failClearedCookie.includes("Max-Age=0") ||
      failClearedCookie.includes("Expires=")
    );
  });

  // 14. Zero Google token leakage
  it("14. No response body, redirect URL or cookie contains any Google token", async () => {
    mockClaims = {
      sub: "google_leak_check_sub",
      email: "leakcheck@example.com",
      email_verified: true,
    };
    const txCookie = createTxCookie({ state: "leak_state" });

    const res = await request(app)
      .get("/api/auth/google/callback?code=code123&state=leak_state")
      .set("Cookie", `harvest_oidc_tx=${txCookie};`);

    assert.equal(res.status, 302);

    // Check location header
    const location = res.headers.location || "";
    assert.ok(!location.includes("mock_google_access_token_secret"));
    assert.ok(!location.includes("mock_google_id_token_secret"));

    // Check response body
    const bodyStr = JSON.stringify(res.body) + (res.text || "");
    assert.ok(!bodyStr.includes("mock_google_access_token_secret"));
    assert.ok(!bodyStr.includes("mock_google_id_token_secret"));

    // Check cookies
    const allSetCookies = (res.headers["set-cookie"] || []).join("; ");
    assert.ok(!allSetCookies.includes("mock_google_access_token_secret"));
    assert.ok(!allSetCookies.includes("mock_google_id_token_secret"));
  });
});
