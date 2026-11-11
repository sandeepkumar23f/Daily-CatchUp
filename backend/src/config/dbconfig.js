import { MongoClient } from "mongodb";

const dbName = process.env.DB_NAME || "Dev-Log";

let cachedClient = null;
let cachedDb = null;

export const connection = async () => {
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  const url = process.env.MONGO_URI;

  if (!url) {
    throw new Error("MONGO_URI is missing from environment variables.");
  }

  const client = new MongoClient(url);
  await client.connect();
  console.log("MongoDB Connected!");

  cachedClient = client;
  cachedDb = client.db(dbName);
  return cachedDb;
};