/**
 * ID Data Parser Utility
 * Parses various ID formats and extracts structured data
 * Specialized for Philippine Driver's License and other Philippine IDs
 */

import AppwriteService from '../services/appwriteService';

// Common date formats found in IDs
const DATE_FORMATS = [
  /(\d{2})\/(\d{2})\/(\d{4})/,  // MM/DD/YYYY
  /(\d{2})-(\d{2})-(\d{4})/,    // MM-DD-YYYY
  /(\d{4})\/(\d{2})\/(\d{2})/,  // YYYY/MM/DD
  /(\d{4})-(\d{2})-(\d{2})/,    // YYYY-MM-DD
  /(\d{2})(\d{2})(\d{4})/,      // MMDDYYYY
  /(\d{4})(\d{2})(\d{2})/,      // YYYYMMDD
];

// Philippine ID Type Detection Patterns
const PHILIPPINE_ID_PATTERNS = {
  DRIVERS_LICENSE: {
    pattern: /^[A-Z]\d{2}-\d{2}-\d{6}$/,
    name: "Philippine Driver's License",
    example: "A01-23-456789"
  },
  NATIONAL_ID: {
    pattern: /^\d{4}-\d{4}-\d{4}$/,
    name: "Philippine National ID",
    example: "1234-5678-9012"
  },
  SSS_ID: {
    pattern: /^\d{2}-\d{7}-\d$/,
    name: "SSS ID",
    example: "12-3456789-0"
  },
  UMID: {
    pattern: /^\d{4}-\d{7}-\d$/,
    name: "UMID",
    example: "1234-5678901-2"
  },
  PRC_ID: {
    pattern: /^PRC-\d{7}$/,
    name: "PRC License",
    example: "PRC-1234567"
  },
  POSTAL_ID: {
    pattern: /^POST-\d{4}-\d{6}$/,
    name: "Postal ID",
    example: "POST-1234-567890"
  }
};

/**
 * Detects the type of Philippine ID based on the ID number pattern
 */
const detectPhilippineIDType = (idNumber) => {
  if (!idNumber) return "Unknown ID Type";
  
  // Clean the ID number for better pattern matching
  const cleanId = idNumber.trim().toUpperCase();
  
  // Philippine Driver's License patterns
  if (/^[A-Z]\d{2}-\d{2}-\d{6}$/.test(cleanId) || /^[A-Z]\d{8,11}$/.test(cleanId)) {
    return "Philippine Driver's License";
  }
  
  // Philippine National ID (PhilID)
  if (/^\d{4}-\d{4}-\d{4}$/.test(cleanId) || /^\d{12}$/.test(cleanId)) {
    return "Philippine National ID";
  }
  
  // SSS ID patterns
  if (/^\d{2}-\d{7}-\d$/.test(cleanId) || /^\d{10}$/.test(cleanId)) {
    return "SSS ID";
  }
  
  // UMID patterns
  if (/^\d{4}-\d{7}-\d$/.test(cleanId) || /^\d{12}$/.test(cleanId)) {
    return "UMID";
  }
  
  // PRC License patterns
  if (/^[A-Z]\d{8,10}[A-Z]?$/.test(cleanId) || cleanId.startsWith('PRC')) {
    return "PRC License";
  }
  
  // Postal ID patterns
  if (cleanId.includes('POST') || /^POST-\d{4}-\d{6}$/.test(cleanId)) {
    return "Postal ID";
  }
  
  // TIN ID patterns
  if (/^\d{3}-\d{3}-\d{3}$/.test(cleanId) || /^\d{9}$/.test(cleanId)) {
    return "TIN ID";
  }
  
  // Philhealth patterns
  if (/^\d{2}-\d{9}-\d$/.test(cleanId) || /^\d{12}$/.test(cleanId)) {
    return "PhilHealth ID";
  }
  
  // GSIS patterns
  if (/^\d{11}$/.test(cleanId) && cleanId.startsWith('1')) {
    return "GSIS ID";
  }
  
  // Senior Citizen ID patterns
  if (cleanId.includes('SENIOR') || cleanId.includes('SC')) {
    return "Senior Citizen ID";
  }
  
  // PWD ID patterns
  if (cleanId.includes('PWD') || cleanId.includes('DISABILITY')) {
    return "PWD ID";
  }
  
  // Voter's ID patterns
  if (/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(cleanId)) {
    return "Voter's ID";
  }
  
  // Passport patterns
  if (/^[A-Z]\d{7}[A-Z]?$/.test(cleanId) || /^P\d{7}[A-Z]$/.test(cleanId)) {
    return "Philippine Passport";
  }
  
  // OFW ID patterns
  if (cleanId.includes('OFW') || cleanId.includes('OWWA')) {
    return "OFW ID";
  }
  
  // If no specific pattern matches but it looks like a Philippine government ID
  if (/^[A-Z0-9\-]{6,20}$/.test(cleanId)) {
    return "Philippine Government ID";
  }
  
  return "Philippine ID";
};

