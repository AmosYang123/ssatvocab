import React, { useState } from 'react';
import { Word, StudyMode, WordStatusMap, MarkedWordsMap, StudySet } from '../types';
import { Icons } from '../constants';

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

const ModeSelector: React.FC<ModeSelectorProps> = ({ 
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
    mastered: vocab.filter(w => wordStatuses[w.name] === 'mastered').length,
    review: vocab.filter(w => wordStatuses[w.name] === 'review').length,
    marked: vocab.filter(w => markedWords[w.name]).length,
    random: Math.min(vocab.length, 50),
    basic: vocab.filter(w => w.difficulty === 'basic').length,
    easy: vocab.filter(w => w.difficulty === 'easy').length,
    medium: vocab.filter(w => w.difficulty === 'medium').length,
    hard: vocab.filter(w => w.difficulty === 'hard').length,
  };

  const statusModes: { id: StudyMode; label: string; count: number; disabled?: boolean }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'random', label: 'Random', count: counts.random },
    { id: 'mastered', label: 'Mastered', count: counts.mastered, disabled: counts.mastered === 0 },
    { id: 'review', label: 'Review', count: counts.review, disabled: counts.review === 0 },
    { id: 'marked', label: 'Marked', count: counts.marked, disabled: counts.marked === 0 },
  ];

  const difficultyModes: { id: StudyMode; label: string; count: number; color: string }[] = [
    { id: 'basic', label: 'Basic', count: counts.basic, color: 'teal' },
    { id: 'easy', label: 'Easy', count: counts.easy, color: 'green' },
    { id: 'medium', label: 'Medium', count: counts.medium, color: 'yellow' },
    { id: 'hard', label: 'Hard', count: counts.hard, color: 'red' },
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

  return (
    <div className="space-y-4">
      {/* Standard Status Modes */}
      <div className="flex flex-wrap gap-2 justify-center">
        {statusModes.map(mode => (
          <button
            key={mode.id}
            disabled={mode.disabled}
            onClick={() => onModeChange(mode.id)}
            className={`px-8 py-1.5 rounded-lg text-[10px] font-black transition-all border-2 active:scale-95 uppercase tracking-[0.1em] shadow-sm
              ${currentMode === mode.id && !activeSetId
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                : 'bg-white text-indigo-700 border-indigo-50 hover:border-indigo-200 disabled:opacity-30'
              }`}
          >
            {mode.label} <span className="opacity-50 ml-1">[{mode.count}]</span>
          </button>
        ))}
      </div>

      {/* Difficulty Modes */}
      <div className="pt-3 border-t border-indigo-100/30">
        <h3 className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] text-center mb-3">Difficulty</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {difficultyModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`px-10 py-1.5 rounded-lg text-[10px] font-black transition-all border-2 active:scale-95 uppercase tracking-[0.1em] shadow-sm
                ${currentMode === mode.id && !activeSetId
                  ? (mode.id === 'basic' ? 'bg-teal-600 border-teal-600 text-white shadow-md' :
                     mode.id === 'easy' ? 'bg-green-600 border-green-600 text-white shadow-md' :
                     mode.id === 'medium' ? 'bg-orange-500 border-orange-500 text-white shadow-md' :
                     'bg-indigo-900 border-indigo-900 text-white shadow-md')
                  : (mode.id === 'basic' ? 'bg-white text-teal-700 border-teal-50 hover:border-teal-200' :
                     mode.id === 'easy' ? 'bg-white text-green-700 border-green-50 hover:border-green-200' :
                     mode.id === 'medium' ? 'bg-white text-orange-700 border-orange-50 hover:border-orange-200' :
                     'bg-white text-indigo-900 border-indigo-50 hover:border-indigo-200')
                }`}
            >
              {mode.label} <span className="opacity-50 ml-1">[{mode.count}]</span>
            </button>
          ))}
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
};

export default ModeSelector;