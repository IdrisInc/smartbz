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

interface EmailTemplate {
  subject: string;
  header_text: string | null;
  footer_text: string | null;
  primary_color: string;
  logo_url: string | null;
  show_business_details: boolean;
  show_items_table: boolean;
  custom_message: string | null;
  is_active: boolean;
}

const defaultTemplates: Record<string, EmailTemplate> = {
  sale_confirmation: {
    subject: 'Receipt for your purchase - {{sale_number}}',
    header_text: 'Thank you for your purchase!',
    footer_text: 'If you have any questions about this transaction, please contact us.',
    primary_color: '#3b82f6',
    logo_url: null,
    show_business_details: true,
    show_items_table: true,
    custom_message: null,
    is_active: true
  },
  purchase_order: {
    subject: 'Purchase Order {{po_number}} from {{business_name}}',
    header_text: 'Please find below the details of our purchase order:',
    footer_text: 'Please confirm receipt of this order.',
    primary_color: '#10b981',
    logo_url: null,
    show_business_details: true,
    show_items_table: true,
    custom_message: null,
    is_active: true
  }
};

const handler = async (req: Request): Promise<Response> => {
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

    // Get email template
    const templateType = type === 'sale' ? 'sale_confirmation' : 'purchase_order';
    const { data: customTemplate } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('template_type', templateType)
      .single();

    const template: EmailTemplate = customTemplate || defaultTemplates[templateType];

    // Check if template is active
    if (!template.is_active) {
      console.log(`Email template ${templateType} is disabled for organization ${organizationId}`);
      return new Response(JSON.stringify({ success: false, message: 'Email notifications disabled' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let emailHtml = '';
    let subject = template.subject;

    const primaryColor = template.primary_color || '#3b82f6';

    if (type === 'sale') {
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

      // Replace template variables
      subject = subject
        .replace('{{sale_number}}', sale.sale_number || 'Sale')
        .replace('{{business_name}}', org.name)
        .replace('{{customer_name}}', recipientName);

      const itemsHtml = template.show_items_table ? sale.sale_items?.map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.products?.name || 'Product'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price?.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.total_amount?.toFixed(2)}</td>
        </tr>
      `).join('') : '';

      emailHtml = generateEmailHtml({
        org,
        template,
        primaryColor,
        recipientName,
        referenceNumber: sale.sale_number || 'N/A',
        date: new Date(sale.sale_date).toLocaleDateString(),
        paymentMethod: sale.payment_method,
        itemsHtml,
        discountAmount: sale.discount_amount,
        taxAmount: sale.tax_amount,
        totalAmount: sale.total_amount
      });
    } else if (type === 'purchase') {
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

      // Replace template variables
      subject = subject
        .replace('{{po_number}}', po.po_number)
        .replace('{{business_name}}', org.name)
        .replace('{{customer_name}}', recipientName);

      const itemsHtml = template.show_items_table ? po.purchase_order_items?.map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.products?.name || 'Product'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price?.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.total_amount?.toFixed(2)}</td>
        </tr>
      `).join('') : '';

      emailHtml = generateEmailHtml({
        org,
        template,
        primaryColor,
        recipientName,
        referenceNumber: po.po_number,
        date: new Date(po.order_date).toLocaleDateString(),
        expectedDate: po.expected_date ? new Date(po.expected_date).toLocaleDateString() : null,
        itemsHtml,
        totalAmount: po.total_amount,
        notes: po.notes
      });
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

function generateEmailHtml(params: {
  org: any;
  template: EmailTemplate;
  primaryColor: string;
  recipientName: string;
  referenceNumber: string;
  date: string;
  paymentMethod?: string | null;
  expectedDate?: string | null;
  itemsHtml: string;
  discountAmount?: number | null;
  taxAmount?: number | null;
  totalAmount: number;
  notes?: string | null;
}): string {
  const { org, template, primaryColor, recipientName, referenceNumber, date, paymentMethod, expectedDate, itemsHtml, discountAmount, taxAmount, totalAmount, notes } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid ${primaryColor}; }
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
          ${template.logo_url ? `<img src="${template.logo_url}" alt="${org.name}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
          <h1 style="margin: 0; color: ${primaryColor};">${org.name}</h1>
          ${template.show_business_details ? `
            ${org.address ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">${org.address}${org.city ? `, ${org.city}` : ''}</p>` : ''}
            ${org.phone ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">Phone: ${org.phone}</p>` : ''}
            ${org.email ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">Email: ${org.email}</p>` : ''}
          ` : ''}
        </div>
        
        <div class="content">
          <h2 style="color: #333;">${template.header_text || ''}, ${recipientName}!</h2>
          
          ${template.custom_message ? `<p style="color: #666; margin-bottom: 20px;">${template.custom_message}</p>` : ''}
          
          <p><strong>Reference:</strong> ${referenceNumber}</p>
          <p><strong>Date:</strong> ${date}</p>
          ${paymentMethod ? `<p><strong>Payment Method:</strong> ${paymentMethod}</p>` : ''}
          ${expectedDate ? `<p><strong>Expected Delivery:</strong> ${expectedDate}</p>` : ''}
          
          ${template.show_items_table && itemsHtml ? `
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
                ${discountAmount ? `
                  <tr>
                    <td colspan="3" style="padding: 8px; text-align: right;">Discount:</td>
                    <td style="padding: 8px; text-align: right;">-$${discountAmount.toFixed(2)}</td>
                  </tr>
                ` : ''}
                ${taxAmount ? `
                  <tr>
                    <td colspan="3" style="padding: 8px; text-align: right;">Tax:</td>
                    <td style="padding: 8px; text-align: right;">$${taxAmount.toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr class="total-row">
                  <td colspan="3" style="padding: 12px 8px; text-align: right;">Total:</td>
                  <td style="padding: 12px 8px; text-align: right;">$${totalAmount?.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          ` : `
            <p style="font-size: 18px; font-weight: bold; color: ${primaryColor};">Total: $${totalAmount?.toFixed(2)}</p>
          `}
          
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>
        
        <div class="footer">
          <p>${template.footer_text || 'Thank you for your business!'}</p>
          ${org.email ? `<p>For any questions, please contact us at ${org.email}</p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
