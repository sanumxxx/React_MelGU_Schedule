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









export const findScheduleConflicts = (scheduleData, mode = 'groups') => {
    const conflicts = new Set();
    const scheduleByEntity = new Map();

    if (!Array.isArray(scheduleData)) {
        return { conflicts, scheduleByEntity };
    }

    // Функция для расчета процента совпадения двух строк
    const calculateSimilarity = (str1, str2) => {
        const words1 = new Set(str1.toLowerCase().split(/\s+/));
        const words2 = new Set(str2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(word => words2.has(word)));
        const similarity = (intersection.size * 2) / (words1.size + words2.size);
        return similarity >= 0.5; // Возвращаем true, если совпадение 50% или больше
    };

    scheduleData.forEach(weekItem => {
        const timetable = weekItem.timetable || [weekItem];

        timetable.forEach(week => {
            week.groups?.forEach(group => {
                group.days?.forEach(day => {
                    day.lessons?.forEach(lesson => {
                        if (mode === 'auditories') {
                            lesson.auditories?.forEach(auditory => {
                                const auditoryId = auditory.auditory_name;
                                const timeKey = `${week.week_number}-${day.weekday}-${lesson.time}`;

                                if (!scheduleByEntity.has(auditoryId)) {
                                    scheduleByEntity.set(auditoryId, new Map());
                                }
                                if (!scheduleByEntity.get(auditoryId).has(timeKey)) {
                                    scheduleByEntity.get(auditoryId).set(timeKey, []);
                                }

                                scheduleByEntity.get(auditoryId).get(timeKey).push({
                                    ...lesson,
                                    groupName: group.group_name
                                });

                                const lessonsAtSameTime = scheduleByEntity.get(auditoryId).get(timeKey);

                                // Проверка конфликтов для аудиторий
                                const uniqueLessons = new Set();

                                for (const l of lessonsAtSameTime) {
                                    let isSimilar = false;
                                    for (const storedLesson of uniqueLessons) {
                                        const [storedSubject, storedAuditory] = storedLesson;
                                        if (calculateSimilarity(storedSubject, l.subject) && storedAuditory === l.auditories?.[0]?.auditory_name) {
                                            isSimilar = true;
                                            break;
                                        }
                                    }

                                    if (!isSimilar) {
                                        uniqueLessons.add([l.subject, l.auditories?.[0]?.auditory_name]);
                                    }
                                }

                                if (uniqueLessons.size > 1) {
                                    conflicts.add(auditoryId);
                                }
                            });
                        } else if (mode === 'teachers') {
                            lesson.teachers?.forEach(teacher => {
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

                                const lessonsAtSameTime = scheduleByEntity.get(teacherId).get(timeKey);

                                // Проверка конфликтов для преподавателей
                                const uniqueLessons = new Set();

                                for (const l of lessonsAtSameTime) {
                                    let isSimilar = false;
                                    for (const storedLesson of uniqueLessons) {
                                        const [storedSubject, storedAuditory] = storedLesson;
                                        if (calculateSimilarity(storedSubject, l.subject) && storedAuditory === l.auditories?.[0]?.auditory_name) {
                                            isSimilar = true;
                                            break;
                                        }
                                    }

                                    if (!isSimilar) {
                                        uniqueLessons.add([l.subject, l.auditories?.[0]?.auditory_name]);
                                    }
                                }

                                if (uniqueLessons.size > 1) {
                                    conflicts.add(teacherId);
                                }
                            });
                        }
                    });
                });
            });
        });
    });

    return { conflicts, scheduleByEntity };
};
