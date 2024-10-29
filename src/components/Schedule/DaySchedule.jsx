
import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "../ui/alert-dialog";
import ComboboxSelect from '../ui/ComboboxSelect';
import Button from '../ui/Button';
import LessonEditModal from './LessonEditModal';

const TIME_SLOTS = [
    { number: 1, start: "08:00", end: "09:20" },
    { number: 2, start: "09:30", end: "10:50" },
    { number: 3, start: "11:00", end: "12:20" },
    { number: 4, start: "13:00", end: "14:20" },
    { number: 5, start: "14:10", end: "15:30" },
    { number: 6, start: "15:40", end: "17:00" },
    { number: 7, start: "17:10", end: "18:30" },
    { number: 8, start: "18:40", end: "20:00" }
];

const SUBGROUP_OPTIONS = {
    NONE: 'none',
    FIRST: 'first',
    SECOND: 'second',
    BOTH: 'both'
};

const checkConflicts = (lessons) => {
    if (!Array.isArray(lessons) || lessons.length <= 1) return false;

    // Группируем пары по подгруппам
    const lessonsBySubgroup = lessons.reduce((acc, lesson) => {
        if (!lesson) return acc;
        const subgroup = lesson.subgroup || 0;
        if (!acc[subgroup]) acc[subgroup] = [];
        acc[subgroup].push(lesson);
        return acc;
    }, {});

    // Проверяем следующие случаи:
    // 1. Если есть пара для всей группы (подгруппа 0) и еще какие-то пары - конфликт
    // 2. Если есть несколько пар для одной подгруппы - конфликт
    // 3. Если есть только пары для разных подгрупп (1, 2) - не конфликт

    // Проверяем наличие пары для всей группы
    if (lessonsBySubgroup[0]?.length > 0) {
        // Если есть пара для всей группы и еще какие-то пары - конфликт
        return Object.keys(lessonsBySubgroup).length > 1;
    }

    // Проверяем, что все подгруппы имеют только по одной паре
    return Object.values(lessonsBySubgroup).some(groupLessons => groupLessons.length > 1);
};

