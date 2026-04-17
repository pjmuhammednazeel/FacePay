import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from '../config/api';

export default function TransactionsScreen({ navigation, route }) {
  const user = route.params?.user || {};
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) {
      setError('User info missing. Please log in again.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/transactions?userId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        setError('');
      } else {
        setError(data.message || 'Failed to load transactions');
      }
    } catch (err) {
      setError('Network error while loading transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const formatDate = (value) => {
    try { return new Date(value).toLocaleString(); } catch { return value; }
  };

  const renderItem = ({ item }) => {
    const isSender = Number(item.sender_id) === Number(user.id);
    const directionLabel = isSender ? 'Sent' : 'Received';
    const counterpartyName = isSender ? item.receiver_name : item.sender_name;
    const counterpartyAccount = isSender ? item.receiver_account : item.sender_account;
    const counterpartyBank = isSender ? item.receiver_bank : item.sender_bank;
    const amountColor = isSender ? '#ef4444' : '#22c55e';
    const amountPrefix = isSender ? '−' : '+';

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={[styles.directionBadge, isSender ? styles.sentBadge : styles.receivedBadge]}>
            <Text style={[styles.directionText, isSender ? styles.sentText : styles.receivedText]}>
              {directionLabel}
            </Text>
          </View>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {amountPrefix}₹{Number(item.amount).toFixed(2)}
          </Text>
        </View>

        <Text style={styles.counterpartyName}>{counterpartyName}</Text>
        <Text style={styles.transactionLine}>Account: {counterpartyAccount}</Text>
        <Text style={styles.transactionLine}>Bank: {counterpartyBank}</Text>
        <View style={styles.transactionFooter}>
          <Text style={styles.statusBadge}>{item.status}</Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTransactions}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={transactions.length ? styles.listContent : styles.emptyContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your payment history will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
    marginRight: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 14,
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e7ff',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  directionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  sentBadge: {
    backgroundColor: '#fee2e2',
  },
  receivedBadge: {
    backgroundColor: '#dcfce7',
  },
  directionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sentText: {
    color: '#ef4444',
  },
  receivedText: {
    color: '#16a34a',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '800',
  },
  counterpartyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  transactionLine: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#e0e7ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
