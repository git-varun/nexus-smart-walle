import {useState} from 'react';
import {useToast} from './useToast';

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

export const useModuleRegistrySimple = () => {
    const {toast} = useToast();
    const [modules] = useState<Module[]>([]);
    const [popularModules] = useState<Module[]>([]);
    const [isLoading] = useState(false);

    const searchModules = async (query: string): Promise<Module[]> => {
        console.log('Module search not implemented in backend yet:', query);
        return [];
    };

    const installModule = async (moduleAddress: string): Promise<void> => {
        console.log('Module installation not implemented in backend yet:', moduleAddress);
        toast({
            title: 'Module Installation',
            description: 'Module installation will be available in future updates',
            variant: 'warning'
        });
    };

    const uninstallModule = async (moduleAddress: string): Promise<void> => {
        console.log('Module uninstallation not implemented in backend yet:', moduleAddress);
        toast({
            title: 'Module Uninstallation',
            description: 'Module uninstallation will be available in future updates',
            variant: 'warning'
        });
    };

    return {
        modules,
        popularModules,
        isLoading,
        searchModules,
        installModule,
        uninstallModule
    };
};
