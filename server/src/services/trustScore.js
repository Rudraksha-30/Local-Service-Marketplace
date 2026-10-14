/**
 * Trust Score Engine  (FR-19, FR-20, FR-21, NFR-1, NFR-11)
 *
 * This is the "hook" of the whole project, so it is deliberately:
 *   - PURE: takes plain numbers/objects in, returns a result. No database here.
 *   - ISOLATED: lives in its own file so the formula can change without
 *     touching booking or review code (NFR-11, separation of concerns).
 *   - EXPLAINABLE: returns a per-signal breakdown, not just one number, so the
 *     provider dashboard (and you, in the viva) can show WHY the score is what it is.
 *
 * FORMULA (each signal is first normalised to the range 0..1):
 *
 *   raw = 100 * ( 0.40 * completionRate
 *               + 0.30 * recencyWeightedRating
 *               + 0.20 * responseTimeScore
 *               + 0.10 * disputeScore )
 *
 *   final = 50 + (raw - 50) * confidence          <-- cold-start shrinkage
 *
 * WHY THESE WEIGHTS?
 *   completion rate (0.40)  hardest signal to fake: a provider either turned up
 *                           and finished the job, or cancelled on the customer.
 *   rating          (0.30)  useful but subjective and easy to inflate.
 *   response time   (0.20)  shows reliability/professionalism, but matters less
 *                           than actually doing the job.
 *   disputes        (0.10)  rare events, so a small weight; still a penalty.
 *
 * COLD START (FR-21): a brand-new provider has no data, so "raw" would be
 * meaningless. We pull the score toward a neutral 50 using a confidence factor
 * that grows with the number of completed jobs:
 *      confidence = min(1, completedJobs / FULL_CONFIDENCE_JOBS)
 * With 0 jobs the score is exactly 50; with 10+ jobs it is fully "raw".
 */

const WEIGHTS = Object.freeze({
  completion: 0.4,
  rating: 0.3,
  responseTime: 0.2,
  disputes: 0.1,
});

const CONFIG = Object.freeze({
  NEUTRAL_SCORE: 50,
  FULL_CONFIDENCE_JOBS: 10, // completed jobs needed before raw score is fully trusted
  NEW_PROVIDER_MAX_REVIEWS: 3, // below this many reviews -> "New Provider" badge
  RATING_HALF_LIFE_DAYS: 90, // a review loses half its weight every 90 days
  FAST_RESPONSE_MINUTES: 30, // responding within this = perfect response score
  SLOW_RESPONSE_MINUTES: 24 * 60, // responding after this = zero response score
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const round1 = (x) => Math.round(x * 10) / 10;

/**
 * completed / (completed + cancelledByProvider)
 * Only bookings that reached "accepted" count: a provider is judged on
 * promises they actually made. No history -> neutral 0.5.
 */
function completionRate(completedCount, providerCancelledCount) {
  const total = completedCount + providerCancelledCount;
  if (total === 0) return 0.5;
  return clamp01(completedCount / total);
}

/**
 * Recency-weighted average rating, normalised to 0..1 (rating / 5).
 * weight = 0.5 ^ (ageInDays / halfLife)  -> exponential decay.
 * reviews: [{ rating: 1..5, createdAt: Date }]
 * No reviews -> neutral 0.5.
 */
function recencyWeightedRating(reviews, now = new Date()) {
  if (!reviews || reviews.length === 0) return 0.5;

  let weightedSum = 0;
  let weightTotal = 0;
  for (const r of reviews) {
    const ageDays = Math.max(0, (now - new Date(r.createdAt)) / MS_PER_DAY);
    const weight = Math.pow(0.5, ageDays / CONFIG.RATING_HALF_LIFE_DAYS);
    weightedSum += r.rating * weight;
    weightTotal += weight;
  }
  if (weightTotal === 0) return 0.5;
  return clamp01(weightedSum / weightTotal / 5);
}

/**
 * Average minutes taken to accept/reject requests -> 0..1
 * <= FAST  => 1,  >= SLOW => 0,  linear in between.
 * No data -> neutral 0.5.
 */
function responseTimeScore(avgResponseMinutes) {
  if (avgResponseMinutes === null || avgResponseMinutes === undefined) return 0.5;
  const { FAST_RESPONSE_MINUTES: fast, SLOW_RESPONSE_MINUTES: slow } = CONFIG;
  if (avgResponseMinutes <= fast) return 1;
  if (avgResponseMinutes >= slow) return 0;
  return clamp01(1 - (avgResponseMinutes - fast) / (slow - fast));
}

/**
 * 1 - (disputes where provider was at fault / completed jobs), floored at 0.
 * No completed jobs yet -> nothing to penalise -> 1.
 */
function disputeScore(providerFaultDisputes, completedCount) {
  if (completedCount === 0) return providerFaultDisputes > 0 ? 0 : 1;
  return clamp01(1 - providerFaultDisputes / completedCount);
}

/**
 * Main entry point.
 *
 * stats = {
 *   completedCount, providerCancelledCount, providerFaultDisputes,
 *   avgResponseMinutes (number|null),
 *   reviews: [{ rating, createdAt }]
 * }
 *
 * Returns { score, rawScore, confidence, isNewProvider, reviewCount, breakdown }
 */
function calculateTrustScore(stats, now = new Date()) {
  const {
    completedCount = 0,
    providerCancelledCount = 0,
    providerFaultDisputes = 0,
    avgResponseMinutes = null,
    reviews = [],
  } = stats || {};

  const signals = {
    completion: completionRate(completedCount, providerCancelledCount),
    rating: recencyWeightedRating(reviews, now),
    responseTime: responseTimeScore(avgResponseMinutes),
    disputes: disputeScore(providerFaultDisputes, completedCount),
  };

  const rawScore =
    100 *
    (WEIGHTS.completion * signals.completion +
      WEIGHTS.rating * signals.rating +
      WEIGHTS.responseTime * signals.responseTime +
      WEIGHTS.disputes * signals.disputes);

  const confidence = Math.min(1, completedCount / CONFIG.FULL_CONFIDENCE_JOBS);
  const score = CONFIG.NEUTRAL_SCORE + (rawScore - CONFIG.NEUTRAL_SCORE) * confidence;

  return {
    score: round1(score),
    rawScore: round1(rawScore),
    confidence: round1(confidence * 100) / 100,
    isNewProvider: reviews.length < CONFIG.NEW_PROVIDER_MAX_REVIEWS,
    reviewCount: reviews.length,
    breakdown: {
      completion: { value: round1(signals.completion * 100), weight: WEIGHTS.completion },
      rating: { value: round1(signals.rating * 100), weight: WEIGHTS.rating },
      responseTime: { value: round1(signals.responseTime * 100), weight: WEIGHTS.responseTime },
      disputes: { value: round1(signals.disputes * 100), weight: WEIGHTS.disputes },
    },
  };
}

module.exports = {
  WEIGHTS,
  CONFIG,
  completionRate,
  recencyWeightedRating,
  responseTimeScore,
  disputeScore,
  calculateTrustScore,
};