/**
 * Parses Philippine Driver's License format
 */
const parsePhilippineDriversLicense = (data) => {
  const lines = data.split(/[\n\r]+/).filter(line => line.trim());
  const result = {
    idNumber: null,
    firstName: null,
    lastName: null,
    middleInitial: null,
    birthday: null,
    photo: null,
    additionalInfo: null,
    idType: null
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Philippine Driver's License number pattern (e.g., A01-23-456789)
    if (!result.idNumber && /^[A-Z]\d{2}-\d{2}-\d{6}/.test(line)) {
      result.idNumber = line;
      result.idType = "Philippine Driver's License";
      continue;
    }
    
    // Alternative DL number patterns
    if (!result.idNumber && /^[A-Z]\d{8,11}$/.test(line)) {
      result.idNumber = line;
      result.idType = "Philippine Driver's License";
      continue;
    }
    
    // Extract birthday
    if (!result.birthday) {
      for (const format of DATE_FORMATS) {
        const match = line.match(format);
        if (match) {
          result.birthday = line;
          break;
        }
      }
    }
    
    // Extract names - Philippine format: "LASTNAME, FIRSTNAME MIDDLEINITIAL"
    if (!result.lastName && line.includes(',')) {
      const nameParts = line.split(',').map(part => part.trim());
      if (nameParts.length >= 2) {
        result.lastName = nameParts[0];
        const remainingName = nameParts[1].split(' ').filter(part => part.trim());
        if (remainingName.length > 0) {
          result.firstName = remainingName[0];
          if (remainingName.length > 1) {
            // Last part could be middle initial or middle name
            const middlePart = remainingName[remainingName.length - 1];
            if (middlePart.length === 1) {
              result.middleInitial = middlePart;
            } else if (middlePart.length > 1) {
              result.middleInitial = middlePart.charAt(0);
            }
          }
        }
        continue;
      }
    }
    
    // Alternative name pattern: "FIRSTNAME MIDDLEINITIAL LASTNAME"
    if (!result.firstName && line.split(' ').length >= 2) {
      const nameParts = line.split(' ').filter(part => part.trim());
      if (nameParts.length >= 2 && nameParts.every(part => /^[A-Z]+\.?$/.test(part))) {
        result.firstName = nameParts[0];
        if (nameParts.length === 3) {
          result.middleInitial = nameParts[1].replace('.', '');
          result.lastName = nameParts[2];
        } else {
          result.lastName = nameParts[nameParts.length - 1];
        }
        continue;
      }
    }
    
    // Check for specific Philippine DL keywords
    if (line.includes('DRIVER') || line.includes('LICENSE') || line.includes('REPUBLIC OF THE PHILIPPINES')) {
      result.idType = "Philippine Driver's License";
      if (!result.additionalInfo) {
        result.additionalInfo = line;
      } else {
        result.additionalInfo += '\n' + line;
      }
    }
  }
  
  // If no specific ID type was detected but we have an ID number, try to detect it
  if (!result.idType && result.idNumber) {
    result.idType = detectPhilippineIDType(result.idNumber);
  }
  
  return result;
};

/**
 * Parses other Philippine ID formats (National ID, SSS, etc.)
 */
