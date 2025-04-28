// netlify/functions/check-stripe-data.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Supabase credentials missing'
      })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload = JSON.parse(event.body || '{}');
    const { userId, storeId, action } = payload;

    if (!userId && !storeId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'User ID or Store ID is required'
        })
      };
    }

    // Get store data first (we can find it by either owner_id or store id)
    let storeQuery = supabase.from('stores').select('*');
    if (storeId) {
      storeQuery = storeQuery.eq('id', storeId);
    } else if (userId) {
      storeQuery = storeQuery.eq('owner_id', userId);
    }
    const { data: storeData, error: storeError } = await storeQuery.maybeSingle();

    if (storeError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Error fetching store: ${storeError.message}`
        })
      };
    }

    if (!storeData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Store not found'
        })
      };
    }

    // Now get customer data
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', storeData.owner_id)
      .maybeSingle();

    // Get subscription data if customer exists
    let subscriptionData = null;
    let subscriptionError = null;
    if (customerData?.customer_id) {
      const result = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('customer_id', customerData.customer_id)
        .maybeSingle();
      
      subscriptionData = result.data;
      subscriptionError = result.error;
    }

    // Option to fix data if action is 'fix'
    if (action === 'fix' && storeData) {
      // Get plan ID from request or use default
      const planId = payload.planId || 'price_1RE8QDIoXiM5069uMN8Ke2TX'; // Default to basic plan if none provided
      
      // Update store with plan ID and active subscription status
      const { data: updatedStore, error: updateError } = await supabase
        .from('stores')
        .update({
          plan_id: planId,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', storeData.id)
        .select()
        .single();
      
      if (updateError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: `Error updating store: ${updateError.message}`,
            data: {
              store: storeData,
              customer: customerData,
              subscription: subscriptionData
            }
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Store updated successfully with plan ID and active subscription status',
          data: {
            store: updatedStore,
            customer: customerData,
            subscription: subscriptionData
          }
        })
      };
    }

    // Return all the data for inspection
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          store: storeData,
          customer: customerData,
          subscription: subscriptionData,
          errors: {
            customer: customerError?.message,
            subscription: subscriptionError?.message
          }
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Server error: ${error.message}`
      })
    };
  }
};