import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

// Load biến môi trường từ file .env
dotenv.config();

const app = express();

// Middlewares cơ bản
app.use(helmet()); // Bảo mật HTTP headers
app.use(cors());   // Cho phép Frontend (Flutter) gọi API
app.use(express.json()); // Parse body JSON
app.use(morgan('dev')); // Log các request ra console

// Route test server
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Cashflow API is running smoothly!' });
});

// Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});