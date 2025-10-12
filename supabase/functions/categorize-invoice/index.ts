import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vendor, description, amount } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Analyze this invoice and categorize it into ONE of these categories:
- Travel (flights, hotels, transportation)
- Office Supplies (stationery, furniture, equipment)
- Software (subscriptions, licenses, SaaS)
- Utilities (electricity, internet, phone)
- Marketing (ads, campaigns, promotions)
- Meals & Entertainment (restaurants, team events)
- Professional Services (consulting, legal, accounting)
- Other

Invoice Details:
Vendor: ${vendor}
Description: ${description || 'N/A'}
Amount: ₹${amount}

Return ONLY the category name and a confidence score (0-1).`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an invoice categorization expert. Always respond with structured data.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "categorize_invoice",
            description: "Categorize an invoice and return confidence score",
            parameters: {
              type: "object",
              properties: {
                category: { 
                  type: "string",
                  enum: ["Travel", "Office Supplies", "Software", "Utilities", "Marketing", "Meals & Entertainment", "Professional Services", "Other"]
                },
                confidence: { type: "number", minimum: 0, maximum: 1 }
              },
              required: ["category", "confidence"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "categorize_invoice" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          category: 'Other', 
          confidence: 0,
          error: 'Rate limit exceeded' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          category: 'Other', 
          confidence: 0,
          error: 'Payment required' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract structured output from tool call
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }
    
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Categorization error:', error);
    return new Response(JSON.stringify({ 
      category: 'Other', 
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
