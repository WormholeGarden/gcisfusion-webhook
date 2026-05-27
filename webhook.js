const express = require('express');
const app = express();
app.use(express.json());

// Your Airtable credentials
const AIRTABLE_TOKEN = 'patC6zVFSofyfnQwi.a75220222551de0f20d5f4cdd8bfd630f3a272b0c8c0e488f9a68644398546d8';
const AIRTABLE_BASE_ID = 'app5RcMj4TSLHraH9';
const AIRTABLE_TABLE_NAME = 'Users';

app.post('/webhook', async (req, res) => {
  console.log('📨 Webhook received');
  console.log('Event type:', req.body.type);
  
  if (req.body.type === 'checkout.session.completed') {
    const email = req.body.data.object.customer_details.email;
    console.log(`💰 Payment from: ${email}`);
    
    if (!email) {
      console.error('❌ No email found');
      return res.json({ received: true });
    }
    
    try {
      // Search for existing user
      const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula={Email}="${email}"`;
      const searchResponse = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
      });
      const searchData = await searchResponse.json();
      
      let recordId = null;
      if (searchData.records && searchData.records.length > 0) {
        recordId = searchData.records[0].id;
        console.log(`📝 Found existing record: ${recordId}`);
      }
      
      // Prepare record
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
      const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordData)
      });
      
      if (response.ok) {
        console.log(`✅ Success! ${email} is now PRO`);
      } else {
        const error = await response.text();
        console.error(`❌ Airtable error ${response.status}: ${error}`);
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
  }
  
  res.json({ received: true });
});

app.get('/healthz', (req, res) => res.status(200).send('OK'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Webhook listening on port ${port}`);
  console.log(`📡 Airtable: ${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`);
});
