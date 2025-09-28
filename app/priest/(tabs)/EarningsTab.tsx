import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_COLORS } from "../../../constants/Colors";
import priestService from "../../../services/priestService";

const { width: screenWidth } = Dimensions.get("window");

const EarningsScreen = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("thisMonth");
  const [earningsData, setEarningsData] = useState<any>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayments: 0,
    completedCeremonies: 0,
    monthlyTrends: [],
    categoryBreakdown: [],
    recentTransactions: [],
  });

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      const response = await priestService.getEarnings();
      if (response.success) {
        setEarningsData(response.data);
      }
    } catch (error) {
      console.error("Failed to load earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number | any) => {
    return `₹${(amount as any)?.toLocaleString?.("en-IN") || "0"}`;
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const renderEarningCard = (
    title: string,
    amount: number,
    subtitle: string | undefined,
    icon: any,
    color: string,
    change?: any
  ) => (
    <SafeAreaView>
      <View style={[styles.earningCard, { borderLeftColor: color }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={[styles.cardAmount, { color }]}>
              {formatCurrency(amount)}
            </Text>
            {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
          </View>
          <View style={[styles.cardIcon, { backgroundColor: color + "20" }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
        </View>
        {change !== undefined && (
          <View style={styles.changeContainer}>
            <Ionicons
              name={change >= 0 ? "trending-up" : "trending-down"}
              size={16}
              color={change >= 0 ? APP_COLORS.success : APP_COLORS.error}
            />
            <Text
              style={[
                styles.changeText,
                { color: change >= 0 ? APP_COLORS.success : APP_COLORS.error },
              ]}
            >
              {change >= 0 ? "+" : ""}
              {change}%
            </Text>
            <Text style={styles.changeLabel}>vs last month</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const monthlyData = {
    labels: (earningsData.monthlyTrends || []).map((trend: any) =>
      new Date(2024, (trend.month || 1) - 1).toLocaleDateString("en", {
        month: "short",
      })
    ),
    datasets: [
      {
        data: (earningsData.monthlyTrends || []).map(
          (trend: any) => trend.earnings || 0
        ),
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const categoryData = (earningsData.categoryBreakdown || []).map(
    (item: any, index: number) => ({
      name: item.category,
      population: item.amount,
      color: [
        APP_COLORS.primary,
        APP_COLORS.secondary,
        APP_COLORS.success,
        APP_COLORS.warning,
      ][index % 4],
      legendFontColor: APP_COLORS.text,
      legendFontSize: 12,
    })
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text style={styles.loadingText}>Loading earnings data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings Dashboard</Text>
          <TouchableOpacity onPress={loadEarningsData}>
            <Ionicons name="refresh" size={24} color={APP_COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {[
              { key: "thisMonth", label: "This Month" },
              { key: "lastMonth", label: "Last Month" },
              { key: "allTime", label: "All Time" },
            ].map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && styles.activePeriodButton,
                ]}
                onPress={() => setSelectedPeriod(period.key)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period.key &&
                      styles.activePeriodButtonText,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Earning Cards */}
          <View style={styles.cardsContainer}>
            {renderEarningCard(
              "Total Earnings",
              earningsData.totalEarnings,
              "All time earnings",
              "wallet",
              APP_COLORS.primary
            )}

            {renderEarningCard(
              "This Month",
              earningsData.thisMonth,
              `${earningsData.completedCeremonies} ceremonies`,
              "calendar",
              APP_COLORS.success,
              getChangePercent(earningsData.thisMonth, earningsData.lastMonth)
            )}

            {renderEarningCard(
              "Pending Payments",
              earningsData.pendingPayments,
              "Awaiting payout",
              "time",
              APP_COLORS.warning
            )}
          </View>

          {/* Monthly Trend Chart */}
          {earningsData.monthlyTrends.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Monthly Earnings Trend</Text>
              <LineChart
                data={monthlyData}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                bezier
              />
            </View>
          )}

          {/* Category Breakdown */}
          {categoryData.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Earnings by Category</Text>
              <PieChart
                data={categoryData}
                width={screenWidth - 32}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </View>
          )}

          {/* Recent Transactions */}
          <View style={styles.transactionsContainer}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {(earningsData.recentTransactions || []).map(
              (transaction: any, index: number) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Ionicons
                      name={
                        transaction.type === "earning"
                          ? "arrow-down-circle"
                          : "arrow-up-circle"
                      }
                      size={24}
                      color={
                        transaction.type === "earning"
                          ? APP_COLORS.success
                          : APP_COLORS.primary
                      }
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color:
                          transaction.type === "earning"
                            ? APP_COLORS.success
                            : APP_COLORS.error,
                      },
                    ]}
                  >
                    {transaction.type === "earning" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Payout Information */}
          <View style={styles.payoutContainer}>
            <View style={styles.payoutHeader}>
              <Text style={styles.sectionTitle}>Payout Schedule</Text>
              <TouchableOpacity style={styles.requestPayoutButton}>
                <Text style={styles.requestPayoutText}>Request Payout</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.payoutInfo}>
              <View style={styles.payoutItem}>
                <Text style={styles.payoutLabel}>Next Payout Date</Text>
                <Text style={styles.payoutValue}>
                  {earningsData.nextPayoutDate
                    ? new Date(earningsData.nextPayoutDate).toLocaleDateString()
                    : "Not scheduled"}
                </Text>
              </View>
              <View style={styles.payoutItem}>
                <Text style={styles.payoutLabel}>Last Payout</Text>
                <Text style={styles.payoutValue}>
                  {earningsData.lastPayoutDate
                    ? new Date(earningsData.lastPayoutDate).toLocaleDateString()
                    : "No previous payout"}
                </Text>
              </View>
            </View>
          </View>

          {/* Performance Metrics */}
          <View style={styles.metricsContainer}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {earningsData.completedCeremonies}
                </Text>
                <Text style={styles.metricLabel}>Completed Ceremonies</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  ₹
                  {Math.round(
                    earningsData.thisMonth /
                      (earningsData.completedCeremonies || 1)
                  )}
                </Text>
                <Text style={styles.metricLabel}>Avg. per Ceremony</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: APP_COLORS.gray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: APP_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: APP_COLORS.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activePeriodButton: {
    backgroundColor: APP_COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  activePeriodButtonText: {
    color: APP_COLORS.white,
    fontWeight: "600",
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  earningCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  changeLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginLeft: 4,
  },
  chartContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLORS.text,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
  },
  transactionsContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLORS.text,
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    color: APP_COLORS.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  payoutContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  payoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  requestPayoutButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestPayoutText: {
    color: APP_COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  payoutInfo: {
    gap: 12,
  },
  payoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payoutLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  payoutValue: {
    fontSize: 14,
    fontWeight: "600",
    color: APP_COLORS.text,
  },
  metricsContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: APP_COLORS.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
    textAlign: "center",
  },
});

export default EarningsScreen;
