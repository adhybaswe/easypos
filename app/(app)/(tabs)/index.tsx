import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuthStore();
  useConfigStore(); // Subscribe to updates
  const t = useTranslation();
  const { transactions, loadTransactions } = useTransactionStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadTransactions();
      }
    }, [user, loadTransactions])
  );

  if (!user) return null;

  return (
    <ScrollView
      style={styles.mainContainer}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: 'https://ui-avatars.com/api/?name=' + user.username + '&background=random' }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.welcomeText}>{t.hello},</Text>
              <Text style={styles.usernameText}>{user.username}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="white" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>{t.adminDashboard} {t.revenue}</Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(transactions.reduce((sum, t) => sum + t.total_amount, 0))}
          </Text>
        </View>
      </View>

      {/* Body Section with Overlapping Card */}
      <View style={styles.bodyContainer}>

        {/* Floating Quick Action Card */}
        <View style={styles.floatingCard}>
          <TouchableOpacity style={styles.floatingAction} onPress={() => router.push('/(app)/pos')}>
            <View style={[styles.floatingIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="calculator" size={24} color="#9333EA" />
            </View>
            <Text style={styles.floatingLabel}>POS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.floatingAction} onPress={() => { }}>
            <View style={[styles.floatingIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="receipt" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.floatingLabel}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.floatingAction} onPress={() => { }}>
            <View style={[styles.floatingIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="stats-chart" size={24} color="#22C55E" />
            </View>
            <Text style={styles.floatingLabel}>Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.floatingAction} onPress={() => router.push('/(app)/(tabs)/settings')}>
            <View style={[styles.floatingIconCircle, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="settings" size={24} color="#EC4899" />
            </View>
            <Text style={styles.floatingLabel}>Setting</Text>
          </TouchableOpacity>
        </View>

        {user.role === 'admin' ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.menuTitle}>Management</Text>
            <View style={styles.menuGrid}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(app)/products')}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="cube" size={24} color="#EF4444" />
                </View>
                <Text style={styles.menuItemText}>{t.manageProducts}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(app)/categories')}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="list" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.menuItemText}>{t.manageCategories}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(app)/users')}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="people" size={24} color="#6366F1" />
                </View>
                <Text style={styles.menuItemText}>{t.manageUsers}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { }}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="bar-chart" size={24} color="#10B981" />
                </View>
                <Text style={styles.menuItemText}>{t.viewReports}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 24 }}>
              <Text style={styles.menuTitle}>Today's Overview</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>{t.totalTransactions}</Text>
                    <Text style={styles.statValue}>{transactions.length}</Text>
                  </View>
                </View>
              </View>
            </View>

          </View>
        ) : (
          <View style={{ marginTop: 20 }}>
            {/* Cashier View Logic - Keeps simple or adopts structure */}
            <Text style={styles.sectionTitle}>{t.cashierPos}</Text>
            {/* ... existing cashier flow or simplified ... */}
            <View style={styles.recentTransactions}>
              {/* ... existing recent transactions ... */}
              {transactions.slice(0, 5).map(tx => (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.transactionCard}
                  onPress={() => router.push(`/(app)/transactions/${tx.id}`)}
                >
                  <View style={styles.txIcon}>
                    <Ionicons name="receipt" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={{ fontWeight: '600', color: theme.colors.text, fontSize: 16 }}>{t.order} #{tx.id.slice(-4)}</Text>
                    <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
                      {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: 'bold', color: theme.colors.primary, fontSize: 16 }}>
                    {formatCurrency(tx.total_amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingBottom: 60, // Space for the overlapping card
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  floatingCard: {
    marginTop: -40, // Pull up to overlap header
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...theme.shadows.medium,
  },
  floatingAction: {
    alignItems: 'center',
    gap: 8,
  },
  floatingIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  // Reused Styles
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  menuItem: {
    width: '20%',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: theme.colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    gap: 12,
    ...theme.shadows.small,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  recentTransactions: {
    marginTop: 8,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
