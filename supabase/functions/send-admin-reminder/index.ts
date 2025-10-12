import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingInvoice {
  id: string;
  invoice_number: string;
  vendor: string;
  amount: number;
  created_at: string;
  user_email: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting admin reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending invoices older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: pendingInvoices, error: invoicesError } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        vendor,
        amount,
        created_at,
        user_id,
        profiles!invoices_user_id_fkey (email)
      `)
      .eq("status", "pending")
      .is("reviewed_at", null)
      .lt("created_at", twentyFourHoursAgo);

    if (invoicesError) {
      console.error("Error fetching invoices:", invoicesError);
      throw invoicesError;
    }

    if (!pendingInvoices || pendingInvoices.length === 0) {
      console.log("No pending invoices found older than 24 hours");
      return new Response(
        JSON.stringify({ message: "No pending invoices to remind about" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Found ${pendingInvoices.length} pending invoices`);

    // Get admin email
    const { data: adminData, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id, profiles!user_roles_user_id_fkey (email)")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (adminError || !adminData) {
      console.error("Error fetching admin:", adminError);
      throw new Error("Admin not found");
    }

    const adminEmail = (adminData.profiles as any).email;
    console.log("Admin email found:", adminEmail);

    // Format invoice details for AI
    const invoiceDetails = pendingInvoices.map((inv: any) => ({
      invoice_number: inv.invoice_number,
      vendor: inv.vendor,
      amount: inv.amount,
      created_at: inv.created_at,
      user_email: inv.profiles.email,
    }));

    // Use Lovable AI to generate reminder email
    const aiPrompt = `Generate a professional reminder email for an admin who has ${pendingInvoices.length} pending invoice(s) to review. The invoices have been pending for more than 24 hours.

Invoice details:
${JSON.stringify(invoiceDetails, null, 2)}

Create a concise, professional email that:
1. Politely reminds them about pending approvals
2. Lists the key details (invoice number, vendor, amount)
3. Emphasizes the importance of timely review
4. Has a friendly but professional tone

Return only the email body HTML (no subject line).`;

    console.log("Calling Lovable AI to generate email...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional email writer. Generate clear, concise, and professional email content.",
          },
          {
            role: "user",
            content: aiPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const emailBody = aiData.choices[0].message.content;

    console.log("Email content generated, sending email...");

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Invoice System <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `⏰ Reminder: ${pendingInvoices.length} Invoice${pendingInvoices.length > 1 ? 's' : ''} Awaiting Your Review`,
      html: emailBody,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Reminder sent to ${adminEmail}`,
        invoices_count: pendingInvoices.length 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});