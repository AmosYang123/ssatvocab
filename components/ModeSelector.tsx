import React, { useState, memo } from 'react';
import { Word, StudyMode, WordStatusMap, MarkedWordsMap, StudySet } from '../types';
import { Icons } from './Icons';

interface ModeSelectorProps {
  currentMode: StudyMode;
  activeSetId: string | null;
  vocab: Word[];
  wordStatuses: WordStatusMap;
  markedWords: MarkedWordsMap;
  savedSets: StudySet[];
  onModeChange: (mode: StudyMode, setId?: string) => void;
  onOpenCustomSelector: () => void;
  onDeleteSet: (id: string) => void;
  onRenameSet: (id: string, newName: string) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = memo(({
  currentMode,
  activeSetId,
  vocab,
  wordStatuses,
  markedWords,
  savedSets,
  onModeChange,
  onOpenCustomSelector,
  onDeleteSet,
  onRenameSet
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const counts = {
    all: vocab.length,
    new_all: vocab.filter(w => w.version === 'new').length,
    old_all: vocab.filter(w => w.version !== 'new').length,
    mastered: vocab.filter(w => wordStatuses[w.name] === 'mastered').length,
    review: vocab.filter(w => wordStatuses[w.name] === 'review').length,
    marked: vocab.filter(w => markedWords[w.name]).length,
    random: Math.min(vocab.length, 50),
    new_basic: vocab.filter(w => w.version === 'new' && w.difficulty === 'basic').length,
    new_easy: vocab.filter(w => w.version === 'new' && w.difficulty === 'easy').length,
    new_medium: vocab.filter(w => w.version === 'new' && w.difficulty === 'medium').length,
    new_hard: vocab.filter(w => w.version === 'new' && w.difficulty === 'hard').length,
    old_basic: vocab.filter(w => w.version !== 'new' && w.difficulty === 'basic').length,
    old_easy: vocab.filter(w => w.version !== 'new' && w.difficulty === 'easy').length,
    old_medium: vocab.filter(w => w.version !== 'new' && w.difficulty === 'medium').length,
    old_hard: vocab.filter(w => w.version !== 'new' && w.difficulty === 'hard').length,
    old_mastered: vocab.filter(w => w.version !== 'new' && wordStatuses[w.name] === 'mastered').length,
    old_review: vocab.filter(w => w.version !== 'new' && wordStatuses[w.name] === 'review').length,
    old_new: vocab.filter(w => w.version !== 'new' && !wordStatuses[w.name]).length,
    new_mastered: vocab.filter(w => w.version === 'new' && wordStatuses[w.name] === 'mastered').length,
    new_review: vocab.filter(w => w.version === 'new' && wordStatuses[w.name] === 'review').length,
    new_new: vocab.filter(w => w.version === 'new' && !wordStatuses[w.name]).length,
  };

  const statusModes: { id: StudyMode; label: string; count: number; disabled?: boolean }[] = [
    { id: 'all', label: 'All Total', count: counts.all },
    { id: 'random', label: 'Mix 50', count: counts.random },
    { id: 'mastered', label: 'Mastered', count: counts.mastered, disabled: counts.mastered === 0 },
    { id: 'review', label: 'Review', count: counts.review, disabled: counts.review === 0 },
    { id: 'marked', label: 'Marked', count: counts.marked, disabled: counts.marked === 0 },
  ];

  const oldModes: { id: StudyMode; label: string; count: number; color?: string; disabled?: boolean }[] = [
    { id: 'old_all', label: 'Current All', count: counts.old_all },
    { id: 'old_mastered', label: 'Mastered', count: counts.old_mastered, disabled: counts.old_mastered === 0 },
    { id: 'old_review', label: 'Review', count: counts.old_review, disabled: counts.old_review === 0 },
    { id: 'old_new', label: 'New', count: counts.old_new, disabled: counts.old_new === 0 },
    { id: 'old_basic', label: 'Basic', count: counts.old_basic, color: 'teal' },
    { id: 'old_easy', label: 'Easy', count: counts.old_easy, color: 'green' },
    { id: 'old_medium', label: 'Medium', count: counts.old_medium, color: 'yellow' },
    { id: 'old_hard', label: 'Hard', count: counts.old_hard, color: 'red' },
  ];

  const newModes: { id: StudyMode; label: string; count: number; color?: string; disabled?: boolean }[] = [
    { id: 'new_all', label: 'New All', count: counts.new_all },
    { id: 'new_mastered', label: 'Mastered', count: counts.new_mastered, disabled: counts.new_mastered === 0 },
    { id: 'new_review', label: 'Review', count: counts.new_review, disabled: counts.new_review === 0 },
    { id: 'new_new', label: 'New', count: counts.new_new, disabled: counts.new_new === 0 },
    { id: 'new_basic', label: 'Basic', count: counts.new_basic, color: 'teal' },
    { id: 'new_easy', label: 'Easy', count: counts.new_easy, color: 'green' },
    { id: 'new_medium', label: 'Medium', count: counts.new_medium, color: 'yellow' },
    { id: 'new_hard', label: 'Hard', count: counts.new_hard, color: 'red' },
  ];

  const handleStartRename = (set: StudySet) => {
    setEditingId(set.id);
    setEditValue(set.name);
  };

  const handleFinishRename = (id: string) => {
    if (editValue.trim()) {
      onRenameSet(id, editValue.trim());
    }
    setEditingId(null);
  };

  const renderModeButton = (mode: { id: StudyMode; label: string; count: number; color?: string; disabled?: boolean }) => {
    let activeStyles = '';
    let inactiveStyles = '';

    if (mode.id.includes('basic')) {
      activeStyles = 'bg-teal-600 border-teal-600 text-white shadow-md';
      inactiveStyles = 'bg-white text-teal-700 border-teal-50 hover:border-teal-200';
    } else if (mode.id.includes('easy')) {
      activeStyles = 'bg-green-600 border-green-600 text-white shadow-md';
      inactiveStyles = 'bg-white text-green-700 border-green-50 hover:border-green-200';
    } else if (mode.id.includes('medium')) {
      activeStyles = 'bg-orange-500 border-orange-500 text-white shadow-md';
      inactiveStyles = 'bg-white text-orange-700 border-orange-50 hover:border-orange-200';
    } else if (mode.id.includes('hard')) {
      activeStyles = 'bg-indigo-900 border-indigo-900 text-white shadow-md';
      inactiveStyles = 'bg-white text-indigo-900 border-indigo-50 hover:border-indigo-200';
    } else {
      activeStyles = 'bg-indigo-600 text-white border-indigo-600 shadow-md';
      inactiveStyles = 'bg-white text-indigo-700 border-indigo-50 hover:border-indigo-200 disabled:opacity-30';
    }

    return (
      <button
        key={mode.id}
        disabled={mode.disabled}
        onClick={() => onModeChange(mode.id)}
        className={`px-6 py-1.5 rounded-lg text-[10px] font-black transition-all border-2 active:scale-95 uppercase tracking-[0.1em] shadow-sm
          ${currentMode === mode.id && !activeSetId
            ? activeStyles
            : inactiveStyles
          }`}
      >
        {mode.label} <span className="opacity-50 ml-1">[{mode.count}]</span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Unified Status Modes */}
      <div className="flex flex-wrap gap-2 justify-center">
        {statusModes.map(mode => renderModeButton(mode))}
      </div>

      {/* Current Vocab Section */}
      <div className="pt-3 border-t border-indigo-100/30">
        <h3 className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] text-center mb-3">Current Vocab</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {oldModes.map(mode => renderModeButton(mode))}
        </div>
      </div>

      {/* New Vocab Section */}
      <div className="pt-3 border-t border-indigo-100/30">
        <h3 className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] text-center mb-3">New Vocab (Temporary)</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {newModes.map(mode => renderModeButton(mode))}
        </div>
      </div>

      {/* Custom Sets */}
      <div className="pt-3 border-t border-indigo-100/30">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em]">Groups</h3>
          <button
            onClick={onOpenCustomSelector}
            className="text-[9px] font-black text-indigo-600 bg-white border border-indigo-100 px-8 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm active:scale-95 uppercase tracking-widest"
          >
            + Create Group
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {savedSets.map(set => (
            <div
              key={set.id}
              className="relative flex items-center h-9 group"
              onDoubleClick={() => handleStartRename(set)}
            >
              {editingId === set.id ? (
                <div className="flex items-center bg-white border-2 border-indigo-500 rounded-lg px-4 h-full shadow-lg z-50">
                  <input
                    autoFocus
                    type="text"
                    className="text-xs font-black text-indigo-900 outline-none w-32 bg-transparent"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleFinishRename(set.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(set.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                </div>
              ) : (
                <div className={`flex items-center rounded-lg overflow-hidden border-2 transition-all shadow-sm
                  ${activeSetId === set.id
                    ? 'border-indigo-600 bg-indigo-600 shadow-md'
                    : 'border-indigo-50 bg-white hover:border-indigo-200'
                  }`}
                >
                  <button
                    onClick={() => onModeChange('custom', set.id)}
                    className={`px-6 h-full text-left flex items-center gap-2 max-w-[180px]
                      ${activeSetId === set.id ? 'text-white' : 'text-indigo-900'}`}
                  >
                    <span className="text-[10px] font-black truncate uppercase tracking-tighter">{set.name}</span>
                    <span className={`text-[9px] font-black ${activeSetId === set.id ? 'text-indigo-200' : 'text-indigo-400'}`}>
                      {set.wordNames.length}
                    </span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteSet(set.id);
                    }}
                    className={`w-9 h-full flex items-center justify-center border-l transition-colors
                      ${activeSetId === set.id
                        ? 'border-indigo-500 text-white/40 hover:bg-red-500 hover:text-white'
                        : 'border-indigo-50 text-indigo-100 hover:bg-red-50 hover:text-red-500'
                      }`}
                  >
                    <Icons.Close />
                  </button>
                </div>
              )}
            </div>
          ))}
          {savedSets.length === 0 && (
            <div className="text-[9px] text-indigo-100 font-black py-2 px-2 uppercase tracking-[0.3em] opacity-40">
              No Custom Groups
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ModeSelector;