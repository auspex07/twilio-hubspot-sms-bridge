import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // HubSpot sends a lot of data; we just need the message and who sent it
    const { text, channelAccountId, recipient } = body;
    
    // 1. Look up the Twilio keys based on the HubSpot Channel Account ID
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: customer, error } = await supabase
      .from('customers')
      .select('twilio_sid, twilio_auth, twilio_number')
      .eq('twilio_number', channelAccountId) // We named the account after the number earlier!
      .single();

    if (error || !customer) {
      console.error('Database Error: Could not find matching Twilio keys');
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // 2. Send the message via Twilio
    const client = twilio(customer.twilio_sid, customer.twilio_auth);
    
    await client.messages.create({
      body: text,
      from: customer.twilio_number,
      to: recipient // The customer's phone number
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Outbound Webhook Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}