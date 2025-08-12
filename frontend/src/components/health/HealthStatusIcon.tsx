import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {AlertTriangle, CheckCircle, Wifi, WifiOff, XCircle} from 'lucide-react';
import {Tooltip} from '../ui/Tooltip';
import {HealthStatus} from '../../hooks/useHealthMonitor';

interface HealthStatusIconProps {
    health: HealthStatus;
    onRefresh?: () => void;
    className?: string;
}

export const HealthStatusIcon: React.FC<HealthStatusIconProps> = ({
                                                                      health,
                                                                      onRefresh,
                                                                      className = ''
                                                                  }) => {
    const [isClicked, setIsClicked] = useState(false);

    const getStatusConfig = () => {
        switch (health.overall) {
            case 'healthy':
                return {
                    color: 'bg-green-500',
                    icon: CheckCircle,
                    pulse: false,
                    label: 'Healthy',
                    textColor: 'text-green-400',
                };
            case 'warning':
                return {
                    color: 'bg-yellow-500',
                    icon: AlertTriangle,
                    pulse: true,
                    label: 'Warning',
                    textColor: 'text-yellow-400',
                };
            case 'error':
                return {
                    color: 'bg-red-500',
                    icon: XCircle,
                    pulse: true,
                    label: 'Error',
                    textColor: 'text-red-400',
                };
            case 'unknown':
            default:
                return {
                    color: 'bg-gray-500',
                    icon: Wifi,
                    pulse: true,
                    label: 'Checking...',
                    textColor: 'text-gray-400',
                };
        }
    };

    const statusConfig = getStatusConfig();
    const StatusIconComponent = statusConfig.icon;

    const formatTime = (timestamp: number | null) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleClick = () => {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 200);
        if (onRefresh) {
            onRefresh();
        }
    };

    const tooltipContent = (
        <div className="space-y-2">
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${statusConfig.color}`}></div>
                <span className="font-medium">{statusConfig.label}</span>
            </div>

            <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                    <span>Network:</span>
                    <div className="flex items-center space-x-1">
                        {health.network.online ? (
                            <>
                                <Wifi size={12} className="text-green-400"/>
                                <span className="text-green-400">Online</span>
                            </>
                        ) : (
                            <>
                                <WifiOff size={12} className="text-red-400"/>
                                <span className="text-red-400">Offline</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span>API:</span>
                    <div className="flex items-center space-x-1">
                        {health.api.connected ? (
                            <>
                                <CheckCircle size={12} className="text-green-400"/>
                                <span className="text-green-400">Connected</span>
                            </>
                        ) : (
                            <>
                                <XCircle size={12} className="text-red-400"/>
                                <span className="text-red-400">Disconnected</span>
                            </>
                        )}
                    </div>
                </div>

                {health.api.latency && (
                    <div className="flex items-center justify-between">
                        <span>Latency:</span>
                        <span className={
                            health.api.latency < 100 ? 'text-green-400' :
                                health.api.latency < 300 ? 'text-yellow-400' : 'text-red-400'
                        }>
                            {health.api.latency}ms
                        </span>
                    </div>
                )}

                {health.api.error && (
                    <div className="pt-1 border-t border-gray-600">
                        <div className="text-red-400 text-xs">
                            Error: {health.api.error}
                        </div>
                    </div>
                )}

                <div className="pt-1 border-t border-gray-600 text-gray-400">
                    <div>Last check: {formatTime(health.api.lastChecked)}</div>
                </div>
            </div>

            {onRefresh && (
                <div className="pt-2 border-t border-gray-600">
                    <div className="text-xs text-gray-400">Click to refresh</div>
                </div>
            )}
        </div>
    );

    return (
        <Tooltip
            content={tooltipContent}
            position="top-right"
            className="w-64"
        >
            <motion.div
                className={`
                    fixed bottom-5 right-5 z-40
                    w-8 h-8 rounded-full
                    flex items-center justify-center
                    cursor-pointer shadow-lg
                    transition-all duration-200 ease-in-out
                    hover:shadow-xl hover:scale-110
                    ${statusConfig.color}
                    ${statusConfig.pulse ? 'animate-pulse' : ''}
                    ${className}
                `}
                onClick={handleClick}
                animate={isClicked ? {scale: 0.9} : {scale: 1}}
                transition={{duration: 0.1}}
                whileHover={{scale: 1.1}}
                whileTap={{scale: 0.9}}
            >
                <StatusIconComponent
                    size={18}
                    className="text-white drop-shadow-sm"
                />

                {/* Subtle glow effect for errors/warnings */}
                {(health.overall === 'error' || health.overall === 'warning') && (
                    <div className={`
                        absolute inset-0 rounded-full opacity-75
                        ${health.overall === 'error' ? 'bg-red-500' : 'bg-yellow-500'}
                        animate-ping
                    `} style={{animationDuration: '2s'}}></div>
                )}
            </motion.div>
        </Tooltip>
    );
};
