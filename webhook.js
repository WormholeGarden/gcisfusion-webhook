const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post('/webhook', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'checkout.session.completed') {
    const email = event.data.object.customer_details.email;
    
    await supabase
      .from('users')
      .upsert({ email, tier: 'pro', subscribed_at: new Date() });
  }
  
  res.json({ received: true });
});

app.listen(3000, () => console.log('Webhook running'));
