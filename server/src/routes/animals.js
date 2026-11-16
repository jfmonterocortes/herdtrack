// FILE          : animals.js
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Halvin Silva Mayes
// FIRST VERSION : 2026-11-16
// DESCRIPTION   : Endpoints to add, list, update and delete animals.

const express = require("express");
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const SEXES = ["MALE", "FEMALE"];
const STATUSES = ["ACTIVE", "SOLD", "DECEASED"];

const SORTS = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  name: { name: "asc" },
  tag: { tagNumber: "asc" },
  youngest: { birthDate: "desc" },
};

function getFarm(req, res, next) {
  if (req.headers.authorization) {
    return requireAuth(req, res, next);
  }
  if (process.env.TEST_FARM_ID) {
    req.user = { id: null, farmId: Number(process.env.TEST_FARM_ID) };
    return next();
  }
  return res.status(401).json({ error: "You need to log in" });
}

router.use("/animals", getFarm);

function readAnimal(body, partial) {
  const data = {};
  const b = body || {};

  for (const field of ["name", "species", "tagNumber"]) {
    if (b[field] === undefined) {
      if (!partial) return { error: `${field} is required` };
      continue;
    }
    if (typeof b[field] !== "string" || b[field].trim() === "") {
      return { error: `${field} can not be empty` };
    }
    data[field] = b[field].trim();
  }

  if (b.sex !== undefined || !partial) {
    if (!SEXES.includes(b.sex)) return { error: "sex must be MALE or FEMALE" };
    data.sex = b.sex;
  }

  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) {
      return { error: "status must be ACTIVE, SOLD or DECEASED" };
    }
    data.status = b.status;
  }

  if (b.breed !== undefined) {
    data.breed = typeof b.breed === "string" && b.breed.trim() ? b.breed.trim() : null;
  }

  if (b.birthDate !== undefined) {
    if (b.birthDate === null || b.birthDate === "") {
      data.birthDate = null;
    } else {
      const d = new Date(b.birthDate);
      if (isNaN(d)) return { error: "birthDate is not valid" };
      if (d > new Date()) return { error: "birthDate can not be in the future" };
      data.birthDate = d;
    }
  }

  return { data };
}

function findAnimal(id, farmId) {
  if (!Number.isInteger(id)) return null;
  return prisma.animal.findFirst({ where: { id, farmId } });
}

function isDuplicateTag(err) {
  return err && err.code === "P2002";
}

router.get("/animals", async (req, res) => {
  const { search, species, status, sort } = req.query;
  const where = { farmId: req.user.farmId };

  if (search && search.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { tagNumber: { contains: search.trim(), mode: "insensitive" } },
      { breed: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  if (species && species.trim()) {
    where.species = { equals: species.trim(), mode: "insensitive" };
  }

  if (status) {
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: "status must be ACTIVE, SOLD or DECEASED" });
    }
    where.status = status;
  }

  if (sort && !SORTS[sort]) {
    return res.status(400).json({
      error: "sort must be one of: " + Object.keys(SORTS).join(", "),
    });
  }

  const animals = await prisma.animal.findMany({
    where,
    orderBy: SORTS[sort] || SORTS.newest,
  });

  res.json(animals);
});

router.get("/animals/species", async (req, res) => {
  const rows = await prisma.animal.findMany({
    where: { farmId: req.user.farmId },
    distinct: ["species"],
    select: { species: true },
    orderBy: { species: "asc" },
  });
  res.json(rows.map((r) => r.species));
});

router.get("/animals/:id", async (req, res) => {
  const animal = await findAnimal(Number(req.params.id), req.user.farmId);
  if (!animal) return res.status(404).json({ error: "Animal not found" });
  res.json(animal);
});

router.post("/animals", async (req, res) => {
  const { error, data } = readAnimal(req.body, false);
  if (error) return res.status(400).json({ error });

  try {
    const animal = await prisma.animal.create({
      data: { ...data, farmId: req.user.farmId },
    });
    res.status(201).json(animal);
  } catch (err) {
    if (isDuplicateTag(err)) {
      return res.status(409).json({ error: "That tag number is already used on your farm" });
    }
    throw err;
  }
});

router.put("/animals/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await findAnimal(id, req.user.farmId);
  if (!existing) return res.status(404).json({ error: "Animal not found" });

  const { error, data } = readAnimal(req.body, true);
  if (error) return res.status(400).json({ error });

  try {
    const animal = await prisma.animal.update({ where: { id }, data });
    res.json(animal);
  } catch (err) {
    if (isDuplicateTag(err)) {
      return res.status(409).json({ error: "That tag number is already used on your farm" });
    }
    throw err;
  }
});

router.delete("/animals/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await findAnimal(id, req.user.farmId);
  if (!existing) return res.status(404).json({ error: "Animal not found" });

  await prisma.animal.delete({ where: { id } });
  res.status(204).send();
});

module.exports = router;