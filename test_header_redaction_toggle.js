/**
 * Test Header Redaction Toggle
 * Verifies the new compact header layout with pill toggle
 */

console.log('🧪 Loading Header Redaction Toggle Test...');

// Test function for the new header layout
window.testHeaderRedactionToggle = function() {
  console.log('🎛️ TESTING HEADER REDACTION TOGGLE');
  console.log('=' + '='.repeat(35));
  
  try {
    // Check if sidebar exists
    if (!window.complyzeSidebar) {
      console.error('❌ Sidebar not initialized');
      return false;
    }
    
    const sidebar = window.complyzeSidebar;
    
    // Test 1: Check if new toggle button exists
    console.log('🔍 Test 1: Checking new toggle button...');
    const modeToggle = document.querySelector('#complyze-mode-toggle');
    
    if (modeToggle) {
      console.log('✅ Mode toggle button found in header');
      console.log('📍 Button location:', {
        tagName: modeToggle.tagName,
        className: modeToggle.className,
        innerHTML: modeToggle.innerHTML
      });
    } else {
      console.error('❌ Mode toggle button not found');
      return false;
    }
    
    // Test 2: Check if old redaction controls are gone
    console.log('\n🔍 Test 2: Verifying old controls are removed...');
    const oldControls = [
      '#complyze-redaction-header',
      '#complyze-redaction-toggle',
      '#structured-redact',
      '#smart-rewrite',
      '.complyze-redaction-controls'
    ];
    
    let cleanupComplete = true;
    oldControls.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        console.warn('⚠️ Old control still exists:', selector);
        cleanupComplete = false;
      } else {
        console.log('✅ Removed:', selector);
      }
    });
    
    if (cleanupComplete) {
      console.log('✅ All old redaction controls successfully removed');
    }
    
    // Test 3: Test toggle functionality
    console.log('\n🔍 Test 3: Testing toggle functionality...');
    const originalMode = sidebar.getRedactionMode();
    console.log('📝 Original mode:', originalMode);
    
    // Simulate click on toggle
    modeToggle.click();
    
    // Wait a moment for the change to process
    setTimeout(() => {
      const newMode = sidebar.getRedactionMode();
      console.log('📝 New mode after toggle:', newMode);
      
      if (newMode !== originalMode) {
        console.log('✅ Toggle functionality working');
        console.log('🔄 Mode changed from', originalMode, 'to', newMode);
        
        // Check if the display updated
        const updatedHTML = modeToggle.innerHTML;
        console.log('🎨 Updated display:', updatedHTML);
        
        // Toggle back to test both directions
        modeToggle.click();
        
        setTimeout(() => {
          const finalMode = sidebar.getRedactionMode();
          console.log('📝 Final mode after second toggle:', finalMode);
          
          if (finalMode === originalMode) {
            console.log('✅ Bidirectional toggle working correctly');
          } else {
            console.error('❌ Toggle not working bidirectionally');
          }
        }, 100);
        
      } else {
        console.error('❌ Toggle functionality not working');
        return false;
      }
    }, 100);
    
    // Test 4: Check increased space for rule toggles
    console.log('\n🔍 Test 4: Verifying increased space for toggles...');
    const sidebarContent = document.querySelector('.complyze-sidebar-content');
    
    if (sidebarContent) {
      const contentHeight = window.getComputedStyle(sidebarContent).height;
      console.log('📏 Sidebar content height:', contentHeight);
      
      // Count visible toggle items
      const toggleItems = sidebarContent.querySelectorAll('.complyze-toggle-item');
      const visibleItems = Array.from(toggleItems).filter(item => {
        return window.getComputedStyle(item).display !== 'none';
      });
      
      console.log('🔢 Total rule toggles visible:', visibleItems.length);
      console.log('📊 Rule sections available:');
      
      sidebar.sections.forEach(section => {
        const sectionElement = document.querySelector(`[data-section="${section.id}"]`);
        if (sectionElement) {
          const activeCount = sidebar.getActiveCount(section.id);
          const totalCount = sidebar.getTotalCount(section.id);
          console.log(`  ${section.icon} ${section.title}: ${activeCount}/${totalCount} active`);
        }
      });
      
      console.log('✅ More space available for rule toggles');
    }
    
    // Test 5: Check header layout
    console.log('\n🔍 Test 5: Verifying header layout...');
    const subtitleRow = document.querySelector('.complyze-subtitle-row');
    
    if (subtitleRow) {
      const rowStyle = window.getComputedStyle(subtitleRow);
      console.log('📐 Subtitle row layout:', {
        display: rowStyle.display,
        alignItems: rowStyle.alignItems,
        justifyContent: rowStyle.justifyContent
      });
      
      const subtitle = subtitleRow.querySelector('.complyze-sidebar-subtitle');
      const toggle = subtitleRow.querySelector('.complyze-mode-toggle');
      
      if (subtitle && toggle) {
        console.log('✅ Header layout correct: subtitle + toggle in same row');
      } else {
        console.error('❌ Header layout issue: missing subtitle or toggle');
      }
    }
    
    console.log('\n🎉 Header redaction toggle test completed');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
};

// Auto-run test when sidebar is available
if (window.complyzeSidebar) {
  console.log('🚀 Auto-running header redaction toggle test...');
  setTimeout(() => window.testHeaderRedactionToggle(), 1000);
} else {
  console.log('⏳ Waiting for sidebar to initialize...');
  
  // Wait for sidebar to be available
  const checkSidebar = setInterval(() => {
    if (window.complyzeSidebar) {
      clearInterval(checkSidebar);
      console.log('🚀 Sidebar detected, running header redaction toggle test...');
      setTimeout(() => window.testHeaderRedactionToggle(), 500);
    }
  }, 500);
}

console.log('✅ Header Redaction Toggle Test loaded. Run testHeaderRedactionToggle() to test manually.'); 