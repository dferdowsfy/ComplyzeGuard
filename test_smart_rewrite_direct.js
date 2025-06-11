/**
 * Direct Smart Rewrite Test - OpenRouter API
 * Test the API directly to identify issues with smart rewrite functionality
 */

async function testSmartRewriteDirectly() {
  console.log('🔧 DIRECT SMART REWRITE TEST');
  console.log('============================');
  
  const apiKey = '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';
  const model = 'meta-llama/llama-3.3-8b-instruct:free';
  const baseUrl = 'https://openrouter.ai/api/v1';
  
  // Test data
  const testPrompt = 'My email is john.doe@company.com and my API key is sk-test123. Please help me with authentication.';
  const detectedPII = [
    { type: 'EMAIL', description: 'Email Address' },
    { type: 'API_KEY', description: 'API Key' }
  ];
  
  // Build system prompt (copied from promptOptimizer.js)
  const systemPrompt = `You are a privacy protection AI that rewrites user prompts to remove sensitive information while preserving the original meaning and intent.

TASK: Naturally rewrite the user's prompt to eliminate ALL sensitive data without using [REDACTED] tags or brackets.

DETECTED SENSITIVE DATA TO REMOVE:
- Email Address (EMAIL)
- API Key (API_KEY)

COMPREHENSIVE REWRITING RULES:
1. NEVER use [REDACTED], [REMOVED], or any bracketed placeholders
2. Replace ALL specific sensitive data with natural, generic alternatives:

PERSONAL IDENTIFIERS:
   - Email addresses → "an email address", "their email", "my email"
   - API keys → "an API key", "my API key", "authentication credentials"

3. Preserve the technical question, request, or core objective
4. Maintain the original tone and writing style
5. Keep all non-sensitive technical details intact

IMPORTANT: 
- Only return the rewritten prompt, nothing else
- Make it sound natural and conversational
- Never mention that you removed sensitive information
- Ensure ALL detected PII types are properly handled`;

  console.log('📋 Test Configuration:');
  console.log('  API Key:', apiKey.substring(0, 12) + '...');
  console.log('  Model:', model);
  console.log('  Base URL:', baseUrl);
  console.log('  Original prompt:', testPrompt);
  console.log('  Detected PII:', detectedPII.map(p => p.type).join(', '));
  
  try {
    // Step 1: Test API connection
    console.log('\n📡 Step 1: Testing API connection...');
    
    const testResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co', // Optional. Site URL for rankings on openrouter.ai
        'X-Title': 'Complyze Smart Rewrite Test' // Optional. Site title for rankings on openrouter.ai
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: 'Say "API_WORKING" if you can see this message.' }
        ],
        max_tokens: 10,
        temperature: 0
      })
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('❌ API connection failed:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        error: errorText
      });
      return false;
    }
    
    const testData = await testResponse.json();
    console.log('✅ API connection successful:', testData.choices[0]?.message?.content);
    
    // Step 2: Test smart rewrite
    console.log('\n🤖 Step 2: Testing smart rewrite...');
    
    const rewriteResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
              headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://complyze.co', // Optional. Site URL for rankings on openrouter.ai
          'X-Title': 'Complyze Smart Rewrite' // Optional. Site title for rankings on openrouter.ai
        },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Rewrite this prompt to remove sensitive data naturally (detected: EMAIL, API_KEY):\n\n${testPrompt}`
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
        stream: false
      })
    });
    
    console.log('📊 Smart rewrite response status:', rewriteResponse.status, rewriteResponse.statusText);
    
    if (!rewriteResponse.ok) {
      const errorText = await rewriteResponse.text();
      console.error('❌ Smart rewrite API error:', {
        status: rewriteResponse.status,
        statusText: rewriteResponse.statusText,
        error: errorText
      });
      return false;
    }
    
    const rewriteData = await rewriteResponse.json();
    console.log('📊 Smart rewrite response data:', {
      hasChoices: !!rewriteData.choices,
      choicesLength: rewriteData.choices?.length,
      hasUsage: !!rewriteData.usage,
      usage: rewriteData.usage
    });
    
    const optimizedText = rewriteData.choices[0]?.message?.content?.trim();
    
    if (!optimizedText) {
      console.error('❌ No optimized text in response:', rewriteData);
      return false;
    }
    
    console.log('\n🎯 SMART REWRITE RESULTS:');
    console.log('=' + '='.repeat(25));
    console.log('📝 Original prompt:', testPrompt);
    console.log('🤖 Rewritten prompt:', optimizedText);
    console.log('💰 Token usage:', rewriteData.usage);
    console.log('📊 Success metrics:', {
      originalLength: testPrompt.length,
      rewrittenLength: optimizedText.length,
      containsEmail: optimizedText.toLowerCase().includes('john.doe@company.com'),
      containsApiKey: optimizedText.toLowerCase().includes('sk-test123'),
      usesRedactedTags: optimizedText.includes('[') && optimizedText.includes(']')
    });
    
    // Check if rewrite was successful
    const isSuccess = !optimizedText.toLowerCase().includes('john.doe@company.com') && 
                     !optimizedText.toLowerCase().includes('sk-test123') &&
                     !optimizedText.includes('[REDACTED]');
    
    if (isSuccess) {
      console.log('✅ SMART REWRITE SUCCESSFUL!');
      console.log('🎉 Sensitive data removed and prompt rewritten naturally');
      return true;
    } else {
      console.log('❌ SMART REWRITE FAILED!');
      console.log('⚠️  Sensitive data may still be present or using [REDACTED] tags');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Direct test failed:', error);
    return false;
  }
}

// Run the test automatically
testSmartRewriteDirectly().then(success => {
  if (success) {
    console.log('\n🎉 Direct test passed - API is working correctly!');
    console.log('💡 The issue might be in the PromptOptimizer initialization or fallback logic');
  } else {
    console.log('\n💔 Direct test failed - API or configuration issue detected');
  }
});

// Make test available globally
window.testSmartRewriteDirectly = testSmartRewriteDirectly;

console.log('🔧 Direct Smart Rewrite Test loaded. Function available as testSmartRewriteDirectly()'); 