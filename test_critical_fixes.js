/**
 * Complyze Critical Fixes Test Suite
 * Tests for the three critical issues:
 * 1. UUID Authentication & Supabase Sync
 * 2. Submit Button Blocking when PII detected
 * 3. Smart Rewrite API Integration with OpenRouter
 */

console.log('🧪 Loading Complyze Critical Fixes Test Suite...');

// Test 1: Supabase Authentication and Sync
window.testSupabaseAuthentication = async function() {
  console.log('\n🔐 TEST 1: Supabase Authentication & Sync');
  console.log('=' + '='.repeat(45));
  
  const results = {
    sidebarAuth: false,
    storageAuth: false,
    backgroundAuth: false,
    supabaseSync: false
  };
  
  try {
    // Check sidebar authentication (primary method)
    console.log('🔍 Checking sidebar authentication...');
    if (window.complyzeSidebar && window.complyzeSidebar.isUserAuthenticated()) {
      results.sidebarAuth = true;
      console.log('✅ Sidebar authentication: ACTIVE');
      console.log('  - Email:', window.complyzeSidebar.userEmail);
      console.log('  - UUID:', window.complyzeSidebar.userUUID?.substring(0, 8) + '...');
    } else {
      console.log('❌ Sidebar authentication: NOT ACTIVE');
      console.log('💡 Please login through the Complyze sidebar (⚙️ icon)');
    }
    
    // Check storage authentication (fallback method)
    console.log('\n🔍 Checking storage authentication...');
    const storage = await chrome.storage.local.get(['complyzeUserUUID', 'complyzeUserEmail']);
    if (storage.complyzeUserUUID && storage.complyzeUserEmail) {
      results.storageAuth = true;
      console.log('✅ Storage authentication: ACTIVE');
      console.log('  - Email:', storage.complyzeUserEmail);
      console.log('  - UUID:', storage.complyzeUserUUID?.substring(0, 8) + '...');
    } else {
      console.log('❌ Storage authentication: NOT ACTIVE');
    }
    
    // Check background script UUID extraction (last resort)
    console.log('\n🔍 Checking background script UUID...');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_USER_UUID' });
      if (response && response.success && response.uuid) {
        results.backgroundAuth = true;
        console.log('✅ Background script UUID: AVAILABLE');
        console.log('  - UUID:', response.uuid?.substring(0, 8) + '...');
      } else {
        console.log('❌ Background script UUID: NOT AVAILABLE');
        console.log('💡 Try visiting https://complyze.co/dashboard with your UUID in the URL');
      }
    } catch (error) {
      console.log('❌ Background script UUID: ERROR -', error.message);
    }
    
    // Test Supabase sync functionality
    console.log('\n🔍 Testing Supabase sync...');
    if (window.complyzeMonitor) {
      try {
        const testPII = [{ type: 'EMAIL', description: 'Email Address', riskLevel: 'medium' }];
        await window.complyzeMonitor.syncToSupabase('test authentication prompt with john@test.com', testPII);
        results.supabaseSync = true;
        console.log('✅ Supabase sync: WORKING');
        console.log('💡 Check Supabase logs: https://supabase.com/dashboard/project/likskioavtpnskrfxbqa/auth/users');
      } catch (error) {
        console.log('❌ Supabase sync: FAILED -', error.message);
      }
    } else {
      console.log('❌ Supabase sync: Monitor not available');
    }
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  }
  
  // Summary
  console.log('\n📊 AUTHENTICATION TEST RESULTS:');
  console.log('  Sidebar Auth:', results.sidebarAuth ? '✅ PASS' : '❌ FAIL');
  console.log('  Storage Auth:', results.storageAuth ? '✅ PASS' : '❌ FAIL');
  console.log('  Background Auth:', results.backgroundAuth ? '✅ PASS' : '❌ FAIL');
  console.log('  Supabase Sync:', results.supabaseSync ? '✅ PASS' : '❌ FAIL');
  
  const authWorking = results.sidebarAuth || results.storageAuth || results.backgroundAuth;
  console.log('\n🎯 Authentication Status:', authWorking ? '✅ WORKING' : '❌ FAILED');
  
  if (!authWorking) {
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('  1. Login via Complyze sidebar (⚙️ icon)');
    console.log('  2. Visit https://complyze.co/dashboard with your UUID');
    console.log('  3. Check Supabase users table: https://supabase.com/dashboard/project/likskioavtpnskrfxbqa/auth/users');
  }
  
  return results;
};

