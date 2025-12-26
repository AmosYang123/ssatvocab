import React from 'react';
import { Word, WordStatusType } from '../types';
import { Icons } from '../constants';

interface FlashcardProps {
  word: Word | null;
  showDefinition: boolean;
  onToggle: () => void;
  status: WordStatusType;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, showDefinition, onToggle, status }) => {
  if (!word) return null;

  // Parsing logic for rich definition format: "Def. Synonyms: X, Y. (Ex: Example)"
  const parseContent = (content: string) => {
    const parts = {
      main: content,
      synonyms: '',
      example: ''
    };

    if (content.includes('(Ex:')) {
      const [beforeEx, exPart] = content.split('(Ex:');
      parts.main = beforeEx.trim();
      parts.example = exPart.replace(')', '').trim();
    }

    if (parts.main.includes('Synonyms:')) {
      const [defPart, synPart] = parts.main.split('Synonyms:');
      parts.main = defPart.trim().replace(/\.$/, ''); // Remove trailing dot
      parts.synonyms = synPart.trim().replace(/\.$/, '');
    }

    return parts;
  };

  const content = parseContent(word.definition);

  return (
    <div 
      onClick={onToggle}
      className="group relative w-full max-w-3xl bg-white rounded-xl shadow-xl hover:shadow-2xl border border-indigo-50 min-h-[320px] md:min-h-[400px] flex items-center justify-center p-8 md:p-12 cursor-pointer transition-all duration-300 overflow-hidden"
    >
      {/* Status Badge */}
      <div className="absolute top-6 right-8 z-10">
        {status === 'mastered' ? (
          <div className="flex items-center gap-1.5 px-6 py-1 bg-green-100 text-green-700 rounded-md text-[11px] font-black shadow-sm border border-green-200 uppercase">
            <Icons.Trophy />
            MASTERED
          </div>
        ) : status === 'review' ? (
          <div className="flex items-center gap-1.5 px-6 py-1 bg-orange-100 text-orange-700 rounded-md text-[11px] font-black shadow-sm border border-orange-200 uppercase">
            <Icons.Brain />
            REVIEW
          </div>
        ) : (
          <div className="px-6 py-1 bg-gray-50 text-gray-400 rounded-md text-[11px] font-black border border-gray-100 uppercase tracking-tighter">
            New
          </div>
        )}
      </div>

      {/* Content */}
      <div className="text-center w-full">
        {!showDefinition ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-6xl md:text-8xl font-black text-indigo-600 tracking-tighter break-words px-4 drop-shadow-md italic">
              {word.name}
            </h2>
            <p className="text-indigo-200 font-black uppercase tracking-[0.5em] text-[12px]">Tap to reveal</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-3xl md:text-4xl font-black text-indigo-300 opacity-60 break-words px-4 italic">
              {word.name}
            </h2>
            <div className="h-1 w-20 bg-indigo-50 mx-auto rounded-full" />
            <div className="max-w-2xl mx-auto space-y-6">
              <p className="text-xl md:text-3xl text-gray-800 font-bold leading-tight px-4">
                {content.main}
              </p>
              
              {content.synonyms && (
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest w-full opacity-60 mb-1">Synonyms</span>
                  {content.synonyms.split(',').map((syn, i) => (
                    <span key={i} className="px-6 py-1.5 bg-indigo-50 text-indigo-600 text-[11px] font-black rounded-lg border border-indigo-100 uppercase shadow-sm">
                      {syn.trim()}
                    </span>
                  ))}
                </div>
              )}

              {content.example && (
                <div className="text-base md:text-xl text-indigo-500 italic bg-indigo-50/40 p-6 rounded-lg border border-indigo-100/30 leading-relaxed text-left relative">
                  <span className="block font-black not-italic text-indigo-600 text-[10px] uppercase mb-2 opacity-50 tracking-widest">In Context</span>
                  "{content.example}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  );
};

export default Flashcard;