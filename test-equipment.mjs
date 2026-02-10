import fetch from 'node-fetch';

async function testEquipment() {
  try {
    const response = await fetch('http://localhost:3000/api/equipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Equipment',
        description: 'Test Description',
        rarity: 'common',
        type: 'misc'
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testEquipment();