// Test 2: Submit Button Blocking
window.testSubmitButtonBlocking = function() {
  console.log('\n🚫 TEST 2: Submit Button Blocking');
  console.log('=' + '='.repeat(35));
  
  const results = {
    buttonsFound: false,
    piiDetected: false,
    buttonsBlocked: false,
    visualIndicators: false
  };
  
  if (!window.complyzeMonitor) {
    console.log('❌ Monitor not available');
    return results;
  }
  
  const monitor = window.complyzeMonitor;
  
  // Step 1: Find submit buttons
  console.log('🔍 Finding submit buttons...');
  monitor.findSubmitButtons();
  
  if (monitor.submitButtons && monitor.submitButtons.length > 0) {
    results.buttonsFound = true;
    console.log(`✅ Found ${monitor.submitButtons.length} submit buttons`);
    monitor.submitButtons.forEach((btn, i) => {
      console.log(`  ${i + 1}. ${btn.textContent?.substring(0, 30) || 'Icon button'} (${btn.tagName})`);
    });
  } else {
    console.log('❌ No submit buttons found');
    console.log('💡 This may be normal if no form is currently visible');
  }
  
  // Step 2: Insert PII to trigger detection
  console.log('\n🔍 Inserting test PII...');
  const testPII = "Please review this data: john.doe@company.com, API key: sk-test123456789, Phone: 555-123-4567";
  
  if (monitor.inputElement) {
    // Clear any existing text first
    if (monitor.inputElement.tagName === 'TEXTAREA') {
      monitor.inputElement.value = '';
    } else {
      monitor.inputElement.textContent = '';
    }
    
    // Insert test PII
    if (monitor.inputElement.tagName === 'TEXTAREA') {
      monitor.inputElement.value = testPII;
    } else {
      monitor.inputElement.textContent = testPII;
    }
    
    // Trigger input event
    monitor.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    monitor.inputElement.dispatchEvent(new Event('keyup', { bubbles: true }));
    
    console.log('✅ Test PII inserted');
    console.log('  Text:', testPII);
    
    // Wait for detection
    setTimeout(() => {
      console.log('\n🔍 Checking PII detection and blocking...');
      
      // Check if PII was detected
      const currentText = monitor.getInputText();
      const detectedPII = window.PIIDetector ? window.PIIDetector.detectSensitiveData(currentText) : [];
      
      if (detectedPII.length > 0) {
        results.piiDetected = true;
        console.log(`✅ PII detected: ${detectedPII.length} types`);
        detectedPII.forEach(pii => {
          console.log(`  - ${pii.description} (${pii.type})`);
        });
      } else {
        console.log('❌ PII not detected');
      }
      
      // Check if buttons are blocked
      if (monitor.isBlocked) {
        results.buttonsBlocked = true;
        console.log('✅ Buttons are blocked');
        
        // Check visual indicators
        const disabledButtons = monitor.submitButtons.filter(btn => btn.disabled).length;
        const blockedButtons = monitor.submitButtons.filter(btn => btn.hasAttribute('data-complyze-blocked')).length;
        const visuallyBlocked = monitor.submitButtons.filter(btn => 
          btn.style.opacity === '0.5' || btn.classList.contains('complyze-blocked')
        ).length;
        
        console.log(`  - Disabled buttons: ${disabledButtons}/${monitor.submitButtons.length}`);
        console.log(`  - Blocked attribute: ${blockedButtons}/${monitor.submitButtons.length}`);
        console.log(`  - Visual indicators: ${visuallyBlocked}/${monitor.submitButtons.length}`);
        
        if (disabledButtons > 0 || blockedButtons > 0 || visuallyBlocked > 0) {
          results.visualIndicators = true;
          console.log('✅ Visual blocking indicators present');
        } else {
          console.log('❌ No visual blocking indicators found');
        }
        
      } else {
        console.log('❌ Buttons are NOT blocked');
        console.log('💡 This suggests the blocking mechanism is not working');
      }
      
      // Test button click prevention
      console.log('\n🔍 Testing click prevention...');
      if (monitor.submitButtons.length > 0) {
        const testButton = monitor.submitButtons[0];
        let clickPrevented = false;
        
        const testClickHandler = (e) => {
          if (e.defaultPrevented) {
            clickPrevented = true;
          }
        };
        
        testButton.addEventListener('click', testClickHandler);
        testButton.click();
        testButton.removeEventListener('click', testClickHandler);
        
        if (clickPrevented || testButton.disabled) {
          console.log('✅ Button clicks are being prevented');
        } else {
          console.log('❌ Button clicks are NOT being prevented');
        }
      }
      
      // Summary
      console.log('\n📊 BUTTON BLOCKING TEST RESULTS:');
      console.log('  Buttons Found:', results.buttonsFound ? '✅ PASS' : '❌ FAIL');
      console.log('  PII Detected:', results.piiDetected ? '✅ PASS' : '❌ FAIL');
      console.log('  Buttons Blocked:', results.buttonsBlocked ? '✅ PASS' : '❌ FAIL');
      console.log('  Visual Indicators:', results.visualIndicators ? '✅ PASS' : '❌ FAIL');
      
      const blockingWorking = results.buttonsFound && results.piiDetected && results.buttonsBlocked;
      console.log('\n🎯 Button Blocking Status:', blockingWorking ? '✅ WORKING' : '❌ FAILED');
      
      if (!blockingWorking) {
        console.log('\n💡 RECOMMENDATIONS:');
        if (!results.buttonsFound) {
          console.log('  1. Ensure you are on a supported platform (ChatGPT, Claude, Gemini, Meta AI)');
        }
        if (!results.piiDetected) {
          console.log('  2. Check PII detection patterns and rules configuration');
        }
        if (!results.buttonsBlocked) {
          console.log('  3. Verify button blocking logic and selectors');
        }
      }
      
    }, 2000); // Wait 2 seconds for detection to complete
    
  } else {
    console.log('❌ No input element found');
    console.log('💡 Ensure you are on a supported AI platform page');
  }
  
  return results;
};

