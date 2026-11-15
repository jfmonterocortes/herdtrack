// FILE          : httpError.js
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Juan Felipe Montero Cortes
// FIRST VERSION : 2026-11-15
// DESCRIPTION   : A small error class that carries an HTTP status code.
//                 Routes throw it (for example a 404 or 400), and the
//                 error handler in app.js turns it into a JSON reply.

// HttpError
// What it does : An Error that also remembers which HTTP status to send.
// Parameters   : status  - HTTP status code, for example 400 or 404
//                message - short text for the user
//                details - optional extra info (for example a list of
//                          form fields that are wrong)
// Returns      : a new HttpError object
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = HttpError;
