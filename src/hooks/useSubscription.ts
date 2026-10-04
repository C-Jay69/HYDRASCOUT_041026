'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Subscription,
  PlanKey,
  Usage,
  Transaction,
  PLANS,
  DEMO_SUBSCRIPTION,
  DEMO_TRANSACTIONS,
  CREDIT_PACKAGES,
} from '@/lib/subscription';

const STORAGE_KEY = 'hydrascout_subscription';
const TRANSACTIONS_KEY = 'hydrascout_transactions';
const CREDITS_KEY = 'hydrascout_credits';

interface UseSubscriptionReturn {
  subscription: Subscription;
  transactions: Transaction[];
  credits: number;
  isLoading: boolean;
  upgradePlan: (plan: PlanKey) => Promise<void>;
  cancelSubscription: () => void;
  topUpCredits: (credits: number, amount: number) => Promise<string>;
  addUsage: (type: keyof Usage, amount?: number) => void;
  resetDemo: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription>(DEMO_SUBSCRIPTION);
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSubscription({
          ...parsed,
          currentPeriodEnd: new Date(parsed.currentPeriodEnd),
        });
      } catch {
        console.error('Failed to parse stored subscription');
      }
    }

    const storedTx = localStorage.getItem(TRANSACTIONS_KEY);
    if (storedTx) {
      try {
        const parsed = JSON.parse(storedTx);
        setTransactions(
          parsed.map((t: Transaction) => ({
            ...t,
            date: new Date(t.date),
          }))
        );
      } catch {
        console.error('Failed to parse stored transactions');
      }
    }

    const storedCredits = localStorage.getItem(CREDITS_KEY);
    if (storedCredits) {
      setCredits(parseInt(storedCredits, 10) || 0);
    }

    setIsInitialized(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
  }, [subscription, isInitialized]);

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  }, [transactions, isInitialized]);

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    localStorage.setItem(CREDITS_KEY, credits.toString());
  }, [credits, isInitialized]);

  const upgradePlan = useCallback(async (plan: PlanKey): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newPlan = PLANS[plan];
      if (!newPlan.priceId) {
        // Free plan
        setSubscription((prev) => ({
          ...prev,
          plan,
          status: 'active',
          usage: {
            lookups: 0,
            skipTraces: 0,
            mailPieces: 0,
          },
        }));
      } else {
        // Create Stripe checkout session
        const response = await fetch('/next_api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'subscription',
            priceId: newPlan.priceId,
            productName: `${newPlan.name} Plan - Monthly`,
          }),
        });

        const data = await response.json();

        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          // Demo mode - simulate upgrade
          setSubscription((prev) => ({
            ...prev,
            plan,
            status: 'active',
            usage: {
              lookups: 0,
              skipTraces: 0,
              mailPieces: 0,
            },
          }));

          const transaction: Transaction = {
            id: `txn_${Date.now()}`,
            date: new Date(),
            description: `${newPlan.name} Plan - Monthly Subscription`,
            amount: newPlan.price,
            status: 'completed',
            invoiceUrl: '#',
          };
          setTransactions((prev) => [transaction, ...prev]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback((): void => {
    setSubscription((prev) => ({
      ...prev,
      status: 'cancelled',
    }));
  }, []);

  const topUpCredits = useCallback(async (creditsAmount: number, amount: number): Promise<string> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create Stripe checkout session
      const response = await fetch('/next_api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'payment',
          credits: creditsAmount,
          amount,
          productName: `${creditsAmount} Credits Top-Up`,
          productDescription: 'Hydrascout Credits',
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        return data.url;
      } else {
        // Demo mode - simulate purchase
        setCredits((prev) => prev + creditsAmount);

        const transaction: Transaction = {
          id: `txn_${Date.now()}`,
          date: new Date(),
          description: `${creditsAmount} Credits Top-Up`,
          amount,
          credits: creditsAmount,
          status: 'completed',
          invoiceUrl: '#',
        };
        setTransactions((prev) => [transaction, ...prev]);
        return '';
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addUsage = useCallback((type: keyof Usage, amount: number = 1): void => {
    setSubscription((prev) => ({
      ...prev,
      usage: {
        ...prev.usage,
        [type]: prev.usage[type] + amount,
      },
    }));
  }, []);

  const resetDemo = useCallback((): void => {
    setSubscription(DEMO_SUBSCRIPTION);
    setTransactions(DEMO_TRANSACTIONS);
    setCredits(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRANSACTIONS_KEY);
    localStorage.removeItem(CREDITS_KEY);
  }, []);

  return {
    subscription,
    transactions,
    credits,
    isLoading,
    upgradePlan,
    cancelSubscription,
    topUpCredits,
    addUsage,
    resetDemo,
  };
}
