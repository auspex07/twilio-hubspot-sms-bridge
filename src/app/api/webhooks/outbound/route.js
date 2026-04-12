import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request) {
  const payload = await request.json();

  try {
    // 1. HubSpot sends the portalId in the request
    const portalId = payload.portalId.toString();
    const { data: user } = await supabase.from('customers').select('*').eq('portal_id', portalId).single();

    const client = twilio(user.twilio_sid, user.twilio_auth);

    // 2. Send the SMS via Twilio
    await client.messages.create({
      body: payload.message.text,
      from: user.twilio_number, // You'll need to store their number in the DB too
      to: payload.recipientId.replace('actorId-customer-', '')
    });

    return NextResponse.json({ status: 'SENT' });
  } catch (error) {
    console.error('Outbound Error:', error.message);
    return NextResponse.json({ status: 'FAILED' }, { status: 500 });
  }
}