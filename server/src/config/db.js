import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

let isDBConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isDBConnected = true;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isDBConnected = false;
    logger.warn(`MongoDB not accessible (${error.message}).`);
    logger.info(`⚡ Running in Resilient Mode: official schemes, eligibility rules, and AI assistant are fully operational.`);
    return false;
  }
};

export { isDBConnected };
export default connectDB;
