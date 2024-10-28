import React, { useState, useMemo } from 'react';
import Input from '../ui/Input';
import { findScheduleConflicts } from '../../utils/scheduleConflicts';

const GroupSelect = ({ items, scheduleData, onSelect, viewMode }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const { conflicts, teacherSchedule } = useMemo(() => {
        return findScheduleConflicts(scheduleData, viewMode);
    }, [scheduleData, viewMode]);

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [items, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="max-w-md mx-auto">
                <Input
                    type="text"
                    placeholder={`Поиск ${
                        viewMode === 'groups' ? 'группы' :
                        viewMode === 'teachers' ? 'преподавателя' :
                        'аудитории'
                    }...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 border rounded-lg shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => {
                    const hasConflict = conflicts.has(item);

                    // Получаем расписание преподавателя если мы в режиме просмотра преподавателей
                    const teacherLessons = viewMode === 'teachers' ?
                        teacherSchedule?.get(item) || [] : [];

                    // Группируем лекции по времени и аудитории
                    const commonLectures = viewMode === 'teachers' ?
                        teacherLessons.reduce((acc, lesson) => {
                            if (lesson && lesson.type?.toLowerCase().includes('лек')) {
                                const key = `${lesson.weekNumber}-${lesson.dayNumber}-${lesson.time}`;
                                if (!acc[key]) {
                                    acc[key] = new Set();
                                }
                                acc[key].add(lesson.groupName);
                            }
                            return acc;
                        }, {}) : {};

                    return (
                        <button
                            key={item}
                            onClick={() => onSelect(item)}
                            className={`
                                relative p-4 text-left rounded-lg transition-all duration-200
                                ${hasConflict 
                                    ? 'bg-red-50 hover:bg-red-100 border-2 border-red-200' 
                                    : 'bg-white hover:bg-gray-50 shadow hover:shadow-md'}
                            `}
                        >
                            <div className="flex justify-between items-center">
                                <span className={hasConflict ? 'font-medium' : ''}>
                                    {item}
                                </span>
                                {hasConflict && (
                                    <span
                                        className="absolute top-2 right-2 text-lg animate-pulse"
                                        title={`${
                                            viewMode === 'groups' 
                                                ? 'В расписании группы есть конфликты пар'
                                                : 'У преподавателя есть пересечения в расписании'
                                        }`}
                                    >
                                        ⚠️
                                    </span>
                                )}
                            </div>
                            {viewMode === 'teachers' && Object.entries(commonLectures).map(([key, groups]) => {
                                if (groups.size > 1) {
                                    return (
                                        <div key={key} className="mt-2 text-xs text-gray-500">
                                            Общая лекция для: {Array.from(groups).join(', ')}
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </button>
                    );
                })}
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