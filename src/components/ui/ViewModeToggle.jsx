// components/ui/ViewModeToggle.jsx
import React from 'react';

const ViewModeToggle = ({ activeMode, onModeChange }) => {
    const modes = [
        { id: 'groups', label: 'Группы' },
        { id: 'teachers', label: 'Преподаватели' },
        { id: 'auditories', label: 'Аудитории' }
    ];

    return (
        <div className="flex justify-center mb-8">
            <div className="relative inline-flex bg-gray-100 rounded-lg p-1">
                {modes.map((mode, index) => (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        className={`
                            relative z-10 px-8 py-2 rounded-md text-sm font-medium
                            transition-colors duration-200
                            ${activeMode === mode.id 
                                ? 'text-white'
                                : 'text-gray-600 hover:text-gray-900'
                            }
                        `}
                    >
                        {mode.label}
                        {activeMode === mode.id && (
                            <div
                                className="absolute inset-0 bg-blue-500 rounded-md -z-10
                                         transition-all duration-200 ease-out"
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ViewModeToggle;