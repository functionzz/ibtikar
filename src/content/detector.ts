import { trackBlockedPurchase } from './storage';

const ADD_TO_CART_XPATH = '//*[@id="test"]/button';
// XPath for price - adjust based on Best Buy's actual structure
const PRICE_XPATH = '//span[@data-testid="customer-price"]//span[contains(@class, "priceView-hero-price")]';

function getElementByXPath(xpath: string): Element | null {
  const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return result.singleNodeValue as Element | null;
}

function getCurrentItemId(): string {
  // Use the current URL as a unique identifier for this product
  return window.location.href;
}

async function getItemPrice(): Promise<number> {
  // Try to get price using XPath
  const priceElement = getElementByXPath(PRICE_XPATH);
  
  if (priceElement) {
    const priceText = priceElement.textContent || '0';
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    if (price > 0) return price;
  }
  
  // Fallback: try common price selectors
  const fallbackSelectors = [
    '[data-testid="customer-price"]',
    '.priceView-hero-price',
    '.priceView-customer-price',
    '[class*="price"]'
  ];
  
  for (const selector of fallbackSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const priceText = element.textContent || '0';
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      if (price > 0) return price;
    }
  }
  
  console.warn('⚠️ Impulse Guard: Could not find price');
  return 0;
}

function showOverlay(itemPrice: number, isNewBlock: boolean) {
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
        <p style="color: #1a1a1a; margin: 0 0 16px; font-size: 16px;">
          ${isNewBlock 
            ? 'This looks like an impulse purchase.<br>Come back in <strong>24 hours</strong> if you still want it.'
            : 'You already blocked this item!<br>Still want it? Come back in <strong>24 hours</strong>.'}
        </p>
        ${itemPrice > 0 && isNewBlock ? `
        <div style="
          background: #dcfce7;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        ">
          <p style="margin: 0; color: #16a34a; font-weight: bold; font-size: 18px;">
            💰 You just saved $${itemPrice.toFixed(2)}!
          </p>
        </div>
        ` : ''}
        ${!isNewBlock ? `
        <div style="
          background: #fef3c7;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        ">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            ℹ️ Already saved from this item
          </p>
        </div>
        ` : ''}
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

document.addEventListener('click', async (event) => {
  try {
    const target = event.target as HTMLElement;
    const addToCartButton = getElementByXPath(ADD_TO_CART_XPATH);

    if (addToCartButton && addToCartButton.contains(target)) {
      event.preventDefault();
      event.stopPropagation();
      
      // Get the price and item ID
      const itemPrice = await getItemPrice();
      const itemId = getCurrentItemId();
      
      // Track the blocked purchase (returns false if already blocked)
      const isNewBlock = await trackBlockedPurchase(itemPrice, itemId);
      
      // Show overlay
      showOverlay(itemPrice, isNewBlock);
    }
  } catch (e) {
    console.error('[Impulse Guard] Error:', e);
  }
}, true);

console.log('[Impulse Guard] Content script loaded');