import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getActiveBudget, createBudget, getTotalIncome } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Budget, BudgetPeriod, BudgetSuggestion } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { Sparkles, Calculator, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BudgetSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [totalIncome, setTotalIncome] = useState(0);
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [aiSuggestion, setAiSuggestion] = useState<BudgetSuggestion | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [budgetData, income] = await Promise.all([
          getActiveBudget(user.id),
          getTotalIncome(user.id)
        ]);

        setBudget(budgetData);
        setTotalIncome(income);

        if (budgetData) {
          setPeriod(budgetData.period);
        }
      } catch (error) {
        console.error('Error loading budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleGetAISuggestion = async () => {
    if (!user || totalIncome === 0) {
      toast({
        title: 'No income set',
        description: 'Please set up your income first',
        variant: 'destructive'
      });
      return;
    }

    setLoadingSuggestion(true);

    try {
      const { data, error } = await supabase.functions.invoke('budget-suggest', {
        body: {
          userId: user.id,
          totalIncome,
          period
        }
      });

      if (error) throw error;

      setAiSuggestion(data.suggestion);
      setShowApprovalDialog(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get AI suggestion',
        variant: 'destructive'
      });
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleApproveSuggestion = () => {
    if (!aiSuggestion) return;

    const newAllocations: Record<string, string> = {};
    Object.keys(CATEGORY_LABELS).forEach((category) => {
      newAllocations[category] = aiSuggestion[category as keyof BudgetSuggestion]?.toString() || '0';
    });

    setAllocations(newAllocations);
    setShowApprovalDialog(false);

    toast({
      title: 'Suggestion applied',
      description: 'AI budget suggestion has been applied'
    });
  };

  const handleSaveBudget = async () => {
    if (!user) return;

    const total = Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    if (total > totalIncome) {
      toast({
        title: 'Budget exceeds income',
        description: 'Total allocations cannot exceed your income',
        variant: 'destructive'
      });
      return;
    }

    try {
      const newBudget = await createBudget({
        user_id: user.id,
        period,
        total_income: totalIncome,
        rent: parseFloat(allocations.rent || '0'),
        groceries: parseFloat(allocations.groceries || '0'),
        transport: parseFloat(allocations.transport || '0'),
        entertainment: parseFloat(allocations.entertainment || '0'),
        savings: parseFloat(allocations.savings || '0'),
        emergency_fund: parseFloat(allocations.emergency_fund || '0'),
        utilities: parseFloat(allocations.utilities || '0'),
        healthcare: parseFloat(allocations.healthcare || '0'),
        education: parseFloat(allocations.education || '0'),
        dining: parseFloat(allocations.dining || '0'),
        shopping: parseFloat(allocations.shopping || '0'),
        other: parseFloat(allocations.other || '0'),
        is_active: true
      });

      setBudget(newBudget);

      toast({
        title: 'Budget saved',
        description: 'Your budget has been created successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save budget',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const remaining = totalIncome - totalAllocated;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Budget Setup</h1>
        <p className="text-muted-foreground">Create and manage your budget</p>
      </div>

      {totalIncome === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please set up your income first before creating a budget.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold">${totalIncome.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Allocated</p>
              <p className="text-2xl font-bold">${totalAllocated.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>
                ${remaining.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Budget Period</Label>
            <Select value={period} onValueChange={(value) => setPeriod(value as BudgetPeriod)}>
              <SelectTrigger id="period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">
            <Calculator className="h-4 w-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assisted
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocations</CardTitle>
              <CardDescription>Enter amounts for each category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
                  <div key={category} className="space-y-2">
                    <Label htmlFor={category}>{label}</Label>
                    <Input
                      id={category}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={allocations[category] || ''}
                      onChange={(e) =>
                        setAllocations({ ...allocations, [category]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveBudget} disabled={totalIncome === 0 || remaining < 0}>
                Save Budget
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Budget Suggestion</CardTitle>
              <CardDescription>
                Get a personalized budget recommendation based on your income and spending patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleGetAISuggestion} disabled={loadingSuggestion || totalIncome === 0}>
                <Sparkles className="h-4 w-4 mr-2" />
                {loadingSuggestion ? 'Generating...' : 'Get AI Suggestion'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Suggestion Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Budget Suggestion</DialogTitle>
            <DialogDescription>
              Review and approve the AI-generated budget allocation
            </DialogDescription>
          </DialogHeader>

          {aiSuggestion && (
            <div className="space-y-2">
              {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
                <div key={category} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-medium">{label}</span>
                  <span>${aiSuggestion[category as keyof BudgetSuggestion]?.toFixed(2) || '0.00'}</span>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveSuggestion}>
              Approve & Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