// Test 3: Smart Rewrite API Integration
window.testSmartRewriteAPI = async function() {
  console.log('\n🤖 TEST 3: Smart Rewrite API Integration');
  console.log('=' + '='.repeat(40));
  
  const results = {
    promptOptimizerAvailable: false,
    apiKeyConfigured: false,
    connectionTest: false,
    smartRewriteTest: false,
    openRouterActivity: false
  };
  
  // Check if PromptOptimizer is available
  console.log('🔍 Checking PromptOptimizer availability...');
  if (window.PromptOptimizer) {
    results.promptOptimizerAvailable = true;
    console.log('✅ PromptOptimizer class: AVAILABLE');
  } else {
    console.log('❌ PromptOptimizer class: NOT AVAILABLE');
    console.log('💡 Ensure promptOptimizer.js is loaded');
    return results;
  }
  
  try {
    // Initialize PromptOptimizer
    console.log('\n🔍 Initializing PromptOptimizer...');
    const optimizer = new window.PromptOptimizer();
    await optimizer.ensureInitialized();
    
    // Check API key configuration
    console.log('🔍 Checking API key configuration...');
    if (optimizer.apiKey) {
      results.apiKeyConfigured = true;
      console.log('✅ API key: CONFIGURED');
      console.log('  - Key prefix:', optimizer.apiKey.substring(0, 12) + '...');
      console.log('  - Model:', optimizer.model);
      console.log('  - Enabled:', optimizer.enabled);
    } else {
      console.log('❌ API key: NOT CONFIGURED');
      console.log('💡 Check your OpenRouter API key settings');
    }
    
    // Test API connection
    console.log('\n🔍 Testing OpenRouter API connection...');
    try {
      const connectionResult = await optimizer.testConnection();
      if (connectionResult.success) {
        results.connectionTest = true;
        console.log('✅ API connection: WORKING');
        console.log('  - Response time:', connectionResult.responseTime + 'ms');
        console.log('  - Model accessible:', connectionResult.modelAccessible);
      } else {
        console.log('❌ API connection: FAILED');
        console.log('  - Error:', connectionResult.error);
        console.log('  - Status:', connectionResult.status);
      }
    } catch (connectionError) {
      console.log('❌ API connection: ERROR -', connectionError.message);
    }
    
    // Test Smart Rewrite functionality
    console.log('\n🔍 Testing Smart Rewrite functionality...');
    const testText = "Please analyze this data: Contact john.doe@company.com for access to API key sk-test123456789";
    const testPII = [
      { type: 'EMAIL', description: 'Email Address', riskLevel: 'medium' },
      { type: 'API_KEY', description: 'API Key', riskLevel: 'high' }
    ];
    
    console.log('  - Input text:', testText);
    console.log('  - Detected PII:', testPII.map(p => p.type).join(', '));
    
    try {
      console.log('🤖 Calling Smart Rewrite API...');
      const rewriteResult = await optimizer.smartRewrite(testText, testPII);
      
      if (rewriteResult && rewriteResult.method === 'smart_rewrite') {
        results.smartRewriteTest = true;
        results.openRouterActivity = true;
        console.log('✅ Smart Rewrite: WORKING');
        console.log('  - Method:', rewriteResult.method);
        console.log('  - Original length:', testText.length);
        console.log('  - Rewritten length:', rewriteResult.optimizedText.length);
        console.log('  - Cost:', '$' + (rewriteResult.cost || 0).toFixed(4));
        console.log('  - Model used:', rewriteResult.model);
        console.log('  - Output preview:', rewriteResult.optimizedText.substring(0, 100) + '...');
        
        // Check if PII was properly handled
        const outputHasPII = window.PIIDetector ? 
          window.PIIDetector.detectSensitiveData(rewriteResult.optimizedText) : [];
        
        if (outputHasPII.length === 0) {
          console.log('✅ PII successfully removed from output');
        } else {
          console.log('⚠️ Some PII may still be present in output:', outputHasPII.map(p => p.type));
        }
        
      } else if (rewriteResult && rewriteResult.method === 'basic_redaction_fallback') {
        console.log('⚠️ Smart Rewrite: FALLBACK TO BASIC REDACTION');
        console.log('  - API Error:', rewriteResult.error);
        console.log('  - Used method:', rewriteResult.method);
        console.log('💡 Check OpenRouter API key, billing, and rate limits');
        
      } else {
        console.log('❌ Smart Rewrite: UNEXPECTED RESULT');
        console.log('  - Result:', rewriteResult);
      }
      
    } catch (rewriteError) {
      console.log('❌ Smart Rewrite: ERROR -', rewriteError.message);
      
      // Try to identify the error type
      if (rewriteError.message.includes('401')) {
        console.log('💡 This appears to be an authentication error - check your API key');
      } else if (rewriteError.message.includes('402')) {
        console.log('💡 This appears to be a billing error - check your OpenRouter credits');
      } else if (rewriteError.message.includes('429')) {
        console.log('💡 This appears to be a rate limit error - try again later');
      }
    }
    
    // Debug configuration
    console.log('\n🔍 Debug configuration...');
    await optimizer.debugConfiguration();
    
  } catch (error) {
    console.error('❌ Smart Rewrite test failed:', error);
  }
  
  // Summary
  console.log('\n📊 SMART REWRITE TEST RESULTS:');
  console.log('  PromptOptimizer Available:', results.promptOptimizerAvailable ? '✅ PASS' : '❌ FAIL');
  console.log('  API Key Configured:', results.apiKeyConfigured ? '✅ PASS' : '❌ FAIL');
  console.log('  Connection Test:', results.connectionTest ? '✅ PASS' : '❌ FAIL');
  console.log('  Smart Rewrite Test:', results.smartRewriteTest ? '✅ PASS' : '❌ FAIL');
  console.log('  OpenRouter Activity:', results.openRouterActivity ? '✅ PASS' : '❌ FAIL');
  
  const apiWorking = results.promptOptimizerAvailable && results.apiKeyConfigured && 
                     results.connectionTest && results.smartRewriteTest;
  console.log('\n🎯 Smart Rewrite Status:', apiWorking ? '✅ WORKING' : '❌ FAILED');
  
  if (!apiWorking) {
    console.log('\n💡 RECOMMENDATIONS:');
    if (!results.promptOptimizerAvailable) {
      console.log('  1. Ensure promptOptimizer.js is properly loaded');
    }
    if (!results.apiKeyConfigured) {
      console.log('  2. Configure OpenRouter API key in extension settings');
    }
    if (!results.connectionTest) {
      console.log('  3. Check OpenRouter API key validity and account status');
      console.log('  4. Visit https://openrouter.ai/keys to verify your API key');
      console.log('  5. Check your OpenRouter account balance');
    }
    if (!results.smartRewriteTest) {
      console.log('  6. Check OpenRouter console for API activity: https://openrouter.ai/activity');
    }
  }
  
  return results;
};

