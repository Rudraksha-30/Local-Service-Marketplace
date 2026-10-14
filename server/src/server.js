require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// A missing or short secret would let anyone forge login tokens, so refuse to start without one.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('Failed to start: JWT_SECRET is missing or shorter than 16 characters. Set a long random value in .env.');
  process.exit(1);
}

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
