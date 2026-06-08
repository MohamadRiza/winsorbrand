const apiKey = 'AIzaSyCoeeujKDj3pY_i1VeA88UiYVyEvzYJRn4';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

const prompt = `We have a Google Maps location link and its metadata:
Link URL: https://www.google.com/maps/place/Happy+Time+(Pvt)+Ltd+-+Colombo+11/@6.9368997,79.8464732,16z/data=!3m1!4b1!4m6!3m5!1s0x3ae259261ada6aad:0x64dff49a1c0ccff2!8m2!3d6.9368997!4d79.8510866
Page Title: Google Maps
Extracted Place Name from URL: Happy Time (Pvt) Ltd - Colombo 11
Extracted Coordinates: Lat 6.9368997, Lng 79.8510866

Your task is to identify and extract the following details for our database:
- name: Shop/Boutique Name (use the 'Extracted Place Name from URL' above if it represents the shop name, e.g. 'Happy Time (Pvt) Ltd')
- address: Street Address (e.g. '49A Keyzer St, Colombo 01100')
- city: City (e.g. 'Colombo')
- country: Country (e.g. 'Sri Lanka')
- latitude: Latitude (use the coordinates above, or infer them if missing)
- longitude: Longitude (use the coordinates above, or infer them if missing)

If you are not sure about city or country, deduce them based on the address or place name.
Return ONLY a JSON object in this format, with no markdown code blocks, backticks or extra text:
{
  "name": "Shop Name",
  "address": "Street Address",
  "city": "City",
  "country": "Country",
  "latitude": 6.9368997,
  "longitude": 79.8510866
}`;

async function test() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 350 }
      })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
