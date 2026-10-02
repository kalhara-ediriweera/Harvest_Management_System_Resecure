# Google OpenID Connect (OIDC) Authentication Architecture & Security Documentation

This document describes the implementation of "Continue with Google" sign-in for the Harvest Management System using **OpenID Connect (OIDC) Authorization Code flow with PKCE (S256)** performed exclusively on the backend as a confidential client.

---

## 1. Sequence Diagram of the Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FE as React Frontend (Vite)
    participant BE as Express Backend
    participant Google as Google Identity Provider (IdP)
    participant DB as MongoDB

    Note over User,Google: Step 1: Initiation
    User->>FE: Clicks "Continue with Google" (optional ?role=farmer|buyer)
    FE->>BE: Top-level navigation: GET /api/auth/google?role=...
    BE->>BE: Sanitize role (accepts farmer or buyer; defaults to farmer)
    BE->>BE: Generate state, nonce, PKCE code_verifier & code_challenge (S256)
    BE->>BE: Sign transaction JWT: { purpose: "oidc_tx", state, nonce, cv, role }
    BE-->>User: 302 Redirect to Google Auth URL<br/>Set-Cookie: harvest_oidc_tx (HttpOnly, SameSite=Lax, Path=/api/auth/google, Max-Age=10m)

    Note over User,Google: Step 2: User Authentication & Consent
    User->>Google: Authenticates and grants OpenID scopes (openid, email, profile)
    Google-->>User: 302 Redirect to /api/auth/google/callback?code=...&state=...

    Note over User,DB: Step 3: Backend Token Exchange & Claim Verification
    User->>BE: GET /api/auth/google/callback?code=...&state=...<br/>(Cookie: harvest_oidc_tx)
    BE->>BE: Read & verify harvest_oidc_tx JWT
    BE->>BE: Clear harvest_oidc_tx cookie immediately (single-use guarantee)
    BE->>BE: Validate state parameter matches transaction cookie state
    BE->>Google: POST /token (Exchange code + PKCE code_verifier + client_secret)
    Google-->>BE: Return TokenSet (ID Token, Access Token)
    BE->>BE: Validate ID Token signature via Google JWKS (iss, aud, exp, nonce)
    BE->>BE: Verify claims.email_verified === true
    BE->>BE: Extract sub and normalized email

    Note over BE,DB: Step 4: User Provisioning & Session Issuance
    BE->>DB: Query User by googleId === sub
    alt User found by googleId
        BE->>BE: Authenticate user (preserve existing role)
    else User not found by googleId
        BE->>DB: Query User by email
        alt Existing User is admin
            BE-->>User: 302 Redirect to /login?error=google_admin_link_blocked
        else Existing User is farmer or buyer
            BE->>DB: Link account (set googleId = sub, keep existing password & role)
        else No existing user
            BE->>DB: Create User (name, email, googleId = sub, no password, role = tx.role)
        end
    end
    BE->>BE: Sign app session JWT: generateToken(user._id, user.role)
    BE-->>User: 302 Redirect to /auth/callback<br/>Set-Cookie: harvest_access_token (HttpOnly, SameSite=Lax, Path=/, Max-Age=24h)

    Note over User,FE: Step 5: Frontend Session Restoration
    User->>FE: Top-level navigation to /auth/callback
    FE->>BE: GET /api/auth/profile (sends harvest_access_token cookie)
    BE-->>FE: Return user profile JSON
    FE->>FE: Store user profile in localStorage["user"] (no tokens stored)
    FE->>FE: Display role-specific success toast
    FE->>User: Navigate to dashboard by role (admin -> /admin-finance, farmer -> /farmer-home, buyer -> /shop)
