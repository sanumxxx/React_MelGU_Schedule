import React from 'react';

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

// Функция для расчета процента совпадения двух строк
const calculateSimilarity = (str1, str2) => {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const similarity = (intersection.size * 2) / (words1.size + words2.size);
    return similarity >= 0.5; // Возвращаем true, если совпадение 50% или больше
};

const DaySchedule = ({ day, date, viewMode = 'groups', selectedItem, onGroupClick, onTeacherClick }) => {
    if (!day || !day.lessons) {
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

    // Функция для определения конфликта в одном временном слоте
    const hasConflict = (lessons) => {
        const uniqueLessons = new Set();

        for (const lesson of lessons) {
            const key = `${lesson.auditories?.map(a => a.auditory_name).join(',')}_${lesson.type}`;
            let isSimilar = false;

            for (const storedLesson of uniqueLessons) {
                const [storedSubject, storedKey] = storedLesson;

                // Проверяем совпадение предметов с 50% порогом
                if (calculateSimilarity(storedSubject, lesson.subject) && storedKey === key) {
                    isSimilar = true;
                    break;
                }
            }

            if (!isSimilar) {
                uniqueLessons.add([lesson.subject, key]);
            }
        }

        // Если уникальных ключей больше одного, считаем это конфликтом
        return uniqueLessons.size > 1;
    };

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
                        <th className="px-2 py-1 text-left">Группа</th>
                        <th className="px-2 py-1 text-left">Аудитория</th>
                        <th className="px-2 py-1 text-left">Тип</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {TIME_SLOTS.map((timeSlot) => {
                        const lessons = day.lessons.filter(lesson => lesson.time === timeSlot.number);

                        if (lessons.length === 0) {
                            return (
                                <tr key={timeSlot.number}>
                                    <td className="px-2 py-1">{`${timeSlot.start}-${timeSlot.end}`}</td>
                                    <td className="px-2 py-1">—</td>
                                    <td className="px-2 py-1">—</td>
                                    <td className="px-2 py-1">—</td>
                                    <td className="px-2 py-1">—</td>
                                    <td className="px-2 py-1">—</td>
                                </tr>
                            );
                        }

                        const isConflict = hasConflict(lessons);

                        return lessons.map((lesson, idx) => (
                            <tr key={`${timeSlot.number}-${idx}`} className={isConflict ? "bg-red-100" : ""}>
                                <td className="px-2 py-1">
                                    {idx === 0 ? `${timeSlot.start}-${timeSlot.end}` : ''}
                                </td>
                                <td className="px-2 py-1">{lesson.subject}</td>
                                <td className="px-2 py-1">
                                    {lesson.teachers.map((teacher, i) => (
                                        <React.Fragment key={teacher.teacher_name}>
                                            {i > 0 && ', '}
                                            <button
                                                onClick={() => onTeacherClick?.(teacher.teacher_name)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {teacher.teacher_name}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </td>
                                <td className="px-2 py-1">
                                    <button
                                        onClick={() => onGroupClick?.(lesson.groupName)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {lesson.groupName}
                                    </button>
                                </td>
                                <td className="px-2 py-1">
                                    {lesson.auditories?.map(a => a.auditory_name).join(', ')}
                                </td>
                                <td className="px-2 py-1">
                                    <div className="flex items-center gap-1">
                                        <span>{lesson.type}</span>
                                        {lesson.subgroup !== 0 && (
                                            <span className="text-gray-500">
                                                {` (${lesson.subgroup})`}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ));
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default DaySchedule;
