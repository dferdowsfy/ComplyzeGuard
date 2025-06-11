document.addEventListener('DOMContentLoaded', function() {
  const loginButton = document.getElementById('login');
  const smartRewriteButton = document.getElementById('smart-rewrite');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const authContainer = document.getElementById('auth-container');
  const redactionContainer = document.getElementById('redaction-container');

  // Check if user is authenticated
  chrome.storage.local.get(['complyze_access_token'], function(result) {
    if (result.complyze_access_token) {
      authContainer.style.display = 'none';
      redactionContainer.style.display = 'block';
    } else {
      authContainer.style.display = 'block';
      redactionContainer.style.display = 'none';
    }
  });

  loginButton.addEventListener('click', function() {
    const email = emailInput.value;
    const password = passwordInput.value;

    chrome.runtime.sendMessage({ type: 'SUPABASE_LOGIN', payload: { email, password } }, function(response) {
      if (response.success) {
        authContainer.style.display = 'none';
        redactionContainer.style.display = 'block';
      } else {
        alert('Login failed: ' + response.error);
      }
    });
  });

  smartRewriteButton.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PROMPT' }, function(response) {
        if (response && response.prompt) {
          chrome.runtime.sendMessage({ type: 'OPTIMIZE_PROMPT', prompt: response.prompt }, function(optimizationResponse) {
            if (optimizationResponse.success) {
              chrome.tabs.sendMessage(tabs[0].id, { type: 'SET_PROMPT', prompt: optimizationResponse.optimizedPrompt });
            } else {
              alert('Smart Rewrite failed: ' + optimizationResponse.error);
            }
          });
        } else {
          alert('Could not get the prompt from the page.');
        }
      });
    });
  });
});
