import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connection } from "./config/dbconfig.js";
import authRoutes from "./routes/authRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const normalizeOrigin = (origin) => origin.replace(/\/+$/, "");
const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map(normalizeOrigin);

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3010",
  "http://localhost:5173",
  ...configuredOrigins,
]);

if (process.env.NODE_ENV === "production" && configuredOrigins.length === 0) {
  throw new Error("FRONTEND_URL must contain the deployed frontend origin in production.");
}

// Middleware
app.disable("x-powered-by");
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "This frontend origin is not allowed. Check the backend FRONTEND_URL setting.",
  });
});

app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || allowedOrigins.has(normalizeOrigin(origin))),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

connection()
  .then(() => {
    console.log("Database connected successfully");

    app.use("/api/auth", authRoutes);
    app.use("/api/news", newsRoutes);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });