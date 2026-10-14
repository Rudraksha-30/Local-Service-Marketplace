/**
 * Create (or promote) the admin account. Admins cannot register through the website.
 *
 *   MONGO_URI=... ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=a-strong-password npm run seed:admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function main() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!MONGO_URI) throw new Error('MONGO_URI is not set');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD');
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');

  await mongoose.connect(MONGO_URI);
  const email = ADMIN_EMAIL.toLowerCase().trim();

  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    existing.role = 'admin';
    existing.password = ADMIN_PASSWORD; // re-hashed by the model's pre-save hook
    await existing.save();
    console.log(`Updated ${email}: role is now admin and the password was reset.`);
  } else {
    await User.create({ name, email, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`Created admin account ${email}.`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('seed:admin failed:', err.message);
  process.exit(1);
});
