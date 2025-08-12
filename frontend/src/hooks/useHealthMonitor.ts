import {useCallback, useEffect, useMemo, useState} from 'react';
import {apiClient} from '../services/apiClient';

export interface HealthStatus {
    overall: 'healthy' | 'warning' | 'error' | 'unknown';
    api: {
        connected: boolean;
        latency: number | null;
        lastChecked: number | null;
        error: string | null;
    };
    network: {
        online: boolean;
        lastChecked: number | null;
    };
}

export const useHealthMonitor = () => {
    const [health, setHealth] = useState<HealthStatus>({
        overall: 'unknown',
        api: {
            connected: false,
            latency: null,
            lastChecked: null,
            error: null,
        },
        network: {
            online: navigator.onLine,
            lastChecked: Date.now(),
        },
    });

    const [isTabActive, setIsTabActive] = useState(!document.hidden);

    // Calculate overall health status
    const calculateOverallHealth = useCallback((apiConnected: boolean, networkOnline: boolean): HealthStatus['overall'] => {
        if (!networkOnline) return 'error';
        if (!apiConnected) return 'warning';
        return 'healthy';
    }, []);

    // Check API connectivity
    const checkApiHealth = useCallback(async (): Promise<void> => {
        try {
            const startTime = Date.now();
            const response = await apiClient.getHealthCheck();
            const endTime = Date.now();
            const latency = endTime - startTime;

            if (response.success) {
                setHealth(prev => {
                    const newHealth = {
                        ...prev,
                        api: {
                            connected: true,
                            latency,
                            lastChecked: Date.now(),
                            error: null,
                        },
                        overall: calculateOverallHealth(true, prev.network.online)
                    };
                    return newHealth;
                });
            } else {
                throw new Error('Health check returned unsuccessful status');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setHealth(prev => {
                const newHealth = {
                    ...prev,
                    api: {
                        connected: false,
                        latency: null,
                        lastChecked: Date.now(),
                        error: errorMessage,
                    },
                    overall: calculateOverallHealth(false, prev.network.online)
                };
                return newHealth;
            });
        }
    }, [calculateOverallHealth]);

    // Handle network status changes
    const handleNetworkChange = useCallback(() => {
        const isOnline = navigator.onLine;
        setHealth(prev => {
            const newHealth = {
                ...prev,
                network: {
                    online: isOnline,
                    lastChecked: Date.now(),
                },
                overall: calculateOverallHealth(prev.api.connected, isOnline)
            };
            return newHealth;
        });

        // If back online, check API immediately
        if (isOnline) {
            checkApiHealth();
        }
    }, [calculateOverallHealth, checkApiHealth]);

    // Handle tab visibility changes
    const handleVisibilityChange = useCallback(() => {
        const isActive = !document.hidden;
        setIsTabActive(isActive);

        // Check health immediately when tab becomes active
        if (isActive) {
            checkApiHealth();
        }
    }, [checkApiHealth]);

    // Smart interval based on health status and tab visibility
    const checkInterval = useMemo(() => {
        if (!isTabActive) return 120000; // 2 minutes when tab is hidden
        if (health.overall === 'error') return 10000; // 10 seconds when error
        if (health.overall === 'warning') return 30000; // 30 seconds when warning
        return 60000; // 1 minute when healthy
    }, [health.overall, isTabActive]);

    // Set up health monitoring
    useEffect(() => {
        // Initial health check
        checkApiHealth();

        // Set up network listeners
        window.addEventListener('online', handleNetworkChange);
        window.addEventListener('offline', handleNetworkChange);

        // Set up tab visibility listener
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('online', handleNetworkChange);
            window.removeEventListener('offline', handleNetworkChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleNetworkChange, handleVisibilityChange, checkApiHealth]);

    // Set up periodic health checks with smart intervals
    useEffect(() => {
        const interval = setInterval(() => {
            if (navigator.onLine) {
                checkApiHealth();
            }
        }, checkInterval);

        return () => clearInterval(interval);
    }, [checkInterval, checkApiHealth]);

    // Manual refresh function
    const refresh = useCallback(async () => {
        await checkApiHealth();
    }, [checkApiHealth]);

    return {
        health,
        refresh,
        isTabActive,
    };
};