const parseOtherPhilippineID = (data) => {
  const lines = data.split(/[\n\r]+/).filter(line => line.trim());
  const result = {
    idNumber: null,
    firstName: null,
    lastName: null,
    middleInitial: null,
    birthday: null,
    photo: null,
    additionalInfo: null,
    idType: null
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Try to extract various Philippine ID number patterns
    if (!result.idNumber) {
      // National ID pattern
      if (/^\d{4}-\d{4}-\d{4}/.test(line)) {
        result.idNumber = line;
        result.idType = "Philippine National ID";
        continue;
      }
      // SSS ID pattern
      if (/^\d{2}-\d{7}-\d/.test(line)) {
        result.idNumber = line;
        result.idType = "SSS ID";
        continue;
      }
      // Generic Philippine ID pattern
      if (/^[A-Z]{1,3}\d{8,12}$/.test(line)) {
        result.idNumber = line;
        continue;
      }
    }
    
    // Extract birthday
    if (!result.birthday) {
      for (const format of DATE_FORMATS) {
        const match = line.match(format);
        if (match) {
          result.birthday = line;
          break;
        }
      }
    }
    
    // Extract names
    if (!result.lastName && line.includes(',')) {
      const nameParts = line.split(',').map(part => part.trim());
      if (nameParts.length >= 2) {
        result.lastName = nameParts[0];
        const remainingName = nameParts[1].split(' ').filter(part => part.trim());
        if (remainingName.length > 0) {
          result.firstName = remainingName[0];
          if (remainingName.length > 1) {
            result.middleInitial = remainingName[1].charAt(0);
          }
        }
        continue;
      }
    }
  }
  
  // Detect ID type if not already set
  if (!result.idType && result.idNumber) {
    result.idType = detectPhilippineIDType(result.idNumber);
  }
  
  return result;
};

/**
 * Parses US ID formats (Driver's License, etc.)
 */
const parseUSID = (data) => {
  const result = {
    idNumber: null,
    firstName: null,
    lastName: null,
    middleInitial: null,
    birthday: null,
    photo: null,
    additionalInfo: null,
    idType: "US Driver's License"
  };

  // PDF417 format parsing (common in US driver's licenses)
  if (data.includes('ANSI')) {
    const fields = data.split(/[,\n]/);
    
    fields.forEach(field => {
      const trimmed = field.trim();
      
      // DCS = Customer Family Name
      if (trimmed.startsWith('DCS')) {
        result.lastName = trimmed.substring(3);
      }
      // DCT = Customer First Name
      else if (trimmed.startsWith('DCT')) {
        result.firstName = trimmed.substring(3);
      }
      // DCU = Customer Middle Name
      else if (trimmed.startsWith('DCU')) {
        result.middleInitial = trimmed.substring(3).charAt(0);
      }
      // DBB = Date of Birth
      else if (trimmed.startsWith('DBB')) {
        const dobString = trimmed.substring(3);
        if (dobString.length === 8) {
          // Format: MMDDYYYY
          result.birthday = `${dobString.substring(0,2)}/${dobString.substring(2,4)}/${dobString.substring(4,8)}`;
        }
      }
      // DAQ = Customer ID Number
      else if (trimmed.startsWith('DAQ')) {
        result.idNumber = trimmed.substring(3);
      }
    });
  }
  
  return result;
};

/**
 * Generic parser for simple text-based IDs
 */
