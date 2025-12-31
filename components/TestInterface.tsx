import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Word, TestType, MarkedWordsMap, WordStatusType } from '../types';
import { Icons } from './Icons';
import { scoreWritingAnswerAI } from '../services/groqService';
import { scoreAnswerOffline, extractSynonyms, cleanDef } from '../utils';

interface TestInterfaceProps {
  studyList: Word[];
  vocab: Word[];
  testType: TestType;
  markedWords: MarkedWordsMap;
  wordStatuses: Record<string, WordStatusType>;
  onToggleMark: (name: string) => void;
  onUpdateWordStatus: (wordName: string, status: WordStatusType) => void;
  onCancel: () => void;
}

interface TestResult {
  correct: number;
  total: number;
  percent: number;
  missed: Word[];
  mastered: Word[];
  marked: Word[];
}

const TestInterface: React.FC<TestInterfaceProps> = ({
  studyList: initialStudyList,
  vocab,
  testType,
  markedWords,
  wordStatuses,
  onToggleMark,
  onUpdateWordStatus,
  onCancel
}) => {
  const [currentTestList, setCurrentTestList] = useState<Word[]>(initialStudyList);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [localMarked, setLocalMarked] = useState<Record<number, boolean>>({});
  const [keepInPool, setKeepInPool] = useState<Record<number, boolean>>({});
  const [cycleNumber, setCycleNumber] = useState(1);
  const [totalMasteredThisSession, setTotalMasteredThisSession] = useState(0);
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});
  const [aiResults, setAiResults] = useState<Record<number, boolean | null>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  const mcQuestions = useMemo(() => {
    if (testType !== 'multiple-choice') return [];
    return currentTestList.map((word) => {
      const distractors: string[] = [];
      const maxAttempts = 50;
      let attempts = 0;
      const strippedCorrect = cleanDef(word.definition);

      while (distractors.length < 3 && attempts < maxAttempts) {
        attempts++;
        const randIdx = Math.floor(Math.random() * vocab.length);
        const candidate = vocab[randIdx];
        const strippedCandidate = cleanDef(candidate.definition);
        if (candidate.name !== word.name && !distractors.includes(strippedCandidate) && strippedCandidate !== strippedCorrect) {
          distractors.push(strippedCandidate);
        }
      }
      const options = [strippedCorrect, ...distractors].sort(() => Math.random() - 0.5);
      return { word, options, strippedCorrect };
    });
  }, [currentTestList, vocab, testType]);

  const isAnswerCorrect = useCallback((idx: number) => {
    // Check manual override first
    if (overrides[idx] !== undefined) {
      return overrides[idx];
    }

    // Check AI result if available
    if (aiResults[idx] === true) return true;
    if (aiResults[idx] === false) return false;

    const word = currentTestList[idx];
    const userAns = (answers[idx] || '').trim();
    const actual = cleanDef(word.definition).trim();

    // For multiple choice, exact match required
    if (testType === 'multiple-choice') {
      return userAns.toLowerCase() === actual.toLowerCase();
    }

    // Use centralized offline scoring
    const synonyms = extractSynonyms(word.definition);
    return scoreAnswerOffline(userAns, actual, synonyms);
  }, [answers, currentTestList, testType, overrides, aiResults]);

  const results = useMemo((): TestResult | null => {
    if (!submitted) return null;
    let correct = 0;
    const missed: Word[] = [];
    const mastered: Word[] = [];

    currentTestList.forEach((word, idx) => {
      const isCorrect = isAnswerCorrect(idx);
      if (isCorrect) {
        correct++;
        if (!keepInPool[idx]) {
          mastered.push(word);
        }
      } else {
        missed.push(word);
      }
    });

    const markedWordsList = currentTestList.filter((_, idx) => localMarked[idx] || markedWords[currentTestList[idx].name]);

    return {
      correct,
      total: currentTestList.length,
      percent: Math.round((correct / currentTestList.length) * 100),
      missed,
      mastered,
      marked: markedWordsList
    };
  }, [submitted, answers, currentTestList, testType, localMarked, markedWords, keepInPool, isAnswerCorrect]);

  useEffect(() => {
    if (!results) return;
    results.mastered.forEach(word => {
      onUpdateWordStatus(word.name, 'mastered');
    });
    results.missed.forEach(word => {
      onUpdateWordStatus(word.name, 'review');
    });
    setTotalMasteredThisSession(prev => prev + results.mastered.length);
  }, [results, onUpdateWordStatus]);

  const handleSubmit = async () => {
    if (testType === 'type-in') {
      setIsEvaluating(true);
      const newAiResults: Record<number, boolean | null> = {};

      // Run all AI evaluations in parallel
      const aiPromises = currentTestList.map(async (word, idx) => {
        const userAns = (answers[idx] || '').trim();
        if (!userAns) {
          newAiResults[idx] = false;
          return;
        }

        const synonyms = extractSynonyms(word.definition);
        const result = await scoreWritingAnswerAI(userAns, cleanDef(word.definition), synonyms);
        newAiResults[idx] = result;
      });

      await Promise.all(aiPromises);
      setAiResults(newAiResults);
      setIsEvaluating(false);
    }

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueLearning = useCallback(() => {
    if (!results || results.missed.length === 0) return;
    // Shuffle the missed words for variety
    const shuffled = [...results.missed].sort(() => Math.random() - 0.5);
    setCurrentTestList(shuffled);
    setAnswers({});
    setSubmitted(false);
    setLocalMarked({});
    setKeepInPool({});
    setOverrides({});
    setAiResults({});
    setCycleNumber(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [results]);

  const handleReQuizAll = useCallback(() => {
    if (!results) return;
    const combined = Array.from(new Set([...results.missed, ...results.marked].map(w => w.name)))
      .map(name => vocab.find(v => v.name === name)!);
    if (combined.length === 0) {
      return;
    }
    setCurrentTestList(combined.sort(() => Math.random() - 0.5));
    setAnswers({});
    setSubmitted(false);
    setLocalMarked({});
    setKeepInPool({});
    setOverrides({});
    setAiResults({});
    setCycleNumber(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [results, vocab]);

  const toggleLocalMark = (idx: number, wordName: string) => {
    setLocalMarked(prev => ({ ...prev, [idx]: !prev[idx] }));
    onToggleMark(wordName);
  };

  const toggleKeepInPool = (idx: number) => {
    setKeepInPool(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Progress calculation
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / currentTestList.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/50">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-indigo-100/50 border border-white/50 mb-6 overflow-hidden">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  {cycleNumber > 1 ? `Round ${cycleNumber}` : 'Vocabulary Test'}
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {testType === 'multiple-choice' ? 'Multiple Choice' : 'Type Answer'} • {currentTestList.length} questions
                </p>
              </div>
              <div className="flex items-center gap-3">
                {cycleNumber > 1 && (
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <Icons.Trophy />
                    <span>{totalMasteredThisSession} mastered</span>
                  </div>
                )}
                <button
                  onClick={onCancel}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Icons.Close />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {!submitted && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{answeredCount} of {currentTestList.length} answered</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Card */}
        {submitted && results && (
          <div className="bg-white rounded-2xl shadow-lg shadow-indigo-100/50 border border-slate-100 mb-6 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-8 text-center">
              {/* Score Circle */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                  <circle
                    cx="64" cy="64" r="56"
                    stroke={results.percent >= 80 ? '#10b981' : results.percent >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${results.percent * 3.52} 352`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${results.percent >= 80 ? 'text-emerald-600' : results.percent >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {results.percent}%
                  </span>
                </div>
              </div>

              <p className="text-slate-500 text-sm mb-6">
                You got <span className="font-semibold text-slate-700">{results.correct}</span> out of <span className="font-semibold text-slate-700">{results.total}</span> correct
              </p>

              {/* Stats Pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl">
                  <Icons.Trophy />
                  <span className="text-sm font-medium">{results.mastered.length} Mastered</span>
                </div>
                {Object.values(aiResults).filter(v => v === true).length > 0 && (
                  <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-md">
                    <Icons.Brain />
                    <span className="text-sm font-medium">{Object.values(aiResults).filter(v => v === true).length} AI Validated</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl">
                  <Icons.Brain />
                  <span className="text-sm font-medium">{results.missed.length} To Review</span>
                </div>
                {results.marked.length > 0 && (
                  <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-xl">
                    <Icons.Flag />
                    <span className="text-sm font-medium">{results.marked.length} Flagged</span>
                  </div>
                )}
              </div>

              {/* Perfect Score Message */}
              {results.missed.length === 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-emerald-800">Perfect Score</h3>
                  <p className="text-emerald-600 text-sm">All words have been mastered.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                {results.missed.length > 0 && (
                  <button
                    onClick={handleContinueLearning}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all active:scale-[0.98] shadow-lg shadow-indigo-200"
                  >
                    <Icons.Brain />
                    Continue Learning
                  </button>
                )}
                {results.marked.length > 0 && (
                  <button
                    onClick={handleReQuizAll}
                    className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-medium transition-all active:scale-[0.98]"
                  >
                    <Icons.Flag />
                    Include Flagged
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all active:scale-[0.98] ${results.missed.length === 0
                    ? 'flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                >
                  {results.missed.length === 0 ? 'Complete' : 'Finish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {currentTestList.map((word, idx) => {
            const userAns = answers[idx] || '';
            const strippedActual = cleanDef(word.definition);
            const isCorrect = isAnswerCorrect(idx);
            const isMarked = localMarked[idx] || markedWords[word.name];
            const isAnswered = userAns.length > 0;

            return (
              <div
                key={`${cycleNumber}-${idx}`}
                className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${submitted
                  ? isCorrect
                    ? 'border-emerald-200 shadow-lg shadow-emerald-100/50'
                    : 'border-red-200 shadow-lg shadow-red-100/50'
                  : isAnswered
                    ? 'border-indigo-200 shadow-lg shadow-indigo-100/50'
                    : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                  }`}
              >
                {/* Question Header */}
                <div className={`px-5 py-4 flex items-center justify-between ${submitted
                  ? isCorrect ? 'bg-emerald-50/50' : 'bg-red-50/50'
                  : isAnswered ? 'bg-indigo-50/30' : 'bg-slate-50/50'
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold ${submitted
                      ? isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      : isAnswered ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">{word.name}</h3>
                    {wordStatuses[word.name] && (
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${wordStatuses[word.name] === 'mastered'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-amber-100 text-amber-600'
                        }`}>
                        {wordStatuses[word.name]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {submitted && isCorrect && (
                      <button
                        onClick={() => toggleKeepInPool(idx)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${keepInPool[idx]
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                          }`}
                      >
                        <Icons.Book />
                        {keepInPool[idx] ? 'Kept in pool' : 'Keep learning'}
                      </button>
                    )}
                    <button
                      onClick={() => toggleLocalMark(idx, word.name)}
                      className={`p-2 rounded-lg transition-all ${isMarked
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-300 hover:text-orange-500 hover:bg-orange-50'
                        }`}
                    >
                      <Icons.Flag />
                    </button>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="p-5">
                  {testType === 'multiple-choice' ? (
                    <div className="space-y-2">
                      {mcQuestions[idx]?.options.map((opt, oIdx) => {
                        const isSelected = userAns === opt;
                        const isActualCorrect = opt === strippedActual;

                        return (
                          <button
                            key={oIdx}
                            disabled={submitted}
                            onClick={() => setAnswers(prev => ({ ...prev, [idx]: opt }))}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${submitted
                              ? isActualCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : isSelected
                                  ? 'bg-red-50 border-red-300 text-red-800'
                                  : 'bg-slate-50 border-slate-100 text-slate-400'
                              : isSelected
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                                : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30'
                              }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${submitted
                              ? isActualCorrect
                                ? 'border-emerald-500 bg-emerald-500'
                                : isSelected
                                  ? 'border-red-500 bg-red-500'
                                  : 'border-slate-200'
                              : isSelected
                                ? 'border-indigo-500 bg-indigo-500'
                                : 'border-slate-300'
                              }`}>
                              {(isSelected || (submitted && isActualCorrect)) && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <span className="text-sm leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        disabled={submitted}
                        type="text"
                        placeholder="Type the definition..."
                        className={`w-full py-3.5 px-5 rounded-xl border-2 outline-none transition-all text-sm ${submitted
                          ? isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-400'
                          }`}
                        value={userAns}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                      />
                      {submitted && !isCorrect && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                          <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Correct answer</span>
                          <p className="text-slate-700 mt-1">{strippedActual}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Indicator with Override */}
                  {submitted && (
                    <div className="flex items-center justify-between mt-4">
                      <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isCorrect ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex items-center gap-2">
                              {keepInPool[idx] ? 'Correct — Kept in study pool' : 'Correct — Marked as mastered'}
                              {aiResults[idx] === true && (
                                <div className="flex items-center gap-1 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                  <Icons.Brain />
                                  AI Validated
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                            Incorrect — Added to review list
                            {aiResults[idx] === false && (
                              <div className="flex items-center gap-1 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ml-2">
                                <Icons.Brain />
                                AI Verified
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => setOverrides(prev => ({
                          ...prev,
                          [idx]: !isCorrect
                        }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${overrides[idx] !== undefined
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                          }`}
                        title="Override: click to mark as correct/incorrect"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Override
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        {!submitted && (
          <div className="sticky bottom-6 mt-6">
            <button
              onClick={handleSubmit}
              disabled={answeredCount === 0 || isEvaluating}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-base transition-all active:scale-[0.99] shadow-xl shadow-indigo-200/50 flex items-center justify-center gap-2"
            >
              {isEvaluating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Evaluating Answers...
                </>
              ) : (
                'Submit Test'
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default TestInterface;