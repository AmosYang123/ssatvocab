import React, { useState, useCallback, useRef } from 'react';
import { Word } from '../types';
import { Icons } from './Icons';
import { expandWordsAI } from '../services/groqService';

interface ImportWordsModalProps {
    onClose: () => void;
    onImport: (newWords: Word[]) => void;
}

const ImportWordsModal: React.FC<ImportWordsModalProps> = ({ onClose, onImport }) => {
    const [inputText, setInputText] = useState('');
    const [processedWords, setProcessedWords] = useState<Partial<Word>[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setInputText(text);
        };
        reader.readAsText(file);
    };

    const handleProcess = () => {
        const words = parseInput(inputText);
        if (words.length === 0) return;
        setProcessedWords(words);
        setStep('preview');
    };

    const handleAIExpand = async () => {
        setIsProcessing(true);
        const batchSize = 10;
        const totalBatches = Math.ceil(processedWords.length / batchSize);
        setProgress({ current: 0, total: totalBatches });

        try {
            const expanded: Word[] = [];

            for (let i = 0; i < processedWords.length; i += batchSize) {
                const batch = processedWords.slice(i, i + batchSize);
                const aiResult = await expandWordsAI(batch.map(w => ({ name: w.name || '', definition: w.definition })));

                // Merge AI results with manual data
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
        } catch (err) {
            console.error("AI Expansion failed", err);
        } finally {
            setIsProcessing(false);
            setProgress(null);
        }
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
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {step === 'input' ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Paste text here</label>
                                <textarea
                                    className="w-full h-64 p-4 bg-gray-50 border-2 border-indigo-100 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-700 resize-none"
                                    placeholder="Enter words (one per line, comma separated, or word: definition)..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-indigo-100 text-indigo-600 rounded-lg text-xs font-black hover:bg-indigo-50 transition-all uppercase tracking-widest"
                                >
                                    <Icons.Download /> Upload File
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <div className="text-gray-300 text-[10px] font-black italic">SUPPORTED: CSV, NEWLINE, OR DASH/COLON FORMATS</div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="text-indigo-600 font-black text-xs uppercase tracking-widest">
                                    Preview: {processedWords.length} Words Found
                                </div>
                                <button
                                    onClick={handleAIExpand}
                                    disabled={isProcessing}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${isProcessing ? 'bg-gray-100 text-gray-400' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg active:scale-95'}`}
                                >
                                    {isProcessing ? (
                                        <><Icons.Shuffle className="animate-spin" /> Batch {progress?.current}/{progress?.total}...</>
                                    ) : (
                                        <><Icons.Brain /> AI Complete Missing Data</>
                                    )}
                                </button>
                            </div>

                            <div className="border border-indigo-50 rounded-xl overflow-hidden shadow-inner bg-gray-50">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-indigo-600 text-white text-[10px] uppercase tracking-widest font-black">
                                        <tr>
                                            <th className="px-4 py-3">Word</th>
                                            <th className="px-4 py-3">Definition</th>
                                            <th className="px-4 py-3">Synonyms</th>
                                            <th className="px-4 py-3">Example</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50">
                                        {processedWords.map((word, idx) => (
                                            <tr key={idx} className="hover:bg-indigo-50/50 bg-white transition-colors">
                                                <td className="px-4 py-3 font-black text-indigo-900 italic">{word.name}</td>
                                                <td className="px-4 py-3 text-gray-600 text-xs min-w-[200px]">{word.definition || <span className="text-orange-400 italic">Empty - AI will fill</span>}</td>
                                                <td className="px-4 py-3 text-gray-500 text-[10px] font-bold">{word.synonyms || <span className="text-orange-300 italic">...</span>}</td>
                                                <td className="px-4 py-3 text-gray-500 text-[10px] italic">{word.example || <span className="text-orange-300 italic">...</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-indigo-50 bg-gray-50/50 flex justify-between items-center">
                    <button
                        onClick={() => step === 'preview' ? setStep('input') : onClose()}
                        className="text-gray-400 font-black text-[11px] uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                        {step === 'preview' ? 'Back to Edit' : 'Cancel'}
                    </button>
                    {step === 'input' ? (
                        <button
                            onClick={handleProcess}
                            disabled={!inputText.trim()}
                            className="bg-indigo-600 text-white px-12 py-3 rounded-xl font-black text-xs hover:bg-indigo-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            Next: Preview Words
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="bg-indigo-600 text-white px-16 py-3 rounded-xl font-black text-xs hover:bg-indigo-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            Import {processedWords.length} Words
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportWordsModal;
