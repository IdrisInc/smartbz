-- Fix ambiguous column reference in generate_activation_code function
CREATE OR REPLACE FUNCTION public.generate_activation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a code in format: ABC1-2DEF-3GHI
    code := 
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      floor(random() * 10)::text ||
      '-' ||
      floor(random() * 10)::text ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      '-' ||
      floor(random() * 10)::text ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      floor(random() * 10)::text;
    
    -- Check if generated code already exists (qualify table column to avoid ambiguity)
    SELECT EXISTS(
      SELECT 1 FROM public.activation_codes ac WHERE ac.code = code
    ) INTO exists_check;
    
    -- If code doesn't exist, we can use it
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$function$;