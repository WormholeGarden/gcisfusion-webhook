const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Debug: Check if environment variables exist
console.log('Starting webhook...');
console.log('SUPABASE_URL exists?', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists?', !!process.env.SUPABASE_ANON_KEY);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post('/webhook', async (req, res) => {
  console.log('Webhook received:', req.body.type);
  const event = req.body;
  
  if (event.type === 'checkout.session.completed') {
    const email = event.data.object.customer_details.email;
    console.log(`💰 Payment received from: ${email}`);
    
    const { error } = await supabase
      .from('users')
      .upsert({ email, tier: 'pro', subscribed_at: new Date() });
    
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log(`✅ Upgraded ${email} to Pro`);
    }
  }
  
  res.json({ received: true });
});

// Health check endpoint (Render needs this)
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Webhook listening on port ${port}`));
