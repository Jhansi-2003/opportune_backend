import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // Load .env

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Optional root route for health check
app.get("/", (req, res) => {
    res.send("🌐 API Server is running!");
});

// ✅ Import and use all your routes
// You can modularize this, but if your routes are in the same file, skip these imports
// Example (uncomment if using route files):
// import authRoutes from './routes/auth.js';
// import jobRoutes from './routes/jobs.js';
// app.use("/api/auth", authRoutes);
// app.use("/api/jobs", jobRoutes);

// ✅ Start server
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
