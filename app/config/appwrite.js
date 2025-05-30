import { Client, Databases, Storage, Query } from 'react-native-appwrite';

// Appwrite configuration using environment variables
const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  platform: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM || 'com.appedgescanner.edgescanner',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'YOUR_DATABASE_ID',
  scannedDataCollectionId: process.env.EXPO_PUBLIC_APPWRITE_SCANNED_DATA_COLLECTION_ID || 'YOUR_SCANNED_DATA_COLLECTION_ID',
  storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_ID || 'YOUR_STORAGE_BUCKET_ID',
};

// Initialize Appwrite client
const client = new Client();

client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

// Initialize services (no account since using Clerk)
const databases = new Databases(client);
const storage = new Storage(client);

export { client, databases, storage, Query, config }; 