import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
    // Получаем все доступные недели и данные по всем группам
    const { weeks, groupData } = useMemo(() => {
        const allWeeks = [];
        const groupsData = {};

        // Проходим по всем файлам
        scheduleData.forEach(item => {
            // Получаем timetable из файла
            const timetable = item.timetable || [item];

            // Обрабатываем каждую неделю
            timetable.forEach(week => {
                // Добавляем неделю в список
                allWeeks.push({
                    weekNumber: week.week_number,
                    dateStart: week.date_start,
                    dateEnd: week.date_end,
                    originalData: week
                });

                // Сохраняем данные групп
                week.groups.forEach(group => {
                    if (!groupsData[group.group_name]) {
                        groupsData[group.group_name] = [];
                    }
                    groupsData[group.group_name].push({
                        weekNumber: week.week_number,
                        data: group
                    });
                });
            });
        });

        // Удаляем дубликаты недель и сортируем
        const uniqueWeeks = Array.from(
            new Map(allWeeks.map(week => [week.weekNumber, week])).values()
        ).sort((a, b) => a.weekNumber - b.weekNumber);

        return {
            weeks: uniqueWeeks,
            groupData: groupsData
        };
    }, [scheduleData]);

    // Состояние для текущей выбранной недели
    const [selectedWeek, setSelectedWeek] = useState(() => weeks[0]);

    // Эффект для автоматического выбора правильной недели при выборе группы
    useEffect(() => {
        if (groupData[selectedItem]) {
            const groupWeeks = groupData[selectedItem];
            if (groupWeeks.length > 0) {
                const weekData = weeks.find(w => w.weekNumber === groupWeeks[0].weekNumber);
                if (weekData) {
                    setSelectedWeek(weekData);
                }
            }
        }
    }, [selectedItem, groupData, weeks]);

    // Получаем расписание для выбранной недели
    const weekSchedule = useMemo(() => {
        if (!selectedWeek?.originalData || !groupData[selectedItem]) return [];

        const week = selectedWeek.originalData;
        const groupWeekData = groupData[selectedItem].find(g => g.weekNumber === selectedWeek.weekNumber);

        if (!groupWeekData) return [];

        if (viewMode === 'groups') {
            return groupWeekData.data.days || [];
        } else {
            // код для преподавателей и аудиторий
            return [];
        }
    }, [selectedWeek, selectedItem, groupData, viewMode]);

    return (
        <div className="space-y-4">
            <div className="mb-6 max-w-md">
                <WeekSelect
                    weeks={weeks}
                    selectedWeek={selectedWeek}
                    onWeekChange={setSelectedWeek}
                />
            </div>

            {(!weekSchedule || weekSchedule.length === 0) ? (
                <div className="text-center text-gray-600">
                    Расписание для {
                        viewMode === 'groups' ? 'группы' :
                        viewMode === 'teachers' ? 'преподавателя' :
                        'аудитории'
                    } {selectedItem} не найдено на неделю {selectedWeek.weekNumber}
                </div>
            ) : (
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
            )}
        </div>
    );
};

export default Schedule;