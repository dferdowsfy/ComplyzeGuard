/**
 * Test Toggle Button Hide/Show Functionality
 * Verifies that the toggle button is hidden when sidebar is open
 */

console.log('🔧 Loading Toggle Hide Test...');

// Test function to verify toggle button hide/show behavior
window.testToggleHide = function() {
  console.log('🧪 TESTING TOGGLE BUTTON HIDE/SHOW');
  console.log('=' + '='.repeat(35));
  
  const sidebar = window.complyzeSidebar;
  const toggle = document.querySelector('#complyze-sidebar-toggle');
  
  if (!sidebar) {
    console.error('❌ Sidebar not found');
    return false;
  }
  
  if (!toggle) {
    console.error('❌ Toggle button not found');
    return false;
  }
  
  console.log('✅ Initial state:', {
    sidebarOpen: sidebar.isOpen,
    toggleVisible: getComputedStyle(toggle).display !== 'none',
    toggleOpacity: getComputedStyle(toggle).opacity
  });
  
  // Test 1: Open sidebar
  console.log('\n1️⃣ Opening sidebar...');
  sidebar.open();
  
  setTimeout(() => {
    const toggleAfterOpen = {
      display: getComputedStyle(toggle).display,
      visibility: getComputedStyle(toggle).visibility,
      opacity: getComputedStyle(toggle).opacity,
      pointerEvents: getComputedStyle(toggle).pointerEvents
    };
    
    console.log('📊 Toggle state after opening:', toggleAfterOpen);
    
    const hiddenCorrectly = (
      toggleAfterOpen.display === 'none' &&
      toggleAfterOpen.visibility === 'hidden' &&
      toggleAfterOpen.opacity === '0'
    );
    
    if (hiddenCorrectly) {
      console.log('✅ Toggle button correctly hidden when sidebar is open');
    } else {
      console.error('❌ Toggle button not properly hidden when sidebar is open');
    }
    
    // Test 2: Close sidebar
    console.log('\n2️⃣ Closing sidebar...');
    sidebar.close();
    
    setTimeout(() => {
      const toggleAfterClose = {
        display: getComputedStyle(toggle).display,
        visibility: getComputedStyle(toggle).visibility,
        opacity: getComputedStyle(toggle).opacity,
        pointerEvents: getComputedStyle(toggle).pointerEvents
      };
      
      console.log('📊 Toggle state after closing:', toggleAfterClose);
      
      const shownCorrectly = (
        toggleAfterClose.display === 'block' &&
        toggleAfterClose.visibility === 'visible' &&
        toggleAfterClose.opacity === '1'
      );
      
      if (shownCorrectly) {
        console.log('✅ Toggle button correctly shown when sidebar is closed');
      } else {
        console.error('❌ Toggle button not properly shown when sidebar is closed');
      }
      
      // Summary
      console.log('\n📋 TEST SUMMARY:');
      console.log(`  Hide when open: ${hiddenCorrectly ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`  Show when closed: ${shownCorrectly ? '✅ PASS' : '❌ FAIL'}`);
      
      const overallPass = hiddenCorrectly && shownCorrectly;
      console.log(`\n🎯 Overall Result: ${overallPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
      
      return overallPass;
      
    }, 500); // Wait for animation
    
  }, 500); // Wait for animation
};

// Quick manual test functions
window.showToggle = function() {
  const toggle = document.querySelector('#complyze-sidebar-toggle');
  if (toggle && window.complyzeSidebar) {
    if (!window.complyzeSidebar.isOpen) {
      window.complyzeSidebar.forceShowToggle();
      console.log('👁️ Toggle button forced visible (sidebar is closed)');
    } else {
      console.log('⚠️ Cannot show toggle - sidebar is currently open');
    }
  } else {
    console.error('❌ Toggle button or sidebar not found');
  }
};

window.hideToggle = function() {
  const toggle = document.querySelector('#complyze-sidebar-toggle');
  if (toggle) {
    toggle.style.cssText = `
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    `;
    console.log('🙈 Toggle button manually hidden');
  } else {
    console.error('❌ Toggle button not found');
  }
};

window.toggleSidebar = function() {
  if (window.complyzeSidebar) {
    window.complyzeSidebar.toggle();
    console.log('🔄 Sidebar toggled');
  } else {
    console.error('❌ Sidebar not found');
  }
};

console.log('✅ Toggle Hide Test loaded!');
console.log('');
console.log('🧪 Available test functions:');
console.log('  - testToggleHide() - Test hide/show behavior');
console.log('  - showToggle() - Manually show toggle');
console.log('  - hideToggle() - Manually hide toggle');
console.log('  - toggleSidebar() - Toggle sidebar open/close');
console.log('');
console.log('🚀 Run testToggleHide() to test the functionality!'); 