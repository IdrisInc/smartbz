import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const callbackData = await req.json();
    console.log("ClickPesa callback received:", callbackData);

    const { transaction_id, status, reference, amount } = callbackData;

    // Find the payment record
    const { data: payment, error: findError } = await supabaseClient
      .from("organization_payments")
      .select("*")
      .eq("stripe_session_id", transaction_id)
      .single();

    if (findError || !payment) {
      console.error("Payment record not found:", findError);
      return new Response(
        JSON.stringify({ success: false, error: "Payment record not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Update payment status
    const newStatus = status === "SUCCESS" ? "completed" : status === "FAILED" ? "failed" : "pending";
    
    const { error: updateError } = await supabaseClient
      .from("organization_payments")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Failed to update payment status:", updateError);
    }

    // If subscription payment was successful, update organization subscription
    if (status === "SUCCESS" && payment.payment_type === "subscription" && payment.plan) {
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1); // 1 month subscription

      const { error: orgError } = await supabaseClient
        .from("organizations")
        .update({
          subscription_plan: payment.plan,
          subscription_end: subscriptionEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.organization_id);

      if (orgError) {
        console.error("Failed to update organization subscription:", orgError);
      } else {
        console.log("Organization subscription updated successfully");
      }

      // Create notification
      await supabaseClient.from("notifications").insert({
        organization_id: payment.organization_id,
        user_id: payment.user_id,
        title: "Subscription Activated",
        message: `Your ${payment.plan} subscription has been activated via mobile money payment.`,
        type: "success",
        action_url: "/settings",
      });
    }

    // If sale payment was successful, update sale payment status
    if (status === "SUCCESS" && payment.payment_type === "sale") {
      // Create notification for successful sale payment
      await supabaseClient.from("notifications").insert({
        organization_id: payment.organization_id,
        user_id: payment.user_id,
        title: "Payment Received",
        message: `Mobile money payment of ${amount} TZS received successfully.`,
        type: "success",
      });
    }

    console.log("ClickPesa callback processed successfully");

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("ClickPesa callback error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
