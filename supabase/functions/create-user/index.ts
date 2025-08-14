import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create client with user's JWT to verify they're authenticated
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Verify the requesting user is authenticated and has permissions
    const { data: { user: requestingUser }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !requestingUser) {
      throw new Error('Unauthorized: Invalid user session')
    }

    const { email, password, firstName, lastName, role, organizationId, isAdminRegistration } = await req.json()

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role || !organizationId) {
      throw new Error('Missing required fields')
    }

    // For admin registration, skip organization membership check
    if (!isAdminRegistration) {
      // Verify the requesting user has permission to create users in this organization
      const { data: membership, error: membershipError } = await supabaseUser
        .from('organization_memberships')
        .select('role, is_owner')
        .eq('user_id', requestingUser.id)
        .eq('organization_id', organizationId)
        .single()

      if (membershipError || !membership) {
        throw new Error('User is not a member of this organization')
      }

      if (!membership.is_owner && !['business_owner', 'manager'].includes(membership.role)) {
        throw new Error('Insufficient permissions to create users')
      }
    } else {
      // For admin registration, verify the requesting user is an admin
      const { data: adminMembership } = await supabaseAdmin
        .from('organization_memberships')
        .select('role')
        .eq('user_id', requestingUser.id)
        .eq('role', 'admin')
        .single()

      if (!adminMembership) {
        throw new Error('Only admins can perform admin registration')
      }
    }

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers()
    if (checkError) {
      console.error('Error checking existing users:', checkError)
    }
    
    const existingUser = existingUsers?.users?.find(u => u.email === email)
    
    if (!isAdminRegistration && existingUser) {
      // For regular registration, check if they're already a member of this organization
      const { data: existingMembership } = await supabaseAdmin
        .from('organization_memberships')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', existingUser.id)
        .single()

      if (existingMembership) {
        throw new Error('User is already a member of this organization')
      } else {
        // Add existing user to the organization
        const { error: membershipError } = await supabaseAdmin
          .from('organization_memberships')
          .insert({
            user_id: existingUser.id,
            organization_id: organizationId,
            role: role,
            is_owner: false
          })

        if (membershipError) {
          throw membershipError
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            userId: existingUser.id,
            message: 'Existing user added to organization'
          }),
          {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            },
            status: 200,
          },
        )
      }
    } else if (isAdminRegistration && existingUser) {
      // For admin registration, don't allow duplicate emails
      throw new Error('A user with this email already exists')
    }

    // Create the new user using admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`
      },
      email_confirm: true // Auto-confirm email to avoid confirmation step
    })

    if (createError) {
      throw createError
    }

    if (!newUser.user) {
      throw new Error('Failed to create user')
    }

    // Create profile for the new user
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        user_id: newUser.user.id,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't throw here - the user was created successfully
    }

    // Create organization membership
    const { error: membershipInsertError } = await supabaseAdmin
      .from('organization_memberships')
      .insert({
        user_id: newUser.user.id,
        organization_id: organizationId,
        role: role,
        is_owner: isAdminRegistration && role === 'business_owner'
      })

    if (membershipInsertError) {
      console.error('Membership creation error:', membershipInsertError)
      
      // Clean up the created user if membership creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw membershipInsertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        message: 'User created successfully'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating user:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400,
      },
    )
  }
})