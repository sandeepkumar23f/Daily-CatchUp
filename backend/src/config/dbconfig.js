import { MongoClient } from "mongodb";

const url = process.env.MONGO_URI
const dbName = "Dev-Log";

const client = new MongoClient(url);

export const connection = async () => {
  const connect = await client.connect();
  console.log("MongoDB Connected!");
  return connect.db(dbName);
};
