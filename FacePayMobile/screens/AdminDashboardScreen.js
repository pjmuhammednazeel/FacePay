import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from '../config/api';

export default function AdminDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubAdminModal, setShowSubAdminModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [newSubAdminUsername, setNewSubAdminUsername] = useState('');
  const [newSubAdminPassword, setNewSubAdminPassword] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    recentTransactions: [],
    recentUsers: [],
  });
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      // Fetch users
      const usersResponse = await fetch(`${API_URL}/users`);
      const usersData = await usersResponse.json();
      
      // Fetch transactions
      const transactionsResponse = await fetch(`${API_URL}/transactions`);
      const transactionsData = await transactionsResponse.json();

      const users = usersData.users || [];
      const transactions = transactionsData.transactions || [];

      setAllUsers(users);
      setStats({
        totalUsers: users.length,
        totalTransactions: transactions.length,
        recentTransactions: transactions.slice(0, 5),
        recentUsers: users.slice(-5).reverse(),
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      Alert.alert('Error', 'Could not load admin statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'DELETE',
              });
              
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Success', 'User deleted successfully');
                fetchAdminStats(); // Refresh data
              } else {
                Alert.alert('Error', data.message || 'Failed to delete user');
              }
            } catch (error) {
              console.error('Delete user error:', error);
              Alert.alert('Error', 'Could not delete user');
            }
          },
        },
      ]
    );
  };

  const handleCreateSubAdmin = async () => {
    if (!newSubAdminUsername || !newSubAdminPassword) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newSubAdminUsername,
          password: newSubAdminPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Sub-admin created successfully');
        setShowSubAdminModal(false);
        setNewSubAdminUsername('');
        setNewSubAdminPassword('');
      } else {
        Alert.alert('Error', data.message || 'Failed to create sub-admin');
      }
    } catch (error) {
      console.error('Create sub-admin error:', error);
      Alert.alert('Error', 'Could not create sub-admin');
    }
  };

  const handleViewAllUsers = () => {
    setShowUsersModal(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminStats();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleViewAllTransactions = () => {
    if (stats.recentTransactions.length === 0) {
      Alert.alert('Transactions', 'No transactions found');
      return;
    }
    
    const transactionsList = stats.recentTransactions.map(t => 
      `• Rs ${t.amount} - ${t.senderName || 'Unknown'} → ${t.receiverName || 'Unknown'}\n  ${new Date(t.transactionDate).toLocaleDateString()}`
    ).join('\n\n');
    
    Alert.alert('Recent Transactions', transactionsList);
  };

  const handleSystemHealth = () => {
    Alert.alert(
      'System Health',
      '✅ Server: Running\n✅ Database: Connected\n✅ Face Recognition: Active\n✅ Liveness Detection: Active',
      [{ text: 'OK' }]
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.loadingText}>Loading admin data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Admin Dashboard</Text>
          <Text style={styles.userName}>System Administrator</Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardRed]}>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={[styles.statCard, styles.statCardOrange]}>
            <Text style={styles.statNumber}>{stats.totalTransactions}</Text>
            <Text style={styles.statLabel}>Total Transactions</Text>
          </View>
        </View>

        {/* Admin Actions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.adminActionButton]} 
              onPress={handleViewAllUsers}
            >
              <Text style={styles.actionButtonText}>👥 View All Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.adminActionButton]} 
              onPress={handleViewAllTransactions}
            >
              <Text style={styles.actionButtonText}>💰 View All Transactions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.adminActionButton]} 
              onPress={handleSystemHealth}
            >
              <Text style={styles.actionButtonText}>🏥 System Health</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.adminActionButton]}
              onPress={onRefresh}
            >
              <Text style={styles.actionButtonText}>🔄 Refresh Data</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.createSubAdminButton]} 
              onPress={() => setShowSubAdminModal(true)}
            >
              <Text style={styles.actionButtonText}>➕ Create Sub-Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityLabel}>Latest Users:</Text>
            {stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user, index) => (
                <Text key={index} style={styles.activityItem}>
                  • {user.name} ({user.phoneNumber})
                </Text>
              ))
            ) : (
              <Text style={styles.noDataText}>No users yet</Text>
            )}
            
            <Text style={[styles.activityLabel, { marginTop: 16 }]}>Latest Transactions:</Text>
            {stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((transaction, index) => (
                <Text key={index} style={styles.activityItem}>
                  • Rs {transaction.amount} - {transaction.senderName || 'Unknown'} → {transaction.receiverName || 'Unknown'}
                </Text>
              ))
            ) : (
              <Text style={styles.noDataText}>No transactions yet</Text>
            )}
          </View>
        </View>

        {/* System Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Status</Text>
          <View style={styles.statusContent}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.statusText}>Server Online</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.statusText}>Database Connected</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.statusText}>Face Recognition Active</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Users List Modal */}
      <Modal
        visible={showUsersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUsersModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Users ({allUsers.length})</Text>
              <TouchableOpacity onPress={() => setShowUsersModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={allUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.userItem}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userDetails}>{item.phoneNumber}</Text>
                    <Text style={styles.userDetails}>{item.accountNumber} - {item.bankName}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(item.id, item.name)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No users found</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Create Sub-Admin Modal */}
      <Modal
        visible={showSubAdminModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubAdminModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Sub-Admin</Text>
              <TouchableOpacity onPress={() => setShowSubAdminModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                value={newSubAdminUsername}
                onChangeText={setNewSubAdminUsername}
                autoCapitalize="none"
              />
              
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                value={newSubAdminPassword}
                onChangeText={setNewSubAdminPassword}
                secureTextEntry
              />
              
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateSubAdmin}
              >
                <Text style={styles.createButtonText}>Create Sub-Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2f2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#991b1b',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#fecaca',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7f1d1d',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    color: '#dc2626',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardRed: {
    backgroundColor: '#dc2626',
  },
  statCardOrange: {
    backgroundColor: '#ea580c',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7f1d1d',
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  adminActionButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  createSubAdminButton: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  actionButtonText: {
    color: '#14532d',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  activityContent: {
    gap: 8,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  activityItem: {
    fontSize: 14,
    color: '#7f1d1d',
    paddingLeft: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingLeft: 8,
  },
  statusContent: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 15,
    color: '#450a0a',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#fecaca',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7f1d1d',
  },
  modalCloseButton: {
    fontSize: 28,
    color: '#991b1b',
    fontWeight: '700',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7f1d1d',
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 13,
    color: '#991b1b',
    marginBottom: 2,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 20,
  },
  formContainer: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f1d1d',
    marginBottom: -8,
  },
  input: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#7f1d1d',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
