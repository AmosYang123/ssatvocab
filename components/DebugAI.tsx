import React, { useState } from 'react';
import { scoreWritingAnswerAI } from '../services/geminiService';
import { Icons } from './Icons';
import { useNavigate } from 'react-router-dom';

const DebugAI: React.FC = () => {
    const navigate = useNavigate();
    const [definition, setDefinition] = useState('to run very fast');
    const [userAnswer, setUserAnswer] = useState('sprint');
    const [modelName, setModelName] = useState('gemini-2.0-flash-exp');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [showKeyInfo, setShowKeyInfo] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const handleListModels = async () => {
        if (!apiKey) {
            addLog("Checking models... SKIP (No Key)");
            return;
        }
        addLog("Fetching available models...");
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await res.json();
            if (data.models) {
                const names = data.models.map((m: any) => m.name.replace('models/', ''));
                setAvailableModels(names);
                addLog(`Found ${names.length} models: ${names.join(', ')}`);
            } else if (data.error) {
                addLog(`❌ Error listing models: ${data.error.message}`);
            }
        } catch (e: any) {
            addLog(`❌ Fetch error: ${e.message}`);
        }
    };

    const handleTest = async () => {
        if (!definition || !userAnswer) return;

        setLoading(true);
        setResult(null);
        addLog(`Testing Model "${modelName}": Def="${definition}", Ans="${userAnswer}"`);

        try {
            const startTime = Date.now();
            // Pass empty synonyms force raw test, throwOnError=true, pass modelName
            const score = await scoreWritingAnswerAI(userAnswer, definition, [], true, modelName);
            const duration = Date.now() - startTime;

            const resStr = score === true ? 'CORRECT (true)' : score === false ? 'INCORRECT (false)' : 'NULL (Fallback)';
            setResult(resStr);
            addLog(`Result: ${resStr} in ${duration}ms`);

            if (score === null) {
                addLog('⚠️ Received NULL. This means API failed, timed out, or key is missing.');
                if (!navigator.onLine) addLog('⚠️ Browser is OFFLINE.');
                if (!apiKey) addLog('⚠️ VITE_GEMINI_API_KEY is missing or empty.');
            }
        } catch (error: any) {
            addLog(`❌ Error: ${error.message || error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                    <h1 className="text-white font-bold text-xl flex items-center gap-2">
                        <Icons.Brain /> AI Debugger
                    </h1>
                    <button onClick={() => navigate('/')} className="text-indigo-100 hover:text-white">
                        <Icons.Close />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Check */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-700">System Status</span>
                            <button
                                onClick={() => setShowKeyInfo(!showKeyInfo)}
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                {showKeyInfo ? 'Hide Info' : 'Show Info'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-slate-600">Network: {navigator.onLine ? 'Online' : 'Offline'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-slate-600">API Key Configured</span>
                            </div>
                        </div>
                        {showKeyInfo && (
                            <div className="mt-2 pt-2 border-t border-slate-200 text-xs font-mono text-slate-500 break-all">
                                Key Prefix: {apiKey ? `${apiKey.substring(0, 4)}...` : 'NONE'}
                            </div>
                        )}
                        <div className="mt-4 pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase">Available Models</span>
                                <button onClick={handleListModels} className="text-xs font-bold text-indigo-600 hover:underline">
                                    Check Availability
                                </button>
                            </div>
                            {availableModels.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {availableModels.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setModelName(m)}
                                            className={`text-[10px] px-2 py-1 rounded border ${modelName === m ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Test Inputs */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                    Model Name
                                </label>
                                <input
                                    type="text"
                                    value={modelName}
                                    onChange={e => setModelName(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs font-mono"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                    Definition
                                </label>
                                <input
                                    type="text"
                                    value={definition}
                                    onChange={e => setDefinition(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Student Answer
                            </label>
                            <input
                                type="text"
                                value={userAnswer}
                                onChange={e => setUserAnswer(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <button
                            onClick={handleTest}
                            disabled={loading || !definition || !userAnswer}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                'Test Scoring'
                            )}
                        </button>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className={`p-4 rounded-lg border text-center ${result.includes('CORRECT (true)')
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : result.includes('NULL')
                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Result</div>
                            <div className="text-2xl font-black">{result}</div>
                        </div>
                    )}

                    {/* Logs */}
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 h-40 overflow-y-auto custom-scrollbar">
                        {logs.length === 0 ? (
                            <span className="text-slate-600 italic">Waiting for test...</span>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="mb-1 border-b border-slate-800 pb-1 last:border-0 last:pb-0">
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebugAI;
