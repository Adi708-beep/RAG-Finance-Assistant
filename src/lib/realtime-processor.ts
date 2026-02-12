/**
 * Real-time Data Processing Module
 * Inspired by Pathway framework patterns for streaming data processing
 * Provides real-time transaction processing, anomaly detection, and budget monitoring
 */

import { supabase } from '@/db/supabase';
import type { Transaction, Budget } from '@/types';

export interface ProcessingPipeline {
  subscribe: () => void;
  unsubscribe: () => void;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  transaction: Transaction;
}

export interface BudgetAlert {
  category: string;
  budgeted: number;
  spent: number;
  percentUsed: number;
  status: 'warning' | 'exceeded';
}

/**
 * Real-time Transaction Processing Pipeline
 * Monitors new transactions and triggers processing workflows
 */
export class TransactionPipeline implements ProcessingPipeline {
  private userId: string;
  private channel: any;
  public onTransaction?: (transaction: Transaction) => void;
  public onAnomaly?: (anomaly: AnomalyResult) => void;
  public onBudgetAlert?: (alert: BudgetAlert) => void;

  constructor(
    userId: string,
    callbacks?: {
      onTransaction?: (transaction: Transaction) => void;
      onAnomaly?: (anomaly: AnomalyResult) => void;
      onBudgetAlert?: (alert: BudgetAlert) => void;
    }
  ) {
    this.userId = userId;
    this.onTransaction = callbacks?.onTransaction;
    this.onAnomaly = callbacks?.onAnomaly;
    this.onBudgetAlert = callbacks?.onBudgetAlert;
  }

  subscribe() {
    // Subscribe to real-time transaction inserts
    this.channel = supabase
      .channel(`transactions:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${this.userId}`
        },
        async (payload) => {
          const transaction = payload.new as Transaction;
          
          // Trigger transaction callback
          if (this.onTransaction) {
            this.onTransaction(transaction);
          }

          // Process transaction through pipeline
          await this.processTransaction(transaction);
        }
      )
      .subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
  }

  private async processTransaction(transaction: Transaction) {
    // Step 1: Anomaly Detection
    const anomaly = await this.detectAnomaly(transaction);
    if (anomaly.isAnomaly && this.onAnomaly) {
      this.onAnomaly(anomaly);
    }

    // Step 2: Budget Monitoring
    const budgetAlert = await this.checkBudgetStatus(transaction);
    if (budgetAlert && this.onBudgetAlert) {
      this.onBudgetAlert(budgetAlert);
    }

    // Step 3: Update aggregated statistics (could be expanded)
    await this.updateStatistics(transaction);
  }

  private async detectAnomaly(transaction: Transaction): Promise<AnomalyResult> {
    // Fetch recent transactions for comparison
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', this.userId)
      .eq('category', transaction.category)
      .order('transaction_date', { ascending: false })
      .limit(50);

    if (!recentTransactions || recentTransactions.length < 10) {
      return {
        isAnomaly: false,
        severity: 'low',
        reason: 'Insufficient data for anomaly detection',
        transaction
      };
    }

    // Calculate statistics
    const amounts = recentTransactions.map((t: any) => parseFloat(t.amount));
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    const transactionAmount = parseFloat(transaction.amount.toString());
    const zScore = (transactionAmount - mean) / stdDev;

    // Determine anomaly severity
    let isAnomaly = false;
    let severity: 'low' | 'medium' | 'high' = 'low';
    let reason = '';

    if (Math.abs(zScore) > 3) {
      isAnomaly = true;
      severity = 'high';
      reason = `Transaction amount (₹${transactionAmount}) is ${Math.abs(zScore).toFixed(1)} standard deviations from average (₹${mean.toFixed(2)})`;
    } else if (Math.abs(zScore) > 2) {
      isAnomaly = true;
      severity = 'medium';
      reason = `Transaction amount (₹${transactionAmount}) is significantly higher than usual for ${transaction.category}`;
    }

    return { isAnomaly, severity, reason, transaction };
  }

  private async checkBudgetStatus(transaction: Transaction): Promise<BudgetAlert | null> {
    // Get active budget
    const { data: budget } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!budget) return null;

    // Calculate current month spending for this category
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: monthTransactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', this.userId)
      .eq('category', transaction.category)
      .gte('transaction_date', `${currentMonth}-01`)
      .lte('transaction_date', `${currentMonth}-31`);

    const totalSpent = monthTransactions?.reduce((sum, t: any) => sum + parseFloat(t.amount), 0) || 0;
    const budgetValue = (budget as any)[transaction.category];
    const budgeted = parseFloat(budgetValue?.toString() || '0');

    if (budgeted === 0) return null;

    const percentUsed = (totalSpent / budgeted) * 100;

    // Trigger alerts at 80% and 100%
    if (percentUsed >= 100) {
      return {
        category: transaction.category,
        budgeted,
        spent: totalSpent,
        percentUsed,
        status: 'exceeded'
      };
    } else if (percentUsed >= 80) {
      return {
        category: transaction.category,
        budgeted,
        spent: totalSpent,
        percentUsed,
        status: 'warning'
      };
    }

    return null;
  }

  private async updateStatistics(transaction: Transaction) {
    // This could be expanded to update aggregated statistics tables
    // For now, we rely on real-time queries
    // Future: Could implement materialized views or summary tables
  }
}

