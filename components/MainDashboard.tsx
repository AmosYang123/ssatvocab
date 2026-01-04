import React, { memo, Suspense } from 'react';
import { Word, WordStatusType, StudyMode, MarkedWordsMap, WordStatusMap, StudySet, TestType, ThemeMode } from '../types';
import StatsDashboard from './StatsDashboard';
import ModeSelector from './ModeSelector';
import ProgressBar from './ProgressBar';
import Flashcard from './Flashcard';
import { AIWordSearch } from './AIWordSearch';
import { Icons } from './Icons';

interface MainDashboardProps {
    studyMode: StudyMode;
    activeSetId: string | null;
    studyList: Word[];
    vocab: Word[];
    wordStatuses: WordStatusMap;
    markedWords: MarkedWordsMap;
    savedSets: StudySet[];
    currentIndex: number;
    showDefinition: boolean;
    showJumpSearch: boolean;
    currentStats: {
        mastered: number;
        review: number;
        marked: number;
        notStudied: number;
        total: number;
    };
    currentUser: string | null;
    storageMode: string;
    onShowSettings: () => void;
    onMasteredClick: () => void;
    onReviewClick: () => void;
    onMarkedClick: () => void;
    onModeChange: (mode: StudyMode, setId?: string) => void;
    onOpenCustomSelector: () => void;
    onDeleteSet: (id: string) => void;
    onRenameSet: (id: string, newName: string) => void;
    onShuffle: () => void;
    navigate: (path: string) => void;
    onShowTestOptions: () => void;
    onSetCurrentIndex: (idx: number) => void;
    onSetShowJumpSearch: (show: boolean) => void;
    onJumpToWord: (input: string) => void;
    onToggleMark: (wordName: string) => void;
    onToggleDefinition: () => void;
    onMarkWord: (status: WordStatusType) => void;
    showWordSelector: boolean;
    setShowWordSelector: (show: boolean) => void;
    showTestOptions: boolean;
    setShowTestOptions: (show: boolean) => void;
    testType: TestType;
    setTestType: (type: TestType) => void;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    showImport: boolean;
    setShowImport: (show: boolean) => void;
    onLogout: () => void;
    onUsernameChange: (name: string) => void;
    onSaveNewSet: (name: string, wordNames: string[]) => void;
    onImportWords: (newWords: Word[]) => void;
    lastImportedNames: string[];
    existingVocab: Word[];
    theme: ThemeMode;
    showDefaultVocab: boolean;
    onUpdatePreferences: (theme: ThemeMode, showDefault: boolean) => void;
    onUpdateTheme: (theme: ThemeMode) => void; // Keeping for backward compatibility or simple theme toggle if needed, but switching to onUpdatePreferences
    LazyWordSelectorModal: React.LazyExoticComponent<any>;
    SettingsModal: React.LazyExoticComponent<any>;
    ImportWordsModal: React.LazyExoticComponent<any>;
}

