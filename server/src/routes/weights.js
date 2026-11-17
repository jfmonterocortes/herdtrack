const express = require("express");
const prisma = require("../lib/prisma");
const requireAuth = require("../middleware/auth");
const { toKg, calculateGrowth } = require("../lib/growth");

const router = express.Router();

async function findAnimal(animalId, farmId) {
  if (isNaN(animalId)) return null;
  return prisma.animal.findFirst({
    where: { id: animalId, farmId: farmId },
  });
}

async function findWeight(weightId, farmId) {
  if (isNaN(weightId)) return null;
  return prisma.weight.findFirst({
    where: { id: weightId, animal: { farmId: farmId } },
  });
}

function formatWeight(weight) {
  return {
    id: weight.id,
    animalId: weight.animalId,
    date: weight.date,
    weightKg: Number(weight.weightKg),
    notes: weight.notes,
  };
}

router.get("/animals/:id/weights", requireAuth, async (req, res) => {
  const animalId = Number(req.params.id);

  const animal = await findAnimal(animalId, req.user.farmId);
  if (!animal) {
    return res.status(404).json({ error: "Animal not found" });
  }

  const weights = await prisma.weight.findMany({
    where: { animalId: animalId },
    orderBy: { date: "asc" },
  });

  res.json(weights.map(formatWeight));
});

router.post("/animals/:id/weights", requireAuth, async (req, res) => {
  const animalId = Number(req.params.id);
  const { date, weight, unit, notes } = req.body || {};

  const animal = await findAnimal(animalId, req.user.farmId);
  if (!animal) {
    return res.status(404).json({ error: "Animal not found" });
  }

  if (!date || !weight) {
    return res.status(400).json({ error: "Date and weight are required" });
  }

  if (isNaN(new Date(date))) {
    return res.status(400).json({ error: "Date is not valid" });
  }

  if (isNaN(weight) || Number(weight) <= 0) {
    return res.status(400).json({ error: "Weight must be a number greater than 0" });
  }

  if (unit && unit !== "KG" && unit !== "LB") {
    return res.status(400).json({ error: "Unit must be KG or LB" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const weightKg = toKg(Number(weight), unit || user.weightUnit);

  if (weightKg > 99999) {
    return res.status(400).json({ error: "Weight is too large" });
  }

  const newWeight = await prisma.weight.create({
    data: {
      animalId: animalId,
      date: new Date(date),
      weightKg: weightKg,
      notes: notes || null,
    },
  });

  res.status(201).json(formatWeight(newWeight));
});

router.put("/weights/:weightId", requireAuth, async (req, res) => {
  const weightId = Number(req.params.weightId);
  const { date, weight, unit, notes } = req.body || {};

  const existing = await findWeight(weightId, req.user.farmId);
  if (!existing) {
    return res.status(404).json({ error: "Weight not found" });
  }

  const data = {};

  if (date !== undefined) {
    if (isNaN(new Date(date))) {
      return res.status(400).json({ error: "Date is not valid" });
    }
    data.date = new Date(date);
  }

  if (weight !== undefined) {
    if (isNaN(weight) || Number(weight) <= 0) {
      return res.status(400).json({ error: "Weight must be a number greater than 0" });
    }
    if (unit && unit !== "KG" && unit !== "LB") {
      return res.status(400).json({ error: "Unit must be KG or LB" });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    data.weightKg = toKg(Number(weight), unit || user.weightUnit);
    if (data.weightKg > 99999) {
      return res.status(400).json({ error: "Weight is too large" });
    }
  }

  if (notes !== undefined) {
    data.notes = notes || null;
  }

  const updated = await prisma.weight.update({
    where: { id: weightId },
    data: data,
  });

  res.json(formatWeight(updated));
});

router.delete("/weights/:weightId", requireAuth, async (req, res) => {
  const weightId = Number(req.params.weightId);

  const existing = await findWeight(weightId, req.user.farmId);
  if (!existing) {
    return res.status(404).json({ error: "Weight not found" });
  }

  await prisma.weight.delete({ where: { id: weightId } });

  res.status(204).send();
});

router.get("/animals/:id/growth", requireAuth, async (req, res) => {
  const animalId = Number(req.params.id);

  const animal = await findAnimal(animalId, req.user.farmId);
  if (!animal) {
    return res.status(404).json({ error: "Animal not found" });
  }

  const weights = await prisma.weight.findMany({
    where: { animalId: animalId },
  });

  const growth = calculateGrowth(weights);

  res.json({ animalId: animalId, ...growth });
});

module.exports = router;
