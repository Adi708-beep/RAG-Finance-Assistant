import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  userId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId }: ChatRequest = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Message and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Retrieve user context for RAG
    const [
      { data: profile },
      { data: incomes },
      { data: budgets },
      { data: transactions },
      { data: chatHistory }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('income_records').select('*').eq('user_id', userId),
      supabase.from('budgets').select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(1),
      supabase.from('transactions').select('*').eq('user_id', userId).order('transaction_date', { ascending: false }).limit(50),
      supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
    ]);

    // Calculate spending by category
    const spendingByCategory: Record<string, number> = {};
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    transactions?.forEach((t) => {
      const transactionMonth = t.transaction_date.slice(0, 7);
      if (transactionMonth === currentMonth) {
        spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + parseFloat(t.amount);
      }
    });

    // Calculate total income
    const totalIncome = incomes?.reduce((sum, inc) => sum + parseFloat(inc.amount), 0) || 0;

    // Build context for RAG
    const context = {
      userMode: profile?.user_mode || 'personal',
      totalIncome,
      incomeRecords: incomes || [],
      activeBudget: budgets?.[0] || null,
      recentTransactions: transactions?.slice(0, 10) || [],
      currentMonthSpending: spendingByCategory,
      totalSpentThisMonth: Object.values(spendingByCategory).reduce((a, b) => a + b, 0)
    };

    // Build conversation history
    const conversationHistory = chatHistory?.reverse().map(h => ({
      role: h.role,
      parts: [{ text: h.message }]
    })) || [];

    // System prompt with domain restriction
    const systemPrompt = `You are a personal finance assistant. You ONLY answer questions about personal finance, budgeting, expense tracking, and financial planning.

STRICT RULES:
1. If the user asks anything outside of personal finance (e.g., general knowledge, politics, entertainment, etc.), respond EXACTLY with: "I'm designed to assist only with personal finance, budgeting, and expense-tracking questions."
2. NEVER provide investment guarantees, legal advice, or tax evasion strategies.
3. Base your answers ONLY on the provided user data. Do NOT guess or hallucinate numbers.
4. Be helpful, informative, and neutral in tone.

USER CONTEXT:
- Mode: ${context.userMode}
- Total Income: $${totalIncome.toFixed(2)}
- Total Spent This Month: $${context.totalSpentThisMonth.toFixed(2)}
- Active Budget: ${context.activeBudget ? 'Yes' : 'No'}
${context.activeBudget ? `- Budget Allocations: ${JSON.stringify({
  rent: context.activeBudget.rent,
  groceries: context.activeBudget.groceries,
  transport: context.activeBudget.transport,
  entertainment: context.activeBudget.entertainment,
  savings: context.activeBudget.savings,
  emergency_fund: context.activeBudget.emergency_fund,
  utilities: context.activeBudget.utilities,
  healthcare: context.activeBudget.healthcare,
  education: context.activeBudget.education,
  dining: context.activeBudget.dining,
  shopping: context.activeBudget.shopping,
  other: context.activeBudget.other
})}` : ''}
- Current Month Spending by Category: ${JSON.stringify(spendingByCategory)}
- Recent Transactions: ${JSON.stringify(context.recentTransactions.map(t => ({
  amount: t.amount,
  date: t.transaction_date,
  merchant: t.merchant,
  category: t.category
})))}

Answer the user's question based on this data.`;

    // Prepare Gemini API request
    const geminiApiKey = Deno.env.get('INTEGRATIONS_API_KEY');
    const geminiUrl = 'https://app-9hnntffjcnb5-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';

    const geminiRequest = {
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'I understand. I will only answer personal finance questions based on the provided user data.' }] },
        ...conversationHistory,
        { role: 'user', parts: [{ text: message }] }
      ]
    };

    // Call Gemini API with streaming
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

    // Save user message to chat history
    await supabase.from('chat_history').insert({
      user_id: userId,
      role: 'user',
      message
    });

    // Stream response back to client
    const reader = geminiResponse.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
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
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          // Save model response to chat history
          if (fullResponse) {
            await supabase.from('chat_history').insert({
              user_id: userId,
              role: 'model',
              message: fullResponse
            });
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in gemini-chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
