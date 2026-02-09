export interface StorageData {
  moneySaved: number;
  weeklySaved: number;
  blockedPurchases: number;
  totalImpulses: number;
  impulsesResisted: number;
  blockedItems: string[];
  count: number;
}

const DEFAULT_STORAGE: StorageData = {
  moneySaved: 0,
  weeklySaved: 0,
  blockedPurchases: 0,
  totalImpulses: 0,
  impulsesResisted: 0,
  blockedItems: [],
  count: 0
};

/**
 * Get all storage data
 */
export async function getStorageData(): Promise<StorageData> {
  const result = await chrome.storage.local.get(Object.keys(DEFAULT_STORAGE));
  return { ...DEFAULT_STORAGE, ...result } as StorageData;
}

/**
 * Update storage with partial data
 */
export async function updateStorage(updates: Partial<StorageData>): Promise<void> {
  await chrome.storage.local.set(updates);
}

/**
 * Track a blocked purchase - increments all relevant stats
 */
export async function trackBlockedPurchase(itemPrice: number, itemId: string): Promise<boolean> {
  const data = await getStorageData();
  
  // Check if this item was already blocked
  if (data.blockedItems.includes(itemId)) {
    console.log('⚠️ Impulse Guard: Item already blocked - not counting again');
    
    // Still increment total impulses (user tried again)
    await updateStorage({
      totalImpulses: data.totalImpulses + 1
    });
    
    return false; // Item was already blocked
  }
  
  // Item is NEW - update all stats
  await updateStorage({
    moneySaved: data.moneySaved + itemPrice,
    weeklySaved: data.weeklySaved + itemPrice,
    blockedPurchases: data.blockedPurchases + 1,
    totalImpulses: data.totalImpulses + 1,
    impulsesResisted: data.impulsesResisted + 1,
    blockedItems: [...data.blockedItems, itemId]
  });
  
  console.log(`💰 Impulse Guard: Blocked NEW purchase - Saved $${itemPrice.toFixed(2)}`);
  console.log(`📊 Stats - Total: $${(data.moneySaved + itemPrice).toFixed(2)}, Blocked: ${data.blockedPurchases + 1}, Success: ${Math.round(((data.blockedPurchases + 1) / (data.totalImpulses + 1)) * 100)}%`);
  
  return true; // New item blocked
}

/**
 * Track an allowed purchase (user proceeded despite warning)
 */
export async function trackAllowedPurchase(): Promise<void> {
  const data = await getStorageData();
  
  // Only increment total impulses (they tried to resist but failed)
  await updateStorage({
    totalImpulses: data.totalImpulses + 1
  });
  
  console.log(`⚠️ Impulse Guard: Purchase allowed`);
  console.log(`📊 Stats - Success rate: ${Math.round((data.blockedPurchases / (data.totalImpulses + 1)) * 100)}%`);
}

/**
 * Get current success rate
 */
export async function getSuccessRate(): Promise<number> {
  const data = await getStorageData();
  return data.totalImpulses > 0 
    ? Math.round((data.blockedPurchases / data.totalImpulses) * 100) 
    : 0;
}

/**
 * Reset weekly stats (call this once a week)
 */
export async function resetWeeklyStats(): Promise<void> {
  await updateStorage({
    weeklySaved: 0
  });
  console.log('🔄 Impulse Guard: Weekly stats reset');
}

/**
 * Clear all blocked items (useful for testing or if user wants a fresh start)
 */
export async function clearBlockedItems(): Promise<void> {
  await updateStorage({
    blockedItems: []
  });
  console.log('🗑️ Impulse Guard: Blocked items cleared');
}

/**
 * Reset all stats
 */
export async function resetAllStats(): Promise<void> {
  await chrome.storage.local.set(DEFAULT_STORAGE);
  console.log('🔄 Impulse Guard: All stats reset');
}