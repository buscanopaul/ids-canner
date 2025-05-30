import { databases, storage, config, Query } from '../config/appwrite';

class AppwriteService {
  // Database Services for Scanned ID Data (Read-Only)
  async getScannedDataHistory(limit = 50) {
    try {
      const documents = await databases.listDocuments(
        config.databaseId,
        config.scannedDataCollectionId,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(limit)
        ]
      );
      
      return documents.documents;
    } catch (error) {
      console.error('Get scanned data history error:', error);
      // Return empty array if error (e.g., no documents yet)
      return [];
    }
  }

  async searchScannedData(searchTerm) {
    try {
      // Get all documents and filter client-side
      const documents = await databases.listDocuments(
        config.databaseId,
        config.scannedDataCollectionId,
        [
          Query.orderDesc('$createdAt')
        ]
      );
      
      // Filter client-side
      const filtered = documents.documents.filter(doc => 
        doc.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.idType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filtered;
    } catch (error) {
      console.error('Search scanned data error:', error);
      return [];
    }
  }

  // Storage Services for ID Photos (Read-Only)
  async getPhotoUrl(fileId) {
    try {
      // Construct URL manually to match your working URL format
      const photoUrl = `${config.endpoint}/storage/buckets/${config.storageId}/files/${fileId}/view?project=${config.projectId}`;
      console.log('Generated photo URL:', photoUrl);
      return photoUrl;
    } catch (error) {
      console.error('Get photo URL error:', error);
      throw error;
    }
  }

  // Utility Services (Read-Only)
  async getStatistics() {
    try {
      const documents = await databases.listDocuments(
        config.databaseId,
        config.scannedDataCollectionId,
        [
          Query.orderDesc('$createdAt')
        ]
      );
      
      const scans = documents.documents;
      const idTypes = {};
      
      scans.forEach(scan => {
        const type = scan.idType || 'Unknown';
        idTypes[type] = (idTypes[type] || 0) + 1;
      });
      
      return {
        totalScans: scans.length,
        recentScans: scans.slice(0, 5),
        idTypeBreakdown: idTypes,
        firstScan: scans[scans.length - 1]?.$createdAt,
        lastScan: scans[0]?.$createdAt
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      return {
        totalScans: 0,
        recentScans: [],
        idTypeBreakdown: {},
        firstScan: null,
        lastScan: null
      };
    }
  }

  // Export functionality (Read-Only)
  async exportUserData(format = 'json') {
    try {
      const documents = await databases.listDocuments(
        config.databaseId,
        config.scannedDataCollectionId,
        [
          Query.orderDesc('$createdAt')
        ]
      );
      
      const data = documents.documents.map(doc => ({
        id: doc.$id,
        idType: doc.idType,
        idNumber: doc.idNumber,
        firstName: doc.firstName,
        lastName: doc.lastName,
        middleInitial: doc.middleInitial,
        birthday: doc.birthday,
        createdAt: doc.$createdAt
      }));
      
      if (format === 'csv') {
        return this.convertToCSV(data);
      }
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Export data error:', error);
      throw error;
    }
  }

  convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        return value.toString().includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  // ID Lookup Services (Read-Only)
  async lookupIdByNumber(idNumber) {
    try {
      const documents = await databases.listDocuments(
        config.databaseId,
        config.scannedDataCollectionId,
        [
          Query.equal('idNumber', idNumber),
          Query.orderDesc('$createdAt'),
          Query.limit(1) // Get the most recent record
        ]
      );
      
      if (documents.documents.length > 0) {
        const record = documents.documents[0];
        
        // If there's a photo associated, get the photo URL
        if (record.photoId) {
          try {
            record.photoUrl = await this.getPhotoUrl(record.photoId);
            console.log('Photo URL generated:', record.photoUrl);
          } catch (photoError) {
            console.log('Photo not found for record:', photoError);
            record.photoUrl = null;
          }
        }
        
        return {
          found: true,
          record: record,
          isVerified: true // Indicates this came from your backend/database
        };
      }
      
      return {
        found: false,
        record: null,
        isVerified: false
      };
    } catch (error) {
      console.error('Lookup ID error:', error);
      return {
        found: false,
        record: null,
        isVerified: false,
        error: error.message
      };
    }
  }

  // Get all records for a specific ID number (in case of duplicates)
  async getAllRecordsForId(idNumber) {
    try {
      const documents = await databases.listDocuments(
        config.databaseId,
        config.scannedDataCollectionId,
        [
          Query.equal('idNumber', idNumber),
          Query.orderDesc('$createdAt')
        ]
      );
      
      // Add photo URLs to each record if they have photos
      const recordsWithPhotos = await Promise.all(
        documents.documents.map(async (record) => {
          if (record.photoId) {
            try {
              record.photoUrl = await this.getPhotoUrl(record.photoId);
              console.log('Photo URL generated for record:', record.$id, record.photoUrl);
            } catch (error) {
              console.log('Photo not found for record:', record.$id, error);
              record.photoUrl = null;
            }
          }
          return record;
        })
      );
      
      return {
        found: recordsWithPhotos.length > 0,
        records: recordsWithPhotos,
        count: recordsWithPhotos.length
      };
    } catch (error) {
      console.error('Get all records error:', error);
      return {
        found: false,
        records: [],
        count: 0,
        error: error.message
      };
    }
  }

  // Verify ID authenticity by checking against database
  async verifyIdAuthenticity(scannedData) {
    try {
      const lookup = await this.lookupIdByNumber(scannedData.idNumber);
      
      if (lookup.found) {
        const dbRecord = lookup.record;
        
        // Compare key fields to check for discrepancies
        const discrepancies = [];
        
        if (scannedData.firstName && dbRecord.firstName) {
          if (scannedData.firstName.toLowerCase() !== dbRecord.firstName.toLowerCase()) {
            discrepancies.push({
              field: 'firstName',
              scanned: scannedData.firstName,
              database: dbRecord.firstName
            });
          }
        }
        
        if (scannedData.lastName && dbRecord.lastName) {
          if (scannedData.lastName.toLowerCase() !== dbRecord.lastName.toLowerCase()) {
            discrepancies.push({
              field: 'lastName',
              scanned: scannedData.lastName,
              database: dbRecord.lastName
            });
          }
        }
        
        if (scannedData.birthday && dbRecord.birthday) {
          if (scannedData.birthday !== dbRecord.birthday) {
            discrepancies.push({
              field: 'birthday',
              scanned: scannedData.birthday,
              database: dbRecord.birthday
            });
          }
        }
        
        return {
          isKnownId: true,
          isValid: discrepancies.length === 0,
          discrepancies: discrepancies,
          databaseRecord: dbRecord,
          verificationStatus: discrepancies.length === 0 ? 'VERIFIED' : 'DISCREPANCY_FOUND'
        };
      }
      
      return {
        isKnownId: false,
        isValid: null, // Cannot verify unknown ID
        discrepancies: [],
        databaseRecord: null,
        verificationStatus: 'UNKNOWN_ID'
      };
    } catch (error) {
      console.error('Verify ID authenticity error:', error);
      return {
        isKnownId: false,
        isValid: null,
        discrepancies: [],
        databaseRecord: null,
        verificationStatus: 'VERIFICATION_ERROR',
        error: error.message
      };
    }
  }
}

export default new AppwriteService(); 