import React, { useState, useMemo } from 'react';
import DaySchedule from './DaySchedule';
import WeekSelect from '../ui/WeekSelect';

const WEEKDAYS = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота'
];

const Schedule = ({ scheduleData, selectedItem, viewMode }) => {
    // Получаем все доступные недели
    const availableWeeks = useMemo(() => {
        const weeks = [];
        scheduleData.forEach(item => {
            if (item.timetable && Array.isArray(item.timetable)) {
                item.timetable.forEach(week => {
                    weeks.push({
                        weekNumber: week.week_number,
                        dateStart: week.date_start,
                        dateEnd: week.date_end,
                        originalData: week
                    });
                });
            }
        });

        // Сортируем недели по номеру и удаляем дубликаты
        const uniqueWeeks = Array.from(new Map(weeks.map(week => [week.weekNumber, week])).values())
            .sort((a, b) => a.weekNumber - b.weekNumber);

        return uniqueWeeks;
    }, [scheduleData]);

    // Состояние для текущей выбранной недели
    const [selectedWeek, setSelectedWeek] = useState(() => availableWeeks[0]);

    // Получаем расписание для выбранной недели
    const weekSchedule = useMemo(() => {
        if (!selectedWeek?.originalData) return [];

        const week = selectedWeek.originalData;

        if (viewMode === 'groups') {
            const foundGroup = week.groups.find(g => g.group_name === selectedItem);
            return foundGroup?.days || [];
        } else {
            const days = [];
            week.groups.forEach(group => {
                group.days.forEach(day => {
                    const filteredLessons = day.lessons.filter(lesson => {
                        if (viewMode === 'teachers') {
                            return lesson.teachers.some(t => t.teacher_name === selectedItem);
                        } else {
                            return lesson.auditories.some(a => a.auditory_name === selectedItem);
                        }
                    });

                    if (filteredLessons.length > 0) {
                        const existingDay = days.find(d => d.weekday === day.weekday);
                        if (existingDay) {
                            existingDay.lessons.push(...filteredLessons);
                        } else {
                            days.push({
                                weekday: day.weekday,
                                date: day.date,
                                lessons: [...filteredLessons]
                            });
                        }
                    }
                });
            });

            return days.sort((a, b) => a.weekday - b.weekday);
        }
    }, [selectedWeek, selectedItem, viewMode]);

    if (!weekSchedule || weekSchedule.length === 0) {
        return (
            <div className="space-y-4">
                <div className="mb-6 max-w-md">
                    <WeekSelect
                        weeks={availableWeeks}
                        selectedWeek={selectedWeek}
                        onWeekChange={setSelectedWeek}
                    />
                </div>
                <div className="text-center text-gray-600">
                    Расписание для {
                        viewMode === 'groups' ? 'группы' :
                        viewMode === 'teachers' ? 'преподавателя' :
                        'аудитории'
                    } {selectedItem} не найдено
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="mb-6 max-w-md">
                <WeekSelect
                    weeks={availableWeeks}
                    selectedWeek={selectedWeek}
                    onWeekChange={setSelectedWeek}
                />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
                {WEEKDAYS.map((dayName, dayIndex) => {
                    const dayData = weekSchedule.find(d => d?.weekday === dayIndex + 1);
                    return (
                        <div key={dayIndex} className="min-w-[300px] flex-shrink-0">
                            <DaySchedule
                                day={dayData}
                                date={`${dayName}, ${dayData?.date || ''}`}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Schedule;