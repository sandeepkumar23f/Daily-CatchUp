import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connection } from "../config/dbconfig.js";

const JWT_SECRET =
  process.env.JWT_SECRET ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "local-development-secret-set-JWT_SECRET-before-deploy");
const SALT_ROUNDS = 10;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production.");
}

if (process.env.NODE_ENV === "production" && JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production.");
}

const authSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "Password must be no more than 72 UTF-8 bytes",
    ),
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 5 * 24 * 60 * 60 * 1000,
};

function findUserByEmail(collection, email) {
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return collection.findOne({
    email: { $regex: `^${escapedEmail}$`, $options: "i" },
  });
}

function setAuthCookie(res, token) {
  res.cookie("token", token, cookieOptions);
  res.set("Cache-Control", "no-store");
}

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
    const existingUser = await findUserByEmail(collection, email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let result;
    try {
      result = await collection.insertOne({
        email,
        password: hashedPassword,
        createdAt: new Date(),
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({ success: false, message: "User already exists" });
      }
      throw error;
    }

    if (!result.acknowledged) {
      return res.status(500).json({ success: false, message: "User creation failed" });
    }

    const tokenData = {
      _id: result.insertedId.toString(),
      email,
    };

    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: "5d" });

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("SignUp error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const Login = async (req, res) => {
  try {
    const parseResult = authSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || "Invalid payload",
      });
    }

    const { email, password } = parseResult.data;

    const db = await connection();
    const collection = db.collection("users");
    const user = await findUserByEmail(collection, email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const tokenData = { _id: user._id.toString(), email: user.email };
    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: "5d" });

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "User login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};