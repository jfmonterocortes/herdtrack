function toKg(weight, unit) {
  if (unit === "LB") {
    return Math.round(weight * 0.453592 * 100) / 100;
  }
  return Math.round(weight * 100) / 100;
}

function calculateGrowth(weights) {
  if (weights.length === 0) {
    return {
      currentWeight: null,
      totalGain: null,
      averageDailyGain: null,
    };
  }

  const sorted = weights.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const firstKg = Number(first.weightKg);
  const lastKg = Number(last.weightKg);

  const totalGain = Math.round((lastKg - firstKg) * 100) / 100;
  const days = Math.round((new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24));

  let averageDailyGain = null;
  if (days > 0) {
    averageDailyGain = Math.round((totalGain / days) * 1000) / 1000;
  }

  return {
    currentWeight: lastKg,
    totalGain: sorted.length > 1 ? totalGain : null,
    averageDailyGain: averageDailyGain,
  };
}

module.exports = { toKg, calculateGrowth };
