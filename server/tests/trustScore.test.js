const {
  calculateTrustScore,
  completionRate,
  recencyWeightedRating,
  responseTimeScore,
  disputeScore,
  CONFIG,
} = require('../src/services/trustScore');

const NOW = new Date('2026-10-11T12:00:00Z');
const daysAgo = (d) => new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000);

describe('completionRate', () => {
  test('no history returns neutral 0.5', () => expect(completionRate(0, 0)).toBe(0.5));
  test('all completed is 1', () => expect(completionRate(8, 0)).toBe(1));
  test('mixed history', () => expect(completionRate(3, 1)).toBeCloseTo(0.75));
  test('all cancelled by provider is 0', () => expect(completionRate(0, 4)).toBe(0));
});

describe('recencyWeightedRating', () => {
  test('no reviews returns neutral 0.5', () => expect(recencyWeightedRating([], NOW)).toBe(0.5));

  test('a single 5-star review normalises to 1', () => {
    expect(recencyWeightedRating([{ rating: 5, createdAt: NOW }], NOW)).toBe(1);
  });

  test('all 1-star reviews normalise to 0.2', () => {
    const reviews = [1, 2, 3].map((d) => ({ rating: 1, createdAt: daysAgo(d) }));
    expect(recencyWeightedRating(reviews, NOW)).toBeCloseTo(0.2);
  });

  test('recent reviews outweigh old ones', () => {
    const recentGood = [
      { rating: 5, createdAt: daysAgo(1) },
      { rating: 1, createdAt: daysAgo(400) },
    ];
    const recentBad = [
      { rating: 1, createdAt: daysAgo(1) },
      { rating: 5, createdAt: daysAgo(400) },
    ];
    expect(recencyWeightedRating(recentGood, NOW)).toBeGreaterThan(recencyWeightedRating(recentBad, NOW));
  });

  test('a review exactly one half-life old has half the weight of a fresh one', () => {
    const reviews = [
      { rating: 5, createdAt: NOW }, // weight 1
      { rating: 1, createdAt: daysAgo(CONFIG.RATING_HALF_LIFE_DAYS) }, // weight 0.5
    ];
    // (5*1 + 1*0.5) / 1.5 / 5 = 0.7333...
    expect(recencyWeightedRating(reviews, NOW)).toBeCloseTo(0.7333, 3);
  });
});

describe('responseTimeScore', () => {
  test('no data is neutral', () => expect(responseTimeScore(null)).toBe(0.5));
  test('fast response is perfect', () => expect(responseTimeScore(10)).toBe(1));
  test('boundary: exactly the fast threshold is perfect', () => {
    expect(responseTimeScore(CONFIG.FAST_RESPONSE_MINUTES)).toBe(1);
  });
  test('slower than 24h scores zero', () => expect(responseTimeScore(3000)).toBe(0));
  test('halfway between thresholds scores about 0.5', () => {
    const mid = (CONFIG.FAST_RESPONSE_MINUTES + CONFIG.SLOW_RESPONSE_MINUTES) / 2;
    expect(responseTimeScore(mid)).toBeCloseTo(0.5);
  });
});

describe('disputeScore', () => {
  test('no disputes is 1', () => expect(disputeScore(0, 10)).toBe(1));
  test('1 fault in 4 jobs is 0.75', () => expect(disputeScore(1, 4)).toBeCloseTo(0.75));
  test('never goes below 0', () => expect(disputeScore(9, 3)).toBe(0));
});

describe('calculateTrustScore', () => {
  test('cold start: brand new provider scores exactly neutral 50 and is flagged new', () => {
    const r = calculateTrustScore({}, NOW);
    expect(r.score).toBe(50);
    expect(r.isNewProvider).toBe(true);
    expect(r.confidence).toBe(0);
  });

  test('a strong established provider scores high', () => {
    const r = calculateTrustScore(
      {
        completedCount: 20,
        providerCancelledCount: 0,
        providerFaultDisputes: 0,
        avgResponseMinutes: 10,
        reviews: Array.from({ length: 15 }, (_, i) => ({ rating: 5, createdAt: daysAgo(i) })),
      },
      NOW
    );
    expect(r.score).toBe(100);
    expect(r.isNewProvider).toBe(false);
  });

  test('a poor established provider scores low', () => {
    const r = calculateTrustScore(
      {
        completedCount: 10,
        providerCancelledCount: 30,
        providerFaultDisputes: 5,
        avgResponseMinutes: 2000,
        reviews: Array.from({ length: 10 }, () => ({ rating: 1, createdAt: NOW })),
      },
      NOW
    );
    expect(r.score).toBeLessThan(25);
  });

  test('confidence shrinks a good score toward 50 when there is little history', () => {
    const base = {
      providerCancelledCount: 0,
      providerFaultDisputes: 0,
      avgResponseMinutes: 5,
      reviews: [{ rating: 5, createdAt: NOW }],
    };
    const few = calculateTrustScore({ ...base, completedCount: 2 }, NOW);
    const many = calculateTrustScore({ ...base, completedCount: 10 }, NOW);
    expect(few.score).toBeGreaterThan(50);
    expect(few.score).toBeLessThan(many.score);
  });

  test('cancelling on customers lowers the score', () => {
    const reliable = calculateTrustScore({ completedCount: 10, providerCancelledCount: 0 }, NOW);
    const flaky = calculateTrustScore({ completedCount: 10, providerCancelledCount: 10 }, NOW);
    expect(flaky.score).toBeLessThan(reliable.score);
  });

  test('score is always within 0..100', () => {
    const r = calculateTrustScore(
      { completedCount: 50, providerCancelledCount: 0, avgResponseMinutes: 0, reviews: [{ rating: 5, createdAt: NOW }] },
      NOW
    );
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  test('breakdown exposes all four signals and weights that sum to 1', () => {
    const r = calculateTrustScore({ completedCount: 5 }, NOW);
    const keys = Object.keys(r.breakdown);
    expect(keys.sort()).toEqual(['completion', 'disputes', 'rating', 'responseTime']);
    const weightSum = keys.reduce((s, k) => s + r.breakdown[k].weight, 0);
    expect(weightSum).toBeCloseTo(1);
  });
});
