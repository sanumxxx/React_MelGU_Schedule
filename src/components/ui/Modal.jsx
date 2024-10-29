// components/ui/Modal.jsx
import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ModalHeader = ({ children }) => (
  <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
    <div className="text-lg font-medium leading-6 text-gray-900">
      {children}
    </div>
  </div>
);

export const ModalBody = ({ children }) => (
  <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
    {children}
  </div>
);

export const ModalFooter = ({ children }) => (
  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
    {children}
  </div>
);

export default Modal;