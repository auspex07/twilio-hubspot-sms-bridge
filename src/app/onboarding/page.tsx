'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OnboardingContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || ''; 
  // 🔴 THE NEW BOUNCER
  if (!sessionId) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>Access Denied</h2>
        <p>You must start a subscription before connecting your infrastructure.</p>
        <a href="/" style={{ color: '#FF7A59', fontWeight: 'bold' }}>Return to Home</a>
      </div>
    );
  }
  
  const [portalId, setPortalId] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioAuth, setTwilioAuth] = useState('');
  const [twilioNumber, setTwilioNumber] = useState('');
  const [status, setStatus] = useState('');

  // 🔴 IMPORTANT: Replace YOUR_HUBSPOT_CLIENT_ID with your actual Client ID
  const hubspotAuthUrl = `https://app-na2.hubspot.com/oauth/authorize?client_id=f7b38951-a15c-45dd-a0a0-bbfc7133d879&redirect_uri=https%3A%2F%2Fwww.auspex.me%2Fapi%2Foauth%2Fcallback&scope=crm.objects.contacts.write+oauth+conversations.read+conversations.write+conversations.custom_channels.write+crm.objects.contacts.read&state=${sessionId}`;

// We added the specific React type to the 'e' parameter
  const handleSaveKeys = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('Saving...');
    const response = await fetch('/api/keys/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portalId, twilioSid, twilioAuth, twilioNumber }),
    });
    
    if (response.ok) {
      setStatus('Keys saved successfully! Your bridge is live.');
    } else {
      setStatus('Error saving keys. Please check your Portal ID and try again.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '80px auto', fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Welcome to Auspex Connect</h1>
      <p style={{ color: '#4B5563', marginBottom: '40px' }}>Let's get your plumbing connected.</p>

      {/* Step 1: HubSpot */}
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '30px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 15px 0' }}>Step 1: Connect HubSpot</h2>
        <a href={hubspotAuthUrl} style={{ background: '#FF7A59', color: 'white', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block' }}>
          Authorize HubSpot
        </a>
      </div>

      {/* Step 2: Twilio */}
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 15px 0' }}>Step 2: Connect Twilio</h2>
        <form onSubmit={handleSaveKeys} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{display: 'block', fontWeight: 'bold', marginBottom: '5px'}}>HubSpot Portal ID</label>
            <input type="text" value={portalId} onChange={(e) => setPortalId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} required />
          </div>
          <div>
            <label style={{display: 'block', fontWeight: 'bold', marginBottom: '5px'}}>Twilio Account SID</label>
            <input type="text" value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} required />
          </div>
          <div>
            <label style={{display: 'block', fontWeight: 'bold', marginBottom: '5px'}}>Twilio Auth Token</label>
            <input type="password" value={twilioAuth} onChange={(e) => setTwilioAuth(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} required />
          </div>
          <div>
            <label style={{display: 'block', fontWeight: 'bold', marginBottom: '5px'}}>Twilio Phone Number</label>
            <input type="text" placeholder="+12345678900" value={twilioNumber} onChange={(e) => setTwilioNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} required />
          </div>
          <button type="submit" style={{ background: '#111827', color: 'white', padding: '12px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Save Twilio Keys</button>
        </form>
        {status && <p style={{ marginTop: '15px', color: '#059669', fontWeight: 'bold' }}>{status}</p>}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{textAlign: 'center', marginTop: '100px'}}>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}