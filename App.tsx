import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Word, WordStatusType, StudyMode, TestType, WordStatusMap, MarkedWordsMap, StudySet } from './types';
import { PLACEHOLDER_VOCAB } from './data/vocab';
import { Icons } from './components/Icons';
import { seededShuffle } from './utils';
import LoginPage from './components/LoginPage';
// Lazy loaded below
import { authService } from './authService';
import { hybridService, StorageMode } from './services/hybridService';

const TestInterface = lazy(() => import('./components/TestInterface'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const LearnSession = lazy(() => import('./components/LearnSession'));
const LazyWordSelectorModal = lazy(() => import('./components/WordSelectorModal'));
const MigrationModal = lazy(() => import('./components/MigrationModal'));
const ImportWordsModal = lazy(() => import('./components/ImportWordsModal'));


import MainDashboard from './components/MainDashboard';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();


  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [showMigration, setShowMigration] = useState(false);

  // --- STATE ---
  const [customVocab, setCustomVocab] = useState<Word[]>([]);
  const vocab = useMemo(() => {
    const combined = [...PLACEHOLDER_VOCAB, ...customVocab];
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [customVocab]);

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
  const [testType, setTestType] = useState<TestType>('multiple-choice');
  const [showJumpSearch, setShowJumpSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Shuffle State
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);

  // Recent Import State
  const [lastImportedNames, setLastImportedNames] = useState<string[]>([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    async function initUser() {
      const user = await hybridService.getCurrentUser();
      if (user) {
        setCurrentUser(user.username);
        setStorageMode(user.mode);

        // Check for migration opportunity if in cloud mode
        if (user.mode === 'cloud') {
          const hasLocal = await hybridService.hasLocalData();
          if (hasLocal) {
            setShowMigration(true);
          }
        }
      }
    }
    initUser();
  }, []);

  // --- PERSISTENCE: Loading ---
  useEffect(() => {
    async function loadUserData() {
      if (currentUser) {
        // Load user data via hybrid service
        const userData = await hybridService.getUserData();
        if (userData) {
          setWordStatuses(userData.wordStatuses || {});
          setMarkedWords(userData.markedWords || {});
          setSavedSets(userData.savedSets || []);
          setCustomVocab(userData.customVocab || []);
        }

        // Navigation stats from localStorage (still local for now)
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
      hybridService.saveUserData({ wordStatuses, markedWords, savedSets, customVocab });
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
      const effectiveSeed = shuffleSeed === 0 ? Date.now() : shuffleSeed;
      const shuffled = seededShuffle(vocab, effectiveSeed);
      return shuffled.slice(0, 50);
    }

    // For other modes, we filter first, THEN shuffle if there is a seed
    switch (studyMode) {
      case 'all':
        list = vocab;
        break;
      case 'new_all':
        list = vocab.filter(w => w.version === 'new');
        break;
      case 'old_all':
        list = vocab.filter(w => w.version !== 'new'); // default to old if not specified
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
      case 'new_basic':
        list = vocab.filter(w => w.version === 'new' && w.difficulty === 'basic');
        break;
      case 'new_easy':
        list = vocab.filter(w => w.version === 'new' && w.difficulty === 'easy');
        break;
      case 'new_medium':
        list = vocab.filter(w => w.version === 'new' && w.difficulty === 'medium');
        break;
      case 'new_hard':
        list = vocab.filter(w => w.version === 'new' && w.difficulty === 'hard');
        break;
      case 'old_basic':
        list = vocab.filter(w => w.version !== 'new' && w.difficulty === 'basic');
        break;
      case 'old_easy':
        list = vocab.filter(w => w.version !== 'new' && w.difficulty === 'easy');
        break;
      case 'old_medium':
        list = vocab.filter(w => w.version !== 'new' && w.difficulty === 'medium');
        break;
      case 'old_hard':
        list = vocab.filter(w => w.version !== 'new' && w.difficulty === 'hard');
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
  }, [studyList.length, currentIndex]);

  const updateStudyList = useCallback((mode: StudyMode, setId?: string) => {
    setStudyMode(mode);
    setActiveSetId(setId || null);
    setCurrentIndex(0);
    setShowDefinition(false);
    setShowWordSelector(false);
    setShowTestOptions(false);

    // If switching TO random mode, force a new shuffle immediately
    if (mode === 'random') {
      setShuffleSeed(Date.now());
    } else {
      // If switching to any other mode, reset shuffle
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

  const markWord = useCallback((status: WordStatusType) => {
    if (!studyList[currentIndex]) return;
    const name = studyList[currentIndex].name;
    setWordStatuses(prev => ({ ...prev, [name]: status }));
    if (currentIndex < studyList.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setShowDefinition(false);
      }, 150);
    }
  }, [studyList, currentIndex]);

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
      // Word not found - silent failure
    }

  }, [studyList]);

  const handleLogout = useCallback(async () => {
    await hybridService.logout();
    setCurrentUser(null);
    setStorageMode('local');
    setShowSettings(false);
  }, []);

  const handleUsernameChange = useCallback((newUsername: string) => {
    setCurrentUser(newUsername);
  }, []);

  const handleImportWords = useCallback((newWords: Word[]) => {
    const freshNames = newWords.map(w => w.name);
    setLastImportedNames(freshNames);

    setCustomVocab(prev => {
      // Create a map of existing custom words for quick lookup & update
      const customMap = new Map<string, Word>(prev.map(w => [w.name.toLowerCase(), w]));

      newWords.forEach(newWord => {
        const lowerName = newWord.name.toLowerCase();
        const existing = customMap.get(lowerName);

        // Use Object.assign to avoid spread on interface issues in some environments
        const mergedWord: Word = existing
          ? Object.assign({}, existing, newWord, { version: 'new' })
          : { ...newWord, version: 'new' } as Word;

        customMap.set(lowerName, mergedWord);
      });

      return Array.from(customMap.values());
    });

    setShowImport(false);
    setShowWordSelector(true);
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger if modals or test are active
      if (showWordSelector || showTestOptions || showSettings || showMigration) {
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
  }, [currentIndex, studyList, showWordSelector, showTestOptions, showSettings, showJumpSearch, showDefinition, showMigration, markWord]);

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

  const learnStudyList = useMemo(() => {
    const showLearn = location.pathname === '/learn';
    if (!showLearn) return [];
    return [...studyList].sort((a, b) => {
      const statusA = wordStatuses[a.name] === 'review' ? 0 : 1;
      const statusB = wordStatuses[b.name] === 'review' ? 0 : 1;
      return statusA - statusB;
    });
  }, [studyList, wordStatuses, location.pathname]);

  // Define ALL useCallback hooks BEFORE any conditional returns
  const updateWordStatus = useCallback((wordName: string, status: WordStatusType) => {
    setWordStatuses(prev => ({ ...prev, [wordName]: status }));
  }, []);

  const handleShowSettings = useCallback(() => setShowSettings(true), []);
  const handleMasteredClick = useCallback(() => currentStats.mastered > 0 && updateStudyList('mastered'), [currentStats.mastered, updateStudyList]);
  const handleReviewClick = useCallback(() => currentStats.review > 0 && updateStudyList('review'), [currentStats.review, updateStudyList]);
  const handleMarkedClick = useCallback(() => currentStats.marked > 0 && updateStudyList('marked'), [currentStats.marked, updateStudyList]);
  const handleOpenCustomSelector = useCallback(() => setShowWordSelector(true), []);
  const handleShowTestOptions = useCallback(() => setShowTestOptions(true), []);
  const handleSetCurrentIndex = useCallback((idx: number) => { setCurrentIndex(idx); setShowDefinition(false); }, []);
  const handleSetShowJumpSearch = useCallback((show: boolean) => setShowJumpSearch(show), []);
  const handleToggleDefinition = useCallback(() => setShowDefinition(d => !d), []);
  const handleSetShowWordSelector = useCallback((show: boolean) => setShowWordSelector(show), []);
  const handleSetShowTestOptions = useCallback((show: boolean) => setShowTestOptions(show), []);
  const handleSetTestType = useCallback((type: TestType) => setTestType(type), []);
  const handleSetShowSettings = useCallback((show: boolean) => setShowSettings(show), []);
  const handleSetShowMigration = useCallback((show: boolean) => setShowMigration(show), []);
  const handleSetShowImport = useCallback((show: boolean) => setShowImport(show), []);
  const navigateHome = useCallback(() => navigate('/'), [navigate]);

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setStorageMode(hybridService.getStorageMode());
          // Check for migration after login
          if (hybridService.getStorageMode() !== 'local') {
            hybridService.hasLocalData().then(hasLocal => {
              if (hasLocal) setShowMigration(true);
            });
          }
        }}
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <MainDashboard
          studyMode={studyMode}
          activeSetId={activeSetId}
          studyList={studyList}
          vocab={vocab}
          wordStatuses={wordStatuses}
          markedWords={markedWords}
          savedSets={savedSets}
          currentIndex={currentIndex}
          showDefinition={showDefinition}
          showJumpSearch={showJumpSearch}
          currentStats={currentStats}
          currentUser={currentUser}
          storageMode={storageMode}
          onShowSettings={handleShowSettings}
          onMasteredClick={handleMasteredClick}
          onReviewClick={handleReviewClick}
          onMarkedClick={handleMarkedClick}
          onModeChange={updateStudyList}
          onOpenCustomSelector={handleOpenCustomSelector}
          onDeleteSet={handleDeleteSet}
          onRenameSet={handleRenameSet}
          onShuffle={handleShuffle}
          navigate={navigate}
          onShowTestOptions={handleShowTestOptions}
          onSetCurrentIndex={handleSetCurrentIndex}
          onSetShowJumpSearch={handleSetShowJumpSearch}
          onJumpToWord={handleJumpToWord}
          onToggleMark={onToggleMark}
          onToggleDefinition={handleToggleDefinition}
          onMarkWord={markWord}
          showWordSelector={showWordSelector}
          setShowWordSelector={handleSetShowWordSelector}
          showTestOptions={showTestOptions}
          setShowTestOptions={handleSetShowTestOptions}
          testType={testType}
          setTestType={handleSetTestType}
          showSettings={showSettings}
          setShowSettings={handleSetShowSettings}
          showMigration={showMigration}
          setShowMigration={handleSetShowMigration}
          showImport={showImport}
          setShowImport={handleSetShowImport}
          onLogout={handleLogout}
          onUsernameChange={handleUsernameChange}
          onSaveNewSet={handleSaveNewSet}
          onImportWords={handleImportWords}
          lastImportedNames={lastImportedNames}
          existingVocab={vocab}
          LazyWordSelectorModal={LazyWordSelectorModal}
          SettingsModal={SettingsModal}
          MigrationModal={MigrationModal}
          ImportWordsModal={ImportWordsModal}
        />
      } />
      <Route path="/learn" element={
        <Suspense fallback={<div className="p-8 text-center text-indigo-500 font-bold">Loading component...</div>}>
          <LearnSession
            studyList={learnStudyList}
            onComplete={navigateHome}
            onUpdateWordStatus={updateWordStatus}
          />
        </Suspense>
      } />
      <Route path="/mtest" element={
        <Suspense fallback={<div className="p-8 text-center text-indigo-500 font-bold">Loading component...</div>}>
          <TestInterface
            studyList={studyList}
            vocab={vocab}
            testType="multiple-choice"
            markedWords={markedWords}
            wordStatuses={wordStatuses}
            onToggleMark={onToggleMark}
            onUpdateWordStatus={updateWordStatus}
            onCancel={navigateHome}
          />
        </Suspense>
      } />
      <Route path="/wtest" element={
        <Suspense fallback={<div className="p-8 text-center text-indigo-500 font-bold">Loading component...</div>}>
          <TestInterface
            studyList={studyList}
            vocab={vocab}
            testType="type-in"
            markedWords={markedWords}
            wordStatuses={wordStatuses}
            onToggleMark={onToggleMark}
            onUpdateWordStatus={updateWordStatus}
            onCancel={navigateHome}
          />
        </Suspense>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}