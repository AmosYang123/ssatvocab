import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { Word, WordStatusType, StudyMode, TestType, WordStatusMap, MarkedWordsMap, StudySet } from './types';
import { PLACEHOLDER_VOCAB } from './data/vocab';
import { Icons } from './components/Icons';
import { seededShuffle } from './utils';
import StatsDashboard from './components/StatsDashboard';
import Flashcard from './components/Flashcard';
import ModeSelector from './components/ModeSelector';
import WordSelectorModal from './components/WordSelectorModal';
import ProgressBar from './components/ProgressBar';
import LoginPage from './components/LoginPage';
import { authService } from './authService';

const TestInterface = lazy(() => import('./components/TestInterface'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));

export default function App() {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<string | null>(authService.getCurrentUser());

  // --- STATE ---
  const [vocab] = useState<Word[]>(PLACEHOLDER_VOCAB);

  // Data Persistence (now empty by default, loaded from DB)
  const [wordStatuses, setWordStatuses] = useState<WordStatusMap>({});
  const [markedWords, setMarkedWords] = useState<MarkedWordsMap>({});
  const [savedSets, setSavedSets] = useState<StudySet[]>([]);

  // Navigation Persistence
  const [studyMode, setStudyMode] = useState<StudyMode>('all');
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [showDefinition, setShowDefinition] = useState(false);

  // Modals / Overlays
  const [showWordSelector, setShowWordSelector] = useState(false);
  const [showTestOptions, setShowTestOptions] = useState(false);
  const [testActive, setTestActive] = useState(false);
  const [testType, setTestType] = useState<TestType>('multiple-choice');
  const [showJumpSearch, setShowJumpSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Shuffle State
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);

  // --- PERSISTENCE: Loading ---
  useEffect(() => {
    async function loadUserData() {
      if (currentUser) {
        // Load user data
        const userData = await authService.getCurrentUserData();
        if (userData) {
          setWordStatuses(userData.wordStatuses || {});
          setMarkedWords(userData.markedWords || {});
          setSavedSets(userData.savedSets || []);
        }

        // Navigation stats from localStorage
        setStudyMode((localStorage.getItem(`ssat_${currentUser}_mode`) as StudyMode) || 'all');
        setActiveSetId(localStorage.getItem(`ssat_${currentUser}_set_id`));
        const lastIdx = localStorage.getItem(`ssat_${currentUser}_index`);
        setCurrentIndex(lastIdx ? parseInt(lastIdx, 10) : 0);
      }
      setIsDataLoaded(true);
    }
    loadUserData();
  }, [currentUser]);

  // --- PERSISTENCE: Saving ---
  useEffect(() => {
    if (isDataLoaded && currentUser) {
      authService.saveUserData(currentUser, { wordStatuses, markedWords, savedSets });
    }
  }, [wordStatuses, markedWords, savedSets, currentUser, isDataLoaded]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`ssat_${currentUser}_mode`, studyMode);
      if (activeSetId) localStorage.setItem(`ssat_${currentUser}_set_id`, activeSetId);
      else localStorage.removeItem(`ssat_${currentUser}_set_id`);
      localStorage.setItem(`ssat_${currentUser}_index`, currentIndex.toString());
    }
  }, [studyMode, activeSetId, currentIndex, currentUser]);

  // --- LOGIC: Mode Switching ---
  const studyList = useMemo(() => {
    let list: Word[] = [];

    // Special handling for Random (50) mode: always shuffle entire vocab and take 50
    if (studyMode === 'random') {
      // Use the seed to shuffle the whole vocab, then take 50
      // If seed is 0 (initial), we still want a random set, so we force a seed if none exists?
      // Actually, updateStudyList ensures we have a seed for random mode.
      // But let's handle the default case where shuffleSeed might be 0 but user switched via other means (though updateStudyList handles it).
      const effectiveSeed = shuffleSeed === 0 ? Date.now() : shuffleSeed;
      const shuffled = seededShuffle(vocab, effectiveSeed);
      return shuffled.slice(0, 50);
    }

    // For other modes, we filter first, THEN shuffle if there is a seed
    switch (studyMode) {
      case 'all':
        list = vocab;
        break;
      case 'mastered':
        list = vocab.filter(w => wordStatuses[w.name] === 'mastered');
        break;
      case 'review':
        list = vocab.filter(w => wordStatuses[w.name] === 'review');
        break;
      case 'marked':
        list = vocab.filter(w => markedWords[w.name]);
        break;
      case 'basic':
        list = vocab.filter(w => w.difficulty === 'basic');
        break;
      case 'easy':
        list = vocab.filter(w => w.difficulty === 'easy');
        break;
      case 'medium':
        list = vocab.filter(w => w.difficulty === 'medium');
        break;
      case 'hard':
        list = vocab.filter(w => w.difficulty === 'hard');
        break;
      case 'custom':
        const targetSet = savedSets.find(s => s.id === activeSetId);
        if (targetSet) {
          const nameSet = new Set(targetSet.wordNames);
          list = vocab.filter(w => nameSet.has(w.name));
        } else {
          list = vocab;
        }
        break;
      default:
        list = vocab;
    }

    // Apply shuffle if active
    if (shuffleSeed !== 0) {
      return seededShuffle(list, shuffleSeed);
    }

    return list;
  }, [studyMode, activeSetId, vocab, wordStatuses, markedWords, savedSets, shuffleSeed]);

  useEffect(() => {
    if (studyList.length > 0 && currentIndex >= studyList.length) {
      setCurrentIndex(0);
    }
  }, [studyList, currentIndex]);

  const updateStudyList = useCallback((mode: StudyMode, setId?: string) => {
    setStudyMode(mode);
    setActiveSetId(setId || null);
    setCurrentIndex(0);
    setShowDefinition(false);
    setTestActive(false);
    setShowWordSelector(false);
    setShowTestOptions(false);

    // If switching TO random mode, force a new shuffle immediately
    if (mode === 'random') {
      setShuffleSeed(Date.now());
    } else {
      // If switching to any other mode, reset shuffle (user clearly changed context)
      // unless they hit shuffle inside that mode, but navigating via menu usually resets view
      setShuffleSeed(0);
    }
  }, []);

  const handleSaveNewSet = useCallback((name: string, wordNames: string[]) => {
    const newSet: StudySet = {
      id: Date.now().toString(),
      name: name || `Set ${savedSets.length + 1}`,
      wordNames
    };
    setSavedSets(prev => [...prev, newSet]);
    updateStudyList('custom', newSet.id);
  }, [savedSets.length, updateStudyList]);

  const handleRenameSet = useCallback((id: string, newName: string) => {
    setSavedSets(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  }, []);

  const handleDeleteSet = useCallback((id: string) => {
    setSavedSets(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (activeSetId === id) {
        setTimeout(() => updateStudyList('all'), 0);
      }
      return updated;
    });
  }, [activeSetId, updateStudyList]);

  const markWord = (status: WordStatusType) => {
    if (!studyList[currentIndex]) return;
    const name = studyList[currentIndex].name;
    setWordStatuses(prev => ({ ...prev, [name]: status }));
    if (currentIndex < studyList.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setShowDefinition(false);
      }, 150);
    }
  };

  const onToggleMark = useCallback((wordName: string) => {
    setMarkedWords(prev => ({ ...prev, [wordName]: !prev[wordName] }));
  }, []);

  const handleShuffle = useCallback(() => {
    const newSeed = Date.now();
    setShuffleSeed(newSeed);
    setCurrentIndex(0);
    setShowDefinition(false);
  }, []);

  const handleJumpToWord = useCallback((input: string) => {
    const num = parseInt(input);
    if (!isNaN(num) && num > 0 && num <= studyList.length) {
      setCurrentIndex(num - 1);
      setShowDefinition(false);
      setShowJumpSearch(false);
      return;
    }
    const searchStr = input.toLowerCase().trim();
    const idx = studyList.findIndex(w => w.name.toLowerCase() === searchStr);
    const partialIdx = idx === -1 ? studyList.findIndex(w => w.name.toLowerCase().includes(searchStr)) : idx;
    if (partialIdx !== -1) {
      setCurrentIndex(partialIdx);
      setShowDefinition(false);
      setShowJumpSearch(false);
    } else {
      alert("Word not found in this list.");
    }
  }, [studyList]);

  const handleLogout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    setShowSettings(false);
  }, []);

  const handleUsernameChange = useCallback((newUsername: string) => {
    setCurrentUser(newUsername);
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger if modals or test are active
      if (showWordSelector || showTestOptions || testActive || showSettings) {
        return;
      }

      switch (e.code) {
        case 'ArrowRight':
          if (currentIndex < studyList.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowDefinition(false);
          }
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowDefinition(false);
          }
          break;
        case 'Space':
          e.preventDefault(); // Prevent page scroll
          if (studyList.length > 0 && !showJumpSearch) {
            setShowDefinition(prev => !prev);
          }
          break;
        case 'Enter':
          // Mark as Mastered (only when definition is showing)
          if (showDefinition && studyList[currentIndex]) {
            e.preventDefault();
            markWord('mastered');
          }
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          // Mark as Review (only when definition is showing)
          if (showDefinition && studyList[currentIndex]) {
            e.preventDefault();
            markWord('review');
          }
          break;
        case 'Backslash':
          // Mark as New (only when definition is showing)
          if (showDefinition && studyList[currentIndex]) {
            e.preventDefault();
            const name = studyList[currentIndex].name;
            setWordStatuses(prev => {
              const updated = { ...prev };
              delete updated[name];
              return updated;
            });
            if (currentIndex < studyList.length - 1) {
              setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setShowDefinition(false);
              }, 150);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, studyList, showWordSelector, showTestOptions, testActive, showSettings, showJumpSearch, showDefinition]);

  const currentStats = useMemo(() => {
    let mastered = 0;
    let review = 0;
    let marked = 0;
    vocab.forEach(w => {
      if (wordStatuses[w.name] === 'mastered') mastered++;
      else if (wordStatuses[w.name] === 'review') review++;
      if (markedWords[w.name]) marked++;
    });
    return {
      mastered,
      review,
      marked,
      notStudied: Math.max(0, vocab.length - mastered - review),
      total: vocab.length
    };
  }, [vocab, wordStatuses, markedWords]);

  // Stable handlers for StatsDashboard
  const handleMasteredClick = useCallback(() => currentStats.mastered > 0 && updateStudyList('mastered'), [currentStats.mastered, updateStudyList]);
  const handleReviewClick = useCallback(() => currentStats.review > 0 && updateStudyList('review'), [currentStats.review, updateStudyList]);
  const handleMarkedClick = useCallback(() => currentStats.marked > 0 && updateStudyList('marked'), [currentStats.marked, updateStudyList]);

  const handleToggleDefinition = useCallback(() => setShowDefinition(d => !d), []);
  const handleTestCancel = useCallback(() => setTestActive(false), []);

  if (testActive) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <div className="animate-pulse">
            <Icons.Brain className="w-12 h-12 text-indigo-600 mb-2 mx-auto" />
            <div className="text-xs font-black uppercase text-indigo-400 tracking-widest">Loading Test...</div>
          </div>
        </div>
      }>
        <TestInterface
          studyList={studyList}
          vocab={vocab}
          testType={testType}
          markedWords={markedWords}
          wordStatuses={wordStatuses}
          onToggleMark={onToggleMark}
          onUpdateWordStatus={(wordName, status) => setWordStatuses(prev => ({ ...prev, [wordName]: status }))}
          onCancel={handleTestCancel}
        />
      </Suspense>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-4 md:py-6 min-h-screen flex flex-col">
      <header className="mb-4 text-center relative">
        <h1 className="text-2xl md:text-3xl font-black text-indigo-900 mb-0 tracking-tighter italic">SSAT Mastery</h1>
        <div className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">
          {activeSetId
            ? <span>Current: <span className="text-indigo-600">"{savedSets.find(s => s.id === activeSetId)?.name}"</span></span>
            : <span>Mode: <span className="text-indigo-600">{studyMode}</span> • {studyList.length} words</span>
          }
        </div>
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute right-0 top-0 p-2 hover:bg-indigo-50 rounded-lg transition-colors text-gray-400 hover:text-indigo-600"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      <StatsDashboard
        stats={currentStats}
        onMasteredClick={handleMasteredClick}
        onReviewClick={handleReviewClick}
        onMarkedClick={handleMarkedClick}
      />

      <div className="my-2">
        <ModeSelector
          currentMode={studyMode}
          activeSetId={activeSetId}
          vocab={vocab}
          wordStatuses={wordStatuses}
          markedWords={markedWords}
          savedSets={savedSets}
          onModeChange={updateStudyList}
          onOpenCustomSelector={() => setShowWordSelector(true)}
          onDeleteSet={handleDeleteSet}
          onRenameSet={handleRenameSet}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 my-4">
        <button onClick={handleShuffle} className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-100 px-6 py-1.5 rounded-lg font-black hover:bg-indigo-50 transition-all text-[11px] active:scale-95 shadow-sm uppercase tracking-[0.1em]">
          <Icons.Shuffle /> Shuffle
        </button>
        <button
          onClick={() => studyList.length > 0 ? setShowTestOptions(true) : alert("No words to test!")}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-1.5 rounded-lg font-black hover:bg-indigo-700 transition-all text-[11px] shadow-lg active:scale-95 uppercase tracking-[0.2em]"
        >
          <Icons.Book /> Test Me
        </button>
      </div>

      {studyList.length > 0 ? (
        <div className="flex flex-col items-center flex-1">
          <ProgressBar
            current={currentIndex + 1}
            total={studyList.length}
            onJump={(val) => setCurrentIndex(val - 1)}
          />

          <div className="relative w-full mb-4 mt-2 flex justify-center">
            <button
              onClick={() => setShowJumpSearch(!showJumpSearch)}
              className="text-indigo-500 font-black text-[10px] flex items-center gap-2 hover:text-indigo-700 transition-colors uppercase tracking-[0.4em] bg-white px-8 py-1.5 rounded-full shadow-md border border-indigo-100"
            >
              <Icons.Search /> {showJumpSearch ? 'CLOSE' : 'QUICK JUMP'}
            </button>
            {showJumpSearch && (
              <div className="absolute top-10 z-[100] bg-white p-3 rounded-xl shadow-2xl border border-indigo-100 flex gap-2 w-full max-w-sm animate-in slide-in-from-top-2 duration-200">
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter word name..."
                  className="flex-1 bg-white text-gray-900 border-indigo-600 border-2 rounded-lg px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleJumpToWord(e.currentTarget.value)}
                />
                <button
                  onClick={(e) => handleJumpToWord((e.currentTarget.previousSibling as HTMLInputElement).value)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-[11px] font-black active:scale-95 uppercase tracking-widest shadow-lg"
                >
                  GO
                </button>
              </div>
            )}
          </div>

          <div className="relative w-full max-w-3xl">
            <button
              onClick={() => onToggleMark(studyList[currentIndex].name)}
              className={`absolute top-4 left-6 z-20 p-2 rounded-md transition-all ${markedWords[studyList[currentIndex].name] ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100'}`}
            >
              <Icons.Flag />
            </button>
            <Flashcard
              word={studyList[currentIndex]}
              showDefinition={showDefinition}
              onToggle={handleToggleDefinition}
              status={wordStatuses[studyList[currentIndex]?.name] || null}
            />
          </div>

          <div className="flex flex-col items-center w-full max-w-lg gap-3 mt-4 pb-6">
            <div className="flex items-center justify-between w-full gap-3">
              <button
                disabled={currentIndex === 0}
                onClick={() => { setCurrentIndex(prev => prev - 1); setShowDefinition(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-10 bg-white border-2 border-gray-100 rounded-lg font-black text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all active:scale-95 text-[11px] shadow-sm uppercase tracking-[0.2em]"
              >
                <Icons.ChevronLeft /> Prev
              </button>
              <button
                disabled={currentIndex === studyList.length - 1}
                onClick={() => { setCurrentIndex(prev => prev + 1); setShowDefinition(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-10 bg-white border-2 border-gray-100 rounded-lg font-black text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all active:scale-95 text-[11px] shadow-sm uppercase tracking-[0.2em]"
              >
                Next <Icons.ChevronRight />
              </button>
            </div>

            {showDefinition && (
              <div className="flex flex-row items-center justify-between w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={() => markWord('mastered')}
                  className={`w-full flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-10 rounded-lg font-black transition-all ${wordStatuses[studyList[currentIndex].name] === 'mastered' ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-md'}`}
                >
                  <Icons.Trophy />
                  <span className="text-[10px] tracking-[0.2em] uppercase">MASTERED</span>
                </button>
                <button
                  onClick={() => markWord('review')}
                  className={`w-full flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-10 rounded-lg font-black transition-all ${wordStatuses[studyList[currentIndex].name] === 'review' ? 'bg-orange-100 text-orange-700 border-2 border-orange-200' : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-md'}`}
                >
                  <Icons.Brain />
                  <span className="text-[10px] tracking-[0.2em] uppercase">REVIEW</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white py-12 px-12 rounded-lg shadow-lg border border-indigo-50 text-center">
          <p className="text-gray-400 text-2xl font-black mb-8 uppercase tracking-widest italic opacity-50">List is Empty</p>
          <button onClick={() => updateStudyList('all')} className="bg-indigo-600 text-white px-16 py-3 rounded-lg text-[12px] font-black hover:bg-indigo-700 transition-all shadow-xl active:scale-95 uppercase tracking-[0.3em]">Reset Study Mode</button>
        </div>
      )}

      {showWordSelector && (
        <WordSelectorModal
          vocab={vocab}
          wordStatuses={wordStatuses}
          markedWords={markedWords}
          setCount={savedSets.length}
          onClose={() => setShowWordSelector(false)}
          onSave={handleSaveNewSet}
        />
      )}

      {showTestOptions && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-indigo-900/60 p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-2xl text-center border-t-8 border-indigo-600">
            <h2 className="text-2xl font-black text-indigo-900 mb-8 uppercase tracking-tight italic">Prepare for Testing</h2>
            <div className="space-y-4">
              <button onClick={() => { setTestType('multiple-choice'); setTestActive(true); }} className="w-full text-left py-3 px-10 border-2 border-indigo-50 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group active:scale-[0.98] shadow-sm">
                <div className="text-sm font-black text-indigo-700 uppercase tracking-widest">Active Recognition</div>
                <div className="text-[10px] text-gray-400 font-black uppercase opacity-60">Pick the correct definition</div>
              </button>
              <button onClick={() => { setTestType('type-in'); setTestActive(true); }} className="w-full text-left py-3 px-10 border-2 border-indigo-50 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group active:scale-[0.98] shadow-sm">
                <div className="text-sm font-black text-indigo-700 uppercase tracking-widest">Deep Recall</div>
                <div className="text-[10px] text-gray-400 font-black uppercase opacity-60">Type out the meaning</div>
              </button>
              <button onClick={() => setShowTestOptions(false)} className="mt-6 text-gray-400 font-black hover:text-gray-600 uppercase tracking-[0.5em] text-[10px] bg-gray-50 px-16 py-2 rounded-full border-2 border-gray-100 shadow-inner">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal
            currentUser={currentUser}
            onUsernameChange={handleUsernameChange}
            onLogout={handleLogout}
            onClose={() => setShowSettings(false)}
          />
        </Suspense>
      )}

      <footer className="mt-auto py-4 border-t border-indigo-100/30 flex justify-between items-center px-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            All progress saved locally
          </div>
          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest opacity-40 italic">
            {currentUser}
          </span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-[8px] font-black text-gray-300 hover:text-indigo-400 uppercase tracking-widest transition-colors"
        >
          ⚙️ Settings
        </button>
      </footer>
    </div>
  );
}