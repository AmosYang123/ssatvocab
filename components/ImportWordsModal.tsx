import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Word } from '../types';
import { Icons } from './Icons';
import { expandWordsAI, smartExtractVocabAI } from '../services/groqService';
import * as mammoth from 'mammoth';
import * as pdfjt from 'pdfjs-dist';

// pdfjs worker setup
pdfjt.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjt.version}/build/pdf.worker.min.mjs`;

interface ImportWordsModalProps {
    onClose: () => void;
    onImport: (newWords: Word[]) => void;
    existingVocab: Word[];
}

const ImportWordsModal: React.FC<ImportWordsModalProps> = ({ onClose, onImport, existingVocab }) => {
    const [inputText, setInputText] = useState('');
    const [processedWords, setProcessedWords] = useState<Partial<Word>[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('AI is thinking...');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadingPhrases = [
        "AI is thinking...",
        "AI is organizing your vocab...",
        "AI is matching definitions...",
        "AI is working its magic...",
        "AI is almost done..."
    ];

    useEffect(() => {
        let interval: any;
        if (isProcessing) {
            let i = 0;
            interval = setInterval(() => {
                i = (i + 1) % loadingPhrases.length;
                setLoadingMessage(loadingPhrases[i]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isProcessing]);

    const parseInput = (text: string) => {
        const lines = text.split('\n').filter(line => line.trim());
        const words: Partial<Word>[] = lines.map(line => {
            // Remove common list prefixes (1., -, *, bullet)
            const cleanLine = line.replace(/^\d+[\.\)]\s*/, '').replace(/^[\-\*\•]\s*/, '').trim();
            if (!cleanLine) return [];

            // Check for formats like "word: definition" or "word - definition"
            if (cleanLine.includes(':')) {
                const [name, ...defParts] = cleanLine.split(':');
                return { name: name.trim(), definition: defParts.join(':').trim(), priority: 1 as 1, difficulty: 'medium' as const };
            }
            if (cleanLine.includes(' - ')) {
                const [name, ...defParts] = cleanLine.split(' - ');
                return { name: name.trim(), definition: defParts.join(' - ').trim(), priority: 1 as 1, difficulty: 'medium' as const };
            }
            // Comma separated words on one line?
            if (cleanLine.includes(',') && !cleanLine.includes(' ')) {
                return cleanLine.split(',').map(w => ({ name: w.trim(), priority: 1 as 1, difficulty: 'medium' as const }));
            }
            return { name: cleanLine, priority: 1 as 1, difficulty: 'medium' as const };
        }).flat();

        // Final deduplication by name in the preview list itself
        const uniqueWords: Partial<Word>[] = [];
        const seen = new Set();
        words.forEach(w => {
            if (w.name && !seen.has(w.name.toLowerCase())) {
                seen.add(w.name.toLowerCase());
                uniqueWords.push(w);
            }
        });

        return uniqueWords;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setIsProcessing(true);
        let extractedText = "";

        try {
            if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                extractedText = result.value;
            } else if (file.name.endsWith('.pdf')) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjt.getDocument({ data: arrayBuffer }).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    extractedText += content.items.map((item: any) => item.str).join(" ") + "\n";
                }
            } else {
                const reader = new FileReader();
                const textPromise = new Promise<string>((resolve, reject) => {
                    reader.onload = (event) => resolve(event.target?.result as string);
                    reader.onerror = reject;
                });
                reader.readAsText(file);
                extractedText = await textPromise;

                if (extractedText.includes('\u0000') || (extractedText.match(/[\uFFFD]/g) || []).length > 10) {
                    throw new Error("This file looks like a binary file. Please use .txt, .csv, .docx, or .pdf.");
                }
            }

            if (extractedText) {
                setInputText(extractedText);
                // DISABLED: await handleSmartAIParse(extractedText); // No longer auto-triggers
            }
        } catch (err: any) {
            console.error("File processing error", err);
            setError(err.message || "Failed to process file. Make sure it's a valid document.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSmartAIParse = async (textToUse?: string) => {
        const text = textToUse || inputText;
        if (!text.trim()) return;
        setIsProcessing(true);
        setError(null);
        try {
            // STEP 1: IDENTIFY & ORGANIZE
            const identified = await smartExtractVocabAI(text);
            if (identified.length === 0) {
                throw new Error("AI couldn't identify any words. Try a cleaner text.");
            }

            setStep('preview');

            // STEP 2: AUTOMATICALLY FILL MISSING DATA
            const batchSize = 10;
            const totalBatches = Math.ceil(identified.length / batchSize);
            setProgress({ current: 0, total: totalBatches });

            const expanded: Word[] = [];
            for (let i = 0; i < identified.length; i += batchSize) {
                const batch = identified.slice(i, i + batchSize);
                const aiResult = await expandWordsAI(batch.map(w => ({ name: w.name || '', definition: w.definition })));

                batch.forEach((original) => {
                    const aiMatch = aiResult.find(r => r.name.toLowerCase() === original.name?.toLowerCase());
                    expanded.push({
                        name: original.name || '',
                        definition: (aiMatch?.definition || original.definition || 'No definition found.').trim(),
                        synonyms: aiMatch?.synonyms || original.synonyms,
                        example: aiMatch?.example || original.example,
                        difficulty: aiMatch?.difficulty || original.difficulty || 'medium',
                        priority: original.priority || 1
                    });
                });
                setProgress({ current: Math.floor(i / batchSize) + 1, total: totalBatches });
            }

            setProcessedWords(expanded);
        } catch (err: any) {
            setError(err.message || "AI Extraction failed.");
        } finally {
            setIsProcessing(false);
            setProgress(null);
        }
    };

    const handleProcess = () => {
        const words = parseInput(inputText);
        if (words.length === 0) return;
        setProcessedWords(words);
        setStep('preview');
    };

    const handleSave = () => {
        onImport(processedWords as Word[]);
    };

    return (
        <div className="fixed inset-0 z-[120] bg-indigo-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border-t-8 border-indigo-600">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-indigo-50">
                    <div>
                        <h2 className="text-2xl font-black text-indigo-900 italic tracking-tight">Import New Words</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Add your own vocabulary sets</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                        <Icons.Close className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 z-[140]">
                            <div className="p-1 bg-red-500 text-white rounded-full">
                                <Icons.Close className="w-3 h-3" />
                            </div>
                            <p className="text-red-700 text-xs font-bold uppercase tracking-widest">{error}</p>
                            <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-red-500 transition-colors">
                                <Icons.Close className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {step === 'input' ? (
                        <div className="space-y-6 relative">
                            <div className="space-y-2 relative">
                                <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Paste text here</label>
                                <div className="relative">
                                    <textarea
                                        className="w-full h-80 p-6 bg-gray-50 border-2 border-indigo-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-700 resize-none shadow-inner"
                                        placeholder="Enter words (one per line, comma separated, or word: definition)..."
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        disabled={isProcessing}
                                    />

                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 z-10 border border-indigo-50">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                                                    <Icons.Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-600 animate-pulse" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-indigo-900 font-bold text-xl tracking-tight">{loadingMessage}</h3>
                                                    <p className="text-indigo-400 text-[10px] uppercase font-black tracking-[0.2em] animate-pulse">Running advanced enrichment...</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl text-[11px] font-black hover:bg-indigo-50 transition-all uppercase tracking-widest disabled:opacity-50 shadow-sm"
                                >
                                    <Icons.Upload /> {isProcessing ? 'Reading...' : 'Upload File'}
                                </button>

                                <div className="text-gray-300 text-[10px] font-black italic tracking-widest flex-1 text-center">
                                    {isProcessing ? 'AI IS PROCESSING...' : 'SMART AI WILL ORGANIZE YOUR DATA'}
                                </div>

                                <button
                                    onClick={() => handleSmartAIParse()}
                                    disabled={!inputText.trim() || isProcessing}
                                    className={`px-10 py-3.5 rounded-2xl font-black text-[11px] shadow-2xl active:scale-95 transition-all uppercase tracking-[0.15em] disabled:opacity-50 flex items-center gap-3 text-white ${isProcessing ? 'bg-indigo-400' : 'animate-ai-gradient'}`}
                                >
                                    <Icons.Sparkles className={isProcessing ? 'animate-spin' : 'w-4 h-4'} />
                                    {isProcessing ? 'Thinking...' : 'Next: Organize with AI'}
                                </button>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".docx,.pdf,.txt,.csv"
                                    className="hidden"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="text-indigo-600 font-black text-xs uppercase tracking-widest">
                                    Preview: {processedWords.length} Words Processed
                                </div>
                                {isProcessing && (
                                    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-indigo-100 shadow-sm animate-pulse">
                                        <Icons.Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                                        <span className="text-indigo-900 font-bold text-[10px] uppercase tracking-widest">
                                            {loadingMessage} ({progress?.current}/{progress?.total})
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="border border-indigo-50 rounded-xl overflow-hidden shadow-inner bg-gray-50">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-indigo-600 text-white text-[10px] uppercase tracking-widest font-black">
                                        <tr>
                                            <th className="px-5 py-3">Word</th>
                                            <th className="px-5 py-3">Definition</th>
                                            <th className="px-5 py-3"></th> {/* For the delete button */}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50">
                                        {processedWords.map((word, idx) => {
                                            const isDuplicate = existingVocab.some(e => e.name.toLowerCase() === word.name?.toLowerCase());
                                            return (
                                                <tr key={idx} className="border-b border-gray-100 hover:bg-white transition-colors group">
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-indigo-900 italic tracking-tighter">{word.name}</span>
                                                                {isDuplicate && (
                                                                    <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-widest animate-pulse">
                                                                        Merge Required
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${word.difficulty === 'hard' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                                    {word.difficulty || 'medium'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-[11px] text-gray-500 font-medium leading-relaxed max-w-xs">{word.definition}</td>
                                                    <td className="px-5 py-4">
                                                        <button
                                                            onClick={() => setProcessedWords(prev => prev.filter((_, i) => i !== idx))}
                                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Icons.Close className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'preview' && (
                    <div className="p-8 border-t border-indigo-50 bg-white flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center gap-4 w-full max-w-md">
                            <button
                                onClick={handleSave}
                                disabled={isProcessing}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em] disabled:opacity-50"
                            >
                                Import {processedWords.length} Words to Cloud
                            </button>
                            <button
                                onClick={() => setStep('input')}
                                className="text-gray-400 font-black text-[11px] uppercase tracking-widest hover:text-indigo-600 transition-colors"
                            >
                                Back to Edit
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportWordsModal;
