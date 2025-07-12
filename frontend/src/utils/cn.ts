// frontend/src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// frontend/src/utils/formatting.ts
export const formatAddress = (address: string, chars: number = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const formatHash = (hash: string, chars: number = 6): string => {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - (timestamp * 1000);

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const formatGas = (gas: string | number): string => {
  const gasNum = typeof gas === 'string' ? parseInt(gas) : gas;
  if (gasNum >= 1000000) return `${(gasNum / 1000000).toFixed(1)}M`;
  if (gasNum >= 1000) return `${(gasNum / 1000).toFixed(1)}k`;
  return gasNum.toString();
};