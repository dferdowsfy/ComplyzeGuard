/**
 * Simple Sidebar Test
 * Run this in browser console to test sidebar functionality
 */

console.log('🧪 Testing Sidebar Components...');

// Test 1: Check if LeftSidebarPanel class is available
console.log('📋 LeftSidebarPanel class available:', typeof LeftSidebarPanel !== 'undefined');

// Test 2: Check if existing sidebar exists
console.log('📋 Existing sidebar element:', !!document.querySelector('#complyze-sidebar-panel'));
console.log('📋 Existing toggle button:', !!document.querySelector('#complyze-sidebar-toggle'));

// Test 3: Try to create sidebar if it doesn't exist
if (typeof LeftSidebarPanel !== 'undefined') {
  try {
    console.log('🔧 Creating test sidebar...');
    const testSidebar = new LeftSidebarPanel();
    console.log('✅ Sidebar created successfully');
    
    // Test toggle functionality
    if (testSidebar.forceShowToggle) {
      testSidebar.forceShowToggle();
      console.log('✅ Toggle button forced to show');
    }
    
    // Check if toggle is now visible
    setTimeout(() => {
      const toggle = document.querySelector('#complyze-sidebar-toggle');
      if (toggle) {
        const rect = toggle.getBoundingClientRect();
        console.log('📏 Toggle button dimensions:', {
          width: rect.width,
          height: rect.height,
          visible: rect.width > 0 && rect.height > 0
        });
      } else {
        console.error('❌ Toggle button still not found');
      }
    }, 500);
    
    // Make it globally accessible
    window.testSidebar = testSidebar;
    console.log('🌐 Test sidebar available as window.testSidebar');
    
  } catch (error) {
    console.error('❌ Failed to create sidebar:', error);
    console.error('Error stack:', error.stack);
  }
} else {
  console.error('❌ LeftSidebarPanel class not found');
}

// Test 4: Manual toggle creation function
window.createTestToggle = function() {
  console.log('🔧 Creating manual test toggle...');
  
  // Remove existing
  const existing = document.querySelector('#test-toggle');
  if (existing) existing.remove();
  
  const toggle = document.createElement('button');
  toggle.id = 'test-toggle';
  toggle.textContent = '🧪 Test';
  toggle.style.cssText = `
    position: fixed !important;
    top: 100px !important;
    left: 0px !important;
    z-index: 2147483647 !important;
    background: #ff6b6b !important;
    color: white !important;
    padding: 10px !important;
    border: none !important;
    border-radius: 0 8px 8px 0 !important;
    cursor: pointer !important;
  `;
  
  toggle.addEventListener('click', () => {
    console.log('🧪 Test toggle clicked!');
    if (window.testSidebar) {
      window.testSidebar.toggle();
    } else {
      console.log('No test sidebar available');
    }
  });
  
  document.body.appendChild(toggle);
  console.log('✅ Manual test toggle created');
};

console.log('🎯 Available test functions:');
console.log('  - createTestToggle() // creates a manual test button');
console.log('  - window.testSidebar // access the test sidebar instance');
console.log('  - Check console for initialization results'); 