const MainDashboard: React.FC<MainDashboardProps> = memo(({
    studyMode,
    activeSetId,
    studyList,
    vocab,
    wordStatuses,
    markedWords,
    savedSets,
    currentIndex,
    showDefinition,
    showJumpSearch,
    currentStats,
    currentUser,
    storageMode,
    onShowSettings,
    onMasteredClick,
    onReviewClick,
    onMarkedClick,
    onModeChange,
    onOpenCustomSelector,
    onDeleteSet,
    onRenameSet,
    onShuffle,
    navigate,
    onShowTestOptions,
    onSetCurrentIndex,
    onSetShowJumpSearch,
    onJumpToWord,
    onToggleMark,
    onToggleDefinition,
    onMarkWord,
    showWordSelector,
    setShowWordSelector,
    showTestOptions,
    setShowTestOptions,
    testType,
    setTestType,
    showSettings,
    setShowSettings,
    showImport,
    setShowImport,
    onLogout,
    onUsernameChange,
    onSaveNewSet,
    onImportWords,
    lastImportedNames,
    existingVocab,
    theme,
    showDefaultVocab,
    onUpdatePreferences,
    onUpdateTheme,
    LazyWordSelectorModal,
    SettingsModal,
    ImportWordsModal
}) => {
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
                <div className="absolute right-0 top-0 flex items-center gap-2">
                    <button
                        onClick={() => onUpdatePreferences(theme === 'light' ? 'dark' : 'light', showDefaultVocab)}
                        className="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-gray-400 hover:text-indigo-600"
                        title={`Theme: ${theme}`}
                    >
                        {theme === 'dark' ? <Icons.Moon /> : <Icons.Sun />}
                    </button>
                    <button
                        onClick={onShowSettings}
                        className="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-gray-400 hover:text-indigo-600"
                        title="Settings"
                    >
                        <Icons.Settings />
                    </button>
                </div>
            </header>

            <StatsDashboard
                stats={currentStats}
                onMasteredClick={onMasteredClick}
                onReviewClick={onReviewClick}
                onMarkedClick={onMarkedClick}
            />

            <div className="my-2">
                <ModeSelector
                    currentMode={studyMode}
                    activeSetId={activeSetId}
                    vocab={vocab}
                    wordStatuses={wordStatuses}
                    markedWords={markedWords}
                    savedSets={savedSets}
                    onModeChange={onModeChange}
                    onOpenCustomSelector={onOpenCustomSelector}
                    onDeleteSet={onDeleteSet}
                    onRenameSet={onRenameSet}
                />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 my-4">
                <button onClick={onShuffle} className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-100 px-6 py-1.5 rounded-lg font-black hover:bg-indigo-50 transition-all text-[11px] active:scale-95 shadow-sm uppercase tracking-[0.1em]">
                    <Icons.Shuffle /> Shuffle
                </button>
                <button
                    onClick={() => { if (studyList.length > 0) navigate('/learn'); }}
                    className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-1.5 rounded-lg font-black hover:bg-emerald-600 transition-all text-[11px] shadow-lg active:scale-95 uppercase tracking-[0.2em]"
                >
                    <Icons.AcademicCap /> Learn Mode
                </button>
                <button
                    onClick={() => { if (studyList.length > 0) onShowTestOptions(); }}

                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-1.5 rounded-lg font-black hover:bg-indigo-700 transition-all text-[11px] shadow-lg active:scale-95 uppercase tracking-[0.2em]"
                >
                    <Icons.ClipboardCheck /> Test Me
                </button>
            </div>

            {studyList.length > 0 ? (
                <div className="flex flex-col items-center flex-1">
                    <ProgressBar
                        current={currentIndex + 1}
                        total={studyList.length}
                        onJump={(val) => onSetCurrentIndex(val - 1)}
                    />

                    <div className="relative w-full mb-4 mt-2 flex justify-center">
                        {!showJumpSearch ? (
                            <button
                                onClick={() => onSetShowJumpSearch(true)}
                                className="text-indigo-500 font-black text-[10px] flex items-center gap-2 hover:text-indigo-700 transition-colors uppercase tracking-[0.4em] bg-white px-8 py-1.5 rounded-full shadow-md border border-indigo-100"
                            >
                                <Icons.Search /> QUICK JUMP
                            </button>
                        ) : (
                            <AIWordSearch
                                availableWords={studyList}
                                onSelectWord={(name) => { onJumpToWord(name); onSetShowJumpSearch(false); }}
                                onClose={() => onSetShowJumpSearch(false)}
                            />
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
                            onToggle={onToggleDefinition}
                            status={wordStatuses[studyList[currentIndex]?.name] || null}
                        />
                    </div>

                    <div className="flex flex-col items-center w-full max-w-lg gap-3 mt-4 pb-6">
                        <div className="flex items-center justify-between w-full gap-3">
                            <button
                                disabled={currentIndex === 0}
                                onClick={() => { onSetCurrentIndex(currentIndex - 1); }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-10 bg-white border-2 border-gray-100 rounded-lg font-black text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all active:scale-95 text-[11px] shadow-sm uppercase tracking-[0.2em]"
                            >
                                <Icons.ChevronLeft /> Prev
                            </button>
                            <button
                                disabled={currentIndex === studyList.length - 1}
                                onClick={() => { onSetCurrentIndex(currentIndex + 1); }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-10 bg-white border-2 border-gray-100 rounded-lg font-black text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all active:scale-95 text-[11px] shadow-sm uppercase tracking-[0.2em]"
                            >
                                Next <Icons.ChevronRight />
                            </button>
                        </div>

                        {showDefinition && (
                            <div className="flex flex-row items-center justify-between w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <button
                                    onClick={() => onMarkWord('mastered')}
                                    className={`w-full flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-10 rounded-lg font-black transition-all ${wordStatuses[studyList[currentIndex].name] === 'mastered' ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-md'}`}
                                >
                                    <Icons.Trophy />
                                    <span className="text-[10px] tracking-[0.2em] uppercase">MASTERED</span>
                                </button>
                                <button
                                    onClick={() => onMarkWord('review')}
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
                    <button onClick={() => onModeChange('all')} className="bg-indigo-600 text-white px-16 py-3 rounded-lg text-[12px] font-black hover:bg-indigo-700 transition-all shadow-xl active:scale-95 uppercase tracking-[0.3em]">Reset Study Mode</button>
                </div>
            )}

            <footer className="mt-auto py-4 border-t border-indigo-100/30 flex justify-between items-center px-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                        <div className={`w-1.5 h-1.5 rounded-full ${storageMode === 'cloud' || storageMode === 'hybrid'
                            ? 'bg-blue-500 shadow-blue-200 shadow-sm'
                            : 'bg-green-500'
                            }`}></div>
                        {storageMode === 'cloud' || storageMode === 'hybrid' ? 'Cloud Sync Active' : 'All progress saved locally'}
                    </div>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest opacity-40 italic">
                        {currentUser}
                    </span>
                </div>
                <button
                    onClick={() => setShowSettings(true)}
                    className="text-[8px] font-black text-gray-300 hover:text-indigo-400 uppercase tracking-widest transition-colors"
                >
                    Settings
                </button>
            </footer>

            {showWordSelector && (
                <Suspense fallback={null}>
                    <LazyWordSelectorModal
                        vocab={vocab}
                        wordStatuses={wordStatuses}
                        markedWords={markedWords}
                        setCount={savedSets.length}
                        lastImportedNames={lastImportedNames}
                        onClose={() => setShowWordSelector(false)}
                        onSave={onSaveNewSet}
                    />
                </Suspense>
            )}

            {showTestOptions && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-indigo-900/60 p-6 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-2xl text-center border-t-8 border-indigo-600">
                        <h2 className="text-2xl font-black text-indigo-900 mb-8 uppercase tracking-tight italic">Prepare for Testing</h2>
                        <div className="space-y-4">
                            <button onClick={() => { setTestType('multiple-choice'); navigate('/mtest'); setShowTestOptions(false); }} className="w-full text-left py-3 px-10 border-2 border-indigo-50 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group active:scale-[0.98] shadow-sm">
                                <div className="text-sm font-black text-indigo-700 uppercase tracking-widest">Active Recognition</div>
                                <div className="text-[10px] text-gray-400 font-black uppercase opacity-60">Pick the correct definition</div>
                            </button>
                            <button onClick={() => { setTestType('type-in'); navigate('/wtest'); setShowTestOptions(false); }} className="w-full text-left py-3 px-10 border-2 border-indigo-50 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group active:scale-[0.98] shadow-sm">
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
                        theme={theme}
                        showDefaultVocab={showDefaultVocab}
                        onUpdatePreferences={onUpdatePreferences}
                        onUsernameChange={onUsernameChange}
                        onLogout={onLogout}
                        onClose={() => setShowSettings(false)}
                        onShowImport={() => setShowImport(true)}
                    />
                </Suspense>
            )}


            {showImport && (
                <Suspense fallback={null}>
                    <ImportWordsModal
                        onClose={() => setShowImport(false)}
                        onImport={onImportWords}
                        existingVocab={existingVocab}
                    />
                </Suspense>
            )}
        </div>
    );
});

export default MainDashboard;
