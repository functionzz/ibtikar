// Types for extension storage

export interface BlockedItem {
  id: string;
  url: string;
  productName: string;
  price: number | null;
  blockedAt: number;
  expiresAt: number;
  site: string;
  status: 'pending' | 'purchased' | 'expired';
}

export interface Statistics {
  totalMoneySaved: number;
  blockedCount: number;
  purchasedCount: number;
  expiredCount: number;
}

export interface Settings {
  waitingPeriodHours: number;
}

const DEFAULT_SETTINGS: Settings = {
  waitingPeriodHours: 24,
};

const DEFAULT_STATISTICS: Statistics = {
  totalMoneySaved: 0,
  blockedCount: 0,
  purchasedCount: 0,
  expiredCount: 0,
};

// Settings
// This function gets the user's settings from local storage and merges it with local storage
export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...result.settings });
    });
  });
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings: { ...current, ...settings } }, resolve);
  });
}

// Statistics
export async function getStatistics(): Promise<Statistics> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['statistics'], (result) => {
      resolve({ ...DEFAULT_STATISTICS, ...result.statistics });
    });
  });
}

export async function updateStatistics(updates: Partial<Statistics>): Promise<void> {
  const current = await getStatistics();
  return new Promise((resolve) => {
    chrome.storage.local.set({ statistics: { ...current, ...updates } }, resolve);
  });
}

export async function incrementStat(key: keyof Statistics, amount: number = 1): Promise<void> {
  const current = await getStatistics();
  await updateStatistics({ [key]: current[key] + amount });
}

// Blocked Items
export async function getBlockedItems(): Promise<BlockedItem[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['blockedItems'], (result) => {
      resolve(result.blockedItems || []);
    });
  });
}

export async function addBlockedItem(item: Omit<BlockedItem, 'id'>): Promise<BlockedItem> {
  const items = await getBlockedItems();
  const newItem: BlockedItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  items.push(newItem);

  return new Promise((resolve) => {
    chrome.storage.local.set({ blockedItems: items }, () => resolve(newItem));
  });
}

export async function updateBlockedItem(id: string, updates: Partial<BlockedItem>): Promise<void> {
  const items = await getBlockedItems();
  const index = items.findIndex((item) => item.id === id);

  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    return new Promise((resolve) => {
      chrome.storage.local.set({ blockedItems: items }, resolve);
    });
  }
}

export async function getPendingItems(): Promise<BlockedItem[]> {
  const items = await getBlockedItems();
  const now = Date.now();
  return items.filter((item) => item.status === 'pending' && item.expiresAt > now);
}

export async function getExpiredItems(): Promise<BlockedItem[]> {
  const items = await getBlockedItems();
  const now = Date.now();
  return items.filter((item) => item.status === 'pending' && item.expiresAt <= now);
}
