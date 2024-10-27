// components/GroupSelect/GroupSelect.jsx
import React, { useState } from 'react';
import Input from '../ui/Input';

const GroupSelect = ({ items, onSelect, viewMode }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = items.filter(item =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPlaceholder = () => {
        switch(viewMode) {
            case 'teachers': return 'Поиск преподавателя...';
            case 'auditories': return 'Поиск аудитории...';
            default: return 'Поиск группы...';
        }
    };

    return (
        <div className="space-y-6">
            <div className="max-w-md mx-auto">
                <Input
                    type="text"
                    placeholder={getPlaceholder()}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 border rounded-lg shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                    <button
                        key={item}
                        onClick={() => onSelect(item)}
                        className="p-4 text-left bg-white shadow rounded-lg
                                 hover:shadow-md transition-all duration-200
                                 hover:bg-gray-50"
                    >
                        {item}
                    </button>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    {searchQuery ? "Ничего не найдено" : "Нет данных для отображения"}
                </div>
            )}
        </div>
    );
};



export default GroupSelect;