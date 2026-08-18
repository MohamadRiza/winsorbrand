// lib/db.ts
import mongoose from 'mongoose';

// Cache connection across hot-reloads in dev
interface CachedMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: CachedMongoose = (global as any).mongoose || { conn: null, promise: null };
(global as any).mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI in .env.local');
  }

  // If already connected, return active connection
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // Reset cached promise on failure so next request can retry
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}