import { MongoClient, type Db } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vetchat"

let client: MongoClient | null = null
let db: Db | null = null

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db
  }

  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    db = client.db()
    console.log("[v0] Connected to MongoDB")
    return db
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error)
    throw error
  }
}

export async function getCollection(name: string) {
  const database = await connectToDatabase()
  return database.collection(name)
}
