import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Word, WordStatusMap, MarkedWordsMap } from '../types';
import { Icons } from './Icons';
import { SET_BATCHES } from '../data/review_batches';

interface WordSelectorModalProps {
  vocab: Word[];
  wordStatuses: WordStatusMap;
  markedWords: MarkedWordsMap;
  setCount: number;
  onClose: () => void;
  onSave: (name: string, selectedNames: string[]) => void;
}

const ITEMS_PER_PAGE = 100;

const WordSelectorModal: React.FC<WordSelectorModalProps> = ({
  vocab,
  wordStatuses,
  markedWords,
  setCount,
  onClose,
  onSave
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [setName, setSetName] = useState(`Set ${setCount + 1}`);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showIndicators, setShowIndicators] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredVocab = useMemo(() => {
    setVisibleCount(ITEMS_PER_PAGE);
    if (!searchTerm.trim()) return vocab;
    const lowerSearch = searchTerm.toLowerCase();
    return vocab.filter(w =>
      w.name.toLowerCase().includes(lowerSearch) ||
      w.definition.toLowerCase().includes(lowerSearch)
    );
  }, [vocab, searchTerm]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 500) {
      if (visibleCount < filteredVocab.length) {
        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
      }
    }
  }, [visibleCount, filteredVocab.length]);

  const handleToggle = useCallback((wordName: string, index: number, isShift: boolean) => {
    const newSelected = new Set(selected);
    if (isShift && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      for (let i = start; i <= end; i++) {
        newSelected.add(filteredVocab[i].name);
      }
    } else {
      if (newSelected.has(wordName)) newSelected.delete(wordName);
      else newSelected.add(wordName);
    }
    setSelected(newSelected);
    setLastClickedIndex(index);
  }, [selected, lastClickedIndex, filteredVocab]);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'hard': return 'text-red-500 bg-red-50 border-red-100';
      case 'medium': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'easy': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'basic': return 'text-indigo-400 bg-indigo-50 border-indigo-100';
      default: return 'text-gray-400 bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex-1">
          <input
            type="text"
            className="text-2xl font-black text-indigo-900 bg-transparent border-b-4 border-indigo-600 focus:border-indigo-800 outline-none w-full max-w-sm px-2 py-1 transition-colors"
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            placeholder={`Set ${setCount + 1}`}
          />
        </div>
        <button onClick={onClose} className="p-3 text-gray-400 hover:text-indigo-600 active:scale-95 transition-all">
          <Icons.Close />
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-6 space-y-4 bg-gray-50 shadow-inner">
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 z-10">
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Search words..."
            className="w-full bg-white text-gray-900 border-indigo-500 border-2 rounded-lg pl-14 pr-6 py-3 text-base outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg placeholder:text-gray-400 font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex gap-3">
              <button onClick={() => { const ns = new Set(selected); filteredVocab.forEach(w => ns.add(w.name)); setSelected(ns); }} className="px-10 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-black shadow-md hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest">SELECT ALL</button>
              <button onClick={() => { const ns = new Set(selected); filteredVocab.forEach(w => ns.delete(w.name)); setSelected(ns); }} className="px-10 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-[11px] font-black shadow-sm hover:bg-gray-300 active:scale-95 transition-all uppercase tracking-widest">CLEAR</button>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-lg border-2 border-indigo-100 shadow-sm">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Select Set #</span>
              <input
                type="number"
                min="1"
                max={SET_BATCHES.length}
                id="set-number-input"
                className="w-14 bg-indigo-50 text-indigo-900 font-black px-2 py-0.5 rounded outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const setNum = parseInt((e.target as HTMLInputElement).value);
                    if (setNum > 0 && setNum <= SET_BATCHES.length) {
                      const items = SET_BATCHES[setNum - 1];
                      const newSelected = new Set(selected);
                      items.forEach(name => newSelected.add(name));
                      setSelected(newSelected);
                      setSetName(`Review Set ${setNum}`);
                    }
                  }
                }}
                placeholder="#"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('set-number-input') as HTMLInputElement;
                  const setNum = parseInt(input?.value || '0');
                  if (setNum > 0 && setNum <= SET_BATCHES.length) {
                    const items = SET_BATCHES[setNum - 1];
                    const newSelected = new Set(selected);
                    items.forEach(name => newSelected.add(name));
                    setSelected(newSelected);
                    setSetName(`Review Set ${setNum}`);
                  }
                }}
                className="px-3 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-black hover:bg-indigo-700 active:scale-95 transition-all"
              >
                GO
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => setShowIndicators(!showIndicators)}
                className={`w-10 h-5 rounded-full transition-colors relative ${showIndicators ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showIndicators ? 'left-6' : 'left-1'}`} />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Show Indicators</span>
            </label>
          </div>

          <div className="text-indigo-600 font-black text-[12px] tracking-[0.2em] uppercase bg-indigo-50 px-6 py-1.5 rounded-full border border-indigo-100">
            {selected.size} WORDS SELECTED
          </div>
        </div>
      </div>

      {/* Grid */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-white">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredVocab.slice(0, visibleCount).map((word, idx) => {
            const status = wordStatuses[word.name];
            const isMarked = markedWords[word.name];

            return (
              <div
                key={word.name}
                onClick={(e) => handleToggle(word.name, idx, e.shiftKey)}
                className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer shadow-sm ${selected.has(word.name) ? 'border-indigo-600 bg-indigo-50 scale-[1.02]' : 'border-gray-50 bg-white hover:border-indigo-200'}`}
              >
                {showIndicators && (
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {/* Status Badge */}
                    <div className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${status === 'mastered' ? 'bg-green-50 text-green-600 border-green-100' :
                      status === 'review' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                      {status || 'new'}
                    </div>
                    {/* Difficulty Badge */}
                    <div className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getDifficultyColor(word.difficulty)}`}>
                      {word.difficulty}
                    </div>
                    {/* Flag Badge */}
                    {isMarked && (
                      <div className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded">FLAGGED</div>
                    )}
                  </div>
                )}
                <div className="font-black text-indigo-900 text-lg truncate mb-1 italic tracking-tighter">{word.name}</div>
                <p className="text-[11px] text-gray-400 truncate opacity-70 font-medium">{word.definition}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50 flex justify-center shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => {
            if (selected.size > 0) {
              onSave(setName, Array.from(selected));
            }
          }}
          className="w-full max-w-md py-3 px-16 bg-indigo-600 text-white rounded-lg font-black text-base hover:bg-indigo-700 shadow-xl active:scale-[0.98] transition-all uppercase tracking-[0.3em]"
        >
          CREATE GROUP
        </button>
      </div>
    </div>
  );
};

export default WordSelectorModal;