import React, { useState, useMemo, useCallback } from 'react';
import { Word, TestType, MarkedWordsMap } from '../types';
import { Icons } from '../constants';

interface TestInterfaceProps {
  studyList: Word[];
  vocab: Word[];
  testType: TestType;
  markedWords: MarkedWordsMap;
  onToggleMark: (name: string) => void;
  onCancel: () => void;
}

const TestInterface: React.FC<TestInterfaceProps> = ({ studyList: initialStudyList, vocab, testType, markedWords, onToggleMark, onCancel }) => {
  const [currentTestList, setCurrentTestList] = useState<Word[]>(initialStudyList);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [localMarked, setLocalMarked] = useState<Record<number, boolean>>({});

  const stripExample = (def: string) => {
    if (def.includes('(Ex:')) {
      return def.split('(Ex:')[0].trim();
    }
    return def;
  };

  const mcQuestions = useMemo(() => {
    if (testType !== 'multiple-choice') return [];
    return currentTestList.map((word) => {
      const distractors: string[] = [];
      const maxAttempts = 50;
      let attempts = 0;
      const strippedCorrect = stripExample(word.definition);
      
      while (distractors.length < 3 && attempts < maxAttempts) {
        attempts++;
        const randIdx = Math.floor(Math.random() * vocab.length);
        const candidate = vocab[randIdx];
        const strippedCandidate = stripExample(candidate.definition);
        if (candidate.name !== word.name && !distractors.includes(strippedCandidate) && strippedCandidate !== strippedCorrect) {
          distractors.push(strippedCandidate);
        }
      }
      const options = [strippedCorrect, ...distractors].sort(() => Math.random() - 0.5);
      return { word, options, strippedCorrect };
    });
  }, [currentTestList, vocab, testType]);

  const results = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    const missed: Word[] = [];
    const markedIndices: number[] = [];

    currentTestList.forEach((word, idx) => {
      const userAns = (answers[idx] || '').trim().toLowerCase();
      const actual = stripExample(word.definition).trim().toLowerCase();
      const isCorrect = userAns === actual || (testType === 'type-in' && actual.includes(userAns) && userAns.length > 5);
      
      if (isCorrect) correct++;
      else missed.push(word);

      if (localMarked[idx] || markedWords[word.name]) {
        markedIndices.push(idx);
      }
    });

    const markedWordsList = currentTestList.filter((_, idx) => localMarked[idx] || markedWords[currentTestList[idx].name]);

    return {
      correct,
      total: currentTestList.length,
      percent: Math.round((correct / currentTestList.length) * 100),
      missed,
      marked: markedWordsList
    };
  }, [submitted, answers, currentTestList, testType, localMarked, markedWords]);

  const handleSubmit = () => setSubmitted(true);

  const handleStartFollowUp = () => {
    if (!results) return;
    // Combine missed and marked words, unique by name
    const combined = Array.from(new Set([...results.missed, ...results.marked].map(w => w.name)))
      .map(name => vocab.find(v => v.name === name)!);
    
    if (combined.length === 0) {
      alert("No words to re-quiz!");
      return;
    }
    
    setCurrentTestList(combined);
    setAnswers({});
    setSubmitted(false);
    setLocalMarked({});
  };

  const toggleLocalMark = (idx: number, wordName: string) => {
    setLocalMarked(prev => ({ ...prev, [idx]: !prev[idx] }));
    onToggleMark(wordName);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
      <div className="bg-white rounded-xl shadow-xl border border-indigo-50 overflow-hidden flex flex-col h-full">
        <div className="py-6 bg-indigo-900 text-white text-center">
          <h2 className="text-2xl font-black mb-1 italic tracking-tight">Vocabulary Test</h2>
          <p className="text-indigo-300 uppercase tracking-[0.3em] text-[10px] font-black">
            {testType === 'multiple-choice' ? 'Recognition' : 'Recall'} • {currentTestList.length} WORDS
          </p>
        </div>

        {submitted && results && (
          <div className="p-6 bg-indigo-50 border-b border-indigo-100 animate-in slide-in-from-top duration-300">
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
              <div className={`text-5xl font-black mb-1 ${results.percent >= 80 ? 'text-green-600' : results.percent >= 50 ? 'text-orange-500' : 'text-red-600'}`}>
                {results.percent}%
              </div>
              <div className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">{results.correct} / {results.total} Correct</div>
              
              <div className="flex gap-3 w-full max-w-sm">
                <button 
                  onClick={handleStartFollowUp}
                  className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg font-black text-xs hover:bg-indigo-700 shadow-md active:scale-95 transition-all uppercase tracking-widest"
                >
                  Re-quiz Missed/Marked
                </button>
                <button 
                  onClick={onCancel}
                  className="bg-gray-100 text-gray-600 px-6 py-2 rounded-lg font-black text-xs hover:bg-gray-200 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Finish
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 md:p-8 space-y-6 bg-gray-50/50 flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {currentTestList.map((word, idx) => {
            const userAns = answers[idx] || '';
            const strippedActual = stripExample(word.definition);
            const isCorrect = userAns.trim().toLowerCase() === strippedActual.trim().toLowerCase() || (testType === 'type-in' && strippedActual.toLowerCase().includes(userAns.toLowerCase()) && userAns.length > 5);
            const isMarked = localMarked[idx] || markedWords[word.name];

            return (
              <div key={idx} className={`bg-white rounded-lg p-6 shadow-sm border transition-all ${submitted ? (isCorrect ? 'border-green-200' : 'border-red-200') : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg font-black text-xs">
                      {idx + 1}
                    </span>
                    <h3 className="text-xl font-black text-indigo-900">{word.name}</h3>
                  </div>
                  <button 
                    onClick={() => toggleLocalMark(idx, word.name)}
                    className={`p-2 rounded-md transition-all ${isMarked ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-50 text-gray-300 hover:text-orange-400'}`}
                  >
                    <Icons.Flag />
                  </button>
                </div>

                {testType === 'multiple-choice' ? (
                  <div className="grid grid-cols-1 gap-2">
                    {mcQuestions[idx]?.options.map((opt, oIdx) => {
                      const isSelected = userAns === opt;
                      const isActualCorrect = opt === strippedActual;
                      let btnClass = "w-full text-left py-2 px-6 rounded-lg border-2 transition-all flex items-center gap-3 text-xs ";
                      if (submitted) {
                        if (isActualCorrect) btnClass += "bg-green-50 border-green-500 text-green-800 font-bold ";
                        else if (isSelected) btnClass += "bg-red-50 border-red-500 text-red-800 ";
                        else btnClass += "bg-gray-50 border-gray-100 text-gray-300 opacity-60 ";
                      } else {
                        btnClass += isSelected ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm " : "bg-white border-gray-100 text-gray-700 hover:border-indigo-300 ";
                      }
                      return (
                        <button key={oIdx} disabled={submitted} onClick={() => setAnswers(prev => ({...prev, [idx]: opt}))} className={btnClass}>
                          <div className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                            {isSelected && <div className="w-1 h-1 bg-white rounded-full" />}
                          </div>
                          <span className="leading-tight">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input 
                      disabled={submitted}
                      type="text"
                      placeholder="Type definition..."
                      className={`w-full py-3 px-8 rounded-lg border-2 outline-none transition-all text-sm font-bold
                        ${submitted 
                          ? (isCorrect ? 'bg-green-600 text-white border-green-800' : 'bg-red-600 text-white border-red-800')
                          : 'bg-gray-800 text-white border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 placeholder:text-gray-500'
                        }
                      `}
                      value={userAns}
                      onChange={(e) => setAnswers(prev => ({...prev, [idx]: e.target.value}))}
                    />
                    {submitted && !isCorrect && (
                      <div className="py-3 px-8 bg-indigo-900 text-indigo-100 border-l-4 border-indigo-400 rounded-lg text-xs font-medium">
                        <span className="font-black mr-2 uppercase opacity-60 text-[10px] tracking-widest">Correct Answer:</span> {strippedActual}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 bg-white border-t border-gray-50 flex gap-4">
          {!submitted ? (
            <>
              <button 
                onClick={handleSubmit}
                className="flex-1 py-3 px-12 bg-indigo-600 text-white rounded-lg font-black text-sm hover:bg-indigo-700 shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest"
              >
                SUBMIT TEST
              </button>
              <button 
                onClick={onCancel}
                className="px-12 py-3 bg-gray-200 text-gray-600 rounded-lg font-black text-sm hover:bg-gray-300 transition-all active:scale-[0.98] uppercase tracking-widest"
              >
                CANCEL
              </button>
            </>
          ) : (
            <button 
              onClick={onCancel}
              className="w-full py-3 px-12 bg-indigo-600 text-white rounded-lg font-black text-sm hover:bg-indigo-700 shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest"
            >
              FINISH TEST
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestInterface;