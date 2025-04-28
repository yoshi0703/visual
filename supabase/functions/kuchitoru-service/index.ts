import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse the request body
    const { action, data } = await req.json();
    
    if (!action) {
      throw new Error("Action is required");
    }
    
    let result;
    
    // Handle different actions
    switch (action) {
      case "save-coupon-settings":
        result = await saveCouponSettings(supabase, data);
        break;
      
      case "save-chat-settings":
        result = await saveChatSettings(supabase, data);
        break;
      
      case "update-store-settings":
        result = await updateStoreSettings(supabase, data);
        break;
      
      case "generate-qr-code":
        result = await generateQrCode(supabase, data);
        break;
      
      // Add other actions as needed
      
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
    
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
    
  } catch (error) {
    console.error("Function error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

// Coupon settings handler
async function saveCouponSettings(supabase, data) {
  const { storeId, settings } = data;
  
  if (!storeId) {
    throw new Error("Store ID is required");
  }
  
  console.log("Updating store with coupon settings:", settings);
  
  // Update the store with coupon settings
  const { data: store, error } = await supabase
    .from("stores")
    .update({
      coupon_type: settings.coupon_type,
      coupon_value: settings.coupon_value,
      coupon_free_item_desc: settings.coupon_free_item_desc,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)
    .select("*")
    .single();
  
  if (error) {
    console.error("Error saving coupon settings:", error);
    throw new Error(`Failed to save coupon settings: ${error.message}`);
  }
  
  return {
    success: true,
    store,
  };
}

// Chat settings handler
async function saveChatSettings(supabase, data) {
  const { storeId, settings } = data;
  
  if (!storeId) {
    throw new Error("Store ID is required");
  }
  
  // Update the store with chat settings
  const { data: store, error } = await supabase
    .from("stores")
    .update({
      ai_tone: settings.ai_tone,
      welcome_message: settings.welcome_message,
      thanks_message: settings.thanks_message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)
    .select("*")
    .single();
  
  if (error) {
    console.error("Error saving chat settings:", error);
    throw new Error(`Failed to save chat settings: ${error.message}`);
  }
  
  return {
    success: true,
    store,
  };
}

// Store settings handler
async function updateStoreSettings(supabase, data) {
  const { storeId, updates } = data;
  
  if (!storeId) {
    throw new Error("Store ID is required");
  }
  
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error("No updates provided");
  }
  
  // Add updated_at timestamp
  updates.updated_at = new Date().toISOString();
  
  // Update the store
  const { data: store, error } = await supabase
    .from("stores")
    .update(updates)
    .eq("id", storeId)
    .select("*")
    .single();
  
  if (error) {
    console.error("Error updating store settings:", error);
    throw new Error(`Failed to update store settings: ${error.message}`);
  }
  
  return {
    success: true,
    store,
  };
}

// QR code generation handler
async function generateQrCode(supabase, data) {
  const { storeId } = data;
  
  if (!storeId) {
    throw new Error("Store ID is required");
  }
  
  // Check if store exists
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name, interview_url, qr_code_url")
    .eq("id", storeId)
    .single();
  
  if (storeError) {
    console.error("Error fetching store:", storeError);
    throw new Error(`Store not found: ${storeError.message}`);
  }
  
  // Generate interview URL if it doesn't exist
  let interviewUrl = store.interview_url;
  
  if (!interviewUrl) {
    // Create a unique path for the interview
    const uniqueId = crypto.randomUUID();
    interviewUrl = `/interview/${uniqueId}`;
    
    // Update the store with the interview URL
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        interview_url: interviewUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);
    
    if (updateError) {
      console.error("Error updating interview URL:", updateError);
      throw new Error(`Failed to update interview URL: ${updateError.message}`);
    }
  }
  
  // For this example, we'll just return the URL - in a real implementation,
  // you might generate an actual QR code image and store it somewhere
  return {
    success: true,
    interviewUrl,
    qrCodeUrl: store.qr_code_url,
  };
}