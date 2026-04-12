export default function LandingPage() {
  // 🔴 IMPORTANT: Replace this URL with your actual Stripe Payment Link
  const stripePaymentLink = "#";

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '100px auto', textAlign: 'center', padding: '20px' }}>
      
      <h1 style={{ fontSize: '3.5rem', color: '#111827', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
        HubSpot SMS, Solved.
      </h1>
      
      <p style={{ fontSize: '1.25rem', color: '#4B5563', marginBottom: '3rem', lineHeight: '1.6' }}>
        Auspex Connect bridges your Twilio number directly into the HubSpot Conversations Inbox. 
        No per-message markups. No telecom registration delays.
      </p>

      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '40px', maxWidth: '400px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0', color: '#111827' }}>
          $25<span style={{ fontSize: '1.1rem', color: '#6B7280', fontWeight: 'normal'}}>/month</span>
        </h2>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', textAlign: 'left', color: '#374151', lineHeight: '2.2', fontSize: '1.1rem' }}>
          <li>✅ 7-Day Free Trial</li>
          <li>✅ Bring Your Own Twilio Account</li>
          <li>✅ Unlimited Messages</li>
          <li>✅ 5-Minute Setup</li>
        </ul>

        <a 
          href={stripePaymentLink} 
          style={{ display: 'block', background: '#2563EB', color: 'white', textDecoration: 'none', padding: '16px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', transition: 'background 0.2s' }}
        >
          Start 7-Day Free Trial
        </a>
        
        <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: '15px' }}>
          Cancel anytime. You won't be charged today.
        </p>
      </div>

    </div>
  );
}