import mongoose from 'mongoose';

const MONGODB_URI = process.env.TRUSTWORTHY_MONGO_CONNECTION;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the TRUSTWORTHY_MONGO_CONNECTION environment variable inside .env'
  );
}

// Global mongoose connection
// eslint-disable-next-line no-var
var globalMongoose = global as unknown as {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
if (!globalMongoose.mongoose) {
  globalMongoose.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (globalMongoose.mongoose.conn) {
    return globalMongoose.mongoose.conn;
  }

  if (!globalMongoose.mongoose.promise) {
    const opts = {
      bufferCommands: false,
    };

    globalMongoose.mongoose.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  globalMongoose.mongoose.conn = await globalMongoose.mongoose.promise;
  return globalMongoose.mongoose.conn;
}

export default dbConnect; 