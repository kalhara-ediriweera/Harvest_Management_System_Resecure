const { Issuer } = require("openid-client");

let cachedClient = null;

const getClient = async () => {
  if (cachedClient) {
    return cachedClient;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OIDC configuration. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI must all be set."
    );
  }

  const googleIssuer = await Issuer.discover("https://accounts.google.com");
  cachedClient = new googleIssuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [redirectUri],
    response_types: ["code"],
  });

  return cachedClient;
};

// Allows resetting the cached client for testing purposes if needed
const _resetClient = () => {
  cachedClient = null;
};

module.exports = {
  getClient,
  _resetClient,
};
