const jwt = require("jsonwebtoken");
const User = require("../models/User");

const AUTH_COOKIE_NAME =
  "harvest_access_token";


// Extract JWT from authentication cookie
const getTokenFromCookie = (req) => {

  const cookieHeader =
    req.headers.cookie || "";

  const cookiePair =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) =>
        part.startsWith(
          `${AUTH_COOKIE_NAME}=`
        )
      );

  if (!cookiePair) {
    return null;
  }

  return decodeURIComponent(
    cookiePair.slice(
      AUTH_COOKIE_NAME.length + 1
    )
  );
};


// Protect authenticated routes
const protect = async (
  req,
  res,
  next
) => {

  const token =
    getTokenFromCookie(req);


  if (!token) {

    return res.status(401).json({
      message:
        "Not authorized, no authentication cookie"
    });
  }


  try {

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    const user =
      await User
        .findById(decoded.id)
        .select("-password");


    if (!user) {

      return res.status(401).json({
        message:
          "Not authorized, user not found"
      });
    }


    req.user = user;

    return next();

  } catch (err) {

    return res.status(401).json({
      message:
        "Not authorized, token failed"
    });
  }
};


// Role authorization
const roleAuth = (roles) => {

  return (req, res, next) => {

    if (
      !req.user ||
      !roles.includes(
        req.user.role
      )
    ) {

      return res.status(403).json({
        message:
          "Permission denied"
      });
    }

    next();
  };
};


module.exports = {
  protect,
  roleAuth
};