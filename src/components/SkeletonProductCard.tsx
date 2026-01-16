import React from 'react';

export default function SkeletonProductCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="skeleton skeleton-img" style={{ aspectRatio: '1 / 1' }} />
      <div className="p-4 space-y-2">
        <div className="skeleton skeleton-line lg w-1/1" />
        <div className="skeleton skeleton-line sm w-1/2" />
      </div>
    </div>
  );
}

