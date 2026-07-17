/**
 * Detect broken Unicode (U+FFFD replacement chars) from bad shell/codepage writes.
 */
const hasBrokenEncoding = (value) =>
  typeof value === 'string' && /\uFFFD/.test(value);

const isUsableText = (value) =>
  typeof value === 'string' && value.trim().length > 0 && !hasBrokenEncoding(value);

/**
 * Sanitize free-text fields: drop broken strings, trim usable ones.
 */
const sanitizeText = (value, fallback = '') => {
  if (typeof value !== 'string') return fallback;
  if (hasBrokenEncoding(value)) return fallback;
  return value.trim();
};

const sanitizeStringArray = (values) => {
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => sanitizeText(v, ''))
    .filter(Boolean);
};

/**
 * Sanitize listener score rows. Returns null if any required text field is broken
 * (caller should reject the request).
 */
const sanitizeScores = (scores) => {
  if (!Array.isArray(scores) || !scores.length) return null;
  const cleaned = [];
  for (const item of scores) {
    if (!item || typeof item !== 'object') return null;
    const criterionName = sanitizeText(item.criterionName, '');
    const tag = sanitizeText(item.tag, criterionName);
    const optionTitle = sanitizeText(item.optionTitle, '');
    const score = Number(item.score);
    if (!criterionName || !Number.isFinite(score)) return null;
    if (hasBrokenEncoding(item.criterionName) || hasBrokenEncoding(item.tag) || hasBrokenEncoding(item.optionTitle)) {
      return null;
    }
    cleaned.push({
      criterionName,
      tag: tag || criterionName,
      optionTitle,
      score
    });
  }
  return cleaned;
};

module.exports = {
  hasBrokenEncoding,
  isUsableText,
  sanitizeText,
  sanitizeStringArray,
  sanitizeScores
};
