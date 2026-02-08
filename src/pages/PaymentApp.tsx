import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { createTransaction } from '@/db/api';
import type { TransactionCategory } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { 
  ShoppingCart, 
  Utensils, 
  Car, 
  Zap, 
  Heart, 
  GraduationCap, 
  Film, 
  Home,
  Coffee,
  Smartphone,
  CheckCircle,
  ArrowLeft,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Merchant {
  id: string;
  name: string;
  category: TransactionCategory;
  icon: React.ReactNode;
  description: string;
  suggestedAmount?: number;
}

const merchants: Merchant[] = [
  {
    id: 'bigbazaar',
    name: 'Big Bazaar',
    category: 'groceries',
    icon: <ShoppingCart className="h-6 w-6" />,
    description: 'Grocery & Household Items',
    suggestedAmount: 500
  },
  {
    id: 'dmart',
    name: 'DMart',
    category: 'groceries',
    icon: <ShoppingCart className="h-6 w-6" />,
    description: 'Supermarket',
    suggestedAmount: 800
  },
  {
    id: 'swiggy',
    name: 'Swiggy',
    category: 'dining',
    icon: <Utensils className="h-6 w-6" />,
    description: 'Food Delivery',
    suggestedAmount: 350
  },
  {
    id: 'zomato',
    name: 'Zomato',
    category: 'dining',
    icon: <Utensils className="h-6 w-6" />,
    description: 'Food Delivery',
    suggestedAmount: 400
  },
  {
    id: 'uber',
    name: 'Uber',
    category: 'transport',
    icon: <Car className="h-6 w-6" />,
    description: 'Ride Sharing',
    suggestedAmount: 200
  },
  {
    id: 'ola',
    name: 'Ola Cabs',
    category: 'transport',
    icon: <Car className="h-6 w-6" />,
    description: 'Ride Sharing',
    suggestedAmount: 180
  },
  {
    id: 'electricity',
    name: 'Electricity Bill',
    category: 'utilities',
    icon: <Zap className="h-6 w-6" />,
    description: 'Power Company',
    suggestedAmount: 1200
  },
  {
    id: 'apollo',
    name: 'Apollo Pharmacy',
    category: 'healthcare',
    icon: <Heart className="h-6 w-6" />,
    description: 'Medical & Healthcare',
    suggestedAmount: 600
  },
  {
    id: 'byjus',
    name: "BYJU'S",
    category: 'education',
    icon: <GraduationCap className="h-6 w-6" />,
    description: 'Online Learning',
    suggestedAmount: 1500
  },
  {
    id: 'bookmyshow',
    name: 'BookMyShow',
    category: 'entertainment',
    icon: <Film className="h-6 w-6" />,
    description: 'Movie & Events',
    suggestedAmount: 500
  },
  {
    id: 'rent',
    name: 'House Rent',
    category: 'rent',
    icon: <Home className="h-6 w-6" />,
    description: 'Monthly Rent Payment',
    suggestedAmount: 15000
  },
  {
    id: 'starbucks',
    name: 'Starbucks',
    category: 'dining',
    icon: <Coffee className="h-6 w-6" />,
    description: 'Coffee Shop',
    suggestedAmount: 250
  },
  {
    id: 'amazon',
    name: 'Amazon',
    category: 'shopping',
    icon: <ShoppingCart className="h-6 w-6" />,
    description: 'Online Shopping',
    suggestedAmount: 1000
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    category: 'shopping',
    icon: <ShoppingCart className="h-6 w-6" />,
    description: 'Online Shopping',
    suggestedAmount: 900
  },
  {
    id: 'airtel',
    name: 'Airtel',
    category: 'utilities',
    icon: <Smartphone className="h-6 w-6" />,
    description: 'Mobile Recharge',
    suggestedAmount: 500
  }
];

export default function PaymentApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [amount, setAmount] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleMerchantSelect = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setAmount(merchant.suggestedAmount?.toString() || '');
    setShowConfirmDialog(true);
  };

  const handlePayment = async () => {
    if (!user || !selectedMerchant || !amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid payment',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);

    try {
      // Create transaction
      await createTransaction({
        user_id: user.id,
        document_id: null,
        amount: parseFloat(amount),
        transaction_date: new Date().toISOString().split('T')[0],
        merchant: selectedMerchant.name,
        category: selectedMerchant.category,
        description: `Payment to ${selectedMerchant.name} via Payment App`
      });

      setShowConfirmDialog(false);
      setShowSuccessDialog(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setShowSuccessDialog(false);
        setSelectedMerchant(null);
        setAmount('');
      }, 2000);

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Payment failed',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CreditCard className="h-8 w-8 text-primary" />
                Payment App
              </h1>
              <p className="text-muted-foreground">Make instant payments to your favorite merchants</p>
            </div>
          </div>
        </div>

        {/* Merchants Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {merchants.map((merchant) => (
            <Card
              key={merchant.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 hover:border-primary"
              onClick={() => handleMerchantSelect(merchant)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {merchant.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{merchant.name}</CardTitle>
                    <CardDescription className="text-xs">{merchant.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{CATEGORY_LABELS[merchant.category]}</Badge>
                  {merchant.suggestedAmount && (
                    <span className="text-sm text-muted-foreground">
                      Suggested: ₹{merchant.suggestedAmount}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>
                Review your payment details before proceeding
              </DialogDescription>
            </DialogHeader>
            {selectedMerchant && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {selectedMerchant.icon}
                  </div>
                  <div>
                    <p className="font-medium">{selectedMerchant.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMerchant.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Amount (₹)</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <Badge>{CATEGORY_LABELS[selectedMerchant.category]}</Badge>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="text-2xl font-bold">₹{parseFloat(amount || '0').toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={processing || !amount || parseFloat(amount) <= 0}>
                {processing ? 'Processing...' : 'Pay Now'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold">Payment Successful!</h3>
                <p className="text-muted-foreground mt-2">
                  ₹{parseFloat(amount || '0').toFixed(2)} paid to {selectedMerchant?.name}
                </p>
              </div>
              <Button onClick={() => navigate('/transactions')} className="w-full">
                View Transactions
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
