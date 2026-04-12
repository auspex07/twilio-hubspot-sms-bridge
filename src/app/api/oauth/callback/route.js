import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// This tells Vercel NOT to run this file during the build process
export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Database connection is safely inside the function
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // 1. Exchange the code for HubSpot tokens
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', process.env.HS_CLIENT_ID);
    formData.append('client_secret', process.env.HS_CLIENT_SECRET);
    formData.append('redirect_uri', process.env.HS_REDIRECT_URI);
    formData.append('code', code);

    const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // 2. Get the HubSpot Portal ID
    const hubSpotInfo = await axios.get('https://api.hubapi.com/oauth/v1/access-tokens/' + access_token);
    const portalId = hubSpotInfo.data.hub_id.toString();

    // 3. Save to Supabase
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    
    const { error } = await supabase
      .from('customers')
      .upsert({ 
        portal_id: portalId, 
        access_token: access_token, 
        refresh_token: refresh_token,
        expires_at: expiresAt
      }, { onConflict: 'portal_id' }); // Prevents creating duplicate rows for the same customer

    if (error) throw error;

    // 4. Redirect to the Onboarding page we are about to build
    return NextResponse.redirect(new URL('/onboarding', request.url));

  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    return NextResponse.json({ error: 'OAuth failed' }, { status: 500 });
  }
}