import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Analyze this invoice image and extract ALL the following information:
- Invoice Number (look for "Invoice #", "Invoice No", "Bill No", etc.)
- Vendor/Business Name (the company issuing the invoice)
- Date (invoice date, format as YYYY-MM-DD)
- Total Amount (the final total amount, just the number without currency symbols)
- Description (brief summary of items/services purchased)
- Category (categorize into ONE of these: Travel, Office Supplies, Software, Utilities, Marketing, Meals & Entertainment, Professional Services, Other)

CATEGORY DETECTION RULES - Analyze in this order of priority:

1. VENDOR NAME ANALYSIS (Highest Priority):
   - Airlines (Delta, United, American, JetBlue, Southwest) → Travel
   - Hotels (Marriott, Hilton, Hyatt, Airbnb) → Travel
   - Ride-sharing (Uber, Lyft) → Travel
   - Cloud services (AWS, Azure, Google Cloud) → Software
   - Software companies (Microsoft, Adobe, Salesforce, Slack) → Software
   - Office supply stores (Staples, Office Depot) → Office Supplies
   - Telecom (Verizon, AT&T, T-Mobile) → Utilities
   - Electric/Gas companies → Utilities
   - Marketing agencies/companies → Marketing
   - Restaurants/Food delivery → Meals & Entertainment
   - Consulting firms, Law firms, Accounting → Professional Services

2. PRODUCT/SERVICE ANALYSIS (If vendor unclear):
   - Flight tickets, hotel bookings → Travel
   - Office furniture, stationery, pens, paper → Office Supplies
   - Software licenses, subscriptions, SaaS → Software
   - Internet, phone, electricity, water bills → Utilities
   - Advertising, campaigns, promotions → Marketing
   - Food, catering, events → Meals & Entertainment
   - Consulting, legal, accounting services → Professional Services
   - Everything else → Other

3. VISUAL CUES:
   - Airline logos, hotel branding → Travel
   - Tech company logos (Microsoft, Apple, etc.) → Software
   - Restaurant logos, food imagery → Meals & Entertainment

CONFIDENCE SCORING:
- 0.9-1.0: Very clear vendor match or obvious product type
- 0.7-0.8: Good vendor indicators or clear product categories
- 0.5-0.6: Some indicators but not definitive
- 0.2-0.4: Limited information, best guess
- 0.0-0.1: Cannot determine category`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert invoice data extraction assistant. Extract information accurately and categorize based on vendor and items purchased.' 
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              }
            ]
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_invoice_data",
            description: "Extract structured invoice data from image",
            parameters: {
              type: "object",
              properties: {
                invoice_number: { type: "string", description: "Invoice number" },
                vendor: { type: "string", description: "Vendor/business name" },
                date: { type: "string", description: "Invoice date in YYYY-MM-DD format" },
                amount: { type: "number", description: "Total amount as number" },
                description: { type: "string", description: "Brief description of items/services" },
                category: { 
                  type: "string",
                  enum: ["Travel", "Office Supplies", "Software", "Utilities", "Marketing", "Meals & Entertainment", "Professional Services", "Other"]
                },
                confidence: { type: "number", minimum: 0, maximum: 1, description: "Confidence score for categorization" }
              },
              required: ["invoice_number", "vendor", "date", "amount", "category", "confidence"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_invoice_data" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required. Please add credits to continue.' 
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
    
    console.log('Extracted invoice data:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Invoice extraction error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
