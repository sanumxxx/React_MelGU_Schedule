// src/components/ui/ComboboxSelect.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const ComboboxSelect = ({ options = [], value = '', onChange, placeholder = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const updatePosition = () => {
            if (buttonRef.current && isOpen) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);

        updatePosition();

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (option) => {
        onChange(option);
        setSearchQuery('');
        setIsOpen(false);
    };

    const Dropdown = () => (
        <div
            ref={dropdownRef}
            className="fixed bg-white border rounded-md shadow-lg"
            style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: 9999
            }}
        >
            <div className="p-2">
                <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            <div className="max-h-[200px] overflow-y-auto">
                {filteredOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                        Ничего не найдено
                    </div>
                ) : (
                    filteredOptions.map((option) => (
                        <button
                            key={option}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                                value === option ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleSelect(option)}
                        >
                            {option}
                        </button>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-left border rounded-md bg-white hover:bg-gray-50"
            >
                <span className="truncate">
                    {value || placeholder}
                </span>
                <ChevronDown
                    className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {isOpen && createPortal(
                <Dropdown />,
                document.body
            )}
        </>
    );
};

export default ComboboxSelect;