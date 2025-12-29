import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Word, WordStatusType } from '../types';
import { Icons } from './Icons';
import { seededShuffle } from '../utils';
import Flashcard from './Flashcard';
import { scoreWritingAnswerAI } from '../services/geminiService';

// --- Types ---

type LearnPhase = 'warmup' | 'round_a' | 'round_b' | 'round_c' | 'writing_test' | 'micro_review' | 'summary' | 'session_review' | 'session_summary';

interface WordProgress {
    roundA: boolean | null;
    roundB: boolean | null;
    roundC: boolean | null;
    writingTest: boolean | null;
    attempts: number;
    mastered: boolean;
    deferred: boolean;
}

interface LearnStateV2 {
    allGroups: Word[][];
    currentGroupIndex: number;
    phase: LearnPhase;
    wordProgress: { [wordName: string]: WordProgress };
    masteredThisSession: string[];
    deferredThisSession: string[];
    previousGroupItems: Word[];
    missedInRoundA: string[];
    missedInRoundB: string[];
    missedInRoundC: string[];
}

interface LearnSessionProps {
    studyList: Word[];
    onComplete: () => void;
    onUpdateWordStatus: (wordName: string, status: WordStatusType) => void;
}

// --- Constants ---

const FEEDBACK_DURATIONS: Record<string, number> = {
    round_a: 2500,
    round_b: 2000,
    round_c: 1500,
    writing_test: 2000,
    micro_review: 2000,
    session_review: 0,
};

const FAIL_FORWARD_MESSAGES = {
    wrong: "Not yet. You'll see this again.",
    deferred: "Taking a break from this one.",
    correct: "Got it!",
    mastered: "Locked in!",
    timeUp: "Time's up!",
};

// --- Helper: Clean definition for display ---
const cleanDef = (def: string) => {
    if (def.includes('(Ex:')) return def.split('(Ex:')[0].trim();
    return def;
};

// --- Helper: Extract synonyms from definition ---
const extractSynonyms = (def: string): string[] => {
    const synonyms: string[] = [];
    const words = def.toLowerCase().split(/[\s,;]+/);
    words.forEach(w => {
        const clean = w.replace(/[^a-z]/g, '');
        if (clean.length >= 3) synonyms.push(clean);
    });
    return synonyms;
};

// --- Helper Components ---

