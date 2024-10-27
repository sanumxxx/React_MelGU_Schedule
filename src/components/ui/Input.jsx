import React from 'react';

const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`
        block w-full rounded-md border-gray-300 shadow-sm
        focus:border-primary-500 focus:ring-primary-500
        ${className}
      `}
      {...props}
    />
  );
};

export default Input;