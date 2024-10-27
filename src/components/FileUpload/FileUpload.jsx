import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import Button from '../ui/Button';
import { processFiles, getStatistics } from '../../utils/fileProcessor';

const FileUpload = ({ onDataLoaded }) => {
    const handleFileChange = useCallback(async (event) => {
        const files = Array.from(event.target.files);

        if (files.length === 0) return;

        try {
            console.log('Loading files...', files);

            const fileContents = await Promise.all(files.map(async file => {
                const arrayBuffer = await file.arrayBuffer();
                const decoder = new TextDecoder('windows-1251');
                const text = decoder.decode(arrayBuffer);

                const cleanText = text
                    .replace(/^\uFEFF/, '')
                    .replace(/\\/g, '\\\\')
                    .replace(/[\u0000-\u0019]+/g, " ");

                console.log('Cleaned text:', cleanText.substring(0, 200));

                try {
                    const json = JSON.parse(cleanText);
                    console.log('Raw parsed JSON:', json);
                    return json;
                } catch (parseError) {
                    console.error('Parse error:', parseError);
                    throw parseError;
                }
            }));

            // Извлекаем и объединяем данные расписания
            const mergedData = fileContents.reduce((acc, fileData) => {
                if (Array.isArray(fileData)) {
                    fileData.forEach(item => {
                        if (item.timetable && Array.isArray(item.timetable)) {
                            acc.push(...item.timetable);
                        }
                    });
                }
                return acc;
            }, []);

            console.log('Merged data:', mergedData);

            // Собираем уникальные данные для статистики
            const stats = {
                groups: new Set(),
                faculties: new Set(),
                subjects: new Set(),
                teachers: new Set(),
                auditories: new Set()
            };

            mergedData.forEach(week => {
                if (week.groups && Array.isArray(week.groups)) {
                    week.groups.forEach(group => {
                        stats.groups.add(group.group_name);
                        stats.faculties.add(group.faculty);

                        if (group.days && Array.isArray(group.days)) {
                            group.days.forEach(day => {
                                if (day.lessons && Array.isArray(day.lessons)) {
                                    day.lessons.forEach(lesson => {
                                        stats.subjects.add(lesson.subject);
                                        lesson.teachers.forEach(teacher =>
                                            stats.teachers.add(teacher.teacher_name)
                                        );
                                        lesson.auditories.forEach(auditory =>
                                            stats.auditories.add(auditory.auditory_name)
                                        );
                                    });
                                }
                            });
                        }
                    });
                }
            });

            const statistics = {
                groupCount: stats.groups.size,
                facultyCount: stats.faculties.size,
                subjectCount: stats.subjects.size,
                teacherCount: stats.teachers.size,
                auditoryCount: stats.auditories.size
            };

            console.log('Statistics:', statistics);
            onDataLoaded(mergedData, statistics);
            console.log('Files processed successfully');

        } catch (error) {
            console.error('Error processing files:', error);
        }
    }, [onDataLoaded]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-8">
            <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex flex-col items-center">
                    <label
                        htmlFor="file-upload"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer transition-colors"
                    >
                        Выберите файл расписания
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            multiple
                            accept=".json"
                            onChange={handleFileChange}
                        />
                    </label>
                    <p className="mt-2 text-sm text-gray-500">
                        Поддерживаются файлы JSON
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;