// Test function specifically for debugging Supabase user recognition
window.debugSupabaseUserSync = async function() {
  console.log('\n🔍 DEBUGGING SUPABASE USER SYNC');
  console.log('=' + '='.repeat(35));
  
  try {
    // Step 1: Check current authentication state
    console.log('📋 Step 1: Checking authentication state...');
    
    const storage = await chrome.storage.local.get(['complyzeUserUUID', 'complyzeUserEmail', 'complyzeAuthToken']);
    console.log('💾 Storage contents:', {
      hasEmail: !!storage.complyzeUserEmail,
      hasUUID: !!storage.complyzeUserUUID,
      hasToken: !!storage.complyzeAuthToken,
      email: storage.complyzeUserEmail,
      uuid: storage.complyzeUserUUID ? storage.complyzeUserUUID.substring(0, 8) + '...' : 'undefined'
    });
    
    // Step 2: Check sidebar authentication
    console.log('\n📋 Step 2: Checking sidebar authentication...');
    if (window.complyzeSidebar) {
      console.log('✅ Sidebar available');
      console.log('  - Is authenticated:', window.complyzeSidebar.isUserAuthenticated());
      console.log('  - User email:', window.complyzeSidebar.userEmail);
      console.log('  - User UUID:', window.complyzeSidebar.userUUID);
      
      if (window.complyzeSidebar.userEmail && !window.complyzeSidebar.userUUID) {
        console.log('⚠️ Email exists but UUID is missing - attempting to generate UUID...');
        
        if (window.complyzeSidebar.generateUserUUID) {
          const generatedUUID = await window.complyzeSidebar.generateUserUUID(window.complyzeSidebar.userEmail);
          console.log('🔧 Generated UUID:', generatedUUID);
          
          // Update storage and sidebar with generated UUID
          await chrome.storage.local.set({ complyzeUserUUID: generatedUUID });
          window.complyzeSidebar.userUUID = generatedUUID;
          console.log('✅ UUID updated in storage and sidebar');
        }
      }
    } else {
      console.log('❌ Sidebar not available');
    }
    
    // Step 3: Test direct Supabase sync
    console.log('\n📋 Step 3: Testing direct Supabase sync...');
    
    const testEventData = {
      user_id: storage.complyzeUserUUID || 'test-uuid',
      model: 'debug-test',
      usd_cost: 0.001,
      prompt_tokens: 15,
      completion_tokens: 0,
      integrity_score: 90,
      risk_type: 'test',
      risk_level: 'low',
      platform: 'debug',
      metadata: {
        debug_test: true,
        test_timestamp: new Date().toISOString(),
        user_email: storage.complyzeUserEmail,
        source: 'debug_function'
      }
    };
    
    console.log('📤 Sending test event to Supabase...');
    console.log('Event data:', testEventData);
    
    const response = await chrome.runtime.sendMessage({
      type: 'SYNC_PROMPT_EVENT',
      data: testEventData
    });
    
    if (response.success) {
      console.log('✅ Supabase sync successful!');
      console.log('Response:', response);
      console.log('🔗 Check your data at: https://supabase.com/dashboard/project/likskioavtpnskrfxbqa/editor');
    } else {
      console.error('❌ Supabase sync failed:', response.error);
    }
    
    // Step 4: Test user table sync
    console.log('\n📋 Step 4: Testing user table sync...');
    
    if (storage.complyzeUserEmail && storage.complyzeUserUUID) {
      console.log('📤 Attempting to create/update user record...');
      
      // Call the ensureUserExists function directly
      try {
        const supabaseUrl = 'https://likskioavtpnskrfxbqa.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3NraW9hdnRwbnNrcmZ4YnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1OTM4NDYsImV4cCI6MjA1MDE2OTg0Nn0.X8GjJ3WKOKPYsA_b3TQ3-jEJSy1D0eSQNK7xf3Rm5TQ';
        
        const userPayload = {
          id: storage.complyzeUserUUID,
          email: storage.complyzeUserEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          extension_version: '1.0.0',
          last_sync: new Date().toISOString()
        };
        
        const userResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(userPayload)
        });
        
        if (userResponse.ok) {
          console.log('✅ User record created successfully in users table');
        } else if (userResponse.status === 409) {
          console.log('✅ User already exists in users table (conflict expected)');
        } else {
          const errorText = await userResponse.text();
          console.log('⚠️ User table response:', userResponse.status, errorText);
        }
        
      } catch (userError) {
        console.error('❌ User table sync error:', userError);
      }
    } else {
      console.log('⚠️ Missing email or UUID for user table sync');
    }
    
    // Step 5: Recommendations
    console.log('\n📋 Step 5: Recommendations...');
    
    if (!storage.complyzeUserEmail) {
      console.log('🔧 REQUIRED: Login through the Complyze sidebar');
      console.log('   Click the ⚙️ icon and enter your credentials');
    }
    
    if (!storage.complyzeUserUUID) {
      console.log('🔧 REQUIRED: Generate or set UUID');
      console.log('   This should happen automatically on login');
    }
    
    if (storage.complyzeUserEmail && storage.complyzeUserUUID) {
      console.log('✅ Authentication looks good!');
      console.log('🔗 Check Supabase tables:');
      console.log('   - Users: https://supabase.com/dashboard/project/likskioavtpnskrfxbqa/editor/28760');
      console.log('   - Events: https://supabase.com/dashboard/project/likskioavtpnskrfxbqa/editor/28761');
    }
    
  } catch (error) {
    console.error('❌ Debug function failed:', error);
  }
};

