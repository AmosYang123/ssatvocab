import React, { memo } from 'react';

interface StatsDashboardProps {
  stats: {
    mastered: number;
    review: number;
    marked: number;
    notStudied: number;
    total: number;
  };
  onMasteredClick: () => void;
  onReviewClick: () => void;
  onMarkedClick: () => void;
}

const StatsDashboard: React.FC<StatsDashboardProps> = memo(({ stats, onMasteredClick, onReviewClick, onMarkedClick }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <button
        onClick={onMasteredClick}
        className={`bg-white py-2 px-6 rounded-lg shadow-sm border border-green-100 flex items-center justify-between transition-all ${stats.mastered > 0 ? 'hover:bg-green-50 cursor-pointer active:scale-[0.98]' : 'opacity-80'}`}
      >
        <div className="text-[9px] font-black text-green-800 tracking-[0.1em] uppercase">Mastered</div>
        <div className="text-xl font-black text-green-600 leading-none">{stats.mastered}</div>
      </button>
      <button
        onClick={onReviewClick}
        className={`bg-white py-2 px-6 rounded-lg shadow-sm border border-orange-100 flex items-center justify-between transition-all ${stats.review > 0 ? 'hover:bg-orange-50 cursor-pointer active:scale-[0.98]' : 'opacity-80'}`}
      >
        <div className="text-[9px] font-black text-orange-800 tracking-[0.1em] uppercase">Review</div>
        <div className="text-xl font-black text-orange-500 leading-none">{stats.review}</div>
      </button>
      <button
        onClick={onMarkedClick}
        className={`bg-white py-2 px-6 rounded-lg shadow-sm border border-yellow-100 flex items-center justify-between transition-all ${stats.marked > 0 ? 'hover:bg-yellow-50 cursor-pointer active:scale-[0.98]' : 'opacity-80'}`}
      >
        <div className="text-[9px] font-black text-yellow-800 tracking-[0.1em] uppercase">Marked</div>
        <div className="text-xl font-black text-yellow-500 leading-none">{stats.marked}</div>
      </button>
      <div className="bg-white py-2 px-6 rounded-lg shadow-sm border border-blue-100 flex items-center justify-between">
        <div className="text-[9px] font-black text-blue-800 tracking-[0.1em] uppercase">New</div>
        <div className="text-xl font-black text-blue-500 leading-none">{stats.notStudied}</div>
      </div>
    </div>
  );
});

export default StatsDashboard;