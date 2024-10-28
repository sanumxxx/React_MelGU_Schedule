import React, { useState, useMemo, useEffect } from 'react';
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

const Schedule = ({ scheduleData, selectedItem, viewMode, setViewMode, setSelectedItem }) => {
    const { weeks, scheduleItems, maxDays } = useMemo(() => {
        const allWeeks = new Map();
        const itemsData = new Map();
        let maxDaysInWeek = 5;

        if (!Array.isArray(scheduleData)) {
            return { weeks: [], scheduleItems: new Map(), maxDays: 5 };
        }

        scheduleData.forEach(weekItem => {
            const timetable = weekItem.timetable || [weekItem];

            timetable.forEach(week => {
                week.groups?.forEach(group => {
                    group.days?.forEach(day => {
                        if (day.lessons?.length > 0) {
                            maxDaysInWeek = Math.max(maxDaysInWeek, day.weekday);
                        }
                    });
                });

                const weekKey = week.week_number;
                const existingWeek = allWeeks.get(weekKey);

                if (!existingWeek || (existingWeek.dateEnd < week.date_end) || (existingWeek.maxDays < maxDaysInWeek)) {
                    allWeeks.set(weekKey, {
                        weekNumber: week.week_number,
                        dateStart: week.date_start,
                        dateEnd: week.date_end,
                        maxDays: maxDaysInWeek,
                        originalData: week
                    });
                }

                // Обработка данных для групп, преподавателей и аудиторий в зависимости от режима
                if (viewMode === 'groups') {
                    week.groups?.forEach(group => {
                        if (group.group_name === selectedItem) {
                            if (!itemsData.has(group.group_name)) {
                                itemsData.set(group.group_name, new Map());
                            }

                            const weekData = itemsData.get(group.group_name);
                            if (!weekData.has(week.week_number)) {
                                weekData.set(week.week_number, {
                                    weekNumber: week.week_number,
                                    days: Array(maxDaysInWeek).fill(null).map((_, index) => ({
                                        weekday: index + 1,
                                        date: '',
                                        lessons: []
                                    }))
                                });
                            }

                            group.days?.forEach(day => {
                                const dayIndex = day.weekday - 1;
                                if (dayIndex < maxDaysInWeek) {
                                    weekData.get(week.week_number).days[dayIndex] = {
                                        ...day,
                                        lessons: day.lessons || []
                                    };
                                }
                            });
                        }
                    });
                } else if (viewMode === 'teachers') {
                    week.groups?.forEach(group => {
                        group.days?.forEach(day => {
                            day.lessons?.forEach(lesson => {
                                lesson.teachers?.forEach(teacher => {
                                    if (teacher.teacher_name === selectedItem) {
                                        if (!itemsData.has(teacher.teacher_name)) {
                                            itemsData.set(teacher.teacher_name, new Map());
                                        }

                                        const teacherWeeks = itemsData.get(teacher.teacher_name);
                                        if (!teacherWeeks.has(week.week_number)) {
                                            teacherWeeks.set(week.week_number, {
                                                weekNumber: week.week_number,
                                                days: Array(maxDaysInWeek).fill(null).map((_, index) => ({
                                                    weekday: index + 1,
                                                    date: '',
                                                    lessons: []
                                                }))
                                            });
                                        }

                                        const teacherWeek = teacherWeeks.get(week.week_number);
                                        const dayIndex = day.weekday - 1;

                                        if (dayIndex < maxDaysInWeek) {
                                            teacherWeek.days[dayIndex].date = day.date;
                                            teacherWeek.days[dayIndex].lessons.push({
                                                ...lesson,
                                                groupName: group.group_name
                                            });
                                        }
                                    }
                                });
                            });
                        });
                    });
                } else if (viewMode === 'auditories') {
                    week.groups?.forEach(group => {
                        group.days?.forEach(day => {
                            day.lessons?.forEach(lesson => {
                                lesson.auditories?.forEach(auditory => {
                                    if (auditory.auditory_name === selectedItem) {
                                        if (!itemsData.has(auditory.auditory_name)) {
                                            itemsData.set(auditory.auditory_name, new Map());
                                        }

                                        const auditoryWeeks = itemsData.get(auditory.auditory_name);
                                        if (!auditoryWeeks.has(week.week_number)) {
                                            auditoryWeeks.set(week.week_number, {
                                                weekNumber: week.week_number,
                                                days: Array(maxDaysInWeek).fill(null).map((_, index) => ({
                                                    weekday: index + 1,
                                                    date: '',
                                                    lessons: []
                                                }))
                                            });
                                        }

                                        const auditoryWeek = auditoryWeeks.get(week.week_number);
                                        const dayIndex = day.weekday - 1;

                                        if (dayIndex < maxDaysInWeek) {
                                            auditoryWeek.days[dayIndex].date = day.date;
                                            auditoryWeek.days[dayIndex].lessons.push({
                                                ...lesson,
                                                groupName: group.group_name
                                            });
                                        }
                                    }
                                });
                            });
                        });
                    });
                }
            });
        });

        const sortedWeeks = Array.from(allWeeks.values())
            .sort((a, b) => a.weekNumber - b.weekNumber);

        return {
            weeks: sortedWeeks,
            scheduleItems: itemsData,
            maxDays: maxDaysInWeek
        };
    }, [scheduleData, selectedItem, viewMode]);

    const [selectedWeek, setSelectedWeek] = useState(() => weeks[0] || null);

    useEffect(() => {
        if (weeks.length > 0 && (!selectedWeek || !weeks.find(w => w.weekNumber === selectedWeek.weekNumber))) {
            setSelectedWeek(weeks[0]);
        }
    }, [weeks, selectedWeek]);

    const weekSchedule = useMemo(() => {
        if (!selectedWeek || !scheduleItems.has(selectedItem)) {
            return [];
        }

        const entityData = scheduleItems.get(selectedItem);
        const weekData = entityData.get(selectedWeek.weekNumber);
        return weekData?.days || [];
    }, [selectedWeek, selectedItem, scheduleItems, viewMode]);

    const handleGroupClick = (groupName) => {
        setViewMode('groups');
        setSelectedItem(groupName);
    };

    const handleTeacherClick = (teacherName) => {
        setViewMode('teachers');
        setSelectedItem(teacherName);
    };

    if (!selectedWeek || weeks.length === 0) {
        return (
            <div className="text-center text-gray-600 p-4">
                Нет данных для отображения
            </div>
        );
    }

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
                    {WEEKDAYS.slice(0, maxDays).map((dayName, dayIndex) => {
                        const dayData = weekSchedule[dayIndex] || {
                            weekday: dayIndex + 1,
                            date: '',
                            lessons: []
                        };

                        return (
                            <div key={dayIndex} className="min-w-[300px] flex-shrink-0">
                                <DaySchedule
                                    day={dayData}
                                    date={`${dayName}, ${dayData?.date || ''}`}
                                    viewMode={viewMode}
                                    selectedItem={selectedItem}
                                    onGroupClick={handleGroupClick}
                                    onTeacherClick={handleTeacherClick}
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
