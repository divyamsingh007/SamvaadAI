import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/database.config.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import vapiRoutes from "./routes/vapi.route.js";
import interviewResponseRoutes from "./routes/interviewResponse.route.js";
import resumeRoutes from "./routes/resume.route.js";
import { errorHandler, notFound } from "./middleware/errorHandler.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";

const app = express();

connectDB();

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

app.use('/api/', apiLimiter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Chat API with Authentication",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); //admin routes for user management (list, delete, etc.)
app.use("/api/vapi", vapiRoutes);
app.use("/api/interview-responses", interviewResponseRoutes);
app.use("/api/resume", resumeRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
