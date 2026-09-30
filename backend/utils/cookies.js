/**
 * Helper to extract and decode a cookie value by name from request headers.
 * Does not throw on malformed URI encoding.
 */
const getCookie = (req, name) => {
  if (!req || !req.headers || typeof req.headers.cookie !== "string") {
    return null;
  }

  const cookieHeader = req.headers.cookie;
  const prefix = `${name}=`;

  const cookiePair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookiePair) {
    return null;
  }

  const rawValue = cookiePair.slice(prefix.length);

  try {
    return decodeURIComponent(rawValue);
  } catch (e) {
    return rawValue;
  }
};

module.exports = {
  getCookie,
};
