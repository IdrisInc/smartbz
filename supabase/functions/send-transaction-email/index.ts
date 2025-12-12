import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransactionEmailRequest {
  type: 'sale' | 'purchase';
  transactionId: string;
  recipientEmail: string;
  recipientName: string;
  organizationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, transactionId, recipientEmail, recipientName, organizationId }: TransactionEmailRequest = await req.json();

    console.log(`Sending ${type} email to ${recipientEmail} for transaction ${transactionId}`);

    if (!recipientEmail) {
      console.log('No recipient email provided, skipping email send');
      return new Response(JSON.stringify({ success: false, message: 'No recipient email' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get organization details
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('name, email, phone, address, city')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      throw new Error('Failed to fetch organization details');
    }

    let emailHtml = '';
    let subject = '';

    if (type === 'sale') {
      // Get sale details
      const { data: sale, error: saleError } = await supabaseAdmin
        .from('sales')
        .select(`
          sale_number,
          sale_date,
          total_amount,
          discount_amount,
          tax_amount,
          payment_method,
          sale_items(
            quantity,
            unit_price,
            total_amount,
            products(name)
          )
        `)
        .eq('id', transactionId)
        .single();

      if (saleError) {
        console.error('Error fetching sale:', saleError);
        throw new Error('Failed to fetch sale details');
      }

      subject = `Receipt for your purchase - ${sale.sale_number || 'Sale'}`;
      
      const itemsHtml = sale.sale_items?.map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.products?.name || 'Product'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price?.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.total_amount?.toFixed(2)}</td>
        </tr>
      `).join('') || '';

      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #333; }
            .content { padding: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #f5f5f5; padding: 12px 8px; text-align: left; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #333;">${org.name}</h1>
              ${org.address ? `<p style="margin: 5px 0;">${org.address}${org.city ? `, ${org.city}` : ''}</p>` : ''}
              ${org.phone ? `<p style="margin: 5px 0;">Phone: ${org.phone}</p>` : ''}
              ${org.email ? `<p style="margin: 5px 0;">Email: ${org.email}</p>` : ''}
            </div>
            
            <div class="content">
              <h2>Thank you for your purchase, ${recipientName}!</h2>
              <p><strong>Receipt Number:</strong> ${sale.sale_number || 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date(sale.sale_date).toLocaleDateString()}</p>
              <p><strong>Payment Method:</strong> ${sale.payment_method || 'N/A'}</p>
              
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  ${sale.discount_amount ? `
                    <tr>
                      <td colspan="3" style="padding: 8px; text-align: right;">Discount:</td>
                      <td style="padding: 8px; text-align: right;">-$${sale.discount_amount.toFixed(2)}</td>
                    </tr>
                  ` : ''}
                  ${sale.tax_amount ? `
                    <tr>
                      <td colspan="3" style="padding: 8px; text-align: right;">Tax:</td>
                      <td style="padding: 8px; text-align: right;">$${sale.tax_amount.toFixed(2)}</td>
                    </tr>
                  ` : ''}
                  <tr class="total-row">
                    <td colspan="3" style="padding: 12px 8px; text-align: right;">Total:</td>
                    <td style="padding: 12px 8px; text-align: right;">$${sale.total_amount?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>If you have any questions about this transaction, please contact us.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'purchase') {
      // Get purchase order details
      const { data: po, error: poError } = await supabaseAdmin
        .from('purchase_orders')
        .select(`
          po_number,
          order_date,
          expected_date,
          total_amount,
          status,
          notes,
          purchase_order_items(
            quantity,
            unit_price,
            total_amount,
            products(name)
          )
        `)
        .eq('id', transactionId)
        .single();

      if (poError) {
        console.error('Error fetching purchase order:', poError);
        throw new Error('Failed to fetch purchase order details');
      }

      subject = `Purchase Order ${po.po_number} from ${org.name}`;

      const itemsHtml = po.purchase_order_items?.map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.products?.name || 'Product'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price?.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.total_amount?.toFixed(2)}</td>
        </tr>
      `).join('') || '';

      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #333; }
            .content { padding: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #f5f5f5; padding: 12px 8px; text-align: left; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #333;">${org.name}</h1>
              ${org.address ? `<p style="margin: 5px 0;">${org.address}${org.city ? `, ${org.city}` : ''}</p>` : ''}
              ${org.phone ? `<p style="margin: 5px 0;">Phone: ${org.phone}</p>` : ''}
              ${org.email ? `<p style="margin: 5px 0;">Email: ${org.email}</p>` : ''}
            </div>
            
            <div class="content">
              <h2>Purchase Order</h2>
              <p>Dear ${recipientName},</p>
              <p>Please find below the details of our purchase order:</p>
              
              <p><strong>PO Number:</strong> ${po.po_number}</p>
              <p><strong>Order Date:</strong> ${new Date(po.order_date).toLocaleDateString()}</p>
              ${po.expected_date ? `<p><strong>Expected Delivery:</strong> ${new Date(po.expected_date).toLocaleDateString()}</p>` : ''}
              
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr class="total-row">
                    <td colspan="3" style="padding: 12px 8px; text-align: right;">Total:</td>
                    <td style="padding: 12px 8px; text-align: right;">$${po.total_amount?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              ${po.notes ? `<p><strong>Notes:</strong> ${po.notes}</p>` : ''}
            </div>
            
            <div class="footer">
              <p>Please confirm receipt of this order.</p>
              <p>For any questions, please contact us at ${org.email || 'our office'}.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: `${org.name} <onboarding@resend.dev>`,
      to: [recipientEmail],
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-transaction-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
