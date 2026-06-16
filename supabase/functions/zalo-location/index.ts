import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userAccessToken, code, secretKey } = await req.json();

    // Validate inputs
    if (!userAccessToken || !code || !secretKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters: userAccessToken, code, secretKey",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const endpoint = "https://graph.zalo.me/v2.0/me/info";

    // Call Zalo API from server (secure)
    const zaloResponse = await fetch(endpoint, {
      method: "GET",
      headers: {
        access_token: userAccessToken,
        code: code,
        secret_key: secretKey,
        "Content-Type": "application/json",
      },
    });

    const zaloData = await zaloResponse.json();

    // Check for Zalo API errors
    if (!zaloResponse.ok || zaloData.error_code) {
      const errorMessage = zaloData.error_message || zaloData.message || "Zalo API error";

      // Check for GPS permission error
      if (
        errorMessage.toLowerCase().includes("gps") ||
        errorMessage.toLowerCase().includes("location") ||
        errorMessage.toLowerCase().includes("permission")
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "GPS_PERMISSION_DENIED",
            details: errorMessage,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          statusCode: zaloResponse.status,
        }),
        {
          status: zaloResponse.status || 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract location data
    const locationData = {
      userId: zaloData.id || null,
      name: zaloData.name || null,
      phone: zaloData.phone || null,
      avatar: zaloData.avatar || null,
      gender: zaloData.gender || null,
      birthdate: zaloData.birthdate || null,
      // Zalo API returns location if user shares it
      latitude: zaloData.latitude || null,
      longitude: zaloData.longitude || null,
    };

    console.log("✅ Zalo Location Success:", {
      userId: locationData.userId,
      name: locationData.name,
      hasLocation: !!(locationData.latitude && locationData.longitude),
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: locationData,
        rawData: zaloData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error:", error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
