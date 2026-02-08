import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getActiveBudget, getCurrentMonthSpending, getTotalIncome, getAlerts } from '@/db/api';
import type { Budget, Transaction, Alert as AlertType } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/types';
import { Link } from 'react-router-dom';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [budgetData, transactionsData, income, alertsData] = await Promise.all([
          getActiveBudget(user.id),
          getCurrentMonthSpending(user.id),
          getTotalIncome(user.id),
          getAlerts(user.id, true)
        ]);

        setBudget(budgetData);
        setTransactions(transactionsData);
        setTotalIncome(income);
        setAlerts(alertsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const calculateSpending = () => {
    const spending: Record<string, number> = {};
    transactions.forEach((t) => {
      spending[t.category] = (spending[t.category] || 0) + Number(t.amount);
    });
    return spending;
  };

  const spending = calculateSpending();
  const totalSpent = Object.values(spending).reduce((a, b) => a + b, 0);
  const totalBudgeted = budget
    ? Number(budget.rent) +
      Number(budget.groceries) +
      Number(budget.transport) +
      Number(budget.entertainment) +
      Number(budget.savings) +
      Number(budget.emergency_fund) +
      Number(budget.utilities) +
      Number(budget.healthcare) +
      Number(budget.education) +
      Number(budget.dining) +
      Number(budget.shopping) +
      Number(budget.other)
    : 0;

  const remaining = totalIncome - totalSpent;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64 bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your financial overview at a glance</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} variant={alert.alert_type === 'budget_exceeded' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${remaining.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Of total budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Breakdown */}
      {budget ? (
        <Card>
          <CardHeader>
            <CardTitle>Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
              const allocated = Number(budget[category as keyof Budget] || 0);
              const spent = spending[category] || 0;
              const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;

              if (allocated === 0) return null;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
                      <span className="font-medium">{label}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${spent.toFixed(2)} / ${allocated.toFixed(2)}
                    </div>
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="h-2"
                    indicatorClassName={percentage > 100 ? 'bg-destructive' : percentage > 80 ? 'bg-warning' : 'bg-primary'}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You haven't set up a budget yet. Create one to start tracking your spending.</p>
            <Button asChild>
              <Link to="/budget">Create Budget</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
