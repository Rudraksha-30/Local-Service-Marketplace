const ProviderProfile = require('../models/ProviderProfile');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// FR-6 / FR-7: provider creates or edits their own listing
exports.upsertMyProfile = async (req, res) => {
  const allowed = [
    'headline',
    'description',
    'categories',
    'serviceArea',
    'priceMin',
    'priceMax',
    'isActive',
  ];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  if (updates.categories) {
    updates.categories = updates.categories.map((c) => String(c).trim().toLowerCase());
  }

  // isVerified and trust are NOT in the allow-list: a provider cannot grant themselves either.
  const profile = await ProviderProfile.findOneAndUpdate({ user: req.user._id }, updates, {
    returnDocument: 'after',
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });
  res.json({ profile });
};

exports.getMyProfile = async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  res.json({ profile });
};

// FR-8 / FR-9 / FR-10: browse, filter, search. Sorted by trust score (highest first).
exports.listProviders = async (req, res) => {
  const { category, area, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const filter = { isActive: true };
  if (category) filter.categories = String(category).trim().toLowerCase();
  if (area) filter.serviceArea = new RegExp(`^${escapeRegex(String(area).trim())}$`, 'i');
  if (q) {
    const rx = new RegExp(escapeRegex(String(q).trim()), 'i'); // escaped -> no regex injection (NFR-7)
    filter.$or = [{ headline: rx }, { description: rx }, { categories: rx }];
  }

  const [providers, total] = await Promise.all([
    ProviderProfile.find(filter)
      .sort({ 'trust.score': -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name'),
    ProviderProfile.countDocuments(filter),
  ]);

  res.json({ providers, page, limit, total, pages: Math.ceil(total / limit) });
};

// Category names that at least one active provider offers (feeds the client's filter dropdown)
exports.listCategories = async (_req, res) => {
  const categories = await ProviderProfile.distinct('categories', { isActive: true });
  res.json({ categories: categories.sort() });
};

exports.getProvider = async (req, res) => {
  const profile = await ProviderProfile.findById(req.params.id).populate('user', 'name');
  if (!profile || !profile.isActive) return res.status(404).json({ message: 'Provider not found' });
  res.json({ profile });
};
