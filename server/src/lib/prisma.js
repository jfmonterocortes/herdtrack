// FILE          : prisma.js
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Juan Felipe Montero Cortes
// FIRST VERSION : 2026-11-15
// DESCRIPTION   : Makes one shared Prisma client for the whole API.
//                 Every route file imports this instead of making its own,
//                 so we do not open too many database connections.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
