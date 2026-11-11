import { summarizeNewsTopic } from "../controllers/newsController.js";
import express from "express"

const router = express.Router()

router.post("/summarize",summarizeNewsTopic)

export default router