import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

export async function POST(request) {
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    
    const fromNumber = params.get('From'); 
    const toNumber = params.get('To');     
    const messageBody = params.get('Body');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Find the HubSpot Portal
    const { data: customer, error: dbError } = await supabase
      .from('customers')
      .select('access_token')
      .eq('twilio_number', toNumber)
      .single();

    if (dbError || !customer) {
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // 2. Fetch the Custom Channel ID
    // 🔴 DON'T FORGET: Put your App ID from the HubSpot Dev URL here
    const appId = 'YOUR_APP_ID_HERE'; 
    
    const channelsRes = await axios.get(`https://api.hubapi.com/conversations/v3/custom-channels?appId=${appId}`, {
        headers: { Authorization: `Bearer ${customer.access_token}` }
    });
    
    const channelId = channelsRes.data.results[0].id;

    // 3. Push to HubSpot
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

    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Inbound Error:', error.response?.data || error.message);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        headers: { 'Content-Type': 'text/xml' }
    });
  }
}