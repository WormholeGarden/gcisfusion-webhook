const express = require('express');
const app = express();
app.use(express.json());

// Your Airtable credentials
const AIRTABLE_TOKEN = 'patC6zVFSofyfnQwi.a75220222551de0f20d5f4cdd8bfd630f3a272b0c8c0e488f9a68644398546d8';
const AIRTABLE_BASE_ID = 'app5RcMj4TSLHraH9';
const AIRTABLE_TABLE_NAME = 'Users';

// Test endpoint to check if webhook can reach Airtable
app.get('/test-airtable', async (req, res) => {
  console.log('🔍 Testing Airtable connection...');
  try {
    const response = await fetch('https://api.airtable.com/v0/meta/whoami', {
      headers: { 
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Airtable connection successful!');
      res.json({ success: true, message: 'Airtable connection works!', data });
    } else {
      const errorText = await response.text();
      console.error(`❌ Airtable auth error: ${response.status}`);
      res.json({ success: false, error: `HTTP ${response.status}: ${errorText}` });
    }
  } catch (err) {
    console.error('❌ Cannot reach Airtable:', err.message);
    res.json({ success: false, error: err.message });
  }
});

// Main webhook endpoint
app.post('/webhook', async (req, res) => {
  console.log('📨 Webhook received');
  console.log('Event type:', req.body.type);
  
  if (req.body.type === 'checkout.session.completed') {
    const email = req.body.data.object.customer_details.email;
    console.log(`💰 Payment from: ${email}`);
    
    if (!email) {
      console.error('❌ No email found in webhook');
      return res.json({ received: true, error: 'no email' });
    }
    
    try {
      // Search for existing user
      const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula={Email}="${email}"`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const searchData = await searchResponse.json();
      
      let recordId = null;
      if (searchData.records && searchData.records.length > 0) {
        recordId = searchData.records[0].id;
        console.log(`📝 Found existing record: ${recordId}`);
      }
      
      // Prepare the record data
      const recordData = {
        records: [{
          id: recordId || undefined,
          fields: {
            Email: email,
            Tier: 'pro',
            'Subscribed At': new Date().toISOString()
          }
        }]
      };
      
      // Send to Airtable
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success! ${email} is now PRO in Airtable`);
      } else {
        console.error(`❌ Airtable error: ${response.status}`);
        console.error('Error details:', JSON.stringify(data, null, 2));
      }
      
    } catch (err) {
      console.error('❌ Fetch error:', err.message);
      console.error('Full error:', err);
    }
  }
  
  res.json({ received: true });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Webhook listening on port ${port}`);
  console.log(`📡 Airtable Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`🔑 Airtable Token: ${AIRTABLE_TOKEN ? 'SET' : 'MISSING'}`);
  console.log(`📋 Table name: ${AIRTABLE_TABLE_NAME}`);
  console.log(``);
  console.log(`🔍 Test endpoint: https://gcisfusion-webhook.onrender.com/test-airtable`);
});
