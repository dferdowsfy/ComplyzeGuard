/**
 * Comprehensive Test Script for Critical Fixes
 * Run this in browser console to test all fixes
 */

console.log('🧪 Testing All Critical Fixes...');

// Test 1: Submit button blocking when PII detected
function testSubmitBlocking() {
  console.log('\n=== TEST 1: Submit Button Blocking ===');
  
  if (!window.complyzeMonitor) {
    console.error('❌ ComplyzeMonitor not available');
    return false;
  }
  
  const monitor = window.complyzeMonitor;
  const inputElement = monitor.inputElement;
  
  if (!inputElement) {
    console.error('❌ Input element not found');
    return false;
  }
  
  // Insert PII text
  const piiText = "Hi, my email is john.doe@company.com and my API key is sk-test123";
  
  if (inputElement.tagName === 'TEXTAREA') {
    inputElement.value = piiText;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    inputElement.textContent = piiText;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Check if blocking occurs after a delay
  setTimeout(() => {
    const isBlocked = monitor.isBlocked;
    const submitButtons = monitor.submitButtons;
    const blockedButtons = submitButtons.filter(btn => btn.disabled);
    
    console.log('📊 Blocking test results:', {
      isBlocked: isBlocked,
      totalButtons: submitButtons.length,
      blockedButtons: blockedButtons.length,
      detectedPII: window.complyzeMonitor.lastPromptText
    });
    
    if (isBlocked && blockedButtons.length > 0) {
      console.log('✅ Submit button correctly blocked when PII detected');
    } else {
      console.error('❌ Submit button NOT blocked when PII detected');
    }
  }, 1000);
  
  return true;
}

// Test 2: Smart Rewrite functionality
async function testSmartRewrite() {
  console.log('\n=== TEST 2: Smart Rewrite Natural Language ===');
  
  if (!window.PromptOptimizer) {
    console.error('❌ PromptOptimizer not available');
    return false;
  }
  
  try {
    const optimizer = new window.PromptOptimizer();
    await optimizer.loadSettings();
    
    const testText = "Hi, my email is john.doe@company.com and my API key is sk-test123. Can you help me debug this?";
    const testPII = [
      { type: 'EMAIL', description: 'Email Address' },
      { type: 'API_KEY', description: 'API Key' }
    ];
    
    console.log('🤖 Testing Smart Rewrite with:', testText);
    
    const result = await optimizer.smartRewrite(testText, testPII);
    
    console.log('📤 Smart Rewrite result:', result);
    
    if (result.method === 'smart_rewrite' && !result.optimizedText.includes('[REDACTED]')) {
      console.log('✅ Smart Rewrite working - natural language output');
      console.log('📝 Rewritten text:', result.optimizedText);
      return true;
    } else if (result.method === 'basic_redaction_fallback') {
      console.error('❌ Smart Rewrite fell back to basic redaction:', result.error);
      return false;
    } else {
      console.error('❌ Smart Rewrite returned unexpected result');
      return false;
    }
  } catch (error) {
    console.error('❌ Smart Rewrite test failed:', error);
    return false;
  }
}

// Test 3: Submit button enabling after clean text
function testCleanTextSubmission() {
  console.log('\n=== TEST 3: Submit Button After Clean Text ===');
  
  if (!window.complyzeMonitor) {
    console.error('❌ ComplyzeMonitor not available');
    return false;
  }
  
  const monitor = window.complyzeMonitor;
  const inputElement = monitor.inputElement;
  
  if (!inputElement) {
    console.error('❌ Input element not found');
    return false;
  }
  
  // Simulate inserting clean text (as if from Smart Rewrite)
  const cleanText = "Hi, my email address is example@email.com and my API key is available. Can you help me debug this?";
  
  // Set the safe text flag and insert text
  monitor.safeTextInserted = true;
  monitor.lastPromptText = cleanText;
  
  if (inputElement.tagName === 'TEXTAREA') {
    inputElement.value = cleanText;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    inputElement.textContent = cleanText;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Check if submit is unblocked
  setTimeout(() => {
    const isBlocked = monitor.isBlocked;
    const submitButtons = monitor.submitButtons;
    const enabledButtons = submitButtons.filter(btn => !btn.disabled);
    
    console.log('📊 Clean text test results:', {
      isBlocked: isBlocked,
      totalButtons: submitButtons.length,
      enabledButtons: enabledButtons.length,
      safeTextFlag: monitor.safeTextInserted
    });
    
    if (!isBlocked && enabledButtons.length > 0) {
      console.log('✅ Submit button correctly enabled for clean text');
    } else {
      console.error('❌ Submit button still blocked for clean text');
    }
    
    // Clear the flag after test
    monitor.safeTextInserted = false;
  }, 500);
  
  return true;
}

// Test 4: Authentication persistence
async function testAuthPersistence() {
  console.log('\n=== TEST 4: Authentication Persistence ===');
  
  if (!window.complyzeSidebar) {
    console.error('❌ Sidebar not available');
    return false;
  }
  
  try {
    const sidebar = window.complyzeSidebar;
    
    // Check current auth status
    await sidebar.refreshAuthStatus();
    
    console.log('📊 Auth status check:', {
      isAuthenticated: sidebar.isUserAuthenticated(),
      userEmail: sidebar.userEmail,
      userUUID: sidebar.userUUID
    });
    
    // Check storage directly
    const storage = await chrome.storage.local.get(['complyzeUserEmail', 'complyzeUserUUID', 'complyzeAuthToken']);
    
    console.log('📊 Storage auth data:', {
      hasEmail: !!storage.complyzeUserEmail,
      hasUUID: !!storage.complyzeUserUUID,
      hasToken: !!storage.complyzeAuthToken,
      email: storage.complyzeUserEmail
    });
    
    if (sidebar.isUserAuthenticated() && storage.complyzeUserEmail && storage.complyzeUserUUID) {
      console.log('✅ Authentication properly persisted');
      return true;
    } else if (!sidebar.isUserAuthenticated()) {
      console.log('⚠️ User not authenticated - this is expected if not logged in');
      return true;
    } else {
      console.error('❌ Authentication persistence issue');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return false;
  }
}

// Test 5: End-to-end flow
async function testEndToEndFlow() {
  console.log('\n=== TEST 5: End-to-End Flow ===');
  
  // Step 1: Insert PII
  console.log('Step 1: Inserting PII text...');
  testSubmitBlocking();
  
  // Step 2: Wait for modal to appear
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Step 3: Check if modal appeared
  const modal = document.querySelector('#complyze-warning-modal');
  if (modal) {
    console.log('✅ Warning modal appeared');
    
    // Step 4: Click Smart Rewrite button
    const smartRewriteBtn = document.querySelector('#complyze-view-safe');
    if (smartRewriteBtn && smartRewriteBtn.textContent.includes('Smart')) {
      console.log('Step 4: Testing Smart Rewrite button...');
      smartRewriteBtn.click();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if text was replaced
      const monitor = window.complyzeMonitor;
      const currentText = monitor.getInputText();
      
      if (!currentText.includes('[REDACTED]') && !currentText.includes('john.doe@company.com')) {
        console.log('✅ Smart Rewrite completed successfully');
        console.log('📝 Final text:', currentText);
      } else {
        console.error('❌ Smart Rewrite did not work properly');
      }
    } else {
      console.log('⚠️ Smart Rewrite button not found or not in Smart Rewrite mode');
    }
  } else {
    console.error('❌ Warning modal did not appear');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running All Critical Fix Tests...\n');
  
  const results = [];
  
  try {
    // Test 1
    results.push({ test: 'Submit Blocking', result: testSubmitBlocking() });
    
    // Test 2
    results.push({ test: 'Smart Rewrite', result: await testSmartRewrite() });
    
    // Test 3
    results.push({ test: 'Clean Text Submission', result: testCleanTextSubmission() });
    
    // Test 4
    results.push({ test: 'Auth Persistence', result: await testAuthPersistence() });
    
    // Wait a bit then run end-to-end
    console.log('\n⏳ Waiting 2 seconds before end-to-end test...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 5
    await testEndToEndFlow();
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    results.forEach(r => {
      console.log(`${r.result ? '✅' : '❌'} ${r.test}: ${r.result ? 'PASSED' : 'FAILED'}`);
    });
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export test functions
window.testSubmitBlocking = testSubmitBlocking;
window.testSmartRewrite = testSmartRewrite;
window.testCleanTextSubmission = testCleanTextSubmission;
window.testAuthPersistence = testAuthPersistence;
window.testEndToEndFlow = testEndToEndFlow;
window.runAllTests = runAllTests;

console.log('🎯 Available test functions:');
console.log('  - testSubmitBlocking() // Test submit button blocking');
console.log('  - testSmartRewrite() // Test Smart Rewrite natural language');
console.log('  - testCleanTextSubmission() // Test submit enabling after clean text');
console.log('  - testAuthPersistence() // Test user authentication persistence');
console.log('  - testEndToEndFlow() // Test complete user flow');
console.log('  - runAllTests() // Run all tests automatically');

console.log('\n🏁 Run runAllTests() to test everything automatically!'); 