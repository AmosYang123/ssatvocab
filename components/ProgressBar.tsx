import React, { useState, useEffect, useRef } from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  onJump: (value: number) => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, onJump }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(current.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const percentage = (current / total) * 100;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleFinishEdit = () => {
    const num = parseInt(editValue);
    if (!isNaN(num) && num > 0 && num <= total) {
      onJump(num);
    }
    setIsEditing(false);
  };

  return (
    <div className="w-full max-w-md mb-4">
      <div className="flex justify-between items-end mb-2">
        <div
          className="text-indigo-900 dark:text-indigo-100 font-bold text-lg cursor-pointer select-none"
          onDoubleClick={() => {
            setIsEditing(true);
            setEditValue(current.toString());
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              className="w-12 border-b-2 border-indigo-500 bg-transparent outline-none text-center text-indigo-900 dark:text-indigo-100"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
          ) : (
            <span>{current}</span>
          )}
          <span className="text-indigo-300 dark:text-indigo-400 mx-1">/</span>
          <span className="text-gray-400 dark:text-gray-500">{total}</span>
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm font-bold">{Math.round(percentage)}%</div>
      </div>
      <div className="h-2.5 w-full bg-indigo-100 dark:bg-slate-700 rounded-md overflow-hidden shadow-inner">
        <div
          className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;