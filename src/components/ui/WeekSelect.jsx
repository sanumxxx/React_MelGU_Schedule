import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const WeekSelect = ({ weeks, selectedWeek, onWeekChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white px-4 py-2 border rounded-lg shadow-sm hover:bg-gray-50"
            >
                <span>
                    Неделя {selectedWeek.weekNumber} ({selectedWeek.dateStart} - {selectedWeek.dateEnd})
                </span>
                <ChevronDown 
                    className={`ml-2 h-5 w-5 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180' : ''
                    }`} 
                />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {weeks.map((week, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                onWeekChange(week);
                                setIsOpen(false);
                            }}
                            className={`
                                w-full px-4 py-2 text-left hover:bg-gray-50
                                ${selectedWeek.weekNumber === week.weekNumber ? 'bg-blue-50 text-blue-600' : ''}
                                ${index !== 0 ? 'border-t' : ''}
                            `}
                        >
                            Неделя {week.weekNumber} ({week.dateStart} - {week.dateEnd})
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WeekSelect;