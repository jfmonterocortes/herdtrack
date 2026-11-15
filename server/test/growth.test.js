const test = require("node:test");
const assert = require("node:assert");
const { toKg, calculateGrowth } = require("../src/lib/growth");

test("toKg converts pounds to kg", () => {
  assert.strictEqual(toKg(100, "LB"), 45.36);
  assert.strictEqual(toKg(250, "KG"), 250);
});

test("growth with no weights", () => {
  const result = calculateGrowth([]);
  assert.strictEqual(result.currentWeight, null);
  assert.strictEqual(result.averageDailyGain, null);
});

test("growth with one weight", () => {
  const result = calculateGrowth([{ date: "2026-10-01", weightKg: 200 }]);
  assert.strictEqual(result.currentWeight, 200);
  assert.strictEqual(result.totalGain, null);
  assert.strictEqual(result.averageDailyGain, null);
});

test("growth with several weights", () => {
  const result = calculateGrowth([
    { date: "2026-11-10", weightKg: "260.00" },
    { date: "2026-10-01", weightKg: "200.00" },
    { date: "2026-10-20", weightKg: "228.50" },
  ]);
  assert.strictEqual(result.currentWeight, 260);
  assert.strictEqual(result.totalGain, 60);
  assert.strictEqual(result.averageDailyGain, 1.5);
});

test("growth when the animal loses weight", () => {
  const result = calculateGrowth([
    { date: "2026-10-01", weightKg: 300 },
    { date: "2026-10-11", weightKg: 295 },
  ]);
  assert.strictEqual(result.totalGain, -5);
  assert.strictEqual(result.averageDailyGain, -0.5);
});
