// frontend/src/components/modules/ModuleStore.tsx
import React, {useState} from 'react';
import {useModuleRegistry} from '@/hooks/useModuleRegistry.ts';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';

export const ModuleStore: React.FC = () => {
    const {
        modules,
        popularModules,
        isLoading,
        searchModules,
        installModule,
        uninstallModule
    } = useModuleRegistry();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'popular' | 'all' | 'installed'>('popular');

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            const results = await searchModules(searchQuery);
            setSearchResults(results);
            setActiveTab('all');
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const getDisplayModules = () => {
        switch (activeTab) {
            case 'popular':
                return popularModules;
            case 'all':
                return searchQuery ? searchResults : modules;
            case 'installed':
                return modules.filter(m => m.isInstalled);
            default:
                return modules;
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Module Store</h2>
                <div className="flex items-center space-x-4">
                    <div className="flex space-x-2">
                        <Input
                            placeholder="Search modules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-64"
                        />
                        <Button onClick={handleSearch} variant="outline">
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1 mb-6">
                {[
                    {id: 'popular', label: 'Popular'},
                    {id: 'all', label: 'All Modules'},
                    {id: 'installed', label: 'Installed'}
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getDisplayModules().map((module, index) => (
                    <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="text-white font-medium">{module.name}</h3>
                                <p className="text-sm text-slate-400">v{module.version}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                {module.isInstalled ? (
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                ) : (
                                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-slate-300 mb-4 line-clamp-3">
                            {module.description}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs text-slate-500">
                                {module.installCount} installs
                            </div>
                            <div className="text-xs text-slate-500">
                                by {module.developer.slice(0, 8)}...
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                            {module.tags?.map((tag: string, tagIndex: number) => (
                                <span
                                    key={tagIndex}
                                    className="px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded"
                                >
                  {tag}
                </span>
                            ))}
                        </div>

                        <Button
                            onClick={() => module.isInstalled ? uninstallModule(module.address) : installModule(module.address)}
                            variant={module.isInstalled ? 'outline' : 'primary'}
                            size="sm"
                            className="w-full"
                            loading={isLoading}
                        >
                            {module.isInstalled ? 'Uninstall' : 'Install'}
                        </Button>
                    </Card>
                ))}
            </div>

            {getDisplayModules().length === 0 && (
                <div className="text-center py-8">
                    <p className="text-slate-400">
                        {searchQuery ? 'No modules found matching your search' : 'No modules available'}
                    </p>
                </div>
            )}
        </Card>
    );
};
