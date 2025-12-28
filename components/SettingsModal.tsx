import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { authService } from '../authService';
import { hybridService, StorageMode } from '../services/hybridService';

interface SettingsModalProps {
    currentUser: string;
    onUsernameChange: (newUsername: string) => void;
    onLogout: () => void;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    currentUser,
    onUsernameChange,
    onLogout,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState<'general' | 'account'>('general');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [storageMode, setStorageMode] = useState<StorageMode>('local');
    const [isCloudConfigured] = useState(hybridService.isCloudAvailable());

    // Account form states
    const [newUsername, setNewUsername] = useState('');
    const [usernamePassword, setUsernamePassword] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    useEffect(() => {
        setStorageMode(hybridService.getStorageMode());
    }, []);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleChangeUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !usernamePassword) {
            showMessage('error', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const result = await authService.changeUsername(newUsername, usernamePassword);
            if (result.success) {
                showMessage('success', result.message);
                onUsernameChange(result.user!);
                setNewUsername('');
                setUsernamePassword('');
            } else {
                showMessage('error', result.message);
            }
        } catch {
            showMessage('error', 'An error occurred.');
        }
        setLoading(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            showMessage('error', 'New passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const result = await authService.changePassword(oldPassword, newPassword);
            if (result.success) {
                showMessage('success', result.message);
                setOldPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                showMessage('error', result.message);
            }
        } catch {
            showMessage('error', 'An error occurred.');
        }
        setLoading(false);
    };

    const handleResetData = async () => {
        if (confirm('Are you sure you want to reset all your study progress? This cannot be undone.')) {
            await authService.resetAllData();
            window.location.reload();
        }
    };

    const handleSyncToCloud = async () => {
        setLoading(true);
        try {
            const result = await hybridService.migrateLocalToCloud();
            if (result.success) {
                showMessage('success', result.message);
                setStorageMode('hybrid');
            } else {
                showMessage('error', result.message);
            }
        } catch (e) {
            showMessage('error', 'Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'general' as const, label: 'General' },
        { id: 'account' as const, label: 'Account' },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <Icons.Close />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors
                ${activeTab === tab.id
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Message */}
                {message && (
                    <div className={`mx-6 mt-4 p-3 rounded-lg text-sm text-center
            ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            {/* User Info */}
                            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1 font-medium">Signed in as</div>
                                    <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <div className="p-1 bg-indigo-100 rounded-md text-indigo-600">
                                            <Icons.User />
                                        </div>
                                        {currentUser}
                                    </div>
                                </div>

                                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${storageMode === 'cloud' || storageMode === 'hybrid'
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : 'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>
                                    {storageMode === 'cloud' || storageMode === 'hybrid'
                                        ? <><Icons.Cloud /> Cloud Sync</>
                                        : <><Icons.Device /> Local Storage</>
                                    }
                                </span>
                            </div>

                            {/* Cloud Sync */}
                            {isCloudConfigured && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                        <Icons.Cloud /> Sync Status
                                    </h3>

                                    {storageMode === 'local' ? (
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-blue-500 mt-0.5"><Icons.Info /></div>
                                                <div>
                                                    <p className="text-sm text-blue-900 mb-3 font-medium leading-relaxed">
                                                        Your vocabulary progress is currently saved only on this device. Enable cloud sync to access your data from anywhere.
                                                    </p>
                                                    <button
                                                        onClick={handleSyncToCloud}
                                                        disabled={loading}
                                                        className="inline-flex items-center gap-2 py-2 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-xs uppercase tracking-wider shadow-sm"
                                                    >
                                                        {loading ? 'Syncing...' : <><Icons.Upload /> Sync Process to Cloud</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                                </span>
                                                <span className="text-sm font-bold text-green-800">Sync Active</span>
                                            </div>
                                            <button
                                                onClick={handleSyncToCloud}
                                                disabled={loading}
                                                className="text-xs font-bold text-green-700 hover:text-green-900 underline flex items-center gap-1"
                                            >
                                                {loading ? 'Syncing...' : <><Icons.Check /> Force Sync</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Data Backup */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <Icons.Database /> Data Management
                                </h3>

                                {/* Export Options */}
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 px-1 font-medium">Export Backups</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setLoading(true);
                                                    const data = await authService.exportAllData();
                                                    const blob = new Blob([data], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `ssat_backup_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                    showMessage('success', 'Backup exported successfully!');
                                                } catch (e) {
                                                    showMessage('error', 'Export failed');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            disabled={loading}
                                            className="group flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all border border-gray-200 hover:border-indigo-200 shadow-sm disabled:opacity-50"
                                        >
                                            <div className="p-2 bg-indigo-50 group-hover:bg-indigo-100 rounded-full transition-colors">
                                                <Icons.Download />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wide">My Data</span>
                                        </button>

                                        <button
                                            onClick={async () => {
                                                try {
                                                    setLoading(true);
                                                    const data = await authService.exportFullDatabase();
                                                    const blob = new Blob([data], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `ssat_full_database_${new Date().toISOString().split('T')[0]}.json`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                    showMessage('success', 'Full database exported!');
                                                } catch (e) {
                                                    showMessage('error', 'Database export failed');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            disabled={loading}
                                            className="group flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all border border-gray-200 hover:border-emerald-200 shadow-sm disabled:opacity-50"
                                        >
                                            <div className="p-2 bg-emerald-50 group-hover:bg-emerald-100 rounded-full transition-colors">
                                                <Icons.Database />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Full DB</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Import Options */}
                                <div className="space-y-2 pt-2">
                                    <p className="text-xs text-gray-500 px-1 font-medium">Restore Data</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="group flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-violet-50 text-violet-600 rounded-xl transition-all border border-gray-200 hover:border-violet-200 shadow-sm cursor-pointer">
                                            <div className="p-2 bg-violet-50 group-hover:bg-violet-100 rounded-full transition-colors">
                                                <Icons.Upload />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Import</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".json"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setLoading(true);
                                                    const reader = new FileReader();
                                                    reader.onload = async (re) => {
                                                        try {
                                                            const content = re.target?.result as string;
                                                            const result = await authService.importAllData(content);
                                                            if (result.success) {
                                                                showMessage('success', result.message);
                                                                setTimeout(() => window.location.reload(), 1500);
                                                            } else {
                                                                showMessage('error', result.message);
                                                            }
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    };
                                                    reader.onerror = () => {
                                                        showMessage('error', 'Failed to read file');
                                                        setLoading(false);
                                                    };
                                                    reader.readAsText(file);
                                                }}
                                            />
                                        </label>

                                        <label className="group flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-amber-50 text-amber-600 rounded-xl transition-all border border-gray-200 hover:border-amber-200 shadow-sm cursor-pointer">
                                            <div className="p-2 bg-amber-50 group-hover:bg-amber-100 rounded-full transition-colors">
                                                <Icons.Wrench />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Merge</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".json"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setLoading(true);
                                                    const reader = new FileReader();
                                                    reader.onload = async (re) => {
                                                        try {
                                                            const content = re.target?.result as string;
                                                            const result = await authService.importAllData(content, { merge: true });
                                                            if (result.success) {
                                                                showMessage('success', 'Data merged! ' + result.message);
                                                                setTimeout(() => window.location.reload(), 1500);
                                                            } else {
                                                                showMessage('error', result.message);
                                                            }
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    };
                                                    reader.onerror = () => {
                                                        showMessage('error', 'Failed to read file');
                                                        setLoading(false);
                                                    };
                                                    reader.readAsText(file);
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Full DB Restore (hidden by default, shown when needed) */}
                                <details className="group pt-2">
                                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 px-1 list-none flex items-center gap-2">
                                        <div className="p-1 bg-gray-100 rounded">
                                            <Icons.Settings />
                                        </div>
                                        <span>Advanced Restore Options</span>
                                    </summary>
                                    <div className="mt-3 p-4 bg-red-50 rounded-xl border border-red-100">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="text-red-500 mt-0.5"><Icons.Alert /></div>
                                            <p className="text-xs text-red-700 font-medium">
                                                Warning: This action restores the entire database and overwrites all user data. Proceed with caution.
                                            </p>
                                        </div>
                                        <label className="flex items-center justify-center gap-2 p-3 bg-white text-red-600 rounded-lg hover:bg-red-50 hover:shadow-md transition-all border border-red-200 cursor-pointer text-xs font-bold uppercase tracking-wide shadow-sm">
                                            <Icons.Database /> Restore Full Database
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".json"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    if (!confirm('This will restore ALL users from the backup. Continue?')) return;
                                                    setLoading(true);
                                                    const reader = new FileReader();
                                                    reader.onload = async (re) => {
                                                        try {
                                                            const content = re.target?.result as string;
                                                            const result = await authService.importFullDatabase(content);
                                                            if (result.success) {
                                                                showMessage('success', result.message);
                                                                setTimeout(() => window.location.reload(), 1500);
                                                            } else {
                                                                showMessage('error', result.message);
                                                            }
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    };
                                                    reader.onerror = () => {
                                                        showMessage('error', 'Failed to read file');
                                                        setLoading(false);
                                                    };
                                                    reader.readAsText(file);
                                                }}
                                            />
                                        </label>
                                    </div>
                                </details>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-gray-100 mt-4">
                                <button
                                    onClick={handleResetData}
                                    className="w-full mb-3 py-3 px-4 bg-white border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    <Icons.Alert /> Reset All Progress
                                </button>
                                <button
                                    onClick={onLogout}
                                    className="w-full py-3.5 px-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 uppercase tracking-[0.2em] text-sm"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Account Tab */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            {/* Change Username */}
                            <form onSubmit={handleChangeUsername} className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Icons.User /> Change Username
                                </h3>
                                <input
                                    type="text"
                                    placeholder="New username"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50"
                                />
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    value={usernamePassword}
                                    onChange={(e) => setUsernamePassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !newUsername || !usernamePassword}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
                                >
                                    {loading ? 'Updating...' : 'Update Username'}
                                </button>
                            </form>

                            <div className="border-t border-gray-100" />

                            {/* Change Password */}
                            <form onSubmit={handleChangePassword} className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Icons.Wrench /> Change Password
                                </h3>
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50"
                                />
                                <input
                                    type="password"
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50"
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !oldPassword || !newPassword || !confirmNewPassword}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