const hasTeacherConflict = (lessons) => {
    if (!Array.isArray(lessons) || lessons.length <= 1) return false;

    const isSameSubject = (subject1, subject2) => {
        if (!subject1 || !subject2) return false;

        // Нормализация строк
        const normalize = (str) => {
            return str.toLowerCase()
                .replace(/[()]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const clean1 = normalize(subject1);
        const clean2 = normalize(subject2);

        // Обработка случая с подгруппой
        // Если один из предметов содержит "(подгр" или просто короче,
        // и начало предметов совпадает - считаем их одним предметом
        if (clean1.includes('подгр') || clean2.includes('подгр')) {
            const base1 = clean1.split('подгр')[0].trim();
            const base2 = clean2.split('подгр')[0].trim();
            if (base1.startsWith(base2) || base2.startsWith(base1)) {
                return true;
            }
        }

        // Прямое совпадение
        if (clean1 === clean2) return true;

        // Проверка на то, является ли один предмет подстрокой другого
        // (для случаев когда один предмет это сокращённая версия другого)
        if (clean1.includes(clean2) || clean2.includes(clean1)) return true;

        return false;
    };

    // Группируем пары по времени и проверяем конфликты
    const lessonsByTime = new Map();

    lessons.forEach(lesson => {
        if (!lessonsByTime.has(lesson.time)) {
            lessonsByTime.set(lesson.time, []);
        }
        lessonsByTime.get(lesson.time).push(lesson);
    });

    // Проверяем каждый временной слот
    for (const [time, timeLessons] of lessonsByTime) {
        const uniqueLessons = new Map();

        for (const lesson of timeLessons) {
            const auditories = lesson.auditories?.map(a => a.auditory_name).sort().join(',') || '';
            let foundMatch = false;

            // Проверяем с уже существующими уроками
            for (const [existingSubject, existingAuditories] of uniqueLessons.entries()) {
                if (isSameSubject(existingSubject, lesson.subject)) {
                    // Если тот же предмет, но разные аудитории - это конфликт
                    if (existingAuditories !== auditories) {
                        return true;
                    }
                    foundMatch = true;
                    break;
                }
            }

            // Если не нашли похожий предмет, добавляем новый
            if (!foundMatch) {
                uniqueLessons.set(lesson.subject, auditories);
                // Если в одно время больше одного разного предмета - это конфликт
                if (uniqueLessons.size > 1) {
                    return true;
                }
            }
        }
    }

    return false;
};


const DaySchedule = ({ 
    day, 
    date, 
    viewMode, 
    selectedItem, 
    isEditMode,
    onLessonEdit,
    onGroupClick, 
    onTeacherClick,
    dayIndex,
    uniqueValues,
    modifiedLessons 
}) => {
    const [editingLesson, setEditingLesson] = useState(null);
    const [editingTimeSlot, setEditingTimeSlot] = useState(null);

    const lessons = day?.lessons || [];

    const handleCellClick = (timeSlot, existingLesson) => {
        if (!isEditMode) return;
        setEditingTimeSlot(timeSlot);
        setEditingLesson(existingLesson);
    };

    const handleLessonSave = (newLessons) => {
        if (onLessonEdit) {
            onLessonEdit(editingTimeSlot.number, newLessons);
        }
        setEditingLesson(null);
        setEditingTimeSlot(null);
    };

    if (!day) {
        return (
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-blue-500 p-2">
                    <h3 className="font-medium text-white text-sm">{date || 'Нет данных'}</h3>
                </div>
                <div className="p-4 text-center text-gray-500 text-sm">
                    Нет занятий
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="bg-blue-500 p-2">
                <h3 className="font-medium text-white text-sm">
                    {date}
                    {viewMode === 'groups' && (
                        <span className="ml-2">• Группа {selectedItem}</span>
                    )}
                    {viewMode === 'teachers' && (
                        <span className="ml-2">• {selectedItem}</span>
                    )}
                    {viewMode === 'auditories' && (
                        <span className="ml-2">• Аудитория {selectedItem}</span>
                    )}
                </h3>
            </div>
            <table className="w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-2 py-1 text-left">Время</th>
                        <th className="px-2 py-1 text-left">Предмет</th>
                        <th className="px-2 py-1 text-left">Преподаватель</th>
                        <th className="px-2 py-1 text-left">Аудитория</th>
                        <th className="px-2 py-1 text-left">Тип</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {TIME_SLOTS.map((timeSlot) => {
                        const timeLessons = lessons.filter(lesson => lesson?.time === timeSlot.number) || [];
                        const isModified = modifiedLessons.has(`${dayIndex}-${timeSlot.number}`);
                        const hasConflict = viewMode === 'teachers' ?
                            hasTeacherConflict(timeLessons) :
                             checkConflicts(timeLessons);

                        if (timeLessons.length === 0) {
                            return (
                                <tr
                                    key={timeSlot.number}
                                    onClick={() => handleCellClick(timeSlot)}
                                    className={isEditMode ? "hover:bg-gray-50 cursor-pointer" : ""}
                                >
                                    <td className="px-2 py-1">{`${timeSlot.start}-${timeSlot.end}`}</td>
                                    <td className="px-2 py-1">—</td>
                                    <td className="px-2 py-1">—</td>
                                    <td className="px-2 py-1">—</td>
                                    <td className="px-2 py-1">—</td>
                                </tr>
                            );
                        }

                        return timeLessons.map((lesson, idx) => (
                            <tr
                                key={`${timeSlot.number}-${idx}`}
                                onClick={() => handleCellClick(timeSlot, lesson)}
                                className={`
                                    ${isEditMode ? "hover:bg-gray-50 cursor-pointer" : ""}
                                    ${isModified ? "bg-blue-50" : ""}
                                    ${hasConflict ? "bg-red-100" : ""}
                                `}
                            >
                                <td className="px-2 py-1">
                                    {idx === 0 ? `${timeSlot.start}-${timeSlot.end}` : ''}
                                </td>
                                <td className="px-2 py-1">
                                    {lesson.subject}
                                    {lesson.subgroup !== 0 && (
                                        <span className="ml-1 text-gray-500">
                                            (подгр. {lesson.subgroup})
                                        </span>
                                    )}
                                </td>
                                <td className="px-2 py-1">
                                    {lesson.teachers?.map((teacher, i) => (
                                        <React.Fragment key={teacher.teacher_name}>
                                            {i > 0 && ', '}
                                            {viewMode === 'teachers' ? (
                                                teacher.teacher_name
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onTeacherClick?.(teacher.teacher_name);
                                                    }}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {teacher.teacher_name}
                                                </button>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </td>
                                <td className="px-2 py-1">
                                    {lesson.auditories?.map(a => a.auditory_name).join(', ')}
                                </td>
                                <td className="px-2 py-1">
                                    <div className="flex items-center gap-1">
                                        <span>{lesson.type}</span>
                                    </div>
                                </td>
                            </tr>
                        ));
                    })}
                </tbody>
            </table>

            {editingTimeSlot && (
    <LessonEditModal
        isOpen={true}
        onClose={() => {
            setEditingTimeSlot(null);
            setEditingLesson(null);
        }}
        lesson={editingLesson}
        timeSlot={editingTimeSlot}
        onSave={handleLessonSave}
        uniqueValues={{
            subjects: uniqueValues?.subjects || [],
            teachers: uniqueValues?.teachers || [],
            auditories: uniqueValues?.auditories || [],
            types: uniqueValues?.types || []
        }}
    />
)}
        </div>
    );
};

export default DaySchedule;