import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const user = route.params?.user || {};

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
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

  const handleScanFace = () => {
    navigation.navigate('Payment', { user });
  };

  const handleViewTransactions = () => {
    navigation.navigate('Transactions', { user });
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword', { user });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.userName}>{user.name || 'User'}</Text>
        </View>

        <View style={styles.cardContainer}>
          {/* Account Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Information</Text>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone Number:</Text>
                <Text style={styles.infoValue}>{user.phoneNumber || 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Number:</Text>
                <Text style={styles.infoValue}>{user.accountNumber || 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bank Name:</Text>
                <Text style={styles.infoValue}>{user.bankName || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={[styles.actionButton, styles.scanActionButton]} onPress={handleScanFace}>
                <Text style={styles.actionButtonText}>📸 Scan Face - Receive Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleViewTransactions}>
                <Text style={styles.actionButtonText}>💳 View Transactions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
                <Text style={styles.actionButtonText}>🔐 Change Password</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>👤 Update Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Status Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Status</Text>
            <View style={styles.statusContent}>
              <View style={styles.statusItem}>
                <View style={styles.statusIndicator} />
                <Text style={styles.statusText}>Account Active</Text>
              </View>
              <View style={styles.statusItem}>
                <View style={[styles.statusIndicator, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.statusText}>Face Recognition Enabled</Text>
              </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#bbf7d0',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#14532d',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    color: '#16a34a',
    fontWeight: '600',
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14532d',
    marginBottom: 14,
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#14532d',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#e8f5e9',
  },
  actionsContainer: {
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },  scanActionButton: {
    backgroundColor: '#cffafe',
    borderLeftColor: '#06b6d4',
  },  scanActionButton: {
    backgroundColor: '#cffafe',
    borderLeftColor: '#06b6d4',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14532d',
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
    backgroundColor: '#fbbf24',
  },
  statusText: {
    fontSize: 14,
    color: '#14532d',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