// Quick fix function to generate UUID for existing authenticated users
window.fixMissingUUID = async function() {
  console.log('🔧 FIXING MISSING UUID...');
  
  try {
    const storage = await chrome.storage.local.get(['complyzeUserEmail']);
    
    if (!storage.complyzeUserEmail) {
      console.log('❌ No email found - please login first');
      return false;
    }
    
    if (window.complyzeSidebar && window.complyzeSidebar.generateUserUUID) {
      const newUUID = await window.complyzeSidebar.generateUserUUID(storage.complyzeUserEmail);
      
      await chrome.storage.local.set({ complyzeUserUUID: newUUID });
      
      if (window.complyzeSidebar) {
        window.complyzeSidebar.userUUID = newUUID;
      }
      
      console.log('✅ UUID generated and stored:', newUUID);
      console.log('🔄 Run debugSupabaseUserSync() to verify fix');
      return true;
      
    } else {
      console.log('❌ Sidebar or generateUserUUID function not available');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return false;
  }
};

// Master test function to run all critical fix tests
window.runCriticalFixTests = async function() {
  console.log('🚀 RUNNING CRITICAL FIXES TEST SUITE');
  console.log('=' + '='.repeat(45));
  console.log('Testing the three critical issues:');
  console.log('1. UUID Authentication & Supabase Sync');
  console.log('2. Submit Button Blocking with PII Detection');
  console.log('3. Smart Rewrite API Integration with OpenRouter');
  console.log('');
  
  const startTime = Date.now();
  let allResults = {};
  
  try {
    // Run all tests
    allResults.authentication = await window.testSupabaseAuthentication();
    allResults.buttonBlocking = window.testSubmitButtonBlocking();
    
    // Wait for button blocking test to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    allResults.smartRewrite = await window.testSmartRewriteAPI();
    
    // Final Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n🏁 CRITICAL FIXES TEST SUITE COMPLETE');
    console.log('=' + '='.repeat(45));
    console.log(`⏱️ Duration: ${duration} seconds`);
    console.log('');
    
    // Score calculation
    let totalScore = 0;
    let maxScore = 0;
    
    // Authentication scoring (max 4 points)
    const authScore = Object.values(allResults.authentication || {}).filter(Boolean).length;
    totalScore += authScore;
    maxScore += 4;
    console.log(`🔐 Authentication: ${authScore}/4 points`);
    
    // Button blocking scoring (max 4 points)  
    const blockScore = Object.values(allResults.buttonBlocking || {}).filter(Boolean).length;
    totalScore += blockScore;
    maxScore += 4;
    console.log(`🚫 Button Blocking: ${blockScore}/4 points`);
    
    // Smart rewrite scoring (max 5 points)
    const rewriteScore = Object.values(allResults.smartRewrite || {}).filter(Boolean).length;
    totalScore += rewriteScore;
    maxScore += 5;
    console.log(`🤖 Smart Rewrite: ${rewriteScore}/5 points`);
    
    const percentage = ((totalScore / maxScore) * 100).toFixed(1);
    console.log('');
    console.log(`📊 OVERALL SCORE: ${totalScore}/${maxScore} (${percentage}%)`);
    
    // Status determination
    if (percentage >= 85) {
      console.log('🎉 STATUS: EXCELLENT - All critical issues resolved!');
    } else if (percentage >= 70) {
      console.log('✅ STATUS: GOOD - Most issues resolved, minor fixes needed');
    } else if (percentage >= 50) {
      console.log('⚠️ STATUS: PARTIAL - Some critical issues remain');
    } else {
      console.log('❌ STATUS: CRITICAL - Major issues need immediate attention');
    }
    
    // Specific recommendations
    console.log('\n💡 NEXT STEPS:');
    
    if (authScore < 2) {
      console.log('  🔐 HIGH PRIORITY: Fix authentication system');
      console.log('     - Ensure user login via sidebar');
      console.log('     - Verify Supabase user table');
    }
    
    if (blockScore < 3) {
      console.log('  🚫 HIGH PRIORITY: Fix submit button blocking');
      console.log('     - Check button selectors');
      console.log('     - Verify PII detection rules');
    }
    
    if (rewriteScore < 3) {
      console.log('  🤖 MEDIUM PRIORITY: Fix Smart Rewrite API');
      console.log('     - Check OpenRouter API key');
      console.log('     - Verify account billing status');
    }
    
    if (percentage >= 85) {
      console.log('  🎯 Monitor extension in production');
      console.log('  📊 Check Supabase logs for activity');
      console.log('  💰 Monitor OpenRouter usage and costs');
    }
    
    console.log('\n🔗 USEFUL LINKS:');
    console.log('  - Supabase Dashboard: https://supabase.com/dashboard/project/likskioavtpnskrfxbqa');
    console.log('  - OpenRouter Console: https://openrouter.ai/activity');
    console.log('  - OpenRouter Keys: https://openrouter.ai/keys');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
  
  return allResults;
};

// Make test functions globally accessible
window.testPromptOptimizer = async function() {
  if (!window.PromptOptimizer) {
    console.error('❌ PromptOptimizer not available');
    return false;
  }
  
  const optimizer = new window.PromptOptimizer();
  console.log('🔧 Testing PromptOptimizer...');
  
  await optimizer.debugConfiguration();
  const result = await optimizer.testConnection();
  console.log('📊 Connection result:', result);
  
  return result.success;
};

console.log('✅ Critical Fixes Test Suite loaded successfully!');
console.log('');
console.log('🧪 Available test functions:');
console.log('  - testSupabaseAuthentication() - Test UUID auth and Supabase sync');
console.log('  - testSubmitButtonBlocking() - Test button blocking with PII');
console.log('  - testSmartRewriteAPI() - Test OpenRouter API integration');
console.log('  - runCriticalFixTests() - Run all tests with scoring');
console.log('  - testPromptOptimizer() - Quick API test');
console.log('  - debugSupabaseUserSync() - Debug Supabase user sync');
console.log('  - fixMissingUUID() - Fix missing UUID');
console.log('');
console.log('🚀 Run runCriticalFixTests() to test all critical fixes!'); 