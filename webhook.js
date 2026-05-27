const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Log that server started
console.log('🚀 Webhook server starting...');

// Check environment variables
if (!process.env.SUPABASE_URL) console.error('❌ SUPABASE_URL missing!');
if (!process.env.SUPABASE_ANON_KEY) console.error('❌ SUPABASE_ANON_KEY missing!');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post('/webhook', async (req, res) => {
  console.log('📨 Webhook hit!');
  console.log('Event type:', req.body.type);
  
  try {
    if (req.body.type === 'checkout.session.completed') {
      const email = req.body.data.object.customer_details.email;
      console.log(`💰 Payment from: ${email}`);
      
      // Try to insert/update
      const { data, error } = await supabase
        .from('users')
        .upsert({ 
          email: email, 
          tier: 'pro', 
          subscribed_at: new Date().toISOString() 
        });
      
      if (error) {
        console.error('❌ DATABASE ERROR:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
      } else {
        console.log(`✅ Success! ${email} is now PRO`);
        console.log('Response:', data);
      }
    } else {
      console.log('⚠️ Ignoring event type:', req.body.type);
    }
  } catch (err) {
    console.error('💥 CRASH:', err.message);
  }
  
  res.json({ received: true });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Webhook listening on port ${port}`);
  console.log(`📡 SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SET' : 'MISSING'}`);
  console.log(`🔑 SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`);
});
