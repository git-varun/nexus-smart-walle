// frontend/src/components/session/SessionKeyManager.tsx
import React, {useState} from 'react';
import {useSessionKeys} from '@/hooks/useSessionKeys.ts';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {SessionKeyCreate} from './SessionKeyCreate';
import {SessionKeyList} from './SessionKeyList';

export const SessionKeyManager: React.FC = () => {
    const {sessionKeys} = useSessionKeys();
    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Session Keys</h2>
                <div className="flex space-x-2">
                    <Button
                        onClick={() => setActiveTab('list')}
                        variant={activeTab === 'list' ? 'primary' : 'outline'}
                        size="sm"
                    >
                        Active Keys ({sessionKeys.length})
                    </Button>
                    <Button
                        onClick={() => setActiveTab('create')}
                        variant={activeTab === 'create' ? 'primary' : 'outline'}
                        size="sm"
                    >
                        Create New
                    </Button>
                </div>
            </div>

            {activeTab === 'list' ? (
                <SessionKeyList/>
            ) : (
                <SessionKeyCreate onSuccess={() => setActiveTab('list')}/>
            )}
        </Card>
    );
};
