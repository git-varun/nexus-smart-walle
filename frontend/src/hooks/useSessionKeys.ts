// frontend/src/hooks/useSessionKeys.ts
import {useCallback, useEffect, useState} from 'react';
import {useSmartAccount} from './useSmartAccount';
import {useToast} from './useToast';
import {CreateSessionKeyParams, SessionKey} from '../types/session';
import {apiClient, SessionKey as ApiSessionKey, SessionPermission} from '../services/apiClient';

export const useSessionKeys = () => {
    const {smartAccountAddress} = useSmartAccount();
    const {toast} = useToast();

    const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);

    // Helper function to convert API session key to frontend format
    const convertApiSessionKey = (apiKey: ApiSessionKey): SessionKey => {
        // Calculate spending limit from permissions (use first permission as primary)
        const primaryPermission = apiKey.permissions[0];
        const spendingLimit = primaryPermission?.spendingLimit || '0';

        return {
            key: apiKey.id,
            spendingLimit,
            dailyLimit: spendingLimit, // Using same value for now
            usedToday: '0', // API doesn't track this yet
            lastUsedDay: 0, // API doesn't track this yet
            expiryTime: Math.floor(new Date(apiKey.expiresAt).getTime() / 1000),
            allowedTargets: apiKey.permissions.map(p => p.target),
            isActive: apiKey.isActive
        };
    };

    // Fetch session keys
    const fetchSessionKeys = useCallback(async () => {
        if (!smartAccountAddress) return;

        setIsLoading(true);
        try {
            const response = await apiClient.getSessionKeys();

            if (response.success && response.data) {
                const convertedKeys = response.data.map(convertApiSessionKey);
                setSessionKeys(convertedKeys);
            } else {
                throw new Error(response.error?.message || 'Failed to fetch session keys');
            }
        } catch (error) {
            console.error('Failed to fetch session keys:', error);
            toast({
                title: 'Failed to Load Session Keys',
                description: error instanceof Error ? error.message : 'Could not load session keys',
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
            // Convert frontend params to API format
            const permissions: SessionPermission[] = [
                {
                    target: (params.allowedTargets?.[0] || smartAccountAddress) as `0x${string}`,
                    allowedFunctions: ['transfer'], // Default allowed functions
                    spendingLimit: params.spendingLimit,
                }
            ];

            const expiresAt = params.expiryTime ? params.expiryTime * 1000 : undefined;

            const response = await apiClient.createSessionKey(permissions, expiresAt);

            if (response.success) {
                toast({
                    title: 'Session Key Created',
                    description: 'New session key has been created successfully',
                    variant: 'success'
                });

                // Refresh the list
                await fetchSessionKeys();
            } else {
                throw new Error(response.error?.message || 'Failed to create session key');
            }
        } catch (error) {
            console.error('Failed to create session key:', error);
            toast({
                title: 'Creation Failed',
                description: error instanceof Error ? error.message : 'Failed to create session key',
                variant: 'error'
            });
            throw error;
        } finally {
            setIsCreating(false);
        }
    }, [smartAccountAddress, toast, fetchSessionKeys]);

    // Validate session key
    const validateSessionKey = useCallback(async (sessionKeyId: string): Promise<boolean> => {
        if (!smartAccountAddress) return false;

        try {
            const response = await apiClient.validateSessionKey(sessionKeyId);

            if (response.success && response.data) {
                return response.data.isValid;
            } else {
                console.error('Failed to validate session key:', response.error?.message);
                return false;
            }
        } catch (error) {
            console.error('Failed to validate session key:', error);
            return false;
        }
    }, [smartAccountAddress]);

    // Revoke session key
    const revokeSessionKey = useCallback(async (sessionKeyAddress: string) => {
        if (!smartAccountAddress) return;

        setIsRevoking(true);
        try {
            const response = await apiClient.revokeSessionKey(sessionKeyAddress);

            if (response.success) {
                // Remove from local state
                setSessionKeys(prev => prev.filter(sk => sk.key !== sessionKeyAddress));

                toast({
                    title: 'Session Key Revoked',
                    description: 'Session key has been revoked successfully',
                    variant: 'success'
                });
            } else {
                throw new Error(response.error?.message || 'Failed to revoke session key');
            }
        } catch (error) {
            console.error('Failed to revoke session key:', error);
            toast({
                title: 'Revocation Failed',
                description: error instanceof Error ? error.message : 'Failed to revoke session key',
                variant: 'error'
            });
        } finally {
            setIsRevoking(false);
        }
    }, [smartAccountAddress, toast]);

    // Check expired session keys and update their status
    const checkExpiredKeys = useCallback(async () => {
        const now = Math.floor(Date.now() / 1000);
        const updatedKeys = await Promise.all(
            sessionKeys.map(async (key) => {
                if (key.expiryTime <= now && key.isActive) {
                    // Key has expired, validate with backend
                    const isValid = await validateSessionKey(key.key);
                    return {...key, isActive: isValid};
                }
                return key;
            })
        );

        // Update state if any keys changed
        if (JSON.stringify(updatedKeys) !== JSON.stringify(sessionKeys)) {
            setSessionKeys(updatedKeys);
        }
    }, [sessionKeys, validateSessionKey]);

    // Auto-fetch when smart account changes
    useEffect(() => {
        if (smartAccountAddress) {
            fetchSessionKeys();
        } else {
            setSessionKeys([]);
        }
    }, [smartAccountAddress, fetchSessionKeys]);

    // Auto-check expired keys periodically
    useEffect(() => {
        if (sessionKeys.length > 0) {
            const interval = setInterval(checkExpiredKeys, 60000); // Check every minute
            return () => clearInterval(interval);
        }
    }, [sessionKeys, checkExpiredKeys]);

    return {
        sessionKeys,
        isLoading,
        isCreating,
        isRevoking,
        fetchSessionKeys,
        createSessionKey,
        revokeSessionKey,
        validateSessionKey,
        checkExpiredKeys,
        // Computed values
        activeSessionKeys: sessionKeys.filter(key => key.isActive),
        expiredSessionKeys: sessionKeys.filter(key => !key.isActive || key.expiryTime <= Math.floor(Date.now() / 1000)),
        totalSessionKeys: sessionKeys.length
    };
};
