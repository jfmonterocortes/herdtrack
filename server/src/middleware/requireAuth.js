// FILE          : requireAuth.js
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Juan Felipe Montero Cortes
// FIRST VERSION : 2026-11-15
// DESCRIPTION   : Checks the JWT in the "Authorization: Bearer <token>"
//                 header. If it is good, it puts the user's id and farm id
//                 on req.user so routes can filter data to that farm.
//
//                 TEMPORARY: Nathaniel owns authentication. This is only
//                 here so the weights routes can run before his auth code
//                 is merged. It expects the token to hold { userId, farmId }.
//                 When his version lands, keep his and delete this one.

const jwt = require("jsonwebtoken");

// requireAuth
// What it does : Stops the request with 401 if there is no valid token.
//                Otherwise saves { id, farmId } on req.user and moves on.
// Parameters   : req, res, next - the normal Express middleware arguments
// Returns      : nothing (calls next() or sends a 401 reply)
function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "You need to log in." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number(payload.userId);
    const farmId = Number(payload.farmId);

    if (!Number.isInteger(userId) || !Number.isInteger(farmId)) {
      return res.status(401).json({ error: "Your login is not valid." });
    }

    req.user = { id: userId, farmId };
    return next();
  } catch {
    return res.status(401).json({ error: "Your login is not valid or has expired." });
  }
}

module.exports = requireAuth;
