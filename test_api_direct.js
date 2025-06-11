/**
 * Direct API Test for Browser Console
 * Run this in the browser console to test the OpenRouter API
 */

// Test function to run in browser console
async function testOpenRouterAPI() {
  const apiKey = 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f';
  const model = 'meta-llama/llama-3.1-8b-instruct:free';
  const baseUrl = 'https://openrouter.ai/api/v1';
  
  console.log('🔑 Testing OpenRouter API in browser...');
  
  try {
    // Test 1: Models endpoint
    console.log('📡 Testing models endpoint...');
    const modelsResponse = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze AI Guard'
      }
    });
    
    console.log('Models response status:', modelsResponse.status);
    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      console.error('❌ Models endpoint failed:', errorText);
    } else {
      console.log('✅ Models endpoint successful');
    }
    
    // Test 2: Chat completion
    console.log('💬 Testing chat completion...');
    const chatResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze AI Guard'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Say "API test successful" if you can read this.'
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
        stream: false
      })
    });
    
    console.log('Chat response status:', chatResponse.status);
    console.log('Chat response headers:', Object.fromEntries(chatResponse.headers.entries()));
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('❌ Chat completion failed:', errorText);
      
      // Try to parse as JSON for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Error details:', errorJson);
      } catch (e) {
        console.error('❌ Raw error text:', errorText);
      }
    } else {
      const data = await chatResponse.json();
      console.log('✅ Chat completion successful:', data.choices[0]?.message?.content);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testOpenRouterAPI(); 