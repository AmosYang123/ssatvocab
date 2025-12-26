import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Word } from '../types';
import { Icons } from './Icons';

interface WordSelectorModalProps {
  vocab: Word[];
  setCount: number;
  onClose: () => void;
  onSave: (name: string, selectedNames: string[]) => void;
}

const ITEMS_PER_PAGE = 100;

const WordSelectorModal: React.FC<WordSelectorModalProps> = ({ vocab, setCount, onClose, onSave }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [setName, setSetName] = useState(`Set ${setCount + 1}`);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
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
          <div className="flex gap-3">
            <button onClick={() => { const ns = new Set(selected); filteredVocab.forEach(w => ns.add(w.name)); setSelected(ns); }} className="px-10 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-black shadow-md hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest">SELECT ALL</button>
            <button onClick={() => { const ns = new Set(selected); filteredVocab.forEach(w => ns.delete(w.name)); setSelected(ns); }} className="px-10 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-[11px] font-black shadow-sm hover:bg-gray-300 active:scale-95 transition-all uppercase tracking-widest">CLEAR</button>
          </div>
          <div className="text-indigo-600 font-black text-[12px] tracking-[0.2em] uppercase bg-indigo-50 px-6 py-1.5 rounded-full border border-indigo-100">
            {selected.size} WORDS SELECTED
          </div>
        </div>
      </div>

      {/* Grid */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-white">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredVocab.slice(0, visibleCount).map((word, idx) => (
            <div
              key={word.name}
              onClick={(e) => handleToggle(word.name, idx, e.shiftKey)}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer shadow-sm ${selected.has(word.name) ? 'border-indigo-600 bg-indigo-50 scale-[1.02]' : 'border-gray-50 bg-white hover:border-indigo-200'}`}
            >
              <div className="font-black text-indigo-900 text-lg truncate mb-1 italic tracking-tighter">{word.name}</div>
              <p className="text-[11px] text-gray-400 truncate opacity-70 font-medium">{word.definition}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50 flex justify-center shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => selected.size > 0 ? onSave(setName, Array.from(selected)) : alert("Select words first")}
          className="w-full max-w-md py-3 px-16 bg-indigo-600 text-white rounded-lg font-black text-base hover:bg-indigo-700 shadow-xl active:scale-[0.98] transition-all uppercase tracking-[0.3em]"
        >
          CREATE GROUP
        </button>
      </div>
    </div>
  );
};

export default WordSelectorModal;