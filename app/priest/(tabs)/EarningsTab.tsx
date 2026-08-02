import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { SafeAreaView } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';
import { EarningsService } from '@/services/priest/earningsService';
import { PriestTransaction } from '@/types/priest.earnings.types';
import TransactionRow from '@/components/priest/TransactionRow';
import EarningStatCard from '@/components/priest/EarningStatCard';

export default function EarningsTab(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['priestEarnings'],
    queryFn: EarningsService.fetchEarningsSummary,
    staleTime: 60000,
  });

  const {
    data: txnData,
    isLoading: isTxnsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['priestTransactions'],
    queryFn: ({ pageParam = 1 }) => EarningsService.fetchTransactions(pageParam as number),
    getNextPageParam: (lastPage, allPages) => lastPage.hasMore ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 60000,
  });

  const allTransactions = useMemo(() => txnData?.pages.flatMap((p) => p.transactions) || [], [txnData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['priestEarnings'] }),
      queryClient.invalidateQueries({ queryKey: ['priestTransactions'] }),
    ]);
    setRefreshing(false);
  };

  const handleRequestPayout = () => {
    Alert.alert('Payout Coming Soon', 'Bank account setup will be available soon.\n\nFor urgent requests, contact:\nsupport@sacredconnect.in', [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={THEME.colors.primary} />}
    >
      <Text style={styles.headerTitle}>Earnings</Text>

      {isSummaryLoading ? <View style={styles.walletShimmer} /> : (
        <LinearGradient colors={['#FF9933', '#CC3300', '#800000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.walletCard}>
          <Text style={styles.walletLabel}>WALLET BALANCE</Text>
          <Text style={styles.walletAmount}>₹{(summary?.walletBalance || 0).toLocaleString('en-IN')}</Text>
          <View style={styles.walletFooter}>
            <View style={styles.pendingRow}>
              <Ionicons name="time-outline" size={14} color="#FFF" />
              <Text style={styles.pendingText}>Pending: ₹{(summary?.pendingPayments || 0).toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity onPress={handleRequestPayout} activeOpacity={0.8}>
              <Text style={styles.requestText}>Request Payout →</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      <View style={styles.statsRow}>
        <EarningStatCard iconName="wallet-outline" value={`₹${(summary?.thisMonth || 0).toLocaleString('en-IN')}`} label="This Month" />
        <EarningStatCard iconName="bar-chart-outline" value={`₹${(summary?.totalEarnings || 0).toLocaleString('en-IN')}`} label="Total Earned" />
        <EarningStatCard iconName="ribbon-outline" value={(summary?.ceremonyCount || 0).toString()} label="Completed" />
      </View>

      <View style={styles.transactionsHeader}>
        <Text style={styles.subheading}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => Alert.alert('View All Transactions', 'All transactions will be paginated below. Tap "Load More" to see older history.')}>
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {isTxnsLoading && !isFetchingNextPage ? (
        <View style={styles.loadingWrapper}><ActivityIndicator color={THEME.colors.primary} /></View>
      ) : allTransactions.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <Ionicons name="receipt-outline" size={48} color={THEME.colors.textMuted} />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <View style={styles.transactionsCard}>
          {allTransactions.map((tx: PriestTransaction, idx: number) => (
            <TransactionRow key={tx._id} transaction={tx} isLast={idx === allTransactions.length - 1} />
          ))}
          {hasNextPage && (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? <ActivityIndicator color={THEME.colors.primary} /> : <Text style={styles.loadMoreText}>Load More</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 32 },
  headerTitle: { fontSize: THEME.typography.displayMedium, fontWeight: '700', color: THEME.colors.textPrimary, paddingHorizontal: 16, paddingTop: 8, marginBottom: THEME.spacing.sm },
  walletCard: { height: 140, borderRadius: 20, marginHorizontal: 16, padding: 20, position: 'relative' },
  walletShimmer: { height: 140, borderRadius: 20, marginHorizontal: 16, backgroundColor: '#F3F4F6' },
  walletLabel: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', opacity: 0.8, letterSpacing: 2 },
  walletAmount: { fontSize: 40, fontWeight: '900', color: '#FFFFFF', marginTop: 4 },
  walletFooter: { position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pendingRow: { flexDirection: 'row', alignItems: 'center' },
  pendingText: { fontSize: 12, color: '#FFFFFF', opacity: 0.7, marginLeft: 4 },
  requestText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8 },
  transactionsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: THEME.spacing.lg },
  subheading: { fontSize: THEME.typography.subheading, fontWeight: '700', color: THEME.colors.textPrimary },
  viewAllText: { fontSize: 14, color: THEME.colors.primary, fontWeight: '600' },
  transactionsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 16, marginTop: 12, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: THEME.colors.border, overflow: 'hidden' },
  loadMoreBtn: { paddingVertical: 14, justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderTopColor: THEME.colors.border, backgroundColor: '#FAF9F6' },
  loadMoreText: { fontSize: 14, color: THEME.colors.primary, fontWeight: '700' },
  loadingWrapper: { paddingVertical: 32, alignItems: 'center' },
  emptyWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, marginTop: 12 },
  emptyText: { fontSize: THEME.typography.bodySmall, color: THEME.colors.textMuted, marginTop: THEME.spacing.sm },
});
