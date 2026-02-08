// Content script for Best Buy

const ADD_TO_CART_XPATH = '//*[@id="test"]/button';

function getElementByXPath(xpath: string): Element | null {
  const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return result.singleNodeValue as Element | null;
}

function showOverlay() {
  // Remove existing overlay if any
  const existing = document.getElementById('impulse-guard-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'impulse-guard-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    ">
      <div style="
        background: #fefdf8;
        padding: 32px;
        border-radius: 16px;
        max-width: 400px;
        text-align: center;
        font-family: system-ui, sans-serif;
        box-shadow: 0 4px 24px rgba(0,0,0,0.3);
      ">
        <h2 style="color: #16a34a; margin: 0 0 16px; font-size: 24px;">🛑 Impulse Guard</h2>
        <p style="color: #1a1a1a; margin: 0 0 24px; font-size: 16px;">
          This looks like an impulse purchase.<br>
          Come back in <strong>24 hours</strong> if you still want it.
        </p>
        <button id="impulse-guard-close" style="
          background: #16a34a;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        ">I understand</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('impulse-guard-close')?.addEventListener('click', () => {
    overlay.remove();
  });
}

document.addEventListener('click', (event) => {
  try {
    const target = event.target as HTMLElement;
    const addToCartButton = getElementByXPath(ADD_TO_CART_XPATH);

    if (addToCartButton && addToCartButton.contains(target)) {
      event.preventDefault();
      event.stopPropagation();
      showOverlay();
    }
  } catch (e) {
    console.error('[Impulse Guard] Error:', e);
  }
}, true);

console.log('[Impulse Guard] Content script loaded');
