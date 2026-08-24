import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);

app.get('/', (req, res) => {
  res.json({ message: 'TrustHome API Server is running' });
});

app.listen(PORT, () => {
  console.log(`TrustHome backend server running on port ${PORT}`);
});
