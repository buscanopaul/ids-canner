import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DatabaseLookupDisplay = ({ data, onClose, onScanAnother }) => {
  const [showFullData, setShowFullData] = useState(false);

  const getVerificationBadge = () => {
    switch (data.verificationStatus) {
      case 'FOUND_IN_DB':
        return {
          color: '#059669',
          icon: 'checkmark-circle',
          text: 'Verified from Database',
          bgColor: '#ECFDF5'
        };
      case 'NEW_ID':
        return {
          color: '#F59E0B',
          icon: 'alert-circle',
          text: 'New ID (Not in Database)',
          bgColor: '#FFFBEB'
        };
      case 'LOOKUP_ERROR':
        return {
          color: '#EF4444',
          icon: 'close-circle',
          text: 'Database Lookup Failed',
          bgColor: '#FEF2F2'
        };
      default:
        return {
          color: '#6B7280',
          icon: 'information-circle',
          text: 'Unknown Status',
          bgColor: '#F9FAFB'
        };
    }
  };

  const badge = getVerificationBadge();

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ID Verification</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Verification Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: badge.bgColor }]}>
            <Ionicons name={badge.icon} size={24} color={badge.color} />
            <Text style={[styles.statusText, { color: badge.color }]}>
              {badge.text}
            </Text>
          </View>

          {/* Photo Section */}
          <View style={styles.photoSection}>
            {(data.photo || data.photoUrl) ? (
              <Image 
                source={{ uri: data.photo || data.photoUrl }} 
                style={styles.photoImage}
                onError={(error) => {
                  console.log('Image load error:', error);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully');
                }}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={60} color="#9CA3AF" />
                <Text style={styles.photoPlaceholderText}>
                  {data.isFromDatabase ? 'Photo from Database' : 'No Photo Available'}
                  {data.photoId && '\n(Photo ID: ' + data.photoId + ')'}
                </Text>
              </View>
            )}
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.dataRow}>
              <Text style={styles.label}>ID Type:</Text>
              <Text style={styles.value}>{data.idType || 'Unknown'}</Text>
            </View>
            
            <View style={styles.dataRow}>
              <Text style={styles.label}>ID Number:</Text>
              <Text style={styles.value}>{data.idNumber || 'Not Available'}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.label}>First Name:</Text>
              <Text style={styles.value}>{data.firstName || 'Not Available'}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.label}>Middle Initial:</Text>
              <Text style={styles.value}>{data.middleInitial || 'Not Available'}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.label}>Last Name:</Text>
              <Text style={styles.value}>{data.lastName || 'Not Available'}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.label}>Birthday:</Text>
              <Text style={styles.value}>{data.birthday || 'Not Available'}</Text>
            </View>
          </View>

          {/* Database Information */}
          {data.isFromDatabase && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Database Record</Text>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Last Updated:</Text>
                <Text style={styles.value}>
                  {new Date(data.lastUpdated).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Raw Data Section - Only show if available */}
          {(data.scannedRawData || data.rawData) && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => setShowFullData(!showFullData)}
              >
                <Text style={styles.sectionTitle}>
                  {data.isFromDatabase ? 'Original Scan Data' : 'Raw Scan Data'}
                </Text>
                <Ionicons 
                  name={showFullData ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {showFullData && (
                <View style={styles.rawDataContainer}>
                  <Text style={styles.rawDataText}>
                    {data.scannedRawData || data.rawData}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.scanAgainButton} 
            onPress={onScanAnother}
          >
            <Ionicons name="close" size={20} color="#4F46E5" />
            <Text style={styles.scanAgainButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 16,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  photoImage: {
    width: 120,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#059669',
  },
  photoPlaceholder: {
    width: 120,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  valueSmall: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  rawDataContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  rawDataText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  scanAgainButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  scanAgainButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DatabaseLookupDisplay; 