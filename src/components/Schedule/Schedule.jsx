import React, { useState, useMemo, useEffect } from 'react';
import DaySchedule from './DaySchedule';
import WeekSelect from '../ui/WeekSelect';
import Button from '../ui/Button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "../ui/alert-dialog";


const WEEKDAYS = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота'
];

const Schedule = ({ scheduleData, selectedItem, viewMode, setViewMode, setSelectedItem }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedSchedule, setEditedSchedule] = useState(null);
    const [showConflicts, setShowConflicts] = useState(false);
    const [conflicts, setConflicts] = useState([]);
    const [modifiedLessons, setModifiedLessons] = useState(new Set());

    // Получаем уникальные значения
    const uniqueValues = useMemo(() => {
        const values = {
            subjects: new Set(),
            teachers: new Set(),
            auditories: new Set(),
            types: new Set()
        };

        if (!Array.isArray(scheduleData)) {
            return {
                subjects: [],
                teachers: [],
                auditories: [],
                types: []
            };
        }

        scheduleData.forEach(weekItem => {
            if (!weekItem) return;

            const timetable = weekItem.timetable || [weekItem];

            timetable.forEach(week => {
                if (!week || !Array.isArray(week.groups)) return;

                week.groups.forEach(group => {
                    if (!group || !Array.isArray(group.days)) return;

                    group.days.forEach(day => {
                        if (!day || !Array.isArray(day.lessons)) return;

                        day.lessons.forEach(lesson => {
                            if (!lesson) return;

                            if (lesson.subject) {
                                values.subjects.add(lesson.subject);
                            }
                            if (Array.isArray(lesson.teachers)) {
                                lesson.teachers.forEach(teacher => {
                                    if (teacher && teacher.teacher_name) {
                                        values.teachers.add(teacher.teacher_name);
                                    }
                                });
                            }
                            if (Array.isArray(lesson.auditories)) {
                                lesson.auditories.forEach(auditory => {
                                    if (auditory && auditory.auditory_name) {
                                        values.auditories.add(auditory.auditory_name);
                                    }
                                });
                            }
                            if (lesson.type) {
                                values.types.add(lesson.type);
                            }
                        });
                    });
                });
            });
        });

        return {
            subjects: Array.from(values.subjects).sort(),
            teachers: Array.from(values.teachers).sort(),
            auditories: Array.from(values.auditories).sort(),
            types: Array.from(values.types).sort()
        };
    }, [scheduleData]);

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
            if (!week || !Array.isArray(week.groups)) return;

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
        if (!group || !Array.isArray(group.days)) return;

        group.days?.forEach(day => {
            if (!day || !Array.isArray(day.lessons)) return;

            day.lessons?.forEach(lesson => {
                if (!lesson || !Array.isArray(lesson.teachers)) return;

                lesson.teachers?.forEach(teacher => {
                    if (!teacher || !teacher.teacher_name) return;
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
                                    date: day.date || '',
                                    lessons: []
                                }))
                            });
                        }

                        const teacherWeek = teacherWeeks.get(week.week_number);
                        const dayIndex = day.weekday - 1;

                        if (dayIndex >= 0 && dayIndex < maxDaysInWeek) {
                            const daySchedule = teacherWeek.days[dayIndex];
                            if (!daySchedule.lessons) {
                                daySchedule.lessons = [];
                            }

                            // Создаем новый урок с информацией о подгруппе
                            const newLesson = {
                                ...lesson,
                                groupName: group.group_name,
                                // Добавляем информацию о подгруппе в отображаемое имя группы
                                displayGroupName: lesson.subgroup ?
                                    `${group.group_name} (подгр. ${lesson.subgroup})` :
                                    group.group_name
                            };

                            // Проверяем, нет ли уже такого урока
                            const existingLessonIndex = daySchedule.lessons.findIndex(
                                l => l.time === lesson.time &&
                                     l.subject === lesson.subject &&
                                     l.groupName === group.group_name &&
                                     l.subgroup === lesson.subgroup // Добавляем проверку подгруппы
                            );

                            if (existingLessonIndex === -1) {
                                daySchedule.lessons.push(newLesson);
                            }

                            // Сортируем уроки по времени и подгруппам
                            daySchedule.lessons.sort((a, b) => {
                                if (a.time === b.time) {
                                    return (a.subgroup || 0) - (b.subgroup || 0);
                                }
                                return (a.time || 0) - (b.time || 0);
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
    }, [selectedWeek, selectedItem, scheduleItems]);

    const handleEditClick = () => {
        setIsEditMode(true);
        setEditedSchedule(JSON.parse(JSON.stringify(weekSchedule)));
        setModifiedLessons(new Set());
    };

    const handleSaveClick = () => {
        if (!editedSchedule) {
            console.error('No schedule to save');
            return;
        }

        const foundConflicts = checkConflicts(editedSchedule);

        if (foundConflicts.length > 0) {
            setConflicts(foundConflicts);
            setShowConflicts(true);
            return;
        }

        saveSchedule();
    };

const handleLessonEdit = (dayIndex, lessonTime, updatedLessons) => {
    console.log('Editing lesson:', { dayIndex, lessonTime, updatedLessons }); // Для отладки

    const newSchedule = [...editedSchedule];
    const daySchedule = newSchedule[dayIndex];

    if (!daySchedule) {
        console.error('Day schedule is undefined');
        return;
    }

    if (!daySchedule.lessons) {
        daySchedule.lessons = [];
    }

    // Убеждаемся, что у каждого урока есть время
    const processLesson = (lesson) => {
        if (!lesson) return null;
        return {
            ...lesson,
            time: lessonTime, // Явно устанавливаем время
            subgroup: lesson.subgroup || 0 // Устанавливаем подгруппу по умолчанию, если её нет
        };
    };

    // Очищаем существующие уроки для этого времени
    daySchedule.lessons = daySchedule.lessons.filter(lesson => lesson && lesson.time !== lessonTime);

    // Добавляем новые уроки
    if (Array.isArray(updatedLessons)) {
        const processedLessons = updatedLessons
            .filter(lesson => lesson) // Фильтруем null/undefined
            .map(processLesson) // Обрабатываем каждый урок
            .filter(lesson => lesson); // Фильтруем null после обработки

        daySchedule.lessons.push(...processedLessons);
    } else if (updatedLessons) {
        const processedLesson = processLesson(updatedLessons);
        if (processedLesson) {
            daySchedule.lessons.push(processedLesson);
        }
    }

    // Сортируем уроки
    daySchedule.lessons.sort((a, b) => {
        if (!a || !b) return 0;
        if (a.time === b.time) {
            return (a.subgroup || 0) - (b.subgroup || 0);
        }
        return (a.time || 0) - (b.time || 0);
    });

    setModifiedLessons(prev => {
        const newSet = new Set(prev);
        newSet.add(`${dayIndex}-${lessonTime}`);
        return newSet;
    });

    setEditedSchedule(newSchedule);
};
    const saveSchedule = () => {
        const savedData = JSON.parse(localStorage.getItem('scheduleData') || '[]');
        const updatedData = savedData.map(week => {
            if (week.week_number === selectedWeek.weekNumber) {
                return {
                    ...week,
                    groups: week.groups.map(group => {
                        if (group.group_name === selectedItem) {
                            return {
                                ...group,
                                days: editedSchedule
                            };
                        }
                        return group;
                    })
                };
            }
            return week;
        });

        const history = JSON.parse(localStorage.getItem('scheduleHistory') || '[]');
        history.push({
            date: new Date().toISOString(),
            group: selectedItem,
            week: selectedWeek.weekNumber,
            hasConflicts: conflicts.length > 0
        });

        localStorage.setItem('scheduleHistory', JSON.stringify(history));
        localStorage.setItem('scheduleData', JSON.stringify(updatedData));

        setIsEditMode(false);
        setShowConflicts(false);
        setConflicts([]);
        setModifiedLessons(new Set());
    };

    const checkConflicts = (schedule) => {
        const foundConflicts = [];

        if (!Array.isArray(schedule)) {
            return foundConflicts;
        }

        schedule.forEach((day, dayIndex) => {
            if (!day || !Array.isArray(day.lessons)) {
                return;
            }

            const timeSlots = {};

            day.lessons.forEach(lesson => {
                if (!lesson || typeof lesson.time === 'undefined') {
                    return;
                }

                const timeKey = lesson.time;
                if (!timeSlots[timeKey]) {
                    timeSlots[timeKey] = [];
                }
                timeSlots[timeKey].push(lesson);
            });

            Object.entries(timeSlots).forEach(([time, lessons]) => {
                if (!Array.isArray(lessons) || lessons.length <= 1) {
                    return;
                }

                const subgroups = new Set(
                    lessons
                        .filter(l => l && typeof l.subgroup !== 'undefined')
                        .map(l => l.subgroup)
                );

                if (subgroups.has(0) || subgroups.size !== lessons.length) {
                    foundConflicts.push({
                        day: WEEKDAYS[dayIndex],
                        time,
                        lessons: lessons.map(l => ({
                            subject: l?.subject || 'Неизвестный предмет',
                            teacher: l?.teachers?.map(t => t.teacher_name).join(', ') || 'Неизвестный преподаватель',
                            auditory: l?.auditories?.map(a => a.auditory_name).join(', ') || 'Неизвестная аудитория',
                            subgroup: l?.subgroup || 0
                        }))
                    });
                }
            });
        });

        return foundConflicts;
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditedSchedule(null);
        setShowConflicts(false);
        setConflicts([]);
        setModifiedLessons(new Set());
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div className="max-w-md">
                    <WeekSelect
                        weeks={weeks}
                        selectedWeek={selectedWeek}
                        onWeekChange={setSelectedWeek}
                    />
                </div>
                {viewMode === 'groups' && (
                    <div className="space-x-2">
                        {isEditMode ? (
                            <>
                                <Button variant="primary" onClick={handleSaveClick}>
                                    Сохранить
                                </Button>
                                <Button variant="secondary" onClick={handleCancelEdit}>
                                    Отменить
                                </Button>
                            </>
                        ) : (
                            <Button variant="primary" onClick={handleEditClick}>
                                Редактировать
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {(!weekSchedule || weekSchedule.length === 0) ? (
                <div className="text-center text-gray-600">
                    Расписание для группы {selectedItem} не найдено на неделю {selectedWeek.weekNumber}
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {WEEKDAYS.slice(0, maxDays).map((dayName, dayIndex) => {
                        const dayData = (isEditMode ? editedSchedule : weekSchedule)[dayIndex] || {
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
                                    isEditMode={isEditMode}
                                    onLessonEdit={(lessonTime, updatedLesson) =>
                                        handleLessonEdit(dayIndex, lessonTime, updatedLesson)}
                                    dayIndex={dayIndex}
                                    uniqueValues={uniqueValues}
                                    modifiedLessons={modifiedLessons}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            <AlertDialog open={showConflicts} onOpenChange={setShowConflicts}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Обнаружены конфликты в расписании</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            {conflicts.map((conflict, index) => (
                                <div key={index} className="border-b pb-2">
                                    <p className="font-medium">{conflict.day}, пара {conflict.time}</p>
                                    {conflict.lessons.map((lesson, lessonIndex) => (
                                        <div key={lessonIndex} className="ml-4">
                                            <p>Предмет: {lesson.subject}</p>
                                            <p>Преподаватель: {lesson.teacher}</p>
                                            <p>Аудитория: {lesson.auditory}</p>
                                            <p>Подгруппа: {lesson.subgroup || 'Вся группа'}</p>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <p className="text-yellow-600">
                                Вы можете сохранить расписание с конфликтами, но рекомендуется их исправить.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button variant="secondary" onClick={() => setShowConflicts(false)}>
                            Вернуться к редактированию
                        </Button>
                        <Button variant="danger" onClick={saveSchedule}>
                            Сохранить с конфликтами
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Schedule;