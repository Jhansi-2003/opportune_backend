import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // Load .env

const app = express();
const PORT = process.env.PORT || 5000;

