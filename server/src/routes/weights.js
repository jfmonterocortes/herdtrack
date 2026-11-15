// FILE          : weights.js
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Juan Felipe Montero Cortes
// FIRST VERSION : 2026-11-15
// DESCRIPTION   : Routes for weigh-ins and growth stats. Mounted under /api.
//                   GET    /animals/:id/weights   list weigh-ins, oldest first
//                   POST   /animals/:id/weights   log a new weigh-in
//                   PUT    /weights/:weightId     edit a weigh-in
//                   DELETE /weights/:weightId     delete a weigh-in
//                   GET    /animals/:id/growth    current weight, total gain,
//                                                 average daily gain (kg/day)
//                 Every query is filtered by the logged-in user's farm, so
//                 one farm can never see or change another farm's animals.
//                 Weights are always saved and sent back in kg. A request can
//                 send pounds with unit: "LB" (or the user's saved unit).

const express = require("express");
const prisma = require("../lib/prisma");
const HttpError = require("../lib/httpError");
const requireAuth = require("../middleware/requireAuth");
const { parseWeightInput, formatWeight, calculateGrowth } = require("../lib/weights");

const router = express.Router();

// parseId
// What it does : Turns a URL id like "12" into a number, or throws a 404
//                if it is not a positive whole number.
// Parameters   : value - the id text from the URL
//                label - what the id is for, used in the error message
// Returns      : the id as a number
function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(404, `${label} not found.`);
  }
  return id;
}

// findFarmAnimal
// What it does : Loads an animal only if it belongs to the user's farm.
// Parameters   : animalId - the animal's id
//                farmId   - the logged-in user's farm id
// Returns      : the animal ({ id, birthDate }); throws 404 if not found
async function findFarmAnimal(animalId, farmId) {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, farmId },
    select: { id: true, birthDate: true },
  });
  if (!animal) throw new HttpError(404, "Animal not found.");
  return animal;
}

// findFarmWeight
// What it does : Loads a weigh-in only if its animal belongs to the user's farm.
// Parameters   : weightId - the weigh-in's id
//                farmId   - the logged-in user's farm id
// Returns      : the weigh-in with its animal's birthDate; throws 404 if not found
async function findFarmWeight(weightId, farmId) {
  const weight = await prisma.weight.findFirst({
    where: { id: weightId, animal: { farmId } },
    include: { animal: { select: { birthDate: true } } },
  });
  if (!weight) throw new HttpError(404, "Weight not found.");
  return weight;
}

// getUserUnit
// What it does : Gets the weight unit ("KG" or "LB") the user picked.
// Parameters   : userId - the logged-in user's id
// Returns      : "KG" or "LB"; throws 401 if the user no longer exists
async function getUserUnit(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { weightUnit: true },
  });
  if (!user) throw new HttpError(401, "Your login is not valid.");
  return user.weightUnit;
}

// checkInput
// What it does : Throws a 400 with the list of bad fields if there are any,
//                and checks the weigh-in is not dated before the birth date.
// Parameters   : errors    - field -> message object from parseWeightInput
//                date      - the weigh-in date (or undefined if not changed)
//                birthDate - the animal's birth date (or null)
// Returns      : nothing; throws HttpError(400) when something is wrong
function checkInput(errors, date, birthDate) {
  if (date && birthDate && date < birthDate) {
    errors.date = "Date can not be before the animal's birth date.";
  }
  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Some fields are not valid.", errors);
  }
}

// Auth is added to each route (not with router.use) so this router never
// blocks other /api routes, such as /api/auth/login, that come after it.

// GET /animals/:id/weights
// What it does : Lists all weigh-ins for one animal, oldest first.
// Parameters   : req.params.id - the animal's id
// Returns      : 200 with an array of weigh-ins
router.get("/animals/:id/weights", requireAuth, async (req, res) => {
  const animalId = parseId(req.params.id, "Animal");
  await findFarmAnimal(animalId, req.user.farmId);

  const rows = await prisma.weight.findMany({
    where: { animalId },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });

  res.json(rows.map(formatWeight));
});

// POST /animals/:id/weights
// What it does : Logs a new weigh-in for one animal.
// Parameters   : req.params.id - the animal's id
//                req.body      - { date, weight, unit?, notes? }
// Returns      : 201 with the new weigh-in
router.post("/animals/:id/weights", requireAuth, async (req, res) => {
  const animalId = parseId(req.params.id, "Animal");
  const animal = await findFarmAnimal(animalId, req.user.farmId);
  const defaultUnit = await getUserUnit(req.user.id);

  const { data, errors } = parseWeightInput(req.body, { defaultUnit });
  checkInput(errors, data.date, animal.birthDate);

  const row = await prisma.weight.create({
    data: { ...data, animalId },
  });

  res.status(201).json(formatWeight(row));
});

// PUT /weights/:weightId
// What it does : Edits a weigh-in. Only the fields sent are changed.
// Parameters   : req.params.weightId - the weigh-in's id
//                req.body            - any of { date, weight, unit, notes }
// Returns      : 200 with the updated weigh-in
router.put("/weights/:weightId", requireAuth, async (req, res) => {
  const weightId = parseId(req.params.weightId, "Weight");
  const existing = await findFarmWeight(weightId, req.user.farmId);
  const defaultUnit = await getUserUnit(req.user.id);

  const { data, errors } = parseWeightInput(req.body, { defaultUnit, partial: true });
  checkInput(errors, data.date, existing.animal.birthDate);

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "Send at least one field to change: date, weight or notes.");
  }

  const row = await prisma.weight.update({
    where: { id: weightId },
    data,
  });

  res.json(formatWeight(row));
});

// DELETE /weights/:weightId
// What it does : Deletes a weigh-in.
// Parameters   : req.params.weightId - the weigh-in's id
// Returns      : 204 with no body
router.delete("/weights/:weightId", requireAuth, async (req, res) => {
  const weightId = parseId(req.params.weightId, "Weight");
  await findFarmWeight(weightId, req.user.farmId);

  await prisma.weight.delete({ where: { id: weightId } });

  res.status(204).end();
});

// GET /animals/:id/growth
// What it does : Works out growth stats for one animal from all its weigh-ins.
// Parameters   : req.params.id - the animal's id
// Returns      : 200 with { animalId, unit, count, firstWeight, currentWeight,
//                totalGainKg, days, averageDailyGainKg }
router.get("/animals/:id/growth", requireAuth, async (req, res) => {
  const animalId = parseId(req.params.id, "Animal");
  await findFarmAnimal(animalId, req.user.farmId);

  const rows = await prisma.weight.findMany({
    where: { animalId },
    select: { date: true, weightKg: true },
  });

  res.json({ animalId, unit: "kg", ...calculateGrowth(rows) });
});

module.exports = router;
