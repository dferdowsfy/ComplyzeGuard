chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'GET_PROMPT') {
    const promptElement = document.querySelector('textarea');
    if (promptElement) {
      sendResponse({ prompt: promptElement.value });
    } else {
      sendResponse({ prompt: null });
    }
  } else if (request.type === 'SET_PROMPT') {
    const promptElement = document.querySelector('textarea');
    if (promptElement) {
      promptElement.value = request.prompt;
    }
  }
});
