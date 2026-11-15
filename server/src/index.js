// FILE          : index.js
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Juan Felipe Montero Cortes
// FIRST VERSION : 2026-11-15
// DESCRIPTION   : Starting point of the API. Loads the .env file, makes
//                 sure the needed settings exist, and starts the server.

require("dotenv").config();

const createApp = require("./app");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const port = Number(process.env.PORT) || 3000;

createApp().listen(port, () => {
  console.log(`HerdTrack API listening on http://localhost:${port}`);
});
