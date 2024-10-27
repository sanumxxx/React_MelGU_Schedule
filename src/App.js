import React, { useState } from 'react';
import FileUpload from './components/FileUpload/FileUpload';
import GroupSelect from './components/GroupSelect/GroupSelect';
import Schedule from './components/Schedule/Schedule';
import ViewModeToggle from './components/ui/ViewModeToggle';

function App() {
    const [scheduleData, setScheduleData] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewMode, setViewMode] = useState('groups'); // 'groups', 'teachers', 'auditories'

    const handleDataLoaded = (data, stats) => {
        setScheduleData(data);
        setStatistics(stats);
    };

    const getFilteredItems = () => {
    if (!scheduleData) return [];

    const items = new Set();

    scheduleData.forEach(item => {
        const timetableData = item.timetable || [item];
        timetableData.forEach(week => {
            if (!week.groups) return;

            week.groups.forEach(group => {
                if (viewMode === 'groups') {
                    items.add(group.group_name);
                } else {
                    if (!group.days) return;

                    group.days.forEach(day => {
                        if (!day.lessons) return;

                        day.lessons.forEach(lesson => {
                            if (viewMode === 'teachers') {
                                lesson.teachers?.forEach(t => items.add(t.teacher_name));
                            } else {
                                lesson.auditories?.forEach(a => items.add(a.auditory_name));
                            }
                        });
                    });
                }
            });
        });
    });

    return Array.from(items).sort();
};

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Расписание занятий
                </h1>

                {!scheduleData && <FileUpload onDataLoaded={handleDataLoaded} />}

                {scheduleData && !selectedItem && (
                    <>
                        <ViewModeToggle
                            activeMode={viewMode}
                            onModeChange={setViewMode}
                        />
                        <GroupSelect
                            items={getFilteredItems()}
                            onSelect={setSelectedItem}
                            viewMode={viewMode}
                        />
                        {statistics && (
                            <div className="mt-8 bg-white shadow rounded-lg p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Статистика
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <StatCard title="Группы" value={statistics.groupCount} />
                                    <StatCard title="Факультеты" value={statistics.facultyCount} />
                                    <StatCard title="Предметы" value={statistics.subjectCount} />
                                    <StatCard title="Преподаватели" value={statistics.teacherCount} />
                                    <StatCard title="Аудитории" value={statistics.auditoryCount} />
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
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

const StatCard = ({ title, value }) => (
    <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
);

export default App;