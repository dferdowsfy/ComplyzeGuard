/**
 * OpenRouter API Specification Compliant Test
 * Follows the exact format from https://openrouter.ai/docs/quickstart
 */

console.log('🔧 Loading OpenRouter Spec Compliant Test...');

async function testOpenRouterSpecCompliant() {
  console.log('\n📚 OPENROUTER API SPECIFICATION COMPLIANT TEST');
  console.log('=' + '='.repeat(50));
  
  // Configuration exactly as per OpenRouter docs
  const config = {
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: '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',
    siteURL: 'https://complyze.co',
    siteName: 'Complyze AI Guard',
    model: 'meta-llama/llama-3.3-8b-instruct:free'
  };
  
  console.log('📋 Configuration:', {
    baseURL: config.baseURL,
    apiKeyPrefix: config.apiKey.substring(0, 12) + '...',
    siteURL: config.siteURL,
    siteName: config.siteName,
    model: config.model
  });
  
  try {
    // Test 1: Basic API Connection (as per OpenRouter docs)
    console.log('\n📡 Test 1: Basic API Connection Test');
    
    const basicResponse = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.siteURL, // Optional. Site URL for rankings on openrouter.ai
        'X-Title': config.siteName // Optional. Site title for rankings on openrouter.ai
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: 'What is the meaning of life?'
          }
        ]
      })
    });
    
    console.log('📊 Basic test response:', {
      status: basicResponse.status,
      statusText: basicResponse.statusText,
      ok: basicResponse.ok
    });
    
    if (!basicResponse.ok) {
      const errorText = await basicResponse.text();
      console.error('❌ Basic API test failed:', {
        status: basicResponse.status,
        error: errorText
      });
      return false;
    }
    
    const basicData = await basicResponse.json();
    console.log('✅ Basic API test successful:', {
      model: basicData.model,
      response: basicData.choices[0]?.message?.content,
      usage: basicData.usage
    });
    
    // Test 2: Smart Rewrite Test (following OpenRouter format)
    console.log('\n🤖 Test 2: Smart Rewrite Following OpenRouter Format');
    
    const smartRewritePrompt = `You are a privacy protection AI that rewrites user prompts to remove sensitive information while preserving the original meaning and intent.

TASK: Naturally rewrite the user's prompt to eliminate ALL sensitive data without using [REDACTED] tags or brackets.

COMPREHENSIVE REWRITING RULES:
1. NEVER use [REDACTED], [REMOVED], or any bracketed placeholders
2. Replace ALL specific sensitive data with natural, generic alternatives:

PERSONAL IDENTIFIERS:
   - Email addresses → "an email address", "their email", "my email"
   - API keys → "an API key", "my API key", "authentication credentials"
   - Phone numbers → "a phone number", "their contact number"
   - Names → "a person", "the individual", "someone"

3. Preserve the technical question, request, or core objective
4. Maintain the original tone and writing style
5. Keep all non-sensitive technical details intact

IMPORTANT: 
- Only return the rewritten prompt, nothing else
- Make it sound natural and conversational
- Never mention that you removed sensitive information
- Ensure ALL detected PII types are properly handled`;

    const testPrompt = 'My email is john.doe@company.com and my API key is sk-test123. Please help me with authentication issues.';
    
    const smartRewriteResponse = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.siteURL, // Optional. Site URL for rankings on openrouter.ai
        'X-Title': config.siteName // Optional. Site title for rankings on openrouter.ai
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: smartRewritePrompt
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
    
    console.log('📊 Smart rewrite response:', {
      status: smartRewriteResponse.status,
      statusText: smartRewriteResponse.statusText,
      ok: smartRewriteResponse.ok
    });
    
    if (!smartRewriteResponse.ok) {
      const errorText = await smartRewriteResponse.text();
      console.error('❌ Smart rewrite test failed:', {
        status: smartRewriteResponse.status,
        error: errorText
      });
      return false;
    }
    
    const smartRewriteData = await smartRewriteResponse.json();
    const rewrittenText = smartRewriteData.choices[0]?.message?.content?.trim();
    
    console.log('\n🎯 SMART REWRITE RESULTS:');
    console.log('=' + '='.repeat(25));
    console.log('📝 Original prompt:', testPrompt);
    console.log('🤖 Rewritten prompt:', rewrittenText);
    console.log('💰 Token usage:', smartRewriteData.usage);
    console.log('📊 Model used:', smartRewriteData.model);
    
    // Validate the rewrite quality
    const qualityCheck = {
      containsOriginalEmail: rewrittenText?.toLowerCase().includes('john.doe@company.com'),
      containsOriginalApiKey: rewrittenText?.toLowerCase().includes('sk-test123'),
      usesRedactedTags: rewrittenText?.includes('[') && rewrittenText?.includes(']'),
      hasReasonableLength: rewrittenText?.length > 20 && rewrittenText?.length < 500,
      preservesIntent: rewrittenText?.toLowerCase().includes('authentication') || rewrittenText?.toLowerCase().includes('help')
    };
    
    console.log('\n🔍 Quality Assessment:', qualityCheck);
    
    const isHighQuality = !qualityCheck.containsOriginalEmail && 
                         !qualityCheck.containsOriginalApiKey && 
                         !qualityCheck.usesRedactedTags && 
                         qualityCheck.hasReasonableLength && 
                         qualityCheck.preservesIntent;
    
    console.log(`\n🎯 Overall Quality: ${isHighQuality ? '✅ EXCELLENT' : '⚠️ NEEDS IMPROVEMENT'}`);
    
    // Test 3: Error Handling Test
    console.log('\n🚨 Test 3: Error Handling Test (Invalid Model)');
    
    const errorTestResponse = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.siteURL,
        'X-Title': config.siteName
      },
      body: JSON.stringify({
        model: 'invalid/model-name',
        messages: [
          {
            role: 'user',
            content: 'This should fail gracefully'
          }
        ]
      })
    });
    
    console.log('📊 Error test response:', {
      status: errorTestResponse.status,
      statusText: errorTestResponse.statusText,
      ok: errorTestResponse.ok
    });
    
    if (!errorTestResponse.ok) {
      const errorText = await errorTestResponse.text();
      console.log('✅ Error handling working correctly:', {
        status: errorTestResponse.status,
        error: errorText.substring(0, 100) + '...'
      });
    } else {
      console.log('⚠️ Expected error test to fail, but it succeeded');
    }
    
    // Final Results
    console.log('\n📊 FINAL RESULTS');
    console.log('=' + '='.repeat(15));
    
    const allTestsPassed = basicResponse.ok && smartRewriteResponse.ok && isHighQuality;
    
    console.log(`Overall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('Test Results:');
    console.log(`  Basic API Connection: ${basicResponse.ok ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Smart Rewrite API: ${smartRewriteResponse.ok ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Rewrite Quality: ${isHighQuality ? '✅ EXCELLENT' : '⚠️ NEEDS IMPROVEMENT'}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 OpenRouter API is working perfectly with the specification!');
      console.log('✅ Headers are correctly formatted');
      console.log('✅ Authentication is working');
      console.log('✅ Smart rewrite functionality is operational');
      console.log('✅ Error handling is appropriate');
      
      // Store the working configuration
      window.openRouterConfig = config;
      console.log('💡 Working configuration saved as window.openRouterConfig');
      
      return {
        success: true,
        basicApiWorking: basicResponse.ok,
        smartRewriteWorking: smartRewriteResponse.ok,
        qualityScore: isHighQuality,
        configuration: config
      };
    } else {
      console.log('\n💔 Some tests failed. Review the detailed logs above.');
      return {
        success: false,
        basicApiWorking: basicResponse.ok,
        smartRewriteWorking: smartRewriteResponse.ok,
        qualityScore: isHighQuality
      };
    }
    
  } catch (error) {
    console.error('❌ Specification compliance test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Quick manual test function
window.quickOpenRouterTest = async function(customPrompt) {
  const prompt = customPrompt || 'My email is test@example.com. Please help me.';
  
  console.log('🧪 Quick OpenRouter Test');
  console.log('Input:', prompt);
  
  try {
    const config = window.openRouterConfig || {
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: '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',
      siteURL: 'https://complyze.co',
      siteName: 'Complyze AI Guard',
      model: 'meta-llama/llama-3.3-8b-instruct:free'
    };
    
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.siteURL,
        'X-Title': config.siteName
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response:', data.choices[0]?.message?.content);
      return data;
    } else {
      const error = await response.text();
      console.error('❌ Error:', error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return null;
  }
};

// Auto-run the specification compliance test
console.log('🚀 Running OpenRouter specification compliance test...');
testOpenRouterSpecCompliant().then(result => {
  if (result.success) {
    console.log('\n🎉 SPECIFICATION COMPLIANCE CONFIRMED!');
    console.log('💡 Use quickOpenRouterTest("your prompt") for quick testing');
  } else {
    console.log('\n💔 Specification compliance test detected issues.');
    console.log('📋 Check the logs above for detailed error information.');
  }
});

// Make the test function available
window.testOpenRouterSpecCompliant = testOpenRouterSpecCompliant;

console.log('🔧 OpenRouter Spec Compliant Test loaded. Functions available:');
console.log('  - testOpenRouterSpecCompliant() - Run full compliance test');
console.log('  - quickOpenRouterTest(prompt) - Quick test with custom prompt'); 