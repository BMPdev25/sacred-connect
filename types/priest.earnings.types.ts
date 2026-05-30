/**
 * Represents the summary metrics of a priest's wallet and lifetime earnings.
 */
export interface EarningsSummary {
  /** The current balance in the priest's wallet available for withdrawal. */
  walletBalance: number;
  /** Earnings that are currently in pending state. */
  pendingPayments: number;
  /** Total amount earned by the priest in the current calendar month. */
  thisMonth: number;
  /** Total lifetime cumulative earnings credit. */
  totalEarnings: number;
  /** Count of ceremonies/pujas performed all-time. */
  ceremonyCount: number;
}

/**
 * Represents a single financial transaction record for the priest's wallet.
 */
export interface PriestTransaction {
  /** Unique transaction record identifier. */
  _id: string;
  /** Associated booking identifier. */
  bookingId: string;
  /** The transaction type classification (e.g. 'credit_for_booking'). */
  type: string;
  /** Direction of the transaction inflow or outflow ('inflow' | 'outflow'). */
  direction: string;
  /** Transaction value amount (in INR). */
  amount: number;
  /** Settlement status of the transaction ('pending' | 'completed' | 'failed'). */
  status: string;
  /** Detailed text description of the transaction. */
  description: string;
  /** ISO date string representing creation timestamp. */
  createdAt: string;
  
  // Derived fields (parsed from description or booking details)
  /** Extracted ceremony name associated with the transaction. */
  ceremonyName?: string;
  /** Extracted devotee name associated with the transaction. */
  devoteeName?: string;
  /** Extracted/formatted ceremony date. */
  date?: string;
}