const parseGenericID = (data) => {
  const result = {
    idNumber: null,
    firstName: null,
    lastName: null,
    middleInitial: null,
    birthday: null,
    photo: null,
    additionalInfo: data,
    idType: "Generic ID"
  };

  const lines = data.split(/[\n\r]+/).filter(line => line.trim());
  
  // Try to extract any number that looks like an ID
  const idPattern = /(?:ID|NUMBER|#)?\s*:?\s*([A-Z0-9\-]{6,20})/i;
  const namePattern = /(?:NAME)?\s*:?\s*([A-Z\s,\.]+)/i;
  const birthdatePattern = /(?:BIRTH|DOB|BIRTHDAY)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i;

  for (const line of lines) {
    // Try to extract ID number
    if (!result.idNumber) {
      const idMatch = line.match(idPattern);
      if (idMatch) {
        result.idNumber = idMatch[1];
      }
    }
    
    // Try to extract name
    if (!result.firstName) {
      const nameMatch = line.match(namePattern);
      if (nameMatch) {
        const nameParts = nameMatch[1].split(/[\s,]+/).filter(part => part.trim());
        if (nameParts.length >= 1) {
          result.firstName = nameParts[0];
          if (nameParts.length >= 2) {
            result.lastName = nameParts[nameParts.length - 1];
          }
          if (nameParts.length >= 3) {
            result.middleInitial = nameParts[1].charAt(0);
          }
        }
      }
    }
    
    // Try to extract birthdate
    if (!result.birthday) {
      const birthMatch = line.match(birthdatePattern);
      if (birthMatch) {
        result.birthday = birthMatch[1];
      }
    }
  }
  
  return result;
};

/**
 * Main parser function that tries different parsing strategies
 */
export const parseIDData = async (rawData, scanType = 'qr') => {
  if (!rawData || typeof rawData !== 'string') {
    return {
      idNumber: null,
      firstName: null,
      lastName: null,
      middleInitial: null,
      birthday: null,
      photo: null,
      additionalInfo: null,
      idType: "Unknown",
      parseSuccess: false
    };
  }

  let parsedData;

  // Try different parsing strategies based on data patterns
  if (rawData.includes('ANSI') || rawData.includes('PDF417')) {
    // US ID format
    parsedData = parseUSID(rawData);
  } else if (
    rawData.includes('DRIVER') || 
    rawData.includes('LICENSE') || 
    rawData.includes('REPUBLIC OF THE PHILIPPINES') ||
    /^[A-Z]\d{2}-\d{2}-\d{6}/.test(rawData) ||
    /^[A-Z]\d{8,11}$/.test(rawData.split(/[\n\r]+/)[0]?.trim())
  ) {
    // Philippine Driver's License format
    parsedData = parsePhilippineDriversLicense(rawData);
  } else if (
    /^\d{4}-\d{4}-\d{4}/.test(rawData) || 
    /^\d{2}-\d{7}-\d/.test(rawData) ||
    /^[A-Z]{1,3}\d{8,12}/.test(rawData)
  ) {
    // Other Philippine ID formats
    parsedData = parseOtherPhilippineID(rawData);
  } else {
    // Generic parsing
    parsedData = parseGenericID(rawData);
  }

  // Add parse success flag
  parsedData.parseSuccess = !!(parsedData.idNumber || parsedData.firstName || parsedData.lastName);
  
  // Always ensure idType is properly detected
  if (parsedData.idNumber) {
    parsedData.idType = detectPhilippineIDType(parsedData.idNumber);
  } else if (!parsedData.idType) {
    parsedData.idType = "Unknown ID Type";
  }
  
  // If we have an ID number, try to look it up in the database
  if (parsedData.idNumber) {
    try {
      const lookupResult = await AppwriteService.lookupIdByNumber(parsedData.idNumber);
      
      if (lookupResult.found) {
        // ID exists in database - return database record with verification info
        const dbRecord = lookupResult.record;
        
        // Ensure the database record also has proper ID type detection
        if (!dbRecord.idType || dbRecord.idType === 'Unknown') {
          dbRecord.idType = detectPhilippineIDType(dbRecord.idNumber);
        }
        
        return {
          ...dbRecord,
          // Add lookup metadata
          isFromDatabase: true,
          verificationStatus: 'FOUND_IN_DB',
          scanSource: 'database_lookup',
          lastUpdated: dbRecord.$updatedAt,
          recordId: dbRecord.$id
        };
      } else {
        // ID not found in database - return parsed data with note
        return {
          ...parsedData,
          isFromDatabase: false,
          verificationStatus: 'NEW_ID',
          scanSource: 'live_scan'
        };
      }
    } catch (error) {
      console.error('Database lookup failed:', error);
      // Fallback to parsed data if lookup fails
      return {
        ...parsedData,
        isFromDatabase: false,
        verificationStatus: 'LOOKUP_ERROR',
        scanSource: 'live_scan',
        lookupError: error.message
      };
    }
  }
  
  // No ID number found - return parsed data
  return {
    ...parsedData,
    isFromDatabase: false,
    verificationStatus: 'NO_ID_NUMBER',
    scanSource: 'live_scan'
  };
};

/**
 * Formats a name string for display
 */
export const formatName = (firstName, middleInitial, lastName) => {
  const parts = [];
  if (firstName) parts.push(firstName);
  if (middleInitial) parts.push(middleInitial + '.');
  if (lastName) parts.push(lastName);
  return parts.join(' ');
};

/**
 * Validates if the parsed data contains minimum required information
 */
export const validateParsedData = (data) => {
  const hasBasicInfo = data.idNumber || data.firstName || data.lastName;
  const completeness = [
    data.idNumber ? 1 : 0,
    data.firstName ? 1 : 0,
    data.lastName ? 1 : 0,
    data.middleInitial ? 1 : 0,
    data.birthday ? 1 : 0,
    data.photo ? 1 : 0
  ].reduce((sum, val) => sum + val, 0) / 6;

  return {
    isValid: hasBasicInfo,
    completeness: completeness,
    missingFields: [
      !data.idNumber ? 'ID Number' : null,
      !data.firstName ? 'First Name' : null,
      !data.lastName ? 'Last Name' : null,
      !data.birthday ? 'Birthday' : null,
    ].filter(Boolean)
  };
};

export default {
  parseIDData,
  formatName,
  validateParsedData
}; 