import React, { memo, useRef, useLayoutEffect, useState, useMemo, useCallback } from 'react';
import { Word, WordStatusType } from '../types';
import { Icons } from './Icons';

// Pronunciation helper using Web Speech API
const usePronunciation = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return { speak, isSpeaking };
};

// Global canvas context for text measurement to avoid recreation
const measureCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
const measureContext = measureCanvas ? measureCanvas.getContext('2d') : null;

// Helper to calculate optimal font size
const getOptimalFontSize = (
  text: string,
  availableWidth: number,
  fontFace: string,
  minSize: number,
  maxSize: number
): number => {
  if (!measureContext || !availableWidth) return minSize;

  // Function to create the font string
  // Matches the component's 'font-black' (900) and 'italic'
  const getFontString = (size: number) => `italic 900 ${size}px ${fontFace}`;

  // 1. Measure at max size first
  measureContext.font = getFontString(maxSize);
  const textMetrics = measureContext.measureText(text);
  const textWidth = textMetrics.width;

  // 2. If it fits, return max size
  // We use a small buffer (0.99) to be safe against sub-pixel differences
  if (textWidth <= availableWidth * 0.99) {
    return maxSize;
  }

  // 3. Calculate ratio
  const ratio = availableWidth / textWidth;

  // 4. Calculate new size based on ratio
  // Apply a slightly more aggressive safety factor (0.95) to ensure it definitely fits
  const newSize = Math.floor(maxSize * ratio * 0.95);

  // 5. Return clamped value
  return Math.max(minSize, Math.min(maxSize, newSize));
};

const AutoFitText = ({
  text,
  containerWidth,
  className,
  minSize = 24,
  maxSize = 96
}: {
  text: string;
  containerWidth: number;
  className?: string;
  minSize?: number;
  maxSize?: number;
}) => {

  const fontSize = useMemo(() => {
    // Only calculate if we have a valid width
    if (!containerWidth) return minSize;

    // Assuming 'Inter' as the font family from global styles.
    // 'font-black' corresponds to weight 900.
    return getOptimalFontSize(text, containerWidth, "'Inter', sans-serif", minSize, maxSize);
  }, [text, containerWidth, minSize, maxSize]);

  return (
    <h2
      className={className}
      style={{
        fontSize: `${fontSize}px`,
        whiteSpace: 'nowrap',
        width: '100%',
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        // Critical: prevent font-size transition if it was inherited
        transitionProperty: 'color, background-color, opacity, transform',
      }}
    >
      {text}
    </h2>
  );
};

interface FlashcardProps {
  word: Word | null;
  showDefinition: boolean;
  onToggle: () => void;
  status: WordStatusType;
}

// parsing logic outside component to avoid recreation
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

const Flashcard: React.FC<FlashcardProps> = memo(({ word, showDefinition, onToggle, status }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const { speak, isSpeaking } = usePronunciation();

  // Handle pronunciation click without triggering card flip
  const handleSpeak = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (word) {
      speak(word.name);
    }
  }, [word, speak]);

  // Measure available width for text
  useLayoutEffect(() => {
    const updateWidth = () => {
      if (cardRef.current) {
        const style = window.getComputedStyle(cardRef.current);
        const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const width = cardRef.current.clientWidth - paddingX;
        setContentWidth(width);
      }
    };

    // Initial measure
    updateWidth();

    // Observer for resizes
    const observer = new ResizeObserver(updateWidth);
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!word) return null;

  const content = parseContent(word.definition);

  return (
    <div
      ref={cardRef}
      onClick={onToggle}
      className="group relative w-full max-w-3xl bg-white rounded-xl shadow-xl hover:shadow-2xl border border-indigo-50 min-h-[320px] md:min-h-[400px] flex items-center justify-center p-8 md:p-12 cursor-pointer transition-all duration-300 overflow-hidden"
    >
      {/* Pronunciation Button - Bottom Right */}
      <button
        onClick={handleSpeak}
        className={`absolute bottom-6 right-8 z-20 p-2.5 rounded-lg transition-all shadow-sm border ${isSpeaking
          ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
          : 'bg-white text-indigo-500 border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
          }`}
        title="Play pronunciation"
      >
        <Icons.Speaker className="w-5 h-5" />
      </button>

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
            <AutoFitText
              text={word.name}
              containerWidth={contentWidth}
              className="font-black text-indigo-600 tracking-tighter px-4 drop-shadow-md italic"
              maxSize={80}
              minSize={30}
            />
            <p className="text-indigo-200 font-black uppercase tracking-[0.5em] text-[12px]">Tap to reveal</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <AutoFitText
              text={word.name}
              containerWidth={contentWidth}
              className="font-black text-indigo-300 opacity-60 px-4 italic"
              maxSize={40}
              minSize={20}
            />
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
});

export default Flashcard;