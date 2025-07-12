// frontend/src/hooks/useSessionKeys.ts
import { useState, useEffect, useCallback } from 'react';
import { useSmartAccount } from './useSmartAccount';
import { useToast } from './useToast';
import { SessionKey, CreateSessionKeyParams } from '../types/session';
import { parseEther } from 'viem';

export const useSessionKeys = () => {
  const { smartAccountAddress } = useSmartAccount();
  const { toast } = useToast();

  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Fetch session keys
  const fetchSessionKeys = useCallback(async () => {
    if (!smartAccountAddress) return;

    setIsLoading(true);
    try {
      // TODO: Implement real session key fetching
      // This would involve calling the SessionKeyModule contract

      // Mock data for now
      const mockSessionKeys: SessionKey[] = [
        {
          key: '0x' + Math.random().toString(16).substr(2, 40),
          spendingLimit: parseEther('0.1').toString(),
          dailyLimit: parseEther('1').toString(),
          usedToday: parseEther('0.05').toString(),
          lastUsedDay: Math.floor(Date.now() / 86400000),
          expiryTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours
          allowedTargets: [],
          isActive: true
        }
      ];

      setSessionKeys(mockSessionKeys);
    } catch (error) {
      console.error('Failed to fetch session keys:', error);
      toast({
        title: 'Failed to Load Session Keys',
        description: 'Could not load session keys',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [smartAccountAddress, toast]);

  // Create session key
  const createSessionKey = useCallback(async (params: CreateSessionKeyParams) => {
    if (!smartAccountAddress) {
      throw new Error('Smart account not connected');
    }

    setIsCreating(true);
    try {
      // TODO: Implement real session key creation
      // This would involve:
      // 1. Call SessionKeyModule.addSessionKey
      // 2. Wait for transaction confirmation
      // 3. Refresh session keys list

      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Session Key Created',
        description: 'New session key has been created successfully',
        variant: 'success'
      });

      // Refresh the list
      await fetchSessionKeys();
    } catch (error) {
      console.error('Failed to create session key:', error);
      toast({
        title: 'Creation Failed',
        description: 'Failed to create session key',
        variant: 'error'
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [smartAccountAddress, toast, fetchSessionKeys]);

  // Revoke session key
  const revokeSessionKey = useCallback(async (sessionKeyAddress: string) => {
    if (!smartAccountAddress) return;

    setIsRevoking(true);
    try {
      // TODO: Implement real session key revocation
      // This would involve calling SessionKeyModule.revokeSessionKey

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Remove from local state
      setSessionKeys(prev => prev.filter(sk => sk.key !== sessionKeyAddress));

      toast({
        title: 'Session Key Revoked',
        description: 'Session key has been revoked successfully',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to revoke session key:', error);
      toast({
        title: 'Revocation Failed',
        description: 'Failed to revoke session key',
        variant: 'error'
      });
    } finally {
      setIsRevoking(false);
    }
  }, [smartAccountAddress, toast]);

  // Auto-fetch when smart account changes
  useEffect(() => {
    if (smartAccountAddress) {
      fetchSessionKeys();
    } else {
      setSessionKeys([]);
    }
  }, [smartAccountAddress, fetchSessionKeys]);

  return {
    sessionKeys,
    isLoading,
    isCreating,
    isRevoking,
    fetchSessionKeys,
    createSessionKey,
    revokeSessionKey
  };
};