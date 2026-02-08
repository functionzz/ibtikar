import { Button } from '@heroui/button';
import { Card, CardBody, Tab, Tabs } from '@heroui/react';
import { useState, useEffect } from 'react';

interface StorageData {
  count?: number;
  moneySaved?: number;
  weeklySaved?: number;
  blockedPurchases?: number;
  totalImpulses?: number;
  impulsesResisted?: number;
}

function App() {
  const [count, setCount] = useState(0);
  const [moneySaved, setMoneySaved] = useState(0);
  const [weeklySaved, setWeeklySaved] = useState(0);
  const [blockedPurchases, setBlockedPurchases] = useState(0);
  const [totalImpulses, setTotalImpulses] = useState(0);
  const [impulsesResisted, setImpulsesResisted] = useState(0);

  // Calculate success rate
  const successRate = totalImpulses > 0 
    ? Math.round((blockedPurchases / totalImpulses) * 100) 
    : 0;

  // Load data from storage on mount
  useEffect(() => {
    browser.storage.local.get([
      'count', 
      'moneySaved', 
      'weeklySaved',
      'blockedPurchases',
      'totalImpulses',
      'impulsesResisted'
    ]).then((result: StorageData) => {
      if (result.count) setCount(result.count);
      if (result.moneySaved) setMoneySaved(result.moneySaved);
      if (result.weeklySaved) setWeeklySaved(result.weeklySaved);
      if (result.blockedPurchases) setBlockedPurchases(result.blockedPurchases);
      if (result.totalImpulses) setTotalImpulses(result.totalImpulses);
      if (result.impulsesResisted) setImpulsesResisted(result.impulsesResisted);
    });
  }, []);

  // Listen for storage changes in real-time
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: browser.Storage.StorageChange }) => {
      if (changes.moneySaved) {
        setMoneySaved(changes.moneySaved.newValue as number || 0);
      }
      if (changes.weeklySaved) {
        setWeeklySaved(changes.weeklySaved.newValue as number || 0);
      }
      if (changes.count) {
        setCount(changes.count.newValue as number || 0);
      }
      if (changes.blockedPurchases) {
        setBlockedPurchases(changes.blockedPurchases.newValue as number || 0);
      }
      if (changes.totalImpulses) {
        setTotalImpulses(changes.totalImpulses.newValue as number || 0);
      }
      if (changes.impulsesResisted) {
        setImpulsesResisted(changes.impulsesResisted.newValue as number || 0);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleClick = () => {
    const newCount = count + 1;
    setCount(newCount);
    browser.storage.local.set({ count: newCount });
  };

  return (
    <div className="w-80 p-5 bg-background">
      {/* Header with gold accent */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-secondary">💰 Impulse Guard</h1>
        <p className="text-xs text-text-muted mt-1">Protecting your wallet</p>
      </div>

      {/* Money saved card - now using state */}
      <div className="bg-linear-to-br from-primary to-primary-dark rounded-xl p-4 mb-4 text-white shadow-lg">
        <p className="text-xs uppercase tracking-wide opacity-80">Money Saved</p>
        <p className="text-3xl font-bold">${moneySaved.toFixed(2)}</p>
        <p className="text-xs opacity-80 mt-1">↑ ${weeklySaved.toFixed(2)} this week</p>
      </div>

      <Tabs aria-label="Options" fullWidth className="mb-4">
        <Tab key="stats" title="📊 Stats">
          <Card className="bg-background-muted border border-border">
            <CardBody className="text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted">Blocked purchases</span>
                <span className="font-semibold text-text">{blockedPurchases}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-muted">Success rate</span>
                <span className="font-semibold text-savings">{successRate}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-muted">Impulses resisted</span>
                <span className="font-semibold text-gold">{impulsesResisted}</span>
              </div>
            </CardBody>
          </Card>
        </Tab>
        <Tab key="pending" title="⏳ Pending">
          <Card className="bg-background-muted border border-border">
            <CardBody className="text-sm text-text-muted">
              No pending purchases. You're doing great! 🎉
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      <Button
        onPress={handleClick}
        className="w-full py-3 bg-gold hover:bg-tertiary text-secondary font-semibold rounded-lg transition-colors shadow-md"
      >
        View Savings Report
      </Button>

      <p className="text-center mt-3 text-text-muted text-xs">
        Guarding since Jan 2025 • <span className="text-savings font-medium">{count} sessions</span>
      </p>
    </div>
  );
}

export default App;