import { supabase } from './supabase';
import { getApiBaseUrl, backendJson } from '@/lib/backend-api';
import type {
  Profile,
  IncomeRecord,
  Budget,
  Document,
  Transaction,
  ChatMessage,
  Alert,
  TransactionCategory,
  UserMode
} from '@/types';

// Profile operations
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile | null;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile;
};

export const updateUserMode = async (userId: string, mode: UserMode) => {
  return updateProfile(userId, { user_mode: mode });
};

// Income operations
export const getIncomeRecords = async (userId: string) => {
  const { data, error } = await supabase
    .from('income_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data as IncomeRecord[] : [];
};

export const createIncomeRecord = async (record: Omit<IncomeRecord, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('income_records')
    .insert(record)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as IncomeRecord;
};

export const deleteIncomeRecord = async (id: string) => {
  const { error } = await supabase
    .from('income_records')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getTotalIncome = async (userId: string): Promise<number> => {
  const records = await getIncomeRecords(userId);
  return records.reduce((sum, record) => sum + Number(record.amount), 0);
};

// Budget operations
export const getActiveBudget = async (userId: string) => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data as Budget | null;
};

export const getAllBudgets = async (userId: string) => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data as Budget[] : [];
};

export const createBudget = async (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) => {
  // Deactivate existing budgets
  const { error: deactivateError } = await supabase
    .from('budgets')
    .update({ is_active: false })
    .eq('user_id', budget.user_id);

  if (deactivateError) throw deactivateError;

  const { data, error } = await supabase
    .from('budgets')
    .insert(budget)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Budget;
};

export const updateBudget = async (id: string, updates: Partial<Budget>) => {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Budget;
};

// Document operations
export const getDocuments = async (userId: string) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data as Document[] : [];
};

export const createDocument = async (doc: Omit<Document, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('documents')
    .insert(doc)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Document;
};

// Transaction operations
export const getTransactions = async (userId: string, limit?: number) => {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data as Transaction[] : [];
};

export const getTransactionsByCategory = async (userId: string, category: TransactionCategory) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('transaction_date', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data as Transaction[] : [];
};

export const getTransactionsByDateRange = async (userId: string, startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data as Transaction[] : [];
};

export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
  if (getApiBaseUrl()) {
    return backendJson<Transaction>('/api/transactions/create', {
      method: 'POST',
      body: transaction
    });
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Transaction;
};

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Chat history operations
export const getChatHistory = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return Array.isArray(data) ? (data as ChatMessage[]).reverse() : [];
};

export const createChatMessage = async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('chat_history')
    .insert(message)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as ChatMessage;
};

export const clearChatHistory = async (userId: string) => {
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
};

// Alert operations
export const getAlerts = async (userId: string, unreadOnly = false) => {
  let query = supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId);
  
  if (unreadOnly) {
    query = query.eq('is_read', false);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data as Alert[] : [];
};

export const createAlert = async (alert: Omit<Alert, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('alerts')
    .insert(alert)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Alert;
};

export const markAlertAsRead = async (id: string) => {
  const { error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('id', id);
  
  if (error) throw error;
};

export const markAllAlertsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('user_id', userId);
  
  if (error) throw error;
};

// Spending analytics
export const getCurrentMonthSpending = async (userId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  return getTransactionsByDateRange(userId, startOfMonth, endOfMonth);
};

export const getSpendingByCategory = async (userId: string, startDate: string, endDate: string) => {
  const transactions = await getTransactionsByDateRange(userId, startDate, endDate);
  
  const spending: Record<string, number> = {};
  transactions.forEach((t) => {
    spending[t.category] = (spending[t.category] || 0) + Number(t.amount);
  });
  
  return spending;
};
