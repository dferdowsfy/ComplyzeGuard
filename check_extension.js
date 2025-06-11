// Complyze Extension Debug Script
// Run this in the browser console on ChatGPT to debug issues

console.log('🔍 Complyze Extension Debug Check');
console.log('=====================================');

// Check if content script loaded
console.log('1. Content Script Loaded:', typeof window.debugComplyzeExtension === 'function');

// Check if LeftSidebarPanel class is available
console.log('2. LeftSidebarPanel Available:', typeof LeftSidebarPanel !== 'undefined');

// Check if monitor is initialized
console.log('3. Monitor Initialized:', !!window.complyzeMonitor);

// Check if sidebar is initialized
console.log('4. Sidebar Initialized:', !!window.complyzeSidebar);

// Check if sidebar elements exist in DOM
console.log('5. Sidebar Toggle Button:', !!document.querySelector('#complyze-sidebar-toggle'));
console.log('6. Sidebar Panel:', !!document.querySelector('#complyze-sidebar-panel'));

// Check current URL
console.log('7. Current URL:', window.location.href);

// Check if extension matches current site
const isMatchingSite = window.location.href.includes('chatgpt.com') || 
                      window.location.href.includes('claude.ai') || 
                      window.location.href.includes('gemini.google.com');
console.log('8. Matching Site:', isMatchingSite);

// Try to manually create sidebar if available
if (typeof LeftSidebarPanel !== 'undefined' && !window.complyzeSidebar) {
    console.log('9. Attempting manual sidebar creation...');
    try {
        window.complyzeSidebar = new LeftSidebarPanel();
        console.log('✅ Manual sidebar creation successful!');
    } catch (error) {
        console.error('❌ Manual sidebar creation failed:', error);
    }
}

// Final check
setTimeout(() => {
    const toggleExists = !!document.querySelector('#complyze-sidebar-toggle');
    console.log('10. Final Toggle Check:', toggleExists);
    
    if (toggleExists) {
        console.log('✅ SUCCESS: Gear icon should be visible on the left side of the screen!');
    } else {
        console.log('❌ ISSUE: Gear icon not found. Try running: forceInitializeComplyzeSidebar()');
    }
}, 1000); 