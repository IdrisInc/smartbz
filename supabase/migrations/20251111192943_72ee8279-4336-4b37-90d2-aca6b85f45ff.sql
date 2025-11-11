-- Function to update product stock when purchase order is received
CREATE OR REPLACE FUNCTION public.update_stock_on_po_receive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process if status changed to 'received'
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    -- Update stock for all items in this purchase order
    UPDATE public.products p
    SET stock_quantity = stock_quantity + poi.quantity
    FROM public.purchase_order_items poi
    WHERE p.id = poi.product_id
    AND poi.purchase_order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on purchase_orders table
CREATE TRIGGER trigger_update_stock_on_po_receive
AFTER UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_on_po_receive();