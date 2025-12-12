import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClickPesaRequest {
  amount: number;
  phone: string;
  provider: "MPESA" | "TIGOPESA" | "AIRTELMONEY" | "HALOPESA" | "EZYPESA";
  reference: string;
  description: string;
  paymentType: "sale" | "subscription";
  organizationId?: string;
  saleId?: string;
  plan?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("CLICKPESA_API_KEY");
    const apiSecret = Deno.env.get("CLICKPESA_API_SECRET");
    
    if (!apiKey || !apiSecret) {
      console.error("ClickPesa API credentials not configured");
      throw new Error("ClickPesa API credentials not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { amount, phone, provider, reference, description, paymentType, organizationId, saleId, plan }: ClickPesaRequest = await req.json();

    console.log("Processing ClickPesa payment:", { amount, phone, provider, reference, paymentType });

    // Step 1: Get authorization token
    const tokenResponse = await fetch("https://api.clickpesa.com/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        api_secret: apiSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Failed to get ClickPesa token:", errorText);
      throw new Error("Failed to authenticate with ClickPesa");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log("ClickPesa token obtained successfully");

    // Step 2: Initiate USSD Push payment
    const paymentResponse = await fetch("https://api.clickpesa.com/payments/mobile-money/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: amount,
        phone_number: phone,
        provider: provider,
        reference: reference,
        description: description,
        callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/clickpesa-callback`,
      }),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error("ClickPesa payment initiation failed:", errorText);
      throw new Error("Failed to initiate mobile money payment");
    }

    const paymentData = await paymentResponse.json();
    console.log("ClickPesa payment initiated:", paymentData);

    // Store payment record for tracking
    if (paymentType === "sale" && saleId && organizationId) {
      await supabaseClient.from("organization_payments").insert({
        organization_id: organizationId,
        user_id: (await supabaseClient.auth.getUser()).data.user?.id,
        amount: amount,
        payment_type: "sale",
        status: "pending",
        stripe_session_id: paymentData.transaction_id || reference, // Store ClickPesa transaction ID
      });
    } else if (paymentType === "subscription" && organizationId && plan) {
      await supabaseClient.from("organization_payments").insert({
        organization_id: organizationId,
        user_id: (await supabaseClient.auth.getUser()).data.user?.id,
        amount: amount,
        payment_type: "subscription",
        plan: plan,
        status: "pending",
        stripe_session_id: paymentData.transaction_id || reference,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: paymentData.transaction_id,
        status: paymentData.status,
        message: "Payment request sent to your phone. Please enter your PIN to complete the transaction.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("ClickPesa payment error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Payment processing failed" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
