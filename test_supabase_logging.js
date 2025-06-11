/**
 * Supabase Logging Test Tool
 * Specifically tests the Supabase integration for prompt event logging
 */

async function testSupabaseLogging() {
  console.log('🧪 TESTING SUPABASE LOGGING');
  console.log('===========================');
  
  try {
    // Ensure PromptOptimizer is available
    if (typeof PromptOptimizer === 'undefined') {
      console.error('❌ PromptOptimizer not found. Make sure promptOptimizer.js is loaded.');
      return false;
    }
    
    const optimizer = new PromptOptimizer();
    await optimizer.ensureInitialized();
    
    console.log('📋 Testing Components:');
    console.log('  - PromptOptimizer initialized:', optimizer.initialized);
    console.log('  - Chrome runtime available:', typeof chrome?.runtime !== 'undefined');
    console.log('  - Chrome storage available:', typeof chrome?.storage !== 'undefined');
    
    // Test 1: Test background script communication
    console.log('\n🧪 Test 1: Background Script Communication');
    try {
      const testMessage = {
        type: 'GET_USER_UUID'
      };
      
      const response = await chrome.runtime.sendMessage(testMessage);
      console.log('📡 Background script response:', response);
      
      if (response && response.success) {
        console.log('✅ Background script communication working');
      } else {
        console.warn('⚠️ Background script communication issue:', response?.error);
      }
    } catch (error) {
      console.error('❌ Background script communication failed:', error);
    }
    
    // Test 2: Test user authentication setup
    console.log('\n🧪 Test 2: User Authentication Setup');
    try {
      // Check current auth status
      const storage = await chrome.storage.local.get(['complyzeUserUUID', 'complyzeUserEmail']);
      console.log('📋 Current auth storage:', {
        hasUUID: !!storage.complyzeUserUUID,
        hasEmail: !!storage.complyzeUserEmail,
        uuid: storage.complyzeUserUUID ? storage.complyzeUserUUID.substring(0, 8) + '...' : 'None'
      });
      
      // Set up test user if none exists
      if (!storage.complyzeUserUUID) {
        const testUUID = 'test-user-' + Math.random().toString(36).substring(2, 15);
        const testEmail = 'test@example.com';
        
        await chrome.storage.local.set({
          complyzeUserUUID: testUUID,
          complyzeUserEmail: testEmail
        });
        
        console.log('✅ Test user created:', {
          uuid: testUUID.substring(0, 8) + '...',
          email: testEmail
        });
      } else {
        console.log('✅ User authentication already configured');
      }
    } catch (error) {
      console.error('❌ User authentication setup failed:', error);
    }
    
    // Test 3: Test direct Supabase message to background
    console.log('\n🧪 Test 3: Direct Supabase Message Test');
    try {
      const testEventData = {
        user_id: 'test-user-12345',
        model: 'meta-llama/llama-3.3-8b-instruct:free',
        usd_cost: 0.001,
        prompt_tokens: 50,
        completion_tokens: 30,
        integrity_score: 85,
        risk_type: 'email',
        risk_level: 'medium',
        platform: 'test-platform',
        metadata: {
          event_type: 'test_event',
          test_data: true,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('📤 Sending test event to background script...');
      const supabaseResponse = await chrome.runtime.sendMessage({
        type: 'SYNC_PROMPT_EVENT',
        data: testEventData
      });
      
      console.log('📡 Supabase response:', supabaseResponse);
      
      if (supabaseResponse && supabaseResponse.success) {
        console.log('✅ Direct Supabase message test passed');
      } else {
        console.error('❌ Direct Supabase message test failed:', supabaseResponse?.error);
      }
    } catch (error) {
      console.error('❌ Direct Supabase message test error:', error);
    }
    
    // Test 4: Test PromptOptimizer logging methods
    console.log('\n🧪 Test 4: PromptOptimizer Logging Methods');
    try {
      // Test clean prompt logging
      console.log('📝 Testing clean prompt logging...');
      const cleanPrompt = "Write a simple hello world program in Python";
      const cleanResult = await optimizer.logPromptEvent(cleanPrompt, []);
      console.log('📊 Clean prompt result:', cleanResult);
      
      // Test flagged prompt logging
      console.log('📝 Testing flagged prompt logging...');
      const flaggedPrompt = "My email is john.doe@company.com and my API key is sk-test123";
      const detectedPII = [
        { type: 'EMAIL', description: 'Email Address', confidence: 'high' },
        { type: 'API_KEY', description: 'API Key', confidence: 'high' }
      ];
      const flaggedResult = await optimizer.logPromptEvent(flaggedPrompt, detectedPII);
      console.log('📊 Flagged prompt result:', flaggedResult);
      
      // Test optimization event logging
      console.log('📝 Testing optimization event logging...');
      const optimizationResult = await optimizer.logOptimizationEvent(
        flaggedPrompt,
        "My email address and API key need help with authentication",
        detectedPII,
        { method: 'test_optimization', cost: 0.001, model: 'test-model' }
      );
      console.log('📊 Optimization event result:', optimizationResult);
      
      console.log('✅ PromptOptimizer logging methods test completed');
      
    } catch (error) {
      console.error('❌ PromptOptimizer logging methods test failed:', error);
    }
    
    // Test 5: Check Supabase table access
    console.log('\n🧪 Test 5: Direct Supabase Table Access Test');
    try {
      const supabaseUrl = 'https://likskioavtpnskrfxbqa.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3NraW9hdnRwbnNrcmZ4YnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI2OTIsImV4cCI6MjA2Mjg5ODY5Mn0.vRzRh_wotQ1UFVk3fVOlAhU8bWucx4oOwkQA6939jtg';
      
      // Test table read access
      console.log('📖 Testing Supabase table read access...');
      const readResponse = await fetch(`${supabaseUrl}/rest/v1/prompt_events?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Table read response:', {
        status: readResponse.status,
        statusText: readResponse.statusText,
        ok: readResponse.ok
      });
      
      if (readResponse.ok) {
        const data = await readResponse.json();
        console.log('✅ Supabase table read access working');
        console.log('📊 Recent events count:', data?.length || 0);
      } else {
        const errorText = await readResponse.text();
        console.error('❌ Supabase table read failed:', errorText);
      }
      
    } catch (error) {
      console.error('❌ Direct Supabase table access test failed:', error);
    }
    
    console.log('\n🎉 SUPABASE LOGGING TEST COMPLETE');
    console.log('=====================================');
    console.log('📋 Summary:');
    console.log('  - If all tests passed, Supabase logging should be working');
    console.log('  - Check the console output above for specific error details');
    console.log('  - Visit https://supabase.com/dashboard/project/likskioavtpnskrfxbqa/editor to verify data');
    
    return true;
    
  } catch (error) {
    console.error('❌ Supabase logging test failed:', error);
    return false;
  }
}

// Quick test function for manual verification
async function quickSupabaseTest() {
  console.log('⚡ QUICK SUPABASE TEST');
  console.log('=====================');
  
  try {
    if (typeof PromptOptimizer === 'undefined') {
      console.error('❌ PromptOptimizer not available');
      return false;
    }
    
    const optimizer = new PromptOptimizer();
    await optimizer.ensureInitialized();
    
    // Single test with detailed logging
    const testPrompt = "Test prompt with email: test@example.com";
    const testPII = [{ type: 'EMAIL', description: 'Email Address' }];
    
    console.log('📝 Testing prompt event logging...');
    const result = await optimizer.logPromptEvent(testPrompt, testPII);
    
    if (result) {
      console.log('✅ Quick test PASSED - Supabase logging working');
      console.log('📊 Result:', result);
    } else {
      console.log('❌ Quick test FAILED - Check error messages above');
    }
    
    return !!result;
    
  } catch (error) {
    console.error('❌ Quick test error:', error);
    return false;
  }
}

// Test the smartRewrite with logging
async function testSmartRewriteWithLogging() {
  console.log('🤖 TESTING SMART REWRITE WITH LOGGING');
  console.log('====================================');
  
  try {
    if (typeof PromptOptimizer === 'undefined') {
      console.error('❌ PromptOptimizer not available');
      return false;
    }
    
    const optimizer = new PromptOptimizer();
    await optimizer.ensureInitialized();
    
    const testText = "My email is john.doe@company.com and my API key is sk-test123. Please help me with authentication.";
    const detectedPII = [
      { type: 'EMAIL', description: 'Email Address', confidence: 'high' },
      { type: 'API_KEY', description: 'API Key', confidence: 'high' }
    ];
    
    console.log('🧪 Testing smart rewrite with Supabase logging...');
    console.log('📝 Original:', testText);
    
    const result = await optimizer.smartRewrite(testText, detectedPII);
    
    console.log('📊 Smart rewrite result:');
    console.log('  - Method:', result.method);
    console.log('  - Rewritten:', result.optimizedText);
    console.log('  - Cost:', result.cost);
    console.log('  - Model:', result.model);
    
    if (result.method === 'smart_rewrite') {
      console.log('✅ Smart rewrite with logging test PASSED');
      return true;
    } else {
      console.warn('⚠️ Smart rewrite fell back to basic method');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Smart rewrite with logging test failed:', error);
    return false;
  }
}

// Make functions available globally
window.testSupabaseLogging = testSupabaseLogging;
window.quickSupabaseTest = quickSupabaseTest;
window.testSmartRewriteWithLogging = testSmartRewriteWithLogging;

console.log('🔧 Supabase Logging Test Tool Loaded!');
console.log('📋 Available functions:');
console.log('  - testSupabaseLogging() - Complete Supabase test suite');
console.log('  - quickSupabaseTest() - Fast single test');
console.log('  - testSmartRewriteWithLogging() - Test smart rewrite with logging');
console.log('');
console.log('💡 Run testSupabaseLogging() for comprehensive testing'); 