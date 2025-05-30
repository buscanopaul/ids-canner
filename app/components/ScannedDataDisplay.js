import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ScannedDataDisplay = ({ data, onClose, onScanAnother }) => {
  const [showFullData, setShowFullData] = useState(false);

  const handleShare = async () => {
    try {
      const shareText = `ID Information:
ID Type: ${data.idType || 'N/A'}
ID Number: ${data.idNumber || 'N/A'}
Name: ${data.firstName || ''} ${data.middleInitial || ''} ${data.lastName || ''}
Birthday: ${data.birthday || 'N/A'}
Scanned at: ${new Date().toLocaleString()}`;

      await Share.share({
        message: shareText,
        title: 'Scanned ID Information',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share data');
    }
  };

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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanned ID Data</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photo Section */}
          <View style={styles.photoSection}>
            {data.photo ? (
              <Image source={{ uri: data.photo }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={60} color="#9CA3AF" />
                <Text style={styles.photoPlaceholderText}>No Photo Available</Text>
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

          {/* Additional Information */}
          {data.additionalInfo && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => setShowFullData(!showFullData)}
              >
                <Text style={styles.sectionTitle}>Additional Information</Text>
                <Ionicons 
                  name={showFullData ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {showFullData && (
                <View style={styles.additionalInfoContainer}>
                  <Text style={styles.additionalInfoText}>{data.additionalInfo}</Text>
                </View>
              )}
            </View>
          )}

          {/* Scan Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scan Information</Text>
            
            <View style={styles.dataRow}>
              <Text style={styles.label}>Scanned At:</Text>
              <Text style={styles.value}>{new Date().toLocaleString()}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.scanAgainButton} 
            onPress={onScanAnother}
          >
            <Ionicons name="scan" size={20} color="#4F46E5" />
            <Text style={styles.scanAgainButtonText}>Scan Another</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  photoImage: {
    width: 120,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
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
  additionalInfoContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  additionalInfoText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
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

export default ScannedDataDisplay; 