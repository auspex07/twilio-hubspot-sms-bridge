import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { portalId, twilioSid, twilioAuth, twilioNumber } = body;

    if (!portalId || !twilioSid || !twilioAuth || !twilioNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Find the row with this HubSpot Portal ID and add the Twilio keys
    const { error } = await supabase
      .from('customers')
      .update({
        twilio_sid: twilioSid,
        twilio_auth: twilioAuth,
        twilio_number: twilioNumber
      })
      .eq('portal_id', portalId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Keys Error:', error);
    return NextResponse.json({ error: 'Failed to save keys' }, { status: 500 });
  }
}