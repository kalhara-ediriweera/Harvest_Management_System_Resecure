const jwt = require("jsonwebtoken");

const AUTH_COOKIE_NAME = "harvest_access_token";
const AUTH_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Authentication cookie configuration
const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: AUTH_COOKIE_MAX_AGE,
  path: "/",
};

// Store JWT inside an HttpOnly cookie
const setAuthCookie = (res, token) => {
  res.cookie(
    AUTH_COOKIE_NAME,
    token,
    authCookieOptions
  );
};

module.exports = {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
  authCookieOptions,
  generateToken,
  setAuthCookie,
};
