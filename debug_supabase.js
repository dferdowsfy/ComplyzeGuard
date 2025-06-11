/**
 * Supabase User Sync Debug Tool
 * Specifically for fixing user recognition and table sync issues
 */

console.log('🔧 Loading Supabase Debug Tool...');

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
    
    // Generate UUID based on email
    const generateUserUUID = async (email) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(email + 'complyze-salt');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      
      const uuid = [
        hashArray.slice(0, 4),
        hashArray.slice(4, 6),
        hashArray.slice(6, 8),
        hashArray.slice(8, 10),
        hashArray.slice(10, 16)
      ].map(arr => 
        Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('')
      ).join('-');
      
      return uuid;
    };
    
    const newUUID = await generateUserUUID(storage.complyzeUserEmail);
    
    await chrome.storage.local.set({ complyzeUserUUID: newUUID });
    
    if (window.complyzeSidebar) {
      window.complyzeSidebar.userUUID = newUUID;
    }
    
    console.log('✅ UUID generated and stored:', newUUID);
    console.log('🔄 Run debugSupabaseUserSync() to verify fix');
    return true;
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return false;
  }
};

// Force re-login to ensure proper UUID generation
window.forceRelogin = async function() {
  console.log('🔄 FORCING RE-LOGIN...');
  
  try {
    // Clear existing auth data
    await chrome.storage.local.remove(['complyzeUserUUID', 'complyzeUserEmail', 'complyzeAuthToken']);
    
    if (window.complyzeSidebar) {
      window.complyzeSidebar.isAuthenticated = false;
      window.complyzeSidebar.userEmail = null;
      window.complyzeSidebar.userUUID = null;
      window.complyzeSidebar.updateAuthUI();
    }
    
    console.log('✅ Authentication cleared');
    console.log('💡 Please login again through the sidebar with your credentials');
    console.log('💡 The new login process will generate a proper UUID automatically');
    
  } catch (error) {
    console.error('❌ Re-login preparation failed:', error);
  }
};

console.log('✅ Supabase Debug Tool loaded!');
console.log('');
console.log('🔧 Available debug functions:');
console.log('  - debugSupabaseUserSync() - Complete diagnosis');
console.log('  - fixMissingUUID() - Generate UUID for authenticated users');
console.log('  - forceRelogin() - Clear auth and force fresh login');
console.log('');
console.log('💡 If you see "User UUID: undefined", run fixMissingUUID() first!'); 