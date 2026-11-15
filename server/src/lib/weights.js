// FILE          : weights.js
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Juan Felipe Montero Cortes
// FIRST VERSION : 2026-11-15
// DESCRIPTION   : Plain helper functions for weights (no database code here,
//                 so they are easy to test):
//                 - checking and cleaning the weight form data
//                 - converting pounds to kilograms
//                 - working out growth: current weight, total gain and
//                   average daily gain (ADG) in kg per day

const KG_PER_LB = 0.45359237;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Biggest value the database column Decimal(7, 2) can hold.
const MAX_WEIGHT_KG = 99999.99;
const MAX_NOTES_LENGTH = 500;

// roundTo
// What it does : Rounds a number to a set number of decimal places.
// Parameters   : value  - the number to round
//                places - how many decimal places to keep
// Returns      : the rounded number
function roundTo(value, places) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

// toKg
// What it does : Changes a weight to kilograms.
// Parameters   : value - the weight number
//                unit  - "KG" or "LB"
// Returns      : the weight in kg, rounded to 2 decimals
function toKg(value, unit) {
  const kg = unit === "LB" ? value * KG_PER_LB : value;
  return roundTo(kg, 2);
}

// parseWeightInput
// What it does : Checks the body of a "log weight" or "edit weight" request
//                and turns it into data ready to save.
//                Body fields: date (required), weight (required, > 0),
//                unit ("KG" or "LB", optional), notes (optional).
// Parameters   : body    - the request body
//                options - { defaultUnit: "KG" | "LB",
//                            partial: true for edits, where every field is
//                            optional but the ones sent must be valid,
//                            now: Date to use as "today" (for tests) }
// Returns      : { data, errors } - data has { date, weightKg, notes }
//                (only the fields that were sent, when partial), and
//                errors is an object of field name -> message (empty if ok)
function parseWeightInput(body, options = {}) {
  const { defaultUnit = "KG", partial = false, now = new Date() } = options;
  const input = body && typeof body === "object" ? body : {};
  const data = {};
  const errors = {};

  // ----- date -----
  if (input.date === undefined || input.date === null || input.date === "") {
    if (!partial) errors.date = "Date is required.";
  } else {
    const date = new Date(input.date);
    if (typeof input.date !== "string" || Number.isNaN(date.getTime())) {
      errors.date = "Date must be a valid date, for example 2026-11-15.";
    } else if (date.getTime() > now.getTime() + MS_PER_DAY) {
      // One day of slack so a user in another time zone can log "today".
      errors.date = "Date can not be in the future.";
    } else {
      data.date = date;
    }
  }

  // ----- unit -----
  let unit = defaultUnit;
  if (input.unit !== undefined && input.unit !== null && input.unit !== "") {
    const cleanUnit = String(input.unit).toUpperCase();
    if (cleanUnit !== "KG" && cleanUnit !== "LB") {
      errors.unit = 'Unit must be "KG" or "LB".';
    } else {
      unit = cleanUnit;
    }
  }

  // ----- weight -----
  const weightMissing =
    input.weight === undefined || input.weight === null || input.weight === "";
  if (weightMissing) {
    if (!partial) errors.weight = "Weight is required.";
    if (partial && input.unit !== undefined && !errors.unit) {
      errors.weight = "Send the weight together with its unit.";
    }
  } else {
    const value = typeof input.weight === "string" ? Number(input.weight) : input.weight;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors.weight = "Weight must be a number.";
    } else if (value <= 0) {
      errors.weight = "Weight must be more than 0.";
    } else if (!errors.unit) {
      const weightKg = toKg(value, unit);
      if (weightKg <= 0) {
        errors.weight = "Weight is too small.";
      } else if (weightKg > MAX_WEIGHT_KG) {
        errors.weight = "Weight is too large.";
      } else {
        data.weightKg = weightKg;
      }
    }
  }

  // ----- notes -----
  if (input.notes !== undefined) {
    if (input.notes === null || input.notes === "") {
      data.notes = null;
    } else if (typeof input.notes !== "string") {
      errors.notes = "Notes must be text.";
    } else if (input.notes.length > MAX_NOTES_LENGTH) {
      errors.notes = `Notes can be at most ${MAX_NOTES_LENGTH} characters.`;
    } else {
      data.notes = input.notes.trim() || null;
    }
  }

  return { data, errors };
}

// formatWeight
// What it does : Turns a Weight row from the database into the JSON shape
//                the API sends back (weightKg as a normal number).
// Parameters   : row - a Weight row from Prisma
// Returns      : { id, animalId, date, weightKg, notes }
function formatWeight(row) {
  return {
    id: row.id,
    animalId: row.animalId,
    date: row.date,
    weightKg: Number(row.weightKg),
    notes: row.notes,
  };
}

// calculateGrowth
// What it does : Works out growth stats from a list of weigh-ins.
//                Total gain = latest weight - first weight.
//                Average daily gain = total gain / days between them.
// Parameters   : weights - array of { date, weightKg } (any order)
// Returns      : { count, firstWeight, currentWeight, totalGainKg, days,
//                  averageDailyGainKg }
//                firstWeight and currentWeight are { date, weightKg } or null.
//                totalGainKg, days and averageDailyGainKg are null when
//                there are not enough weigh-ins (fewer than 2, or all on
//                the same day) to work them out.
function calculateGrowth(weights) {
  const sorted = [...weights]
    .map((w) => ({ date: new Date(w.date), weightKg: Number(w.weightKg) }))
    .sort((a, b) => a.date - b.date);

  const result = {
    count: sorted.length,
    firstWeight: null,
    currentWeight: null,
    totalGainKg: null,
    days: null,
    averageDailyGainKg: null,
  };

  if (sorted.length === 0) return result;

  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  result.firstWeight = first;
  result.currentWeight = latest;

  if (sorted.length < 2) return result;

  const totalGainKg = roundTo(latest.weightKg - first.weightKg, 2);
  const days = Math.round((latest.date - first.date) / MS_PER_DAY);
  result.totalGainKg = totalGainKg;
  result.days = days;

  if (days > 0) {
    result.averageDailyGainKg = roundTo(totalGainKg / days, 3);
  }

  return result;
}

module.exports = {
  KG_PER_LB,
  MAX_WEIGHT_KG,
  toKg,
  parseWeightInput,
  formatWeight,
  calculateGrowth,
};
