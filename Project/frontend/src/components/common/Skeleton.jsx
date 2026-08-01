import React from 'react';

const Skeleton = ({ className = 'h-6 w-full', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-50/60 animate-pulse rounded-xl ${className}`}
        ></div>
      ))}
    </>
  );
};

export default Skeleton;
