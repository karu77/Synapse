import React from 'react';

const HeaderInput = ({ onClick }) => {
  return (
    <div 
      className="bg-white/10 dark:bg-white/5 rounded-full pl-4 pr-2 py-1 flex-1 max-w-xs group cursor-pointer"
      onClick={onClick}
    >
      <input
        type="text"
        placeholder="Create diagrams here"
        className="bg-transparent w-full text-sm text-skin-muted placeholder:text-skin-muted focus:outline-none pointer-events-none"
        readOnly
      />
    </div>
  );
};

export default HeaderInput; 