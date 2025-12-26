import React, { useState } from 'react';
import { Icons } from './Icons';
import { authService } from '../authService';

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

    // Account form states
    const [newUsername, setNewUsername] = useState('');
    const [usernamePassword, setUsernamePassword] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

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
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-xs text-gray-500 mb-1">Logged in as</div>
                                <div className="text-lg font-bold text-gray-900">{currentUser}</div>
                            </div>

                            {/* Data Backup */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Data Management</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const data = await authService.exportAllData();
                                                const blob = new Blob([data], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `ssat_backup_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            } catch (e) {
                                                alert('Export failed');
                                            }
                                        }}
                                        className="flex flex-col items-center justify-center gap-1 p-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100"
                                    >
                                        <div className="text-lg">📥</div>
                                        <span className="text-[10px] font-bold uppercase tracking-tight">Export</span>
                                    </button>

                                    <label className="flex flex-col items-center justify-center gap-1 p-3 bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 transition-colors border border-violet-100 cursor-pointer">
                                        <div className="text-lg">📤</div>
                                        <span className="text-[10px] font-bold uppercase tracking-tight">Import</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".json"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = async (re) => {
                                                    const content = re.target?.result as string;
                                                    const result = await authService.importAllData(content);
                                                    if (result.success) {
                                                        alert(result.message);
                                                        window.location.reload();
                                                    } else {
                                                        alert(result.message);
                                                    }
                                                };
                                                reader.readAsText(file);
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleResetData}
                                    className="w-full py-3 px-4 bg-white border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm uppercase tracking-wider"
                                >
                                    Reset All Progress
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
                                <h3 className="text-sm font-medium text-gray-700">Change Username</h3>
                                <input
                                    type="text"
                                    placeholder="New username"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    value={usernamePassword}
                                    onChange={(e) => setUsernamePassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !newUsername || !usernamePassword}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
                                >
                                    {loading ? 'Updating...' : 'Update Username'}
                                </button>
                            </form>

                            <div className="border-t border-gray-100" />

                            {/* Change Password */}
                            <form onSubmit={handleChangePassword} className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-700">Change Password</h3>
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                    type="password"
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !oldPassword || !newPassword || !confirmNewPassword}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
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
