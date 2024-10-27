// Функция для обработки JSON файлов
// Функция для обработки JSON файлов

// Функция для объединения данных расписания
export const mergeScheduleData = (dataArray) => {
    console.log('Merging data from files:', dataArray);

    // Создаем массив для хранения всех недель
    let allWeeks = [];

    dataArray.forEach((data, index) => {
        console.log(`Processing file ${index}:`, data);

        // Проходим по каждому элементу в файле
        data.forEach(item => {
            if (item.timetable && Array.isArray(item.timetable)) {
                allWeeks.push(...item.timetable);
            }
        });
    });

    console.log('Merged weeks:', allWeeks);
    return allWeeks;
};

export const processFiles = async (files) => {
    try {
        let allData = [];

        // Обрабатываем каждый файл
        for (const file of files) {
            // Читаем файл как бинарный
            const buffer = await file.arrayBuffer();
            // Декодируем как windows-1251
            const decoder = new TextDecoder('windows-1251');
            const text = decoder.decode(buffer);

            // Очищаем строку от BOM и других специальных символов
            const cleanText = text
                .replace(/^\uFEFF/, '') // Удаляем BOM
                .replace(/\\/g, '\\\\') // Экранируем обратные слеши
                .replace(/[\u0000-\u0019]+/g, " "); // Удаляем управляющие символы

            try {
                const json = JSON.parse(cleanText);
                console.log('Parsed JSON:', json); // Отладочный вывод
                if (Array.isArray(json)) {
                    allData.push(...json);
                } else if (json.timetable && Array.isArray(json.timetable)) {
                    allData.push(...json.timetable);
                }
            } catch (parseError) {
                console.error('Error parsing file:', file.name, parseError);
                throw parseError;
            }
        }

        return {
            success: true,
            data: allData
        };
    } catch (error) {
        console.error('Error processing files:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const getStatistics = (data) => {
    console.log('Calculating statistics for data:', data); // Отладочный вывод

    const stats = {
        groups: new Set(),
        faculties: new Set(),
        subjects: new Set(),
        teachers: new Set(),
        auditories: new Set(),
        conflicts: 0
    };

    // Проходим по каждой неделе расписания
    data.forEach(week => {
        if (week && week.groups && Array.isArray(week.groups)) {
            week.groups.forEach(group => {
                stats.groups.add(group.group_name);
                stats.faculties.add(group.faculty);

                if (group.days && Array.isArray(group.days)) {
                    group.days.forEach(day => {
                        if (day.lessons && Array.isArray(day.lessons)) {
                            day.lessons.forEach(lesson => {
                                stats.subjects.add(lesson.subject);
                                lesson.teachers.forEach(teacher => {
                                    stats.teachers.add(teacher.teacher_name);
                                });
                                lesson.auditories.forEach(auditory => {
                                    stats.auditories.add(auditory.auditory_name);
                                });
                            });
                        }
                    });
                }
            });
        }
    });

    return {
        groupCount: stats.groups.size,
        facultyCount: stats.faculties.size,
        subjectCount: stats.subjects.size,
        teacherCount: stats.teachers.size,
        auditoryCount: stats.auditories.size
    };
};