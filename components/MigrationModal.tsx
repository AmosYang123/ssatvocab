import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { hybridService } from '../services/hybridService';
import { authService } from '../authService';

interface MigrationModalProps {
    onComplete: () => void;
    onSkip: () => void;
}

const MigrationModal: React.FC<MigrationModalProps> = ({ onComplete, onSkip }) => {
    const [status, setStatus] = useState<'checking' | 'ready' | 'migrating' | 'success' | 'error'>('checking');
    const [message, setMessage] = useState('Checking local data...');
    const [stats, setStats] = useState<{
        wordStatuses: number;
        markedWords: number;
        savedSets: number;
    } | null>(null);

    useEffect(() => {
        checkLocalData();
    }, []);

    const checkLocalData = async () => {
        try {
            const localData = await authService.getCurrentUserData();
            if (localData) {
                const statusCount = Object.keys(localData.wordStatuses).length;
                const markedCount = Object.values(localData.markedWords).filter(Boolean).length;
                const setsCount = localData.savedSets.length;

                setStats({
                    wordStatuses: statusCount,
                    markedWords: markedCount,
                    savedSets: setsCount,
                });

                if (statusCount > 0 || markedCount > 0 || setsCount > 0) {
                    setStatus('ready');
                    setMessage('Found local data that can be migrated to the cloud.');
                } else {
                    // No data to migrate
                    onComplete();
                }
            } else {
                // No data to migrate
                onComplete();
            }
        } catch (e) {
            console.error('Error checking local data:', e);
            onComplete();
        }
    };

    const handleMigrate = async () => {
        setStatus('migrating');
        setMessage('Migrating your data to the cloud...');

        try {
            const result = await hybridService.migrateLocalToCloud();
            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                setTimeout(() => {
                    onComplete();
                }, 2000);
            } else {
                setStatus('error');
                setMessage(result.message);
            }
        } catch (e) {
            setStatus('error');
            setMessage('Migration failed. Your local data is still safe.');
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span>☁️</span> Migrate to Cloud
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">
                        Sync your progress across devices
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {status === 'checking' && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
                        </div>
                    )}

                    {status === 'ready' && stats && (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                We found study progress on this device. Would you like to sync it to the cloud?
                            </p>

                            {/* Stats */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Local Data</h3>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                        <div className="text-2xl font-bold text-indigo-600">{stats.wordStatuses}</div>
                                        <div className="text-xs text-gray-500">Word Statuses</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                        <div className="text-2xl font-bold text-purple-600">{stats.markedWords}</div>
                                        <div className="text-xs text-gray-500">Marked Words</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                        <div className="text-2xl font-bold text-violet-600">{stats.savedSets}</div>
                                        <div className="text-xs text-gray-500">Study Sets</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onSkip}
                                    className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Keep Local Only
                                </button>
                                <button
                                    onClick={handleMigrate}
                                    className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                                >
                                    Migrate to Cloud
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'migrating' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="animate-spin w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
                            <p className="text-gray-600">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-3xl">✓</span>
                            </div>
                            <p className="text-green-700 font-medium text-center">{message}</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center py-4 space-y-3">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-3xl">⚠️</span>
                                </div>
                                <p className="text-red-600 text-center">{message}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onSkip}
                                    className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Continue Offline
                                </button>
                                <button
                                    onClick={handleMigrate}
                                    className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MigrationModal;