```

---

## 2. List of Changed and Created Files

### Backend
| File | Action | Purpose |
|---|---|---|
| `backend/utils/session.js` | **Created** | Centralized session helpers: `generateToken`, `setAuthCookie`, and cookie option constants. |
| `backend/utils/cookies.js` | **Created** | Safe cookie extraction helper `getCookie(req, name)` with error-tolerant URI component decoding. |
| `backend/utils/googleOidc.js` | **Created** | Lazy Google OpenID configuration discovery (`Issuer.discover`) and `Client` factory with environment validation. |
| `backend/controllers/googleAuthController.js` | **Created** | Handlers `googleStart` and `googleCallback` implementing PKCE S256, transaction cookies, state/nonce validation, and user find-or-create logic. |
| `backend/tests/googleOidc.test.js` | **Created** | Automated unit/integration test suite covering all 14 mandatory security and functional test cases. |
| `backend/controllers/authController.js` | **Modified** | Imported session helpers from `../utils/session` and removed redundant local declarations. |
| `backend/routes/authRoute.js` | **Modified** | Registered public routes `GET /google` and `GET /google/callback`. |
| `backend/models/User.js` | **Modified** | Added `googleId` (`unique`, `sparse`, `select: false`) and updated `password` to conditional requirement (`required: function() { return !this.googleId; }`). |
| `backend/package.json` | **Modified** | Added dependencies `openid-client@^5.7.1`, `supertest@^7.3.0` (dev), and script `"test:google-oidc"`. |
| `backend/.env.example` | **Modified** | Added non-secret placeholders for Google OIDC configuration and verified `FRONTEND_URL`. |

### Frontend
| File | Action | Purpose |
|---|---|---|
| `frontend/src/config.js` | **Created** | Exposes `API_BASE_URL` based on `VITE_API_BASE_URL` with `http://localhost:5000` fallback. |
| `frontend/src/Components/GoogleSignInButton.jsx` | **Created** | Accessible button with inline SVG Google "G" logo, optional `role` parameter, and top-level navigation. |
| `frontend/src/Pages/OAuthCallback.jsx` | **Created** | Callback page handling `refreshSession()`, role navigation, React StrictMode double-call protection, and toast notifications. |
| `frontend/src/contexts/AuthContext.jsx` | **Modified** | Added `refreshSession()` and exposed it through the context provider value. |
| `frontend/src/Pages/Login.jsx` | **Modified** | Added divider, `<GoogleSignInButton />`, and allowlisted query error toast handler. |
| `frontend/src/Pages/Register.jsx` | **Modified** | Added divider and `<GoogleSignInButton role={form.role} />`. |
| `frontend/src/App.jsx` | **Modified** | Registered public route `<Route path="/auth/callback" element={<OAuthCallback />} />`. |

---

## 3. Environment Variables

Add the following environment variables to `backend/.env` (use real values in development/production; never commit `.env`):

```bash
# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server URL & Port
PORT=5000

# JWT Signing Secret (must be a strong, random string at least 32 characters)
JWT_SECRET=your_jwt_secret_key_here

# Google OAuth 2.0 Credentials (from Google Cloud Console -> APIs & Services -> Credentials)
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

### Google Cloud Console Configuration
1. **Authorized JavaScript origins**: `http://localhost:5000` and `http://localhost:5173`
2. **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`

---

## 4. How to Run the Automated Tests

The test suite in `backend/tests/googleOidc.test.js` is built with Node's native test runner (`node:test`), Node's strict assertion library (`node:assert/strict`), and `supertest`.

### Test Execution Command
From the `backend/` directory:
```bash
npm run test:google-oidc
```

Or from the root directory:
```bash
npm --prefix backend run test:google-oidc
```

### Test Strategy & Mock Isolation
- **No External Network Calls**: `utils/googleOidc.js#getClient` is stubbed to return a mock client with deterministic `authorizationUrl`, `callbackParams`, and `callback` responses.
- **In-Memory User Model**: The `User` model in `require.cache` is replaced with an in-memory `FakeUser` class supporting `findOne` (with exact match and regex emulation), `create`, `findById`, and password verification.
- **Fresh Route Mounting**: The real `backend/routes/authRoute.js` is mounted onto an isolated Express instance for end-to-end HTTP request testing via `supertest`.

### Verification Coverage
1. `GET /api/auth/google` responds with 302 to Google authorization URL containing `response_type=code`, `scope=openid email profile`, `state`, `nonce`, `code_challenge`, and `code_challenge_method=S256`, and sets `harvest_oidc_tx` HttpOnly Lax cookie with `maxAge <= 600`.
2. Role query parameter sanitization: `?role=admin` and invalid strings default to `farmer`; `?role=buyer` is accepted.
3. Callback without transaction cookie fails with 302 to `/login?error=google_state`.
4. Callback with tampered or expired transaction cookie fails with `/login?error=google_state`.
5. State mismatch between query parameter and cookie fails with `/login?error=google_state` and issues no session cookie.
6. Google `error=access_denied` redirects to `/login?error=google_denied`.
7. `email_verified: false` claims redirect to `/login?error=google_unverified_email`, no user created, no session issued.
8. New user creation: persists `googleId`, normalized email, default/requested role, no password, issues `harvest_access_token` HttpOnly cookie, and redirects to `/auth/callback`.
9. Existing user sign-in by `googleId`: existing role is preserved regardless of transaction query parameter.
10. Existing local account linking: matching verified email updates `googleId`, preserves existing password hash and role.
11. Local admin protection: existing admin account with matching email is NOT linked; redirects to `/login?error=google_admin_link_blocked`.
12. Passwordless protection: accounts created via Google cannot log in through `POST /api/auth/login` with any password (empty, incorrect, or omitted).
13. Transaction cookie clearing: `harvest_oidc_tx` is cleared on both successful authentication and every failure redirect.
14. Zero token exposure: neither access token nor ID token appears in response bodies, redirect URLs, or cookies.

---

## 5. Architectural Rationale: Why Authorization Code + PKCE on the Backend

When designing OAuth/OIDC for modern web applications, three common patterns exist:

