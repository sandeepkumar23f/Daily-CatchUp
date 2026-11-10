import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import { z } from "zod"
import { connection } from "./config/dbconfig.js"
import authRoutes from "./routes/authRoutes.js"
dotenv.config()
const port = 5000

const app = express()

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
connection()

app.use("/api/auth",authRoutes)

app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})