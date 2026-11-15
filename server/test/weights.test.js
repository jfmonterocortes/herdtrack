// FILE          : weights.test.js
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Juan Felipe Montero Cortes
// FIRST VERSION : 2026-11-15
// DESCRIPTION   : Unit tests for the weight helpers in src/lib/weights.js.
//                 Run with: npm test (uses Node's built-in test runner).

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  toKg,
  parseWeightInput,
  formatWeight,
  calculateGrowth,
} = require("../src/lib/weights");

const NOW = new Date("2026-11-15T12:00:00Z");

// ---------- toKg ----------

test("toKg keeps kg values and converts pounds", () => {
  assert.equal(toKg(250, "KG"), 250);
  assert.equal(toKg(100, "LB"), 45.36);
  assert.equal(toKg(1000, "LB"), 453.59);
});

// ---------- parseWeightInput (new weight) ----------

test("parseWeightInput accepts a good kg weight", () => {
  const { data, errors } = parseWeightInput(
    { date: "2026-11-01", weight: 312.456, notes: "  after weaning  " },
    { now: NOW }
  );
  assert.deepEqual(errors, {});
  assert.equal(data.weightKg, 312.46);
  assert.equal(data.notes, "after weaning");
  assert.equal(data.date.toISOString(), "2026-11-01T00:00:00.000Z");
});

test("parseWeightInput uses the user's unit when no unit is sent", () => {
  const { data, errors } = parseWeightInput(
    { date: "2026-11-01", weight: 100 },
    { defaultUnit: "LB", now: NOW }
  );
  assert.deepEqual(errors, {});
  assert.equal(data.weightKg, 45.36);
});

test("parseWeightInput lets the request unit win over the user's unit", () => {
  const { data } = parseWeightInput(
    { date: "2026-11-01", weight: 100, unit: "kg" },
    { defaultUnit: "LB", now: NOW }
  );
  assert.equal(data.weightKg, 100);
});

test("parseWeightInput accepts a weight sent as text", () => {
  const { data, errors } = parseWeightInput(
    { date: "2026-11-01", weight: "250.5" },
    { now: NOW }
  );
  assert.deepEqual(errors, {});
  assert.equal(data.weightKg, 250.5);
});

test("parseWeightInput requires date and weight", () => {
  const { errors } = parseWeightInput({}, { now: NOW });
  assert.ok(errors.date);
  assert.ok(errors.weight);
});

test("parseWeightInput rejects bad values", () => {
  const cases = [
    [{ date: "not a date", weight: 10 }, "date"],
    [{ date: "2026-12-30", weight: 10 }, "date"], // in the future
    [{ date: "2026-11-01", weight: 0 }, "weight"],
    [{ date: "2026-11-01", weight: -5 }, "weight"],
    [{ date: "2026-11-01", weight: "abc" }, "weight"],
    [{ date: "2026-11-01", weight: 100000 }, "weight"], // too big for the column
    [{ date: "2026-11-01", weight: 10, unit: "stone" }, "unit"],
    [{ date: "2026-11-01", weight: 10, notes: 42 }, "notes"],
    [{ date: "2026-11-01", weight: 10, notes: "x".repeat(501) }, "notes"],
  ];

  for (const [body, field] of cases) {
    const { errors } = parseWeightInput(body, { now: NOW });
    assert.ok(errors[field], `expected an error on "${field}" for ${JSON.stringify(body)}`);
  }
});

// ---------- parseWeightInput (edit weight) ----------

test("parseWeightInput in partial mode only returns the fields that were sent", () => {
  const { data, errors } = parseWeightInput({ notes: "re-weighed" }, { partial: true, now: NOW });
  assert.deepEqual(errors, {});
  assert.deepEqual(data, { notes: "re-weighed" });
});

test("parseWeightInput in partial mode still checks the fields that were sent", () => {
  const { errors } = parseWeightInput({ weight: -1 }, { partial: true, now: NOW });
  assert.ok(errors.weight);
});

test("parseWeightInput in partial mode wants a weight when a unit is sent", () => {
  const { errors } = parseWeightInput({ unit: "LB" }, { partial: true, now: NOW });
  assert.ok(errors.weight);
});

test("parseWeightInput lets an edit clear the notes", () => {
  const { data } = parseWeightInput({ notes: "" }, { partial: true, now: NOW });
  assert.deepEqual(data, { notes: null });
});

// ---------- formatWeight ----------

test("formatWeight turns the database decimal into a number", () => {
  const row = {
    id: 1,
    animalId: 7,
    date: new Date("2026-11-01"),
    weightKg: { toString: () => "312.50" }, // looks like a Prisma Decimal
    notes: null,
  };
  assert.equal(formatWeight(row).weightKg, 312.5);
});

// ---------- calculateGrowth ----------

test("calculateGrowth with no weigh-ins returns empty stats", () => {
  const growth = calculateGrowth([]);
  assert.equal(growth.count, 0);
  assert.equal(growth.currentWeight, null);
  assert.equal(growth.averageDailyGainKg, null);
});

test("calculateGrowth with one weigh-in has a current weight but no gain", () => {
  const growth = calculateGrowth([{ date: "2026-10-01", weightKg: 200 }]);
  assert.equal(growth.count, 1);
  assert.equal(growth.currentWeight.weightKg, 200);
  assert.equal(growth.totalGainKg, null);
  assert.equal(growth.averageDailyGainKg, null);
});

test("calculateGrowth works out total gain and ADG, in any input order", () => {
  const growth = calculateGrowth([
    { date: "2026-11-10", weightKg: "260.00" },
    { date: "2026-10-01", weightKg: "200.00" },
    { date: "2026-10-20", weightKg: "228.50" },
  ]);
  assert.equal(growth.count, 3);
  assert.equal(growth.firstWeight.weightKg, 200);
  assert.equal(growth.currentWeight.weightKg, 260);
  assert.equal(growth.totalGainKg, 60);
  assert.equal(growth.days, 40);
  assert.equal(growth.averageDailyGainKg, 1.5);
});

test("calculateGrowth handles weight loss", () => {
  const growth = calculateGrowth([
    { date: "2026-10-01", weightKg: 300 },
    { date: "2026-10-11", weightKg: 295 },
  ]);
  assert.equal(growth.totalGainKg, -5);
  assert.equal(growth.averageDailyGainKg, -0.5);
});

test("calculateGrowth gives no ADG when all weigh-ins are on the same day", () => {
  const growth = calculateGrowth([
    { date: "2026-10-01T08:00:00Z", weightKg: 300 },
    { date: "2026-10-01T09:00:00Z", weightKg: 302 },
  ]);
  assert.equal(growth.totalGainKg, 2);
  assert.equal(growth.days, 0);
  assert.equal(growth.averageDailyGainKg, null);
});
