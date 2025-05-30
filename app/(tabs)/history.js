import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useFocusEffect } from '@react-navigation/native';
import AppwriteService from '../services/appwriteService';
import ScanStatistics from '../components/ScanStatistics';
import TestLookup from '../components/TestLookup';

export default function HistoryScreen() {
  const { user } = useUser();
  const [scannedHistory, setScannedHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [showStatistics, setShowStatistics] = useState(false);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadScannedHistory();
    }, [user])
  );

  // Filter data when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHistory(scannedHistory);
    } else {
      const filtered = scannedHistory.filter(item =>
        item.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.idNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.idType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHistory(filtered);
    }
  }, [searchQuery, scannedHistory]);

  const loadScannedHistory = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const history = await AppwriteService.getScannedDataHistory();
      setScannedHistory(history);
      console.log('Loaded history:', history.length, 'items');
    } catch (error) {
      console.error('Load history error:', error);
      Alert.alert('Error', 'Failed to load scan history');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadScannedHistory();
    setIsRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>
            {item.firstName} {item.middleInitial} {item.lastName}
          </Text>
          <Text style={styles.itemIdType}>{item.idType}</Text>
          <Text style={styles.itemIdNumber}>{item.idNumber}</Text>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        {item.birthday && (
          <Text style={styles.itemDetail}>Birthday: {item.birthday}</Text>
        )}
        <Text style={styles.itemDate}>Scanned: {formatDate(item.$createdAt)}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="scan-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Scans Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start scanning IDs to see your history here
      </Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Ionicons name="person-outline" size={64} color="#9CA3AF" />
          <Text style={styles.loginTitle}>Please Log In</Text>
          <Text style={styles.loginSubtitle}>
            Sign in to view your scan history
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Scan History</Text>
          <Text style={styles.headerSubtitle}>
            {filteredHistory.length} scan{filteredHistory.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.statsButton}
          onPress={() => setShowStatistics(true)}
        >
          <Ionicons name="analytics" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID number, or type..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearch}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Database Lookup Test */}
      <TestLookup />

      {/* History List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading scan history...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.$id}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Statistics Modal */}
      <Modal
        visible={showStatistics}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatistics(false)}
      >
        <ScanStatistics onClose={() => setShowStatistics(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearSearch: {
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemIdType: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginBottom: 2,
  },
  itemIdNumber: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  itemDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
}); 