import { MongoClient } from "mongodb";

const url = "mongodb+srv://event_management:event123@cluster0.f2gjwjm.mongodb.net/Event-management?retryWrites=true&w=majority&appName=Cluster0";

const dbName = "Event-management";

const client = new MongoClient(url);

export const connection = async () => {
  const connect = await client.connect();
  console.log("MongoDB Connected!");
  return connect.db(dbName);
};
