import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Make sure your .env.local has these!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // 1. Exchange the auth code for an Access Token & Refresh Token
    const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.HS_CLIENT_ID,
      client_secret: process.env.HS_CLIENT_SECRET,
      redirect_uri: process.env.HS_REDIRECT_URI,
      code: code
    }));

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Calculate when the token expires (current time + seconds until expiry)
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // 2. Get the Portal ID (Hub ID) from HubSpot so we know who this is
    const infoResponse = await axios.get('https://api.hubapi.com/oauth/v1/access-tokens/' + access_token);
    const portalId = infoResponse.data.hub_id.toString();

    // 3. Register the Custom Channel for this portal
    // This makes the "Twilio SMS" option appear in their HubSpot Inbox
    const channelResponse = await axios.post(
      'https://api.hubapi.com/conversations/v3/custom-channels',
      {
        channelName: "Twilio SMS",
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/outbound`
      },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const hsChannelId = channelResponse.data.channelId;

    // 4. Save everything to your Supabase 'customers' table
    const { error: dbError } = await supabase
      .from('customers')
      .upsert({ 
        portal_id: portalId, 
        access_token, 
        refresh_token, 
        expires_at: expiresAt,
        hs_channel_id: hsChannelId 
      }, { onConflict: 'portal_id' });

    if (dbError) throw dbError;

    // 5. Success! Redirect them back to a "Thank You" page or your UI
    return NextResponse.redirect(new URL('/success', request.url));

  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}