import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

export async function POST(request) {
  try {
    // Twilio sends data as form-urlencoded
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    
    const fromNumber = params.get('From'); // Customer's phone
    const toNumber = params.get('To');     // Your Twilio number
    const messageBody = params.get('Body');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Find the HubSpot Portal attached to this Twilio Number
    const { data: customer, error } = await supabase
      .from('customers')
      .select('access_token')
      .eq('twilio_number', toNumber)
      .single();

    if (error || !customer) {
      console.error('No matching portal for this Twilio number');
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 2. Fetch the Custom Channel ID from HubSpot
    const appId = 'YOUR_APP_ID_HERE'; // Replace with your App ID again!
    const channelsRes = await axios.get(`https://api.hubapi.com/conversations/v3/custom-channels?appId=${appId}`, {
        headers: { Authorization: `Bearer ${customer.access_token}` }
    });
    
    const channelId = channelsRes.data.results[0].id;

    // 3. Push the message into the HubSpot Inbox
    await axios.post(`https://api.hubapi.com/conversations/v3/custom-channels/${channelId}/messages`, {
        channelAccountId: toNumber,
        direction: "INCOMING",
        text: messageBody,
        sender: {
            type: "HS_PHONE_NUMBER",
            value: fromNumber
        }
    }, {
        headers: { Authorization: `Bearer ${customer.access_token}` }
    });

    // Twilio requires an empty TwiML response to acknowledge receipt
    return new NextResponse('