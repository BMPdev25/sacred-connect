import api from '@/api/index';
import { logger } from '@/utils/logger';
import { EarningsSummary, PriestTransaction } from '@/types/priest.earnings.types';

/**
 * Utility to extract the ceremony name from the transaction description.
 * E.g., "Earnings for Griha Pravesh Puja" -> "Griha Pravesh Puja".
 *
 * @param desc - The description string from the transaction.
 * @returns The parsed ceremony name, or a default fallback.
 */
export function parseCeremonyFromDescription(desc: string): string {
  if (!desc) {
    return 'Ceremony';
  }
  
  const prefix = 'Earnings for ';
  if (desc.toLowerCase().startsWith(prefix.toLowerCase())) {
    return desc.slice(prefix.length).trim();
  }
  
  return desc;
}

/**
 * Fetches the priest's current earnings statistics and wallet balance.
 *
 * @returns A promise resolving to an EarningsSummary object.
 */
export async function fetchEarningsSummary(): Promise<EarningsSummary> {
  try {
    const response = await api.get('/priest/earnings');
    const data = response.data?.data || response.data || {};

    return {
      walletBalance: data.wallet?.currentBalance ?? 0,
      pendingPayments: data.earnings?.pendingPayments ?? 0,
      thisMonth: data.earnings?.thisMonth ?? 0,
      totalEarnings: data.earnings?.totalEarnings ?? 0,
      ceremonyCount: data.ceremonyCount ?? 0,
    };
  } catch (err) {
    logger.error('Failed to fetch earnings summary', err);
    return {
      walletBalance: 0,
      pendingPayments: 0,
      thisMonth: 0,
      totalEarnings: 0,
      ceremonyCount: 0,
    };
  }
}

/**
 * Fetches a paginated history list of the priest's earnings transactions.
 *
 * @param page - Page number to fetch (starts from 1).
 * @returns A promise resolving to transactions array and pagination flag.
 */
export async function fetchTransactions(
  page: number = 1
): Promise<{ transactions: PriestTransaction[]; hasMore: boolean }> {
  try {
    const response = await api.get(`/priest/transactions?page=${page}&limit=10`);
    const rawList = response.data?.data || response.data || [];
    const transactions = Array.isArray(rawList) ? rawList : [];
    
    const mapped = transactions.map((tx: any) => {
      const desc = tx.description || '';
      const dateVal = tx.createdAt || tx.date || new Date().toISOString();
      const devoteeName = tx.booking?.devoteeId?.name;
      const ceremonyName = tx.booking?.ceremonyType || parseCeremonyFromDescription(desc);

      return {
        _id: tx._id || tx.id || '',
        bookingId: tx.bookingId || (typeof tx.booking === 'string' ? tx.booking : tx.booking?._id) || '',
        type: tx.type || 'credit_for_booking',
        direction: tx.direction || 'inflow',
        amount: tx.amount || 0,
        status: tx.status || 'completed',
        description: desc,
        createdAt: dateVal,
        ceremonyName,
        devoteeName: devoteeName || undefined,
        date: dateVal ? new Date(dateVal).toISOString().split('T')[0] : undefined,
      };
    });

    return {
      transactions: mapped,
      hasMore: mapped.length === 10,
    };
  } catch (err) {
    logger.error('Failed to fetch transactions', err);
    return { transactions: [], hasMore: false };
  }
}



/**
 * Exported EarningsService containing earnings and transaction actions.
 */
export const EarningsService = {
  parseCeremonyFromDescription,
  fetchEarningsSummary,
    fetchTransactions,
};
