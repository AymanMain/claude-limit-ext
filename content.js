// content.js — Runs on claude.ai, detects message activity

let lastMessageCount = 0;

function countHumanMessages() {
  // Claude.ai renders human messages with specific aria roles or data attrs
  const selectors = [
    '[data-testid="human-turn"]',
    '.human-turn',
    '[class*="HumanTurn"]',
    '[class*="human-turn"]'
  ];

  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) return els.length;
  }

  // Fallback: look for the structured message containers
  const allTurns = document.querySelectorAll('[class*="Turn"], [class*="Message"]');
  let count = 0;
  allTurns.forEach(el => {
    const text = el.getAttribute('class') || '';
    if (text.toLowerCase().includes('human') || text.toLowerCase().includes('user')) count++;
  });
  return count;
}

function checkForLimitMessage() {
  const bodyText = document.body.innerText || '';
  const limitPhrases = [
    "usage limit",
    "you've reached",
    "reached your limit",
    "rate limit",
    "too many requests",
    "plan's usage"
  ];
  return limitPhrases.some(p => bodyText.toLowerCase().includes(p));
}

// MutationObserver: fires when new messages appear in the DOM
const observer = new MutationObserver(() => {
  const count = countHumanMessages();

  if (count > lastMessageCount) {
    const delta = count - lastMessageCount;
    lastMessageCount = count;
    chrome.runtime.sendMessage({ type: 'MESSAGES_SENT', delta, total: count });
  }

  if (checkForLimitMessage()) {
    chrome.runtime.sendMessage({ type: 'LIMIT_HIT' });
  }
});

// Start observing once DOM is ready
function startObserver() {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  // Initial count
  lastMessageCount = countHumanMessages();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver);
} else {
  startObserver();
}

// Listen for page navigation (SPA) — re-sync message count after route change
let lastHref = location.href;
const navObserver = new MutationObserver(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    setTimeout(() => {
      lastMessageCount = countHumanMessages();
    }, 1500);
  }
});
navObserver.observe(document.querySelector('head') || document.documentElement, {
  childList: true,
  subtree: true
});

// Relay page visibility to background (for session awareness)
document.addEventListener('visibilitychange', () => {
  chrome.runtime.sendMessage({
    type: 'PAGE_VISIBILITY',
    visible: document.visibilityState === 'visible'
  });
});

chrome.runtime.sendMessage({ type: 'CONTENT_READY', url: location.href });