// 1. Warmup View - Flashcard preview (90 second timer, keyboard controls)
const WarmupView: React.FC<{
    group: Word[];
    groupIndex: number;
    totalGroups: number;
    onComplete: () => void;
}> = ({ group, groupIndex, totalGroups, onComplete }) => {
    const [index, setIndex] = useState(0);
    const [showDef, setShowDef] = useState(false);
    const [timeLeft, setTimeLeft] = useState(90);

    // Timer countdown - auto-skip when reaches 0
    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete(); // Auto-skip to quiz when timer runs out
            return;
        }
        const interval = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, onComplete]);


    const handleNext = useCallback(() => {
        if (index < group.length - 1) {
            setIndex(prev => prev + 1);
            setShowDef(false);
        } else {
            onComplete();
        }
    }, [index, group.length, onComplete]);

    const handlePrev = useCallback(() => {
        if (index > 0) {
            setIndex(prev => prev - 1);
            setShowDef(false);
        }
    }, [index]);

    const handleToggle = useCallback(() => {
        setShowDef(prev => !prev);
    }, []);

    // Keyboard controls - Space, Enter, Arrow keys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    handleToggle();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    handleNext();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    handlePrev();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleToggle, handleNext, handlePrev]);

    if (!group[index]) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center max-w-2xl mx-auto w-full px-4">
            {/* Header */}
            <div className="text-center mb-4 w-full">
                <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">
                        Group {groupIndex + 1} of {totalGroups}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${timeLeft > 30 ? 'bg-emerald-100 text-emerald-700' : timeLeft > 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-1">Warm Up</h2>
                <p className="text-sm text-slate-500">
                    Preview these {group.length} words
                </p>
            </div>

            {/* Progress */}
            <div className="w-full mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400">{index + 1}</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                            style={{ width: `${((index + 1) / group.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs font-black text-slate-400">{group.length}</span>
                </div>
            </div>

            {/* Flashcard */}
            <div className="w-full">
                <Flashcard
                    word={group[index]}
                    showDefinition={showDef}
                    onToggle={handleToggle}
                    status={null}
                />
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center justify-center w-full gap-3">
                <button
                    onClick={handlePrev}
                    disabled={index === 0}
                    className={`p-3 rounded-xl border-2 transition-all ${index === 0 ? 'border-slate-100 text-slate-300' : 'border-slate-200 text-slate-600 hover:border-indigo-300 active:scale-95'}`}
                >
                    <Icons.ChevronLeft />
                </button>

                <button
                    onClick={handleToggle}
                    className="flex-1 max-w-xs bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:border-indigo-300 transition-all active:scale-95"
                >
                    {showDef ? 'Hide' : 'Show'} Definition
                </button>

                <button
                    onClick={handleNext}
                    className="p-3 rounded-xl border-2 border-indigo-500 bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Icons.ChevronRight />
                </button>
            </div>

            <button
                onClick={onComplete}
                className="mt-6 text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest"
            >
                Skip to Quiz →
            </button>

            <div className="mt-6 text-[10px] text-slate-400 text-center">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded mr-1">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-100 rounded mx-1">Enter</kbd> = Flip &nbsp;|&nbsp;
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded mr-1">←</kbd><kbd className="px-1.5 py-0.5 bg-slate-100 rounded">→</kbd> = Navigate
            </div>
        </div>
    );
};

// 2. Quiz View - Multiple choice (correct = instant advance, wrong = feedback duration)
const QuizView: React.FC<{
    phase: 'round_a' | 'round_b' | 'round_c' | 'micro_review' | 'session_review';
    words: Word[];
    allVocab: Word[];
    groupIndex: number;
    totalGroups: number;
    wordProgress: { [wordName: string]: WordProgress };
    onAnswer: (wordName: string, correct: boolean) => void;
    onComplete: () => void;
    hideIndividualFeedback?: boolean;
}> = ({ phase, words, allVocab, groupIndex, totalGroups, wordProgress, onAnswer, onComplete, hideIndividualFeedback = false }) => {
    const [queue, setQueue] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [feedbackState, setFeedbackState] = useState<'none' | 'correct' | 'incorrect'>('none');

    // Timer for Rounds B (10s) and C (6s)
    const getTimeLimit = () => {
        if (phase === 'round_b') return 10;
        if (phase === 'round_c') return 6;
        return 0;
    };
    const [questionTimer, setQuestionTimer] = useState(getTimeLimit());

    // Initialize queue
    useEffect(() => {
        if (words.length > 0) {
            setQueue(seededShuffle([...words], Date.now()));
            setCurrentIndex(0);
            setSelectedOption(null);
            setFeedbackState('none');
        }
    }, [words, phase]);

    // Reset timer for each question
    useEffect(() => {
        setQuestionTimer(getTimeLimit());
    }, [currentIndex, phase]);

    // Timer countdown
    useEffect(() => {
        const limit = getTimeLimit();
        if (limit === 0 || feedbackState !== 'none' || !queue[currentIndex]) return;

        const interval = setInterval(() => {
            setQuestionTimer(prev => {
                if (prev <= 1) {
                    // Time's up
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [currentIndex, feedbackState, queue]);

    const handleTimeUp = useCallback(() => {
        const word = queue[currentIndex];
        if (!word || feedbackState !== 'none') return;

        setFeedbackState('incorrect');
        onAnswer(word.name, false);

        setTimeout(() => {
            advanceQuestion();
        }, FEEDBACK_DURATIONS[phase] || 2000);
    }, [queue, currentIndex, feedbackState, phase, onAnswer]);

    const advanceQuestion = useCallback(() => {
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setFeedbackState('none');
        } else {
            onComplete();
        }
    }, [currentIndex, queue.length, onComplete]);

    const currentWord = queue[currentIndex];

    // Generate options
    useEffect(() => {
        if (!currentWord) return;

        const correctDef = cleanDef(currentWord.definition);
        const distractors: string[] = [];
        let attempts = 0;

        while (distractors.length < 3 && attempts < 50) {
            attempts++;
            const rand = allVocab[Math.floor(Math.random() * allVocab.length)];
            const dDef = cleanDef(rand.definition);
            if (rand.name !== currentWord.name && dDef !== correctDef && !distractors.includes(dDef)) {
                distractors.push(dDef);
            }
        }

        setOptions(seededShuffle([correctDef, ...distractors], Date.now()));
    }, [currentWord, allVocab]);

    const handleSelect = useCallback((option: string) => {
        if (feedbackState !== 'none' || !currentWord) return;

        const correct = option === cleanDef(currentWord.definition);
        setSelectedOption(option);
        setFeedbackState(correct ? 'correct' : 'incorrect');
        onAnswer(currentWord.name, correct);

        if (correct) {
            // Correct = instant advance (300ms for visual feedback)
            setTimeout(advanceQuestion, 300);
        } else {
            // Wrong = show feedback for full duration
            setTimeout(advanceQuestion, FEEDBACK_DURATIONS[phase] || 2000);
        }
    }, [feedbackState, currentWord, phase, onAnswer, advanceQuestion]);

    if (!currentWord) return null;

    const progress = wordProgress[currentWord.name];
    const phaseNames: Record<string, string> = {
        round_a: 'Round A: First Pass',
        round_b: 'Round B: Review Missed',
        round_c: 'Round C: Final Check',
        micro_review: 'Quick Review',
        session_review: 'Final Review',
    };

    const getFeedbackMessage = () => {
        if (feedbackState === 'correct') {
            return progress?.mastered ? FAIL_FORWARD_MESSAGES.mastered : FAIL_FORWARD_MESSAGES.correct;
        }
        if (questionTimer === 0) return FAIL_FORWARD_MESSAGES.timeUp;
        return progress?.deferred ? FAIL_FORWARD_MESSAGES.deferred : FAIL_FORWARD_MESSAGES.wrong;
    };

    return (
        <div className="flex flex-col items-center max-w-lg mx-auto w-full px-4">
            {/* Header */}
            <div className="text-center mb-4 w-full">
                <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">
                        Group {groupIndex + 1} of {totalGroups}
                    </div>
                    {getTimeLimit() > 0 && feedbackState === 'none' && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${questionTimer > 5 ? 'bg-emerald-100 text-emerald-700' : questionTimer > 2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                            {questionTimer}s
                        </div>
                    )}
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-1">{phaseNames[phase]}</h2>
                <div className="text-xs text-slate-400">
                    {currentIndex + 1} of {queue.length}
                </div>
            </div>

            {/* Progress */}
            <div className="w-full mb-6">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Word */}
            <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-6">
                <h3 className="text-3xl font-black text-slate-900 text-center">
                    {currentWord.name}
                </h3>
            </div>

            {/* Options */}
            <div className="w-full space-y-3 mb-4">
                {options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === cleanDef(currentWord.definition);
                    const showResult = feedbackState !== 'none' && !hideIndividualFeedback;

                    let bgClass = 'bg-white hover:bg-slate-50 border-slate-200';
                    if (showResult && isCorrect) bgClass = 'bg-emerald-50 border-emerald-300';
                    else if (showResult && isSelected) bgClass = 'bg-red-50 border-red-300';
                    else if (isSelected) bgClass = 'bg-indigo-50 border-indigo-300';

                    return (
                        <button
                            key={i}
                            onClick={() => handleSelect(opt)}
                            disabled={feedbackState !== 'none'}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${bgClass}`}
                        >
                            <span className="text-sm font-medium text-slate-700">{opt}</span>
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            {feedbackState !== 'none' && !hideIndividualFeedback && (
                <div className={`w-full p-4 rounded-xl border ${feedbackState === 'correct' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <p className={`text-sm font-bold ${feedbackState === 'correct' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {getFeedbackMessage()}
                    </p>
                    {feedbackState === 'incorrect' && (
                        <p className="text-sm text-slate-600 mt-1">
                            <span className="font-semibold">Answer:</span> {cleanDef(currentWord.definition)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

// 3. Writing Test View (Timed: 3s, Re-test missed)
const WritingTestView: React.FC<{
    words: Word[];
    groupIndex: number;
    totalGroups: number;
    onAnswer: (wordName: string, correct: boolean) => void;
    onComplete: () => void;
}> = ({ words, groupIndex, totalGroups, onAnswer, onComplete }) => {
    const [queue, setQueue] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedbackState, setFeedbackState] = useState<'none' | 'checking' | 'correct' | 'incorrect'>('none');
    const [correctAnswer, setCorrectAnswer] = useState('');

    // Timer state for auto-reveal
    const [timer, setTimer] = useState(20);

    useEffect(() => {
        if (words.length > 0) {
            setQueue(seededShuffle([...words], Date.now()));
            setCurrentIndex(0);
            setUserInput('');
            setFeedbackState('none');
            setTimer(20);
        }
    }, [words]);

    const currentWord = queue[currentIndex];

    // Timer logic
    useEffect(() => {
        if (feedbackState !== 'none' || !currentWord) return;

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    handleTimeout(); // Handle timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [feedbackState, currentWord]);

    const handleTimeout = useCallback(() => {
        if (!currentWord) return;
        setCorrectAnswer(cleanDef(currentWord.definition));
        setFeedbackState('incorrect');
        onAnswer(currentWord.name, false); // Mark as wrong

        // Re-queue the missed word
        setQueue(prev => [...prev, currentWord]);

        // Auto-advance after delay
        setTimeout(() => {
            advanceNext();
        }, 3500);
    }, [currentWord, onAnswer]);

    const advanceNext = useCallback(() => {
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setUserInput('');
            setFeedbackState('none');
            setTimer(20); // Reset timer
        } else {
            onComplete();
        }
    }, [currentIndex, queue.length, onComplete]);

    const handleSubmit = useCallback(async () => {
        if (!currentWord || feedbackState !== 'none' || !userInput.trim()) return;

        setFeedbackState('checking');
        const synonyms = extractSynonyms(currentWord.definition);

        // Try AI scoring first
        const aiResult = await scoreWritingAnswerAI(userInput, currentWord.definition, synonyms);

        let isCorrect = false;
        if (aiResult !== null) {
            isCorrect = aiResult;
        } else {
            // Fallback: simple keyword match
            const userWords = userInput.toLowerCase().split(/\s+/);
            const defWords = currentWord.definition.toLowerCase().split(/\s+/);
            const matches = userWords.filter(w => defWords.includes(w) || synonyms.includes(w));
            isCorrect = matches.length >= 1;
        }

        setCorrectAnswer(cleanDef(currentWord.definition));
        setFeedbackState(isCorrect ? 'correct' : 'incorrect');
        onAnswer(currentWord.name, isCorrect);

        // Re-queue if incorrect
        if (!isCorrect) {
            setQueue(prev => [...prev, currentWord]);
        }

        setTimeout(() => {
            advanceNext();
        }, isCorrect ? 800 : 3500);
    }, [currentWord, feedbackState, userInput, currentIndex, queue.length, onAnswer, advanceNext]);

    if (!currentWord) return null;

    return (
        <div className="flex flex-col items-center max-w-lg mx-auto w-full px-4">
            <div className="text-center mb-4 w-full">
                <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">
                        Group {groupIndex + 1} of {totalGroups}
                    </div>
                    {feedbackState === 'none' && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${timer > 10 ? 'bg-emerald-100 text-emerald-700' : timer > 5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                            {timer}s
                        </div>
                    )}
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-1">Writing Test</h2>
                <div className="text-xs text-slate-400">{currentIndex + 1} of {queue.length}</div>
            </div>

            <div className="w-full mb-6">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                        style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                    />
                </div>
            </div>

            <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-6">
                <h3 className="text-3xl font-black text-slate-900 text-center">
                    {currentWord.name}
                </h3>
            </div>

            <div className="w-full mb-4">
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type the definition or meaning..."
                    disabled={feedbackState !== 'none'}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-400 focus:outline-none resize-none bg-white"
                    rows={3}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={feedbackState !== 'none' || !userInput.trim()}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-50"
            >
                {feedbackState === 'checking' ? 'Checking...' : 'Submit'}
            </button>

            {(feedbackState === 'correct' || feedbackState === 'incorrect') && (
                <div className={`w-full mt-4 p-5 rounded-xl border-2 ${feedbackState === 'correct' ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
                    <p className={`text-lg font-bold mb-2 ${feedbackState === 'correct' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {feedbackState === 'correct' ? 'Correct!' : "Not quite. Here's the answer:"}
                    </p>
                    <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                        <span className="font-semibold text-indigo-600">{currentWord.name}:</span> {correctAnswer}
                    </p>
                </div>
            )}
        </div>
    );
};


// 4. Group Summary
const GroupSummary: React.FC<{
    groupIndex: number;
    totalGroups: number;
    masteredCount: number;
    deferredCount: number;
    onContinue: () => void;
}> = ({ groupIndex, totalGroups, masteredCount, deferredCount, onContinue }) => (
    <div className="flex flex-col items-center max-w-md mx-auto text-center py-8 px-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <Icons.Check />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Group {groupIndex + 1} Complete</h2>

        <div className="flex gap-4 my-6">
            <div className="bg-emerald-50 px-6 py-4 rounded-xl border border-emerald-100">
                <div className="text-2xl font-black text-emerald-600">{masteredCount}</div>
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Mastered</div>
            </div>
            {deferredCount > 0 && (
                <div className="bg-amber-50 px-6 py-4 rounded-xl border border-amber-100">
                    <div className="text-2xl font-black text-amber-600">{deferredCount}</div>
                    <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Deferred</div>
                </div>
            )}
        </div>

        <button
            onClick={onContinue}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg"
        >
            {groupIndex + 1 < totalGroups ? 'Next Group' : 'Final Review'}
        </button>
    </div>
);

// 5. Session Summary
const SessionSummary: React.FC<{
    masteredCount: number;
    deferredCount: number;
    totalWords: number;
    onExit: () => void;
}> = ({ masteredCount, deferredCount, totalWords, onExit }) => (
    <div className="flex flex-col items-center max-w-md mx-auto text-center py-8 px-4">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Icons.Trophy />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Session Complete</h2>
        <p className="text-slate-500 mb-8">You studied {totalWords} words</p>

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <div className="text-4xl font-black text-emerald-500 mb-1">{masteredCount}</div>
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Mastered</div>
            </div>
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <div className="text-4xl font-black text-amber-500 mb-1">{deferredCount}</div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-widest">Try Later</div>
            </div>
        </div>

        <button
            onClick={onExit}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-xl"
        >
            Back to Dashboard
        </button>
    </div>
);

// --- Main Component ---

const LearnSession: React.FC<LearnSessionProps> = React.memo(({
    studyList,
    onComplete,
    onUpdateWordStatus
}) => {
    const [state, setState] = useState<LearnStateV2>(() => {
        const groups: Word[][] = [];
        for (let i = 0; i < studyList.length; i += 5) {
            groups.push(studyList.slice(i, i + 5));
        }

        const progress: { [name: string]: WordProgress } = {};
        studyList.forEach(w => {
            progress[w.name] = {
                roundA: null,
                roundB: null,
                roundC: null,
                writingTest: null,
                attempts: 0,
                mastered: false,
                deferred: false,
            };
        });

        return {
            allGroups: groups,
            currentGroupIndex: 0,
            phase: groups.length > 0 ? 'warmup' : 'session_summary',
            wordProgress: progress,
            masteredThisSession: [],
            deferredThisSession: [],
            previousGroupItems: [],
            missedInRoundA: [],
            missedInRoundB: [],
            missedInRoundC: [],
        };
    });

    const currentGroup = state.allGroups[state.currentGroupIndex] || [];

    // Get words for current round (B and C only test missed from previous round)
    const wordsForCurrentRound = useMemo(() => {
        if (state.phase === 'round_a') {
            return currentGroup;
        } else if (state.phase === 'round_b') {
            // Only test words missed in Round A
            const missed = currentGroup.filter(w => state.wordProgress[w.name]?.roundA === false);
            return missed.length > 0 ? missed : currentGroup;
        } else if (state.phase === 'round_c') {
            // Only test words missed in Round B
            const missed = currentGroup.filter(w => state.wordProgress[w.name]?.roundB === false);
            return missed.length > 0 ? missed : currentGroup;
        } else if (state.phase === 'writing_test') {
            // Test ALL words in the group for writing practice
            return currentGroup;
        }
        return currentGroup;
    }, [state.phase, currentGroup, state.wordProgress]);


    const handleAnswer = useCallback((wordName: string, correct: boolean) => {
        setState(prev => {
            const progress = { ...prev.wordProgress };
            const wp = { ...progress[wordName] };

            wp.attempts++;

            if (prev.phase === 'round_a') wp.roundA = correct;
            else if (prev.phase === 'round_b') wp.roundB = correct;
            else if (prev.phase === 'round_c') wp.roundC = correct;
            else if (prev.phase === 'writing_test') wp.writingTest = correct;

            // Mastery: correct in 2+ rounds
            const roundResults = [wp.roundA, wp.roundB, wp.roundC, wp.writingTest].filter(r => r === true);
            if (roundResults.length >= 2) {
                wp.mastered = true;
            }

            // Defer after 3 failed attempts
            if (wp.attempts >= 3 && !wp.mastered && !correct) {
                wp.deferred = true;
            }

            progress[wordName] = wp;
            return { ...prev, wordProgress: progress };
        });
    }, []);

    const advancePhase = useCallback(() => {
        setState(prev => {
            const { phase, currentGroupIndex, allGroups, wordProgress } = prev;
            const currentGrp = allGroups[currentGroupIndex] || [];
            const totalGroups = allGroups.length;

            // Check if there are missed words for next round
            const missedInA = currentGrp.filter(w => wordProgress[w.name]?.roundA === false);
            const missedInB = currentGrp.filter(w => wordProgress[w.name]?.roundB === false);
            const missedInC = currentGrp.filter(w => wordProgress[w.name]?.roundC === false);

            switch (phase) {
                case 'warmup':
                    return { ...prev, phase: 'round_a' };

                case 'round_a':
                    // If no wrong answers, skip to writing test
                    if (missedInA.length === 0) {
                        return { ...prev, phase: 'writing_test' };
                    }
                    return { ...prev, phase: 'round_b' };

                case 'round_b':
                    if (missedInB.length === 0) {
                        return { ...prev, phase: 'writing_test' };
                    }
                    return { ...prev, phase: 'round_c' };

                case 'round_c':
                    return { ...prev, phase: 'writing_test' };

                case 'writing_test':
                    return { ...prev, phase: 'micro_review' };

                case 'micro_review': {
                    const groupMastered = currentGrp.filter(w => wordProgress[w.name]?.mastered).map(w => w.name);
                    const groupDeferred = currentGrp.filter(w => wordProgress[w.name]?.deferred).map(w => w.name);

                    groupMastered.forEach(name => onUpdateWordStatus(name, 'mastered'));
                    groupDeferred.forEach(name => onUpdateWordStatus(name, 'review'));

                    return {
                        ...prev,
                        phase: 'summary',
                        masteredThisSession: [...prev.masteredThisSession, ...groupMastered.filter(n => !prev.masteredThisSession.includes(n))],
                        deferredThisSession: [...prev.deferredThisSession, ...groupDeferred.filter(n => !prev.deferredThisSession.includes(n))],
                    };
                }

                case 'summary':
                    if (currentGroupIndex + 1 < totalGroups) {
                        const nextGroup = allGroups[currentGroupIndex + 1] || [];
                        const newProgress = { ...wordProgress };
                        nextGroup.forEach(w => {
                            newProgress[w.name] = {
                                roundA: null, roundB: null, roundC: null, writingTest: null,
                                attempts: 0, mastered: false, deferred: false,
                            };
                        });

                        return {
                            ...prev,
                            currentGroupIndex: currentGroupIndex + 1,
                            phase: 'warmup',
                            wordProgress: newProgress,
                            previousGroupItems: currentGrp,
                        };
                    }
                    return { ...prev, phase: 'session_review' };

                case 'session_review':
                    return { ...prev, phase: 'session_summary' };

                default:
                    return prev;
            }
        });
    }, [onUpdateWordStatus]);

    const microReviewWords = useMemo(() => {
        const current = seededShuffle([...currentGroup], Date.now()).slice(0, 3);
        const previous = state.previousGroupItems.length > 0
            ? [state.previousGroupItems[Math.floor(Math.random() * state.previousGroupItems.length)]]
            : [];
        return seededShuffle([...current, ...previous], Date.now());
    }, [currentGroup, state.previousGroupItems]);

    const sessionReviewWords = useMemo(() => {
        const allWords = state.allGroups.flat();
        const count = Math.min(10, Math.max(5, Math.floor(allWords.length / 2)));
        return seededShuffle([...allWords], Date.now()).slice(0, count);
    }, [state.allGroups]);

    const groupStats = useMemo(() => ({
        mastered: currentGroup.filter(w => state.wordProgress[w.name]?.mastered).length,
        deferred: currentGroup.filter(w => state.wordProgress[w.name]?.deferred).length,
    }), [currentGroup, state.wordProgress]);

    if (studyList.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-800 mb-4">No Words to Study</h2>
                    <button onClick={onComplete} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
            <div className="fixed top-4 left-4 z-50">
                <button
                    onClick={onComplete}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-slate-100"
                >
                    <Icons.ChevronLeft /> Exit
                </button>
            </div>

            {state.phase === 'warmup' && (
                <WarmupView
                    group={currentGroup}
                    groupIndex={state.currentGroupIndex}
                    totalGroups={state.allGroups.length}
                    onComplete={advancePhase}
                />
            )}

            {(state.phase === 'round_a' || state.phase === 'round_b' || state.phase === 'round_c') && (
                <QuizView
                    phase={state.phase}
                    words={wordsForCurrentRound}
                    allVocab={studyList}
                    groupIndex={state.currentGroupIndex}
                    totalGroups={state.allGroups.length}
                    wordProgress={state.wordProgress}
                    onAnswer={handleAnswer}
                    onComplete={advancePhase}
                />
            )}

            {state.phase === 'writing_test' && (
                <WritingTestView
                    words={wordsForCurrentRound}
                    groupIndex={state.currentGroupIndex}
                    totalGroups={state.allGroups.length}
                    onAnswer={handleAnswer}
                    onComplete={advancePhase}
                />
            )}

            {state.phase === 'micro_review' && (
                <QuizView
                    phase="micro_review"
                    words={microReviewWords}
                    allVocab={studyList}
                    groupIndex={state.currentGroupIndex}
                    totalGroups={state.allGroups.length}
                    wordProgress={state.wordProgress}
                    onAnswer={() => { }}
                    onComplete={advancePhase}
                />
            )}

            {state.phase === 'summary' && (
                <GroupSummary
                    groupIndex={state.currentGroupIndex}
                    totalGroups={state.allGroups.length}
                    masteredCount={groupStats.mastered}
                    deferredCount={groupStats.deferred}
                    onContinue={advancePhase}
                />
            )}

            {state.phase === 'session_review' && (
                <QuizView
                    phase="session_review"
                    words={sessionReviewWords}
                    allVocab={studyList}
                    groupIndex={state.allGroups.length - 1}
                    totalGroups={state.allGroups.length}
                    wordProgress={state.wordProgress}
                    onAnswer={() => { }}
                    onComplete={advancePhase}
                    hideIndividualFeedback={true}
                />
            )}

            {state.phase === 'session_summary' && (
                <SessionSummary
                    masteredCount={state.masteredThisSession.length}
                    deferredCount={state.deferredThisSession.length}
                    totalWords={studyList.length}
                    onExit={onComplete}
                />
            )}
        </div>
    );
});

export default LearnSession;
