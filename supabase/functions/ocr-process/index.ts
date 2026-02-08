import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OCRRequest {
  documentId: string;
  fileUrl: string;
  userId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, fileUrl, userId }: OCRRequest = await req.json();

    if (!documentId || !fileUrl || !userId) {
      return new Response(
        JSON.stringify({ error: 'documentId, fileUrl, and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call OCR API
    const ocrApiKey = Deno.env.get('INTEGRATIONS_API_KEY');
    const ocrUrl = 'https://app-9hnntffjcnb5-api-W9z3M6eONl3L.gateway.appmedo.com/parse/image';

    const formData = new FormData();
    formData.append('url', fileUrl);
    formData.append('language', 'eng');
    formData.append('isTable', 'true');

    const ocrResponse = await fetch(ocrUrl, {
      method: 'POST',
      headers: {
        'X-Gateway-Authorization': `Bearer ${ocrApiKey}`
      },
      body: formData
    });

    if (!ocrResponse.ok) {
      throw new Error(`OCR API error: ${ocrResponse.statusText}`);
    }

    const ocrResult = await ocrResponse.json();
    const extractedText = ocrResult.ParsedResults?.[0]?.ParsedText || '';

    if (!extractedText) {
      return new Response(
        JSON.stringify({ error: 'No text extracted from document' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update document with OCR text
    await supabase
      .from('documents')
      .update({ ocr_text: extractedText })
      .eq('id', documentId);

    // Use Gemini to parse structured transaction data
    const geminiApiKey = Deno.env.get('INTEGRATIONS_API_KEY');
    const geminiUrl = 'https://app-9hnntffjcnb5-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';

    const parsePrompt = `Extract transaction data from this receipt/bank statement text. Return ONLY a valid JSON array of transactions with this exact format:
[
  {
    "amount": 123.45,
    "date": "2026-02-08",
    "merchant": "Store Name",
    "category": "groceries",
    "description": "Brief description"
  }
]

Valid categories: rent, groceries, transport, entertainment, savings, emergency_fund, utilities, healthcare, education, dining, shopping, other

If no transactions found, return an empty array [].

Text to parse:
${extractedText}`;

    const geminiRequest = {
      contents: [
        { role: 'user', parts: [{ text: parsePrompt }] }
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
    let transactions = [];
    try {
      const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse transactions:', e);
    }

    // Insert transactions into database
    if (transactions.length > 0) {
      const transactionsToInsert = transactions.map((t: any) => ({
        user_id: userId,
        document_id: documentId,
        amount: t.amount,
        transaction_date: t.date,
        merchant: t.merchant || 'Unknown',
        category: t.category || 'other',
        description: t.description || ''
      }));

      await supabase.from('transactions').insert(transactionsToInsert);

      // Analyze spending patterns and suggest budget
      const spendingByCategory: Record<string, number> = {};
      transactions.forEach((t: any) => {
        spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
      });

      // Get user's total income
      const { data: incomeRecords } = await supabase
        .from('income_records')
        .select('amount')
        .eq('user_id', userId);

      const totalIncome = incomeRecords?.reduce((sum, rec) => sum + parseFloat(rec.amount), 0) || 0;

      // If user has income but no active budget, suggest one
      if (totalIncome > 0) {
        const { data: existingBudget } = await supabase
          .from('budgets')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();

        if (!existingBudget) {
          // Generate budget suggestion based on spending patterns
          const budgetPrompt = `Based on the following spending patterns from uploaded documents, create a balanced monthly budget for a user with total income of ₹${totalIncome}.

Observed spending patterns:
${JSON.stringify(spendingByCategory, null, 2)}

Create a comprehensive budget allocation across these categories:
- rent, groceries, transport, entertainment, savings, emergency_fund, utilities, healthcare, education, dining, shopping, other

Return ONLY a valid JSON object with this exact format:
{
  "rent": 0,
  "groceries": 0,
  "transport": 0,
  "entertainment": 0,
  "savings": 0,
  "emergency_fund": 0,
  "utilities": 0,
  "healthcare": 0,
  "education": 0,
  "dining": 0,
  "shopping": 0,
  "other": 0
}

Guidelines:
1. Allocate higher amounts to categories with observed spending
2. Ensure savings is at least 20% of income
3. Emergency fund should be at least 10% of income
4. Total allocations should not exceed total income
5. All values must be positive numbers in Indian Rupees`;

          const geminiRequest = {
            contents: [
              { role: 'user', parts: [{ text: budgetPrompt }] }
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

          if (geminiResponse.ok) {
            const reader = geminiResponse.body?.getReader();
            const decoder = new TextDecoder();
            let budgetResponse = '';

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
                        budgetResponse += text;
                      }
                    } catch (e) {
                      // Skip invalid JSON
                    }
                  }
                }
              }
            }

            // Extract JSON from response
            try {
              const jsonMatch = budgetResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const suggestedBudget = JSON.parse(jsonMatch[0]);

                // Create the suggested budget
                await supabase.from('budgets').insert({
                  user_id: userId,
                  period: 'monthly',
                  total_income: totalIncome,
                  rent: suggestedBudget.rent || 0,
                  groceries: suggestedBudget.groceries || 0,
                  transport: suggestedBudget.transport || 0,
                  entertainment: suggestedBudget.entertainment || 0,
                  savings: suggestedBudget.savings || 0,
                  emergency_fund: suggestedBudget.emergency_fund || 0,
                  utilities: suggestedBudget.utilities || 0,
                  healthcare: suggestedBudget.healthcare || 0,
                  education: suggestedBudget.education || 0,
                  dining: suggestedBudget.dining || 0,
                  shopping: suggestedBudget.shopping || 0,
                  other: suggestedBudget.other || 0,
                  is_active: true
                });
              }
            } catch (e) {
              console.error('Failed to parse budget suggestion:', e);
            }
          }
        }
      }
    }

    // Mark document as processed
    await supabase
      .from('documents')
      .update({ processed: true })
      .eq('id', documentId);

    return new Response(
      JSON.stringify({
        success: true,
        extractedText,
        transactions,
        transactionCount: transactions.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ocr-process:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
