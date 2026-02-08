// Type definitions for storage
interface StorageData {
  moneySaved?: number;
  weeklySaved?: number;
  blockedPurchases?: number;
  totalImpulses?: number;
  impulsesResisted?: number;
}

// Track when user attempts to add to cart (impulse detected)
async function trackImpulse(itemPrice: number, wasBlocked: boolean): Promise<void> {
  const result = await browser.storage.local.get([
    'moneySaved',
    'weeklySaved',
    'blockedPurchases',
    'totalImpulses',
    'impulsesResisted'
  ]) as StorageData;
  
  const currentMoneySaved = result.moneySaved || 0;
  const currentWeeklySaved = result.weeklySaved || 0;
  const currentBlocked = result.blockedPurchases || 0;
  const currentTotal = result.totalImpulses || 0;
  const currentResisted = result.impulsesResisted || 0;

  // Always increment total impulses
  const updates: StorageData = {
    totalImpulses: currentTotal + 1
  };

  // If the purchase was blocked
  if (wasBlocked) {
    updates.blockedPurchases = currentBlocked + 1;
    updates.moneySaved = currentMoneySaved + itemPrice;
    updates.weeklySaved = currentWeeklySaved + itemPrice;
    updates.impulsesResisted = currentResisted + 1;
    
    console.log(`💰 Impulse Guard: Blocked purchase of $${itemPrice.toFixed(2)}`);
  } else {
    console.log(`⚠️ Impulse Guard: Purchase allowed - $${itemPrice.toFixed(2)}`);
  }

  await browser.storage.local.set(updates);
}

// Example: Show confirmation dialog before adding to cart
function interceptCartAddition(): void {
  document.addEventListener('click', async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Customize this selector based on the website
    if (target.matches('.add-to-cart, [data-action="add-to-cart"], button[name="add-to-cart"]')) {
      // Extract price from the product
      const priceElement = target.closest('.product, .item, [data-product]')?.querySelector('.price, .amount, [data-price]');
      const priceText = priceElement?.textContent || '0';
      const itemPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      
      if (itemPrice > 0) {
        // Prevent default action
        event.preventDefault();
        event.stopPropagation();
        
        // Show confirmation dialog
        const confirmed = confirm(
          `💰 Impulse Guard\n\n` +
          `Are you sure you want to buy this item for $${itemPrice.toFixed(2)}?\n\n` +
          `Take a moment to think about it!`
        );
        
        if (confirmed) {
          // User proceeded with purchase
          await trackImpulse(itemPrice, false);
          // Let the purchase go through (you might need to trigger the original action)
        } else {
          // User blocked the purchase
          await trackImpulse(itemPrice, true);
        }
      }
    }
  }, true); // Use capture phase to intercept early
}

// Alternative: Use MutationObserver to watch for cart changes
function observeCartChanges(): void {
  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    mutations.forEach((mutation: MutationRecord) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node: Node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // Customize based on cart structure
            if (element.classList.contains('cart-item') || 
                element.querySelector('.cart-item')) {
              const priceElement = element.querySelector('.item-price, .price');
              const priceText = priceElement?.textContent || '0';
              const itemPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
              
              if (itemPrice > 0) {
                // Item was added to cart without interception
                trackImpulse(itemPrice, false);
              }
            }
          }
        });
      }
    });
  });
  
  // Observe the cart container
  const cartContainer = document.querySelector('.cart, #shopping-cart, [data-cart]');
  if (cartContainer) {
    observer.observe(cartContainer, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize
interceptCartAddition();
observeCartChanges();

console.log('💰 Impulse Guard: Content script loaded');