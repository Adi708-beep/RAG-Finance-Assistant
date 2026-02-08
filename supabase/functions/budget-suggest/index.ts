import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BudgetSuggestionRequest {
  userId: string;
  totalIncome: number;
  period: 'monthly' | 'yearly';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, totalIncome, period }: BudgetSuggestionRequest = await req.json();

    if (!userId || !totalIncome || !period) {
      return new Response(
        JSON.stringify({ error: 'userId, totalIncome, and period are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's past transactions for context
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .limit(100);

    // Calculate average spending by category
    const spendingByCategory: Record<string, number[]> = {};
    transactions?.forEach((t) => {
      if (!spendingByCategory[t.category]) {
        spendingByCategory[t.category] = [];
      }
      spendingByCategory[t.category].push(parseFloat(t.amount));
    });

    const avgSpending: Record<string, number> = {};
    Object.keys(spendingByCategory).forEach((category) => {
      const amounts = spendingByCategory[category];
      avgSpending[category] = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    });

    // Build prompt for Gemini
    const prompt = `You are a financial advisor. Create a ${period} budget plan for a user with total income of ₹${totalIncome}.

${transactions && transactions.length > 0 ? `The user's past spending patterns:
${JSON.stringify(avgSpending, null, 2)}` : 'No past spending data available.'}

Create a balanced budget allocation across these categories:
- rent
- groceries
- transport
- entertainment
- savings
- emergency_fund
- utilities
- healthcare
- education
- dining
- shopping
- other

Return ONLY a valid JSON object with this exact format:
{
  "rent": 1200.00,
  "groceries": 400.00,
  "transport": 200.00,
  "entertainment": 150.00,
  "savings": 500.00,
  "emergency_fund": 300.00,
  "utilities": 150.00,
  "healthcare": 100.00,
  "education": 100.00,
  "dining": 200.00,
  "shopping": 150.00,
  "other": 100.00
}

Ensure:
1. Total allocations do not exceed the total income
2. Prioritize savings (at least 20% of income)
3. Emergency fund should be at least 10% of income
4. Consider past spending patterns if available
5. All values must be positive numbers in Indian Rupees (₹)`;

    // Call Gemini API
    const geminiApiKey = Deno.env.get('INTEGRATIONS_API_KEY');
    const geminiUrl = 'https://app-9hnntffjcnb5-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';

    const geminiRequest = {
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ]
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Authorization': `Bearer ${geminiApiKey}`
      },
      body: JSON.stringify(geminiRequest)
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    // Read streaming response
    const reader = geminiResponse.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim()) {
            try {
              const parsed = JSON.parse(data);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullResponse += text;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    // Extract JSON from response
    let budgetSuggestion = null;
    try {
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        budgetSuggestion = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse budget suggestion:', e);
      throw new Error('Failed to generate budget suggestion');
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestion: budgetSuggestion,
        totalIncome,
        period
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in budget-suggest:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
