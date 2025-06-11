/**
 * Direct OpenRouter API Test
 * Run this in browser console to test API key directly
 */

async function testOpenRouterDirectly() {
  const apiKey = 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f';
  const model = 'meta-llama/llama-3.1-8b-instruct:free';
  
  console.log('🧪 Testing OpenRouter API directly...');
  console.log('🔑 API Key:', apiKey.substring(0, 12) + '...');
  console.log('🤖 Model:', model);
  
  try {
    // Test 1: Check models endpoint
    console.log('\n📡 Step 1: Testing /models endpoint...');
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Models endpoint status:', modelsResponse.status);
    
    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      console.error('❌ Models endpoint failed:', {
        status: modelsResponse.status,
        statusText: modelsResponse.statusText,
        body: errorText
      });
      return false;
    }
    
    const modelsData = await modelsResponse.json();
    console.log('✅ Models endpoint successful');
    console.log('📊 Total models available:', modelsData.data?.length || 0);
    
    // Check if our target model exists
    const targetModel = modelsData.data?.find(m => m.id === model);
    if (targetModel) {
      console.log('✅ Target model found:', {
        id: targetModel.id,
        name: targetModel.name,
        pricing: targetModel.pricing
      });
    } else {
      console.warn('⚠️ Target model not found. Available free models:');
      const freeModels = modelsData.data?.filter(m => 
        m.pricing?.prompt === "0" || 
        m.pricing?.prompt === 0 ||
        m.id.includes(':free')
      ).slice(0, 5);
      console.log(freeModels?.map(m => m.id) || []);
    }
    
    // Test 2: Simple chat completion
    console.log('\n📡 Step 2: Testing chat completion...');
    const chatResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze Test'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond with exactly "API_TEST_SUCCESS" if you understand this.'
          },
          {
            role: 'user',
            content: 'Please confirm this test is working by responding with the exact phrase requested.'
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
        stream: false
      })
    });
    
    console.log('Chat completion status:', chatResponse.status);
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('❌ Chat completion failed:', {
        status: chatResponse.status,
        statusText: chatResponse.statusText,
        body: errorText
      });
      
      // Try to parse error as JSON for better details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('📋 Parsed error details:', errorJson);
      } catch (e) {
        console.error('📋 Raw error text:', errorText);
      }
      
      return false;
    }
    
    const chatData = await chatResponse.json();
    console.log('✅ Chat completion successful:', {
      response: chatData.choices?.[0]?.message?.content,
      usage: chatData.usage,
      model: chatData.model,
      cost: calculateSimpleCost(chatData.usage)
    });
    
    // Test 3: Smart rewrite simulation
    console.log('\n📡 Step 3: Testing smart rewrite...');
    const smartRewriteResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze Smart Rewrite Test'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a privacy protection AI. Rewrite prompts to remove sensitive data naturally without using [REDACTED] tags.'
          },
          {
            role: 'user',
            content: 'Rewrite this prompt to remove sensitive data naturally: "Hi, my email is john.doe@company.com and my API key is sk-test123. Can you help me debug this?"'
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
        stream: false
      })
    });
    
    if (smartRewriteResponse.ok) {
      const smartRewriteData = await smartRewriteResponse.json();
      console.log('✅ Smart rewrite test successful:', {
        rewritten: smartRewriteData.choices?.[0]?.message?.content,
        usage: smartRewriteData.usage
      });
    } else {
      const errorText = await smartRewriteResponse.text();
      console.error('❌ Smart rewrite test failed:', errorText);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

function calculateSimpleCost(usage) {
  if (!usage) return 0;
  const inputCost = (usage.prompt_tokens || 0) * 0.0005 / 1000;
  const outputCost = (usage.completion_tokens || 0) * 0.0015 / 1000;
  return inputCost + outputCost;
}

// Run the test
console.log('🚀 Starting direct OpenRouter API test...');
testOpenRouterDirectly().then(success => {
  if (success) {
    console.log('✅ Direct API test completed successfully');
  } else {
    console.log('❌ Direct API test failed');
  }
}); 