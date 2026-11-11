import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import dns from "node:dns";
import { connection } from "./config/dbconfig.js";
import authRoutes from "./routes/authRoutes.js";
import newsRoutes from "./routes/newsRoutes.js"
dotenv.config();

// Custom DNS configuration (useful for MongoDB Atlas resolution issues on some ISPs)
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const PORT = process.env.PORT || 5000;

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3010",
  "http://localhost:5173",
];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman or mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

// Connect to Database & Start Server
connection()
  .then(() => {
    console.log("Database connected successfully");
    
    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/news",newsRoutes)
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });