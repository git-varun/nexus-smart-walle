// frontend/src/hooks/useModuleRegistry.ts
import { useState, useEffect, useCallback } from 'react';
import { useSmartAccount } from './useSmartAccount';
import { useToast } from './useToast';

interface Module {
  address: string;
  name: string;
  version: string;
  description: string;
  developer: string;
  isActive: boolean;
  registeredAt: number;
  tags: string[];
  installCount: number;
  isInstalled: boolean;
}

export const useModuleRegistry = () => {
  const { smartAccountAddress } = useSmartAccount();
  const { toast } = useToast();

  const [modules, setModules] = useState<Module[]>([]);
  const [popularModules, setPopularModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all modules
  const fetchModules = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement real module fetching from registry

      // Mock data
      const mockModules: Module[] = [
        {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'SessionKeyModule',
          version: '1.0.0',
          description: 'Manage temporary access keys with spending limits and time bounds',
          developer: '0x742A4A0BfF7C58e3b52F6c51ede22f7B8F4CAb0E',
          isActive: true,
          registeredAt: Date.now() - 86400000,
          tags: ['access-control', 'security', 'temporary'],
          installCount: 1234,
          isInstalled: true
        },
        {
          address: '0xabcdef1234567890abcdef1234567890abcdef12',
          name: 'RecoveryModule',
          version: '1.0.0',
          description: 'Guardian-based account recovery with social verification',
          developer: '0x8F4CAb0E742A4A0BfF7C58e3b52F6c51ede22f7B',
          isActive: true,
          registeredAt: Date.now() - 172800000,
          tags: ['recovery', 'guardians', 'security'],
          installCount: 856,
          isInstalled: false
        },
        {
          address: '0x567890abcdef1234567890abcdef1234567890ab',
          name: 'TimelockModule',
          version: '1.2.0',
          description: 'Add time delays to sensitive operations for enhanced security',
          developer: '0x9B8E7F6D5C4A3B2A1098765432109876543210',
          isActive: true,
          registeredAt: Date.now() - 259200000,
          tags: ['timelock', 'security', 'delays'],
          installCount: 567,
          isInstalled: false
        }
      ];

      setModules(mockModules);
      setPopularModules(mockModules.sort((a, b) => b.installCount - a.installCount).slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search modules
  const searchModules = useCallback(async (query: string) => {
    try {
      // TODO: Implement real module search

      const results = modules.filter(module =>
        module.name.toLowerCase().includes(query.toLowerCase()) ||
        module.description.toLowerCase().includes(query.toLowerCase()) ||
        module.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      return results;
    } catch (error) {
      console.error('Failed to search modules:', error);
      return [];
    }
  }, [modules]);

  // Install module
  const installModule = useCallback(async (moduleAddress: string) => {
    if (!smartAccountAddress) {
      throw new Error('Smart account not connected');
    }

    setIsLoading(true);
    try {
      // TODO: Implement real module installation

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update local state
      setModules(prev => prev.map(module =>
        module.address === moduleAddress
          ? { ...module, isInstalled: true }
          : module
      ));

      toast({
        title: 'Module Installed',
        description: 'Module has been successfully installed',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to install module:', error);
      toast({
        title: 'Installation Failed',
        description: 'Failed to install module',
        variant: 'error'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [smartAccountAddress, toast]);

  // Uninstall module
  const uninstallModule = useCallback(async (moduleAddress: string) => {
    if (!smartAccountAddress) {
      throw new Error('Smart account not connected');
    }

    setIsLoading(true);
    try {
      // TODO: Implement real module uninstallation

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update local state
      setModules(prev => prev.map(module =>
        module.address === moduleAddress
          ? { ...module, isInstalled: false }
          : module
      ));

      toast({
        title: 'Module Uninstalled',
        description: 'Module has been successfully uninstalled',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to uninstall module:', error);
      toast({
        title: 'Uninstallation Failed',
        description: 'Failed to uninstall module',
        variant: 'error'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [smartAccountAddress, toast]);

  // Auto-fetch when smart account changes
  useEffect(() => {
    if (smartAccountAddress) {
      fetchModules();
    } else {
      setModules([]);
      setPopularModules([]);
    }
  }, [smartAccountAddress, fetchModules]);

  return {
    modules,
    popularModules,
    isLoading,
    fetchModules,
    searchModules,
    installModule,
    uninstallModule
  };
};