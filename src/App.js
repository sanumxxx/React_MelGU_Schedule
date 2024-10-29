import React, { useState } from 'react';
import FileUpload from './components/FileUpload/FileUpload';
import GroupSelect from './components/GroupSelect/GroupSelect';
import Schedule from './components/Schedule/Schedule';
import ViewModeToggle from './components/ui/ViewModeToggle';


const StatCard = ({ title, value }) => (
    <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
);

function App() {
    const [scheduleData, setScheduleData] = useState(() => {
        const savedData = localStorage.getItem('scheduleData');
        return savedData ? JSON.parse(savedData) : null;
    });

    const [statistics, setStatistics] = useState(() => {
        const savedStats = localStorage.getItem('scheduleStatistics');
        return savedStats ? JSON.parse(savedStats) : null;
    });

    const [selectedItem, setSelectedItem] = useState(null);
    const [viewMode, setViewMode] = useState('groups');

    React.useEffect(() => {
        if (scheduleData) {
            localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
        }
    }, [scheduleData]);

    React.useEffect(() => {
        if (statistics) {
            localStorage.setItem('scheduleStatistics', JSON.stringify(statistics));
        }
    }, [statistics]);

    const handleDataLoaded = (data, stats) => {
        console.log('Loading new data:', data);

        if (scheduleData) {
            const mergedData = mergeScheduleData(scheduleData, data);
            setScheduleData(mergedData);
            const newStats = calculateStatistics(mergedData);
            setStatistics(newStats);
        } else {
            setScheduleData(data);
            setStatistics(stats);
        }
    };

    const mergeScheduleData = (oldData, newData) => {
        const allData = [...oldData, ...newData];
        const uniqueData = [];
        const seen = new Set();

        allData.forEach(item => {
            if (item.timetable) {
                item.timetable.forEach(week => {
                    const key = `${week.week_number}-${week.date_start}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueData.push(week);
                    }
                });
            }
        });

        return uniqueData;
    };

    const calculateStatistics = (data) => {
        const stats = {
            groups: new Set(),
            faculties: new Set(),
            subjects: new Set(),
            teachers: new Set(),
            auditories: new Set(),
            conflictGroups: new Set()
        };

        data.forEach(weekItem => {
            const weeks = weekItem.timetable ? weekItem.timetable : [weekItem];

            weeks.forEach(week => {
                week.groups?.forEach(group => {
                    stats.groups.add(group.group_name);
                    stats.faculties.add(group.faculty);

                    group.days?.forEach(day => {
                        // Проверяем конфликты
                        const timeSlots = {};
                        day.lessons?.forEach(lesson => {
                            if (!timeSlots[lesson.time]) timeSlots[lesson.time] = [];
                            timeSlots[lesson.time].push(lesson);

                            stats.subjects.add(lesson.subject);
                            lesson.teachers?.forEach(t => stats.teachers.add(t.teacher_name));
                            lesson.auditories?.forEach(a => stats.auditories.add(a.auditory_name));
                        });

                        // Проверяем каждый временной слот на конфликты
                        Object.values(timeSlots).forEach(lessons => {
                            if (lessons.length > 1) {
                                const hasConflict = lessons.some((l1, i) =>
                                    lessons.some((l2, j) => i !== j &&
                                        (l1.subgroup === l2.subgroup || l1.subgroup === 0 || l2.subgroup === 0)
                                    )
                                );
                                if (hasConflict) {
                                    stats.conflictGroups.add(group.group_name);
                                }
                            }
                        });
                    });
                });
            });
        });

        return {
            groupCount: stats.groups.size,
            facultyCount: stats.faculties.size,
            subjectCount: stats.subjects.size,
            teacherCount: stats.teachers.size,
            auditoryCount: stats.auditories.size,
            conflictCount: stats.conflictGroups.size
        };
    };

    const getFilteredItems = () => {
    if (!scheduleData) return [];

    const items = new Set();

    scheduleData.forEach(weekItem => {
        if (!weekItem) return;

        const timetable = weekItem.timetable || [weekItem];

        timetable.forEach(week => {
            if (!week || !Array.isArray(week.groups)) return;

            week.groups.forEach(group => {
                if (!group || !Array.isArray(group.days)) return;

                if (viewMode === 'groups') {
                    if (group.group_name) {
                        items.add(group.group_name);
                    }
                } else {
                    group.days.forEach(day => {
                        if (!day || !Array.isArray(day.lessons)) return;

                        day.lessons.forEach(lesson => {
                            if (!lesson) return;

                            if (viewMode === 'teachers' && Array.isArray(lesson.teachers)) {
                                lesson.teachers.forEach(teacher => {
                                    if (teacher && teacher.teacher_name) {
                                        items.add(teacher.teacher_name);
                                    }
                                });
                            } else if (viewMode === 'auditories' && Array.isArray(lesson.auditories)) {
                                lesson.auditories.forEach(auditory => {
                                    if (auditory && auditory.auditory_name) {
                                        items.add(auditory.auditory_name);
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
    });

    return Array.from(items).sort();
};

    const handleClearData = () => {
        localStorage.removeItem('scheduleData');
        localStorage.removeItem('scheduleStatistics');
        setScheduleData(null);
        setStatistics(null);
        setSelectedItem(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Расписание занятий
                    </h1>
                    {scheduleData && (
                        <button
                            onClick={handleClearData}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            Очистить данные
                        </button>
                    )}
                </div>

                {!scheduleData && <FileUpload onDataLoaded={handleDataLoaded} />}

                {scheduleData && !selectedItem && (
                    <>
                        <ViewModeToggle
                            activeMode={viewMode}
                            onModeChange={setViewMode}
                        />
                        <GroupSelect
                            items={getFilteredItems()}
                            scheduleData={scheduleData}
                            onSelect={setSelectedItem}
                            viewMode={viewMode}
                        />
                        {statistics && (
                            <div className="mt-8 bg-white shadow rounded-lg p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Статистика
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                                    <StatCard title="Группы" value={statistics.groupCount} />
                                    <StatCard title="Факультеты" value={statistics.facultyCount} />
                                    <StatCard title="Предметы" value={statistics.subjectCount} />
                                    <StatCard title="Преподаватели" value={statistics.teacherCount} />
                                    <StatCard title="Аудитории" value={statistics.auditoryCount} />
                                    <StatCard title="Конфликты" value={statistics.conflictCount} />
                                </div>
                            </div>
                        )}
                    </>
                )}

                {selectedItem && (
                    <div>
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                        >
                            ← Назад к списку
                        </button>
                        <Schedule
    scheduleData={scheduleData}
    selectedItem={selectedItem}
    viewMode={viewMode}
    setViewMode={setViewMode} // Передаем функцию переключения режима
    setSelectedItem={setSelectedItem} // Передаем функцию обновления выбранного элемента
/>

                    </div>
                )}
            </div>
        </div>
    );
}

export default App;