export const isLecture = (lesson) => {
    return lesson.type?.toLowerCase().includes('лек') || false;
};

export const checkGroupTimeslotConflicts = (lessons) => {
    if (!Array.isArray(lessons) || lessons.length <= 1) return false;

    // Группируем пары по подгруппам
    const lessonsBySubgroup = lessons.reduce((acc, lesson) => {
        const subgroup = lesson.subgroup || 0;
        if (!acc[subgroup]) acc[subgroup] = [];
        acc[subgroup].push(lesson);
        return acc;
    }, {});

    // Проверяем следующие случаи:
    // 1. Если есть пара для всей группы (подгруппа 0) и еще какие-то пары - конфликт
    // 2. Если есть несколько пар для одной подгруппы - конфликт
    // 3. Если есть только пары для разных подгрупп (1, 2, 3) - не конфликт

    // Проверяем наличие пары для всей группы
    if (lessonsBySubgroup[0]?.length > 0) {
        // Если есть пара для всей группы и еще какие-то пары - конфликт
        return Object.keys(lessonsBySubgroup).length > 1;
    }

    // Проверяем, что все подгруппы имеют только по одной паре
    return Object.values(lessonsBySubgroup).some(groupLessons => groupLessons.length > 1);
};

export const checkTeacherTimeslotConflicts = (lessons, teacherId) => {
    if (!Array.isArray(lessons) || lessons.length <= 1) return false;

    // Создаем уникальные комбинации предмета и аудитории
    const uniqueLessons = new Set(lessons.map(lesson => `${lesson.subject}_${lesson.auditories?.map(a => a.auditory_name).join(',')}`));

    // Если количество уникальных занятий больше одного, значит, есть конфликт
    const hasConflict = uniqueLessons.size > 1;

    if (hasConflict) {
        console.log(`Конфликт: у преподавателя ${teacherId} разные дисциплины или аудитории в одно и то же время`);
        console.table(lessons); // Выводим занятия для лучшего анализа конфликта
    } else {
        console.log(`Конфликтов не обнаружено для преподавателя ${teacherId}`);
    }

    return hasConflict;
};








const processTeacherTimeSlot = (lessons) => {
    if (lessons.length <= 1) return false;

    // Собираем все уникальные комбинации предмет+аудитория
    const uniqueCombinations = new Set();

    for (const lesson of lessons) {
        if (!lesson) continue;

        // Если у урока нет аудиторий или предмета, пропускаем
        if (!lesson.auditories || !lesson.subject) continue;

        const auditories = lesson.auditories.map(a => a.auditory_name).sort().join(',');
        const key = `${lesson.subject}|${auditories}`;
        uniqueCombinations.add(key);
    }

    // Если есть больше одной уникальной комбинации - это конфликт
    return uniqueCombinations.size > 1;
};



export const findScheduleConflicts = (scheduleData, mode = 'groups') => {
    const conflicts = new Set();
    const scheduleByEntity = new Map();

    if (!Array.isArray(scheduleData)) {
        return { conflicts, scheduleByEntity };
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
                        if (!lesson || !Array.isArray(lesson.teachers)) return;

                        lesson.teachers.forEach(teacher => {
                            if (!teacher || !teacher.teacher_name) return;

                            const teacherId = teacher.teacher_name;
                            const timeKey = `${week.week_number}-${day.weekday}-${lesson.time}`;

                            if (!scheduleByEntity.has(teacherId)) {
                                scheduleByEntity.set(teacherId, new Map());
                            }
                            if (!scheduleByEntity.get(teacherId).has(timeKey)) {
                                scheduleByEntity.get(teacherId).set(timeKey, []);
                            }

                            scheduleByEntity.get(teacherId).get(timeKey).push({
                                ...lesson,
                                groupName: group.group_name
                            });

                            // Проверяем накладки
                            const lessonsAtSameTime = scheduleByEntity.get(teacherId).get(timeKey);
                            if (processTeacherTimeSlot(lessonsAtSameTime)) {
                                conflicts.add(teacherId);
                            }
                        });
                    });
                });
            });
        });
    });

    return { conflicts, scheduleByEntity };
};const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return false;
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const similarity = (intersection.size * 2) / (words1.size + words2.size);
    return similarity >= 0.5;
};