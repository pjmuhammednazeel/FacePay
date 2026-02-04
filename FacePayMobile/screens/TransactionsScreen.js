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
    try {
      return new Date(value).toLocaleString();
    } catch (e) {
      return value;
    }
  };

  const renderItem = ({ item }) => {
    const isSender = Number(item.sender_id) === Number(user.id);
    const directionLabel = isSender ? 'Sent' : 'Received';
    const counterpartyName = isSender ? item.receiver_name : item.sender_name;
    const counterpartyAccount = isSender ? item.receiver_account : item.sender_account;
    const counterpartyBank = isSender ? item.receiver_bank : item.sender_bank;
    const amountColor = isSender ? '#dc2626' : '#16a34a';

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionDirection}>{directionLabel}</Text>
          <Text style={[styles.amountText, { color: amountColor }]}>₹{Number(item.amount).toFixed(2)}</Text>
        </View>

        <Text style={styles.transactionLine}>Counterparty: {counterpartyName}</Text>
        <Text style={styles.transactionLine}>Account: {counterpartyAccount}</Text>
        <Text style={styles.transactionLine}>Bank: {counterpartyBank}</Text>
        <Text style={styles.transactionLine}>Status: {item.status}</Text>
        {item.face_match_similarity !== null && item.face_match_similarity !== undefined && (
          <Text style={styles.transactionLine}>
            Face Match: {(Number(item.face_match_similarity) * 100).toFixed(1)}%
          </Text>
        )}
        <Text style={styles.transactionLine}>Date: {formatDate(item.created_at)}</Text>
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
          <ActivityIndicator size="large" color="#16a34a" />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions yet.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    padding: 20,
    backgroundColor: '#16a34a',
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
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDirection: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14532d',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
  },
  transactionLine: {
    fontSize: 14,
    color: '#14532d',
    marginTop: 2,
  },
});
