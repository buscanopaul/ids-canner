# Appwrite Setup Guide for Edge Scanner App

This guide will help you set up Appwrite as the backend for your Edge Scanner React Native app.

## 🚀 Step 1: Create Appwrite Project

1. **Sign up for Appwrite Cloud** or **Self-host Appwrite**
   - Go to [cloud.appwrite.io](https://cloud.appwrite.io) for cloud version
   - Or follow [self-hosting guide](https://appwrite.io/docs/installation) for self-hosted

2. **Create a new project**
   - Click "Create Project"
   - Enter project name: `Edge Scanner`
   - Copy your **Project ID** (you'll need this later)

## 📊 Step 2: Create Database Structure

### Create Database
1. Go to **Databases** in your Appwrite console
2. Click **Create Database**
3. Name: `edge_scanner_db`
4. Copy the **Database ID**

### Create Collections

#### Collection: Scanned Data
1. **Collection ID**: `scanned_data`
2. **Attributes**:
   ```
   - idType (string, 100)
   - idNumber (string, 100)
   - firstName (string, 100)
   - lastName (string, 100)
   - middleInitial (string, 10)
   - birthday (string, 50)
   - additionalInfo (string, 2000)
   - photoId (string, 255) - Links to photo in storage bucket
   ```

### Set Collection Permissions
For the scanned_data collection:
- **Create**: None (Backend only)
- **Read**: Any
- **Update**: None (Backend only)
- **Delete**: None (Backend only)

> **Note**: Collection is read-only for app users. Data will be uploaded and managed through your backend system.

## 🗂️ Step 3: Create Storage Bucket (Read-Only)

1. Go to **Storage** in your Appwrite console
2. Click **Create Bucket**
3. **Bucket ID**: `id_photos`
4. **Name**: `ID Photos`
5. **Permissions**:
   - **Create**: None (Backend only)
   - **Read**: Any
   - **Update**: None (Backend only)
   - **Delete**: None (Backend only)

> **Note**: Storage is read-only for app users. Photos will be uploaded through your backend system.

## 🔑 Step 4: Configure Environment Variables

Create/update your `.env` file with these variables:

```bash
# Clerk Configuration (existing)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Appwrite Configuration
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PLATFORM=com.appedgescanner.edgescanner
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
EXPO_PUBLIC_APPWRITE_SCANNED_DATA_COLLECTION_ID=scanned_data
EXPO_PUBLIC_APPWRITE_STORAGE_ID=id_photos
```

**Replace these values**:
- `your_project_id_here` → Your Appwrite Project ID
- `your_database_id_here` → Your Database ID

## 🔧 Step 5: Configure Platform

1. Go to **Overview** → **Platforms** in your Appwrite console
2. Click **Add Platform**
3. Select **React Native**
4. **Platform Name**: `Edge Scanner React Native`
5. **Package Name**: `com.appedgescanner.edgescanner`

## 📱 Step 6: Test Your Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Start the development server**:
   ```bash
   bun start
   ```

3. **Test the app**:
   - Sign up/Login with Clerk
   - Scan an ID (use sample QR codes from README)
   - Save the scanned data
   - Check if data appears in Appwrite console
   - View scan history and statistics

## 🛠️ Step 7: Verify Data in Appwrite Console

1. Go to **Databases** → `edge_scanner_db` → `scanned_data`
2. You should see your scanned ID data with structure like:
   ```
   - Document ID: 6839cc1500121f17555f
   - idNumber: 191-589-009-000
   - firstName: Wandra
   - lastName: Heron
   - middleInitial: Y
   - birthday: 08/19/1962
   - idType: Philippine Driver's License
   - additionalInfo: (any additional details)
   ```

3. Check the **Storage** bucket for any uploaded photos (if implemented)

## 🔍 Troubleshooting

### Common Issues:

#### 1. **Permission Denied Errors**
- Check collection permissions are set to "Any"
- Ensure authentication is working with Clerk
- Verify Project ID and Database ID in .env file

#### 2. **Connection Errors**
- Verify your Project ID is correct
- Check if your endpoint URL is correct (https://cloud.appwrite.io/v1)
- Ensure platform is configured correctly with right package name

#### 3. **Missing Collections**
- Double-check collection ID matches your .env file (`scanned_data`)
- Verify database ID is correct
- Ensure collection exists in Appwrite console

#### 4. **Data Not Appearing**
- Verify all required attributes are created in collection
- Check console logs for any Appwrite errors
- Ensure Clerk authentication is working properly

### Debug Tips:
1. **Check Console Logs**: Look for Appwrite errors in your app logs
2. **Appwrite Console Logs**: Check the logs in your Appwrite console
3. **Test API Calls**: Use Appwrite console API playground to test
4. **Verify Authentication**: Ensure Clerk authentication is working

## 🌟 Features Enabled by Appwrite

Once setup is complete, your app will have:

- ✅ **Read-Only Database**: Access to verified ID data uploaded via backend
- ✅ **ID Verification**: Lookup and verify ID numbers against trusted database  
- ✅ **Search**: Search through all ID records by name, ID number, type
- ✅ **Statistics**: View ID type breakdown and database insights
- ✅ **Photo Integration**: View photos linked to ID records (uploaded via backend)
- ✅ **Authentication**: Secure access via Clerk authentication
- ✅ **History**: Browse complete database of verified IDs
- ✅ **Export**: JSON/CSV export functionality for data analysis
- ✅ **Real-time Lookup**: Instant database verification when scanning
- ✅ **Data Integrity**: Backend-managed uploads ensure data quality

## 📚 Architecture Overview

```
React Native App (Expo)
├── Clerk Authentication (User Management & Security)
├── Appwrite Database (Read-Only ID Verification Database)
│   └── edge_scanner_db
│       └── scanned_data (Collection)
│           ├── ID Information (idNumber, firstName, lastName, etc.)
│           ├── Additional Info (idType, birthday, additionalInfo)
│           └── Photo Links (photoId references)
└── Appwrite Storage (Read-Only Photo Storage)
    └── id_photos (Bucket)
        └── ID Photos uploaded via backend
        
Backend System (Separate)
├── Data Upload & Management
├── Photo Processing & Storage
└── Database Maintenance
```

## 🆘 Need Help?

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Discord Community](https://discord.gg/appwrite)
- [React Native Appwrite SDK Docs](https://appwrite.io/docs/getting-started-for-react-native)
- [Clerk + Appwrite Integration Guide](https://clerk.com/docs/integrations/appwrite)

---

**Happy Scanning! 🔍📱** 