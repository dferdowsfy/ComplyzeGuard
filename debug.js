// Debug script for ChatGPT testing
// Paste this into the console on ChatGPT to test directly

console.log('🔧 Complyze Debug Script Starting...');

// Test selectors
const testSelectors = {
  inputs: [
    'textarea[data-id="root"]',
    'textarea',
    '[contenteditable="true"]',
    '#prompt-textarea',
    'textarea[placeholder*="Message"]'
  ],
  buttons: [
    'button[data-testid="send-button"]',
    'button[aria-label*="Send"]',
    'button:has(svg)',
    'button[type="submit"]',
    '[data-testid="send-button"]'
  ]
};

console.log('Testing input selectors:');
testSelectors.inputs.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`  ${selector}: ${elements.length} found`, elements);
});

console.log('Testing button selectors:');
testSelectors.buttons.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`  ${selector}: ${elements.length} found`, elements);
});

// Test sensitive data detection
const testPrompt = "my name is john smith and credit card number is 312419208323 and cc is 312491028410";

const patterns = {
  creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g
};

console.log('Testing pattern detection:');
console.log('Test prompt:', testPrompt);

Object.entries(patterns).forEach(([type, pattern]) => {
  const matches = testPrompt.match(pattern);
  console.log(`  ${type}:`, matches);
});

// Test direct button click interception
function addTestListener() {
  const buttons = document.querySelectorAll('button');
  console.log(`Adding test listeners to ${buttons.length} buttons`);
  
  buttons.forEach((button, index) => {
    button.addEventListener('click', (e) => {
      console.log(`Button ${index} clicked:`, button, e);
      
      // Test if this is a send button
      const isSendButton = button.textContent.includes('Send') || 
                          button.getAttribute('aria-label')?.includes('Send') ||
                          button.dataset.testid === 'send-button' ||
                          button.querySelector('svg');
      
      if (isSendButton) {
        console.log('🚨 SEND BUTTON DETECTED! Preventing...', button);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        alert('Complyze: Send blocked by debug script!');
        return false;
      }
    }, true);
  });
}

// Add test listeners
addTestListener();

console.log('🔧 Debug script loaded. Try clicking send button now!'); 