import { useState, useEffect } from 'react';
import {
  getSettings,
  getStatistics,
  getBlockedItems,
  getPendingItems,
  Settings,
  Statistics,
  BlockedItem,
} from '@/api/storage';

// Hook to get and watch settings
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });

    // Listen for storage changes
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.settings) {
        setSettings(changes.settings.newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return { settings, loading };
}

// Hook to get and watch statistics
export function useStatistics() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStatistics().then((data) => {
      setStatistics(data);
      setLoading(false);
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.statistics) {
        setStatistics(changes.statistics.newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return { statistics, loading };
}

// Hook to get and watch blocked items
export function useBlockedItems() {
  const [items, setItems] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlockedItems().then((data) => {
      setItems(data);
      setLoading(false);
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.blockedItems) {
        setItems(changes.blockedItems.newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return { items, loading };
}

// Hook to get pending items with countdown
export function usePendingItems() {
  const [items, setItems] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      getPendingItems().then((data) => {
        setItems(data);
        setLoading(false);
      });
    };

    load();

    // Refresh every minute to update countdowns
    const interval = setInterval(load, 60000);

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.blockedItems) {
        load();
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      clearInterval(interval);
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  return { items, loading };
}
