console.log('🏭 Loading PromptOptimizer for production testing...');

// Load PromptOptimizer
const script = document.createElement('script');
script.src = 'promptOptimizer.js';
script.onload = async () => {
  console.log('📦 PromptOptimizer loaded, starting tests...');
  
  try {
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Run production test
    const result = await window.testPromptOptimizerProduction();
    console.log('\n🎯 FINAL TEST RESULT:', result);
    
    if (result.allTestsPassed) {
      console.log('\n🎉 ALL SYSTEMS READY FOR PRODUCTION!');
      console.log('✅ Storage Manager: Working');
      console.log('✅ OpenRouter API: Connected');
      console.log('✅ Smart Rewrite: Functional');
      console.log('✅ Supabase Logging: Active');
    } else {
      console.log('\n❌ SOME SYSTEMS NEED ATTENTION');
      console.log('Storage:', result.storageWorking ? '✅' : '❌');
      console.log('API:', result.apiConnected ? '✅' : '❌');
      console.log('Smart Rewrite:', result.smartRewriteWorking ? '✅' : '❌');
      console.log('Supabase:', result.supabaseLogging ? '✅' : '❌');
    }
    
  } catch (error) {
    console.error('❌ Production test execution failed:', error);
  }
};

script.onerror = (error) => {
  console.error('❌ Failed to load PromptOptimizer:', error);
};

document.head.appendChild(script); 