### Comparison Matrix

| Security / Architecture Dimension | Implicit Flow (Legacy) | Frontend-Only Button (GIS / SPA) | Backend Confidential Authorization Code + PKCE |
|---|---|---|---|
| **Client Type** | Public client (browser) | Public client (browser) | **Confidential client (backend)** |
| **Client Secret Protection** | None (cannot use secret) | None (cannot use secret) | **Guaranteed (secret never leaves server)** |
| **Token Exposure to JS** | ID/Access token in URL fragment | ID/Access token directly in browser memory/JS | **Zero (tokens never reach browser)** |
| **Code Interception Defense** | N/A (no code) | N/A (no code) | **PKCE (S256) cryptographically binds code to verifier** |
| **CSRF / Replay Protection** | Weak | Requires client-side nonce checks | **Strong (backend-signed HttpOnly state & nonce)** |
| **App Session Integration** | Fragmented | Frontend must send Google token to backend for verification | **Unified: backend issues standard HttpOnly app session cookie** |
| **OAuth 2.1 Compliance** | Disallowed by IETF BCP | Not recommended for confidential apps | **Fully compliant with OAuth 2.1 & BCP** |

### Why Frontend-Only Google Button is Inferior
A frontend-only Google button delivers Google's credential (e.g. an ID token or access token) directly to JavaScript running in the browser. This presents significant security and architectural drawbacks:
1. **XSS Blast Radius**: Any cross-site scripting flaw in the frontend allows an attacker to extract Google ID tokens or access tokens directly from memory or storage.
2. **Duplicated Verification Logic**: The backend would still need to accept the ID token via a custom POST endpoint and verify Google's JWKS on every request or issue a local session anyway.
3. **Session Desynchronization**: It introduces two separate session concepts in the browser (Google's client-side state vs. the application's HttpOnly session).
4. **No True Confidential Client**: The Google Cloud Console client ID is public; without backend authentication using the Client Secret, the identity provider cannot authenticate the calling application itself.

### Why Authorization Code + PKCE on Backend Was Chosen
1. **Confidential Client Authentication**: Google authenticates our backend using both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` via backend-to-backend TLS.
2. **PKCE (Proof Key for Code Exchange) Defense-in-Depth**: Although PKCE was originally standardized for public clients (RFC 7636), OAuth 2.1 mandates PKCE for all authorization code flows. PKCE ensures that even if an authorization code is intercepted in transit or through local system logs, it cannot be exchanged for tokens without the cryptographically bound `code_verifier`.
3. **Zero Token Footprint in Browser**: Google ID tokens, access tokens, and refresh tokens remain exclusively in backend memory and are never persisted or returned to the browser.
4. **Seamless Identity Bridging**: The backend translates Google claims into the existing application session (`harvest_access_token` HttpOnly cookie) with zero modifications to the existing session model or role-based access control.

---

## 6. Residual Risks & Production Recommendations

While the implementation addresses all core authentication vulnerabilities, the following residual risks should be considered for production deployment:

### 1. Lack of Rate Limiting on Authentication Endpoints
- **Risk**: An attacker could flood `GET /api/auth/google`, `GET /api/auth/google/callback`, or `POST /api/auth/login` to exhaust server resources or attempt denial-of-service against the cryptographic signing operations.
- **Mitigation**: Implement `express-rate-limit` or an API gateway rate limiter:
  ```javascript
  const rateLimit = require("express-rate-limit");
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per window
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/auth", authLimiter);
  ```

### 2. Google OAuth Consent Screen in "Testing" Mode
- **Risk**: In Google Cloud Console, projects with consent screens set to "Testing" status are restricted to up to 100 explicitly added test Google accounts. Furthermore, user authorizations under testing status expire after 7 days.
- **Mitigation**: Before broad release, submit the Google Cloud OAuth Consent Screen for "Production" verification. Ensure privacy policy and terms of service links are configured in Google Cloud Console.

### 3. Stateless Session Revocation & Lifecycle
- **Risk**: The application session cookie `harvest_access_token` is a signed stateless JWT valid for 24 hours (`1d`). If a user's role is modified in the database or an account needs to be immediately revoked, existing JWTs remain valid until expiration.
- **Mitigation**: For sensitive operations or immediate revocation capability, implement a Redis-backed token blacklist or session version identifier (`tokenVersion`) on the `User` schema that is validated during `protect` middleware execution.

### 4. Omission of Phone Number in Google-Created Profiles
- **Risk**: Google basic profile claims (`openid email profile`) provide user `name`, `email`, and `sub`, but do NOT provide `phoneNumber`. Features relying on SMS notifications (such as Twilio order updates) will find `user.phoneNumber` undefined for Google-registered users.
- **Mitigation**: Implement a post-registration profile completion banner or modal for users where `!user.phoneNumber`, prompting them to provide a contact number before placing orders or listing harvest stock.
