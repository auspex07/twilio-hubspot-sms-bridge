import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const sessionId = url.searchParams.get('state');

  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', process.env.NEXT_PUBLIC_HS_CLIENT_ID || process.env.HS_CLIENT_ID);
    formData.append('client_secret', process.env.HS_CLIENT_SECRET);
    formData.append('redirect_uri', process.env.HS_REDIRECT_URI);
    formData.append('code', code);

    const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const hubSpotInfo = await axios.get('https://api.hubapi.com/oauth/v1/access-tokens/' + access_token);
    const portalId = hubSpotInfo.data.hub_id.toString();
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    
    // 3. Save to Supabase (Strict Enforcement)
    let stripeCustomerId = null;
    if (sessionId) {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        stripeCustomerId = session.customer;
    }

    if (!stripeCustomerId) {
        console.error('Security Block: Attempted connection without active Stripe session');
        return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }

    const { error } = await supabase.from('customers').upsert({
        stripe_customer_id: stripeCustomerId,
        portal_id: portalId,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiresAt
    }, { onConflict: 'stripe_customer_id' });

    if (error) throw error;

    return NextResponse.redirect(new URL(`/onboarding?session_id=${sessionId}`, request.url));
  } catch (error) {
    console.error('OAuth Error:', error.message || error);
    return NextResponse.json({ error: 'OAuth failed' }, { status: 500 });
  }
}