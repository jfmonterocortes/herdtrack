// FILE          : app.js
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Juan Felipe Montero Cortes
// FIRST VERSION : 2026-11-15
// DESCRIPTION   : Builds the Express app: reads JSON bodies, mounts every
//                 route under /api, and turns errors into JSON replies.
//                 It does not start listening; index.js does that, so
//                 tests can use the app without opening a port.

const express = require("express");
const HttpError = require("./lib/httpError");
const weightsRouter = require("./routes/weights");

// createApp
// What it does : Makes a new Express app with all routes and error handling.
// Parameters   : none
// Returns      : the Express app
function createApp() {
  const app = express();

  app.use(express.json());

  // Quick check that the API is running (used by Azure App Service too).
  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  // Weights and growth: /api/animals/:id/weights, /api/animals/:id/growth,
  // /api/weights/:weightId
  app.use("/api", weightsRouter);

  // Any /api path that did not match a route.
  app.use("/api", (req, res) => {
    res.status(404).json({ error: "Not found." });
  });

  // Error handler: must have 4 arguments so Express knows it is one.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) {
      const body = { error: err.message };
      if (err.details) body.details = err.details;
      return res.status(err.status).json(body);
    }

    // Bad JSON in the request body.
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "The request body is not valid JSON." });
    }

    console.error(err);
    return res.status(500).json({ error: "Something went wrong on the server." });
  });

  return app;
}

module.exports = createApp;
