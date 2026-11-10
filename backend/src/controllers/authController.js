import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { connection } from "../config/dbconfig.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "secret-code";
const SALT_ROUNDS = 10;

// Input Validation Schemas
const authSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const SignUp = async (req, res) => {
  try {
    const parseResult = authSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues?.[0]?.message || "Invalid payload";
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const { email, password } = parseResult.data;

    const db = await connection();
    const collection = db.collection("users");
    const existingUser = await collection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await collection.insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    if (!result.acknowledged) {
      return res.status(500).json({ success: false, message: "User creation failed" });
    }

    const tokenData = {
      _id: result.insertedId.toString(),
      email,
    };

    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: "5d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 5 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
    });
  } catch (error) {
    console.error("SignUp Error Details:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const Login = async (req, res) => {
  try {
    // 1. Validate Input Payload
    const parseResult = authSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
    }

    const { email, password } = parseResult.data;

    // 2. Fetch User by Email
    const db = await connection();
    const collection = db.collection("users");
    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Verify Password Hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Generate Token & Respond
    const tokenData = { _id: user._id.toString(), email: user.email };
    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: "5d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 5 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "User login successful",
      token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};