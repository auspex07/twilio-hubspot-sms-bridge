import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const payload = await request.json();

  try {
    const portalId = payload.portalId.toString();
    
    // Look up the specific user by their HubSpot Portal ID
    const { data: user, error } = await supabase
        .from('customers')
        .select('*')
        .eq('portal_id', portalId)
        .single();
    
    if (error || !user) throw new Error('User not found in Supabase');

    // Initialize Twilio with THIS specific user's keys
    const client = twilio(user.twilio_sid, user.twilio_auth);

    await client.messages.create({
      body: payload.message.text,
      from: user.twilio_number,
      to: payload.recipientId.replace('actorId-customer-', '')
    });

    return NextResponse.json({ status: 'SENT' });
  } catch (error) {
    console.error('Outbound Error:', error.message);
    return NextResponse.json({ status: 'FAILED' }, { status: 500 });
  }
}