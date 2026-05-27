const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post('/webhook', async (req, res) => {
  console.log('📨 Webhook received');
  console.log('Event type:', req.body.type);
  
  const event = req.body;
  
  if (event.type === 'checkout.session.completed') {
    const email = event.data.object.customer_details.email;
    console.log(`💰 Payment from: ${email}`);
    
    // Try to upsert
    const { data, error } = await supabase
      .from('users')
      .upsert({ email, tier: 'pro', subscribed_at: new Date() });
    
    if (error) {
      console.error('❌ Supabase error:', error.message);
      console.error('Full error:', error);
    } else {
      console.log(`✅ Upserted ${email} to Pro`);
      console.log('Response data:', data);
    }
  }
  
  res.json({ received: true });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Webhook listening on port ${port}`));
