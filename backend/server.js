import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; // Import path
import { fileURLToPath } from 'url'; // Import fileURLToPath

import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js'; // Import post routes
import usersRoutes from './routes/users.js'; // Import user routes


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- ES Module workarounds for __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes); // Use post routes
app.use('/api/users', usersRoutes); // Use user routes

// --- Serve static files (uploaded images) ---
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});