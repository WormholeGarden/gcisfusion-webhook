const express = require('express');
const app = express();
app.use(express.json());

const SUPABASE_URL = 'https://udldtawboszhvvwibndv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkbGR0YXdib3N6aHZ2aXdibmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzcyNzMsImV4cCI6MjA5NTQxMzI3M30.3-hFqaOu3y9Fr-FMcxThE9Aa-lFWOZYKwbeTmeHDAzI';

app.post('/webhook', async (req, res) => {
  console.log('📨 Webhook hit!');
  
  if (req.body.type === 'checkout.session.completed') {
    const email = req.body.data.object.customer_details.email;
    console.log(`💰 Payment from: ${email}`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          email: email,
          tier: 'pro',
          subscribed_at: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log(`✅ Success! ${email} is now PRO`);
      } else {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err.message);
    }
  }
  
  res.json({ received: true });
});

app.get('/healthz', (req, res) => res.status(200).send('OK'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Webhook listening on port ${port}`));