/**
 * Real-time Budget Monitoring Pipeline
 * Monitors budget changes and spending patterns
 */
export class BudgetMonitoringPipeline implements ProcessingPipeline {
  private userId: string;
  private channel: any;
  public onBudgetUpdate?: (budget: Budget) => void;

  constructor(
    userId: string,
    callbacks?: {
      onBudgetUpdate?: (budget: Budget) => void;
    }
  ) {
    this.userId = userId;
    this.onBudgetUpdate = callbacks?.onBudgetUpdate;
  }

  subscribe() {
    this.channel = supabase
      .channel(`budgets:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          if (payload.new && this.onBudgetUpdate) {
            this.onBudgetUpdate(payload.new as Budget);
          }
        }
      )
      .subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
  }
}

/**
 * Real-time Document Processing Pipeline
 * Monitors document uploads and processing status
 */
export class DocumentProcessingPipeline implements ProcessingPipeline {
  private userId: string;
  private channel: any;
  public onDocumentProcessed?: (documentId: string) => void;

  constructor(
    userId: string,
    callbacks?: {
      onDocumentProcessed?: (documentId: string) => void;
    }
  ) {
    this.userId = userId;
    this.onDocumentProcessed = callbacks?.onDocumentProcessed;
  }

  subscribe() {
    this.channel = supabase
      .channel(`documents:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          const doc = payload.new as any;
          if (doc.processed && this.onDocumentProcessed) {
            this.onDocumentProcessed(doc.id);
          }
        }
      )
      .subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
  }
}

/**
 * Unified Real-time Processing Manager
 * Manages all real-time pipelines for a user
 */
export class RealtimeProcessingManager {
  private transactionPipeline: TransactionPipeline;
  private budgetPipeline: BudgetMonitoringPipeline;
  private documentPipeline: DocumentProcessingPipeline;

  constructor(userId: string) {
    this.transactionPipeline = new TransactionPipeline(userId);
    this.budgetPipeline = new BudgetMonitoringPipeline(userId);
    this.documentPipeline = new DocumentProcessingPipeline(userId);
  }

  startAll() {
    this.transactionPipeline.subscribe();
    this.budgetPipeline.subscribe();
    this.documentPipeline.subscribe();
  }

  stopAll() {
    this.transactionPipeline.unsubscribe();
    this.budgetPipeline.unsubscribe();
    this.documentPipeline.unsubscribe();
  }

  getTransactionPipeline() {
    return this.transactionPipeline;
  }

  getBudgetPipeline() {
    return this.budgetPipeline;
  }

  getDocumentPipeline() {
    return this.documentPipeline;
  }
}
