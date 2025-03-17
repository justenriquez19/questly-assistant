import mongoose from 'mongoose';

/**
 * @description Singleton service for managing MongoDB connections.
 */
export class MongoService {
  private static _instance: MongoService;

  /**
   * @description Private constructor to prevent instantiation.
   */
  private constructor() { }

  /**
   * @description Get the singleton instance of the MongoService.
   * @returns {MongoService} The instance of MongoService.
   */
  public static getInstance(): MongoService {
    if (!MongoService._instance) {
      MongoService._instance = new MongoService();
    }

    return MongoService._instance;
  }

  /**
   * @description Connect to the MongoDB database.
   * @returns {Promise<void>} A promise that resolves when the connection is successful.
   */
  public async connect(): Promise<void> {
    const mongoURL = process.env.MONGO_URL as string;

    if (!mongoURL) {
      throw new Error('MONGO_URL is not defined');
    }

    try {
      await mongoose.connect(mongoURL);
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw err;
    }
  }

  /**
   * @description Disconnect from the MongoDB database.
   * @returns {Promise<void>} A promise that resolves when the disconnection is successful.
   */
  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    } catch (err) {
      console.error('MongoDB disconnection error:', err);
      throw err;
    }
  }
}
