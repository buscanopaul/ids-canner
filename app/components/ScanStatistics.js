import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import AppwriteService from '../services/appwriteService';

const ScanStatistics = ({ onClose }) => {
  const { user } = useUser();
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    if (!user) return;

    try {
      const stats = await AppwriteService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Load statistics error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getIdTypeColor = (idType) => {
    const colors = {
      "Philippine Driver's License": '#4F46E5',
      'Philippine National ID': '#059669',
      'SSS ID': '#DC2626',
      'UMID': '#7C2D12',
      'PRC License': '#9333EA',
      'Postal ID': '#EA580C',
      'Generic ID': '#6B7280',
      'Unknown': '#9CA3AF',
    };
    return colors[idType] || '#6B7280';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan Statistics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    );
  }

  if (!statistics) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan Statistics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start scanning IDs to see your statistics
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Statistics</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="qr-code-scanner" size={24} color="#4F46E5" />
              <Text style={styles.statNumber}>{statistics.totalScans}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={24} color="#059669" />
              <Text style={styles.statNumber}>
                {Object.keys(statistics.idTypeBreakdown).length}
              </Text>
              <Text style={styles.statLabel}>ID Types</Text>
            </View>
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Period</Text>
          <View style={styles.dateRange}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>First Scan</Text>
              <Text style={styles.dateValue}>{formatDate(statistics.firstScan)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Latest Scan</Text>
              <Text style={styles.dateValue}>{formatDate(statistics.lastScan)}</Text>
            </View>
          </View>
        </View>

        {/* ID Type Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ID Type Breakdown</Text>
          <View style={styles.idTypeList}>
            {Object.entries(statistics.idTypeBreakdown)
              .sort(([,a], [,b]) => b - a)
              .map(([idType, count]) => (
                <View key={idType} style={styles.idTypeItem}>
                  <View style={styles.idTypeInfo}>
                    <View 
                      style={[
                        styles.idTypeIndicator, 
                        { backgroundColor: getIdTypeColor(idType) }
                      ]} 
                    />
                    <Text style={styles.idTypeName}>{idType}</Text>
                  </View>
                  <View style={styles.idTypeStats}>
                    <Text style={styles.idTypeCount}>{count}</Text>
                    <Text style={styles.idTypePercentage}>
                      {Math.round((count / statistics.totalScans) * 100)}%
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        {/* Recent Scans */}
        {statistics.recentScans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <View style={styles.recentList}>
              {statistics.recentScans.map((scan) => (
                <View key={scan.$id} style={styles.recentItem}>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>
                      {scan.firstName} {scan.lastName}
                    </Text>
                    <Text style={styles.recentType}>{scan.idType}</Text>
                  </View>
                  <Text style={styles.recentDate}>
                    {formatDate(scan.$createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  dateRange: {
    flexDirection: 'row',
    gap: 12,
  },
  dateItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  idTypeList: {
    gap: 8,
  },
  idTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  idTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  idTypeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  idTypeName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  idTypeStats: {
    alignItems: 'flex-end',
  },
  idTypeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  idTypePercentage: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  recentType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  recentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default ScanStatistics; 