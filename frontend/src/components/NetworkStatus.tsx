import React, {useEffect, useState} from 'react';
import {apiClient} from '../services/apiClient';
import {Button} from './ui/Button';
import {Card} from './ui/Card';

interface NetworkStatus {
    isOnline: boolean;
    apiConnected: boolean;
    lastChecked: number;
    rtt: number | null; // Round trip time
}

export const NetworkStatus: React.FC = () => {
    const [status, setStatus] = useState<NetworkStatus>({
        isOnline: navigator.onLine,
        apiConnected: false,
        lastChecked: Date.now(),
        rtt: null
    });
    const [isVisible, setIsVisible] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const checkApiConnection = async (): Promise<boolean> => {
        try {
            const startTime = Date.now();
            const response = await apiClient.getHealthCheck();
            const endTime = Date.now();

            if (response.success) {
                setStatus(prev => ({
                    ...prev,
                    apiConnected: true,
                    lastChecked: Date.now(),
                    rtt: endTime - startTime
                }));
                setLastError(null);
                return true;
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setLastError(errorMessage);
            setStatus(prev => ({
                ...prev,
                apiConnected: false,
                lastChecked: Date.now(),
                rtt: null
            }));
            return false;
        }
    };

    const handleOnlineStatusChange = () => {
        const isOnline = navigator.onLine;
        setStatus(prev => ({...prev, isOnline}));

        if (isOnline) {
            // When coming back online, check API connection
            checkApiConnection();
        } else {
            setStatus(prev => ({...prev, apiConnected: false}));
        }

        // Show status temporarily
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 3000);
    };

    const handleRetryConnection = async () => {
        setIsVisible(true);
        await checkApiConnection();
        setTimeout(() => setIsVisible(false), 2000);
    };

    useEffect(() => {
        // Initial API connection check
        checkApiConnection();

        // Listen for online/offline events
        window.addEventListener('online', handleOnlineStatusChange);
        window.addEventListener('offline', handleOnlineStatusChange);

        // Periodic health checks (every 30 seconds)
        const healthCheckInterval = setInterval(async () => {
            if (navigator.onLine) {
                const connected = await checkApiConnection();

                // Show status if connection state changed
                if (connected !== status.apiConnected) {
                    setIsVisible(true);
                    setTimeout(() => setIsVisible(false), 2000);
                }
            }
        }, 30000);

        // Show status if connection is poor
        const connectionMonitor = setInterval(() => {
            if (!status.isOnline || !status.apiConnected) {
                setIsVisible(true);
            }
        }, 5000);

        return () => {
            window.removeEventListener('online', handleOnlineStatusChange);
            window.removeEventListener('offline', handleOnlineStatusChange);
            clearInterval(healthCheckInterval);
            clearInterval(connectionMonitor);
        };
    }, []);

    // Auto-hide if connection is good
    useEffect(() => {
        if (status.isOnline && status.apiConnected && isVisible) {
            const timer = setTimeout(() => setIsVisible(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [status.isOnline, status.apiConnected, isVisible]);

    const shouldShowStatus = isVisible || !status.isOnline || !status.apiConnected;

    if (!shouldShowStatus) {
        return null;
    }

    const getStatusColor = () => {
        if (!status.isOnline) return 'bg-red-500';
        if (!status.apiConnected) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStatusText = () => {
        if (!status.isOnline) return 'Offline';
        if (!status.apiConnected) return 'API Disconnected';
        return 'Connected';
    };

    const getStatusMessage = () => {
        if (!status.isOnline) {
            return 'No internet connection. Please check your network settings.';
        }
        if (!status.apiConnected) {
            return lastError ? `API connection failed: ${lastError}` : 'Cannot connect to the backend API.';
        }
        return `Connected to API (${status.rtt}ms response time)`;
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Card className={`p-4 shadow-lg border-l-4 ${
                !status.isOnline ? 'border-l-red-500 bg-red-50' :
                    !status.apiConnected ? 'border-l-yellow-500 bg-yellow-50' :
                        'border-l-green-500 bg-green-50'
            }`}>
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${
                        !status.isOnline || !status.apiConnected ? 'animate-pulse' : ''
                    }`}></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                            {getStatusText()}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                            {getStatusMessage()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
                        </p>
                    </div>
                    {(!status.isOnline || !status.apiConnected) && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRetryConnection}
                        >
                            Retry
                        </Button>
                    )}
                </div>

                {/* Dismissible for successful connections */}
                {status.isOnline && status.apiConnected && (
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                )}
            </Card>
        </div>
    );
};

// Hook for accessing network status in other components
export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [apiConnected, setApiConnected] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        const checkApi = async () => {
            try {
                const response = await apiClient.getHealthCheck();
                setApiConnected(response.success);
            } catch {
                setApiConnected(false);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check API connection initially and periodically
        checkApi();
        const interval = setInterval(checkApi, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    return {isOnline, apiConnected};
};
