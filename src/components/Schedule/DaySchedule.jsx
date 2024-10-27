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

const DaySchedule = ({ day, date }) => {
    if (!day || !day.lessons) {
        return (
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b">
                    <h3 className="font-semibold">{date || 'Нет данных'}</h3>
                </div>
                <div className="p-4 text-center text-gray-500">
                    Нет занятий
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-3 border-b">
                <h3 className="font-semibold">{date}</h3>
            </div>
            <div className="divide-y">
                {TIME_SLOTS.map((timeSlot) => {
                    const lessons = day.lessons.filter(lesson => lesson.time === timeSlot.number);
                    const hasMultipleLessons = lessons.length > 1;

                    return (
                        <div key={timeSlot.number} className="grid grid-cols-[80px_1fr] border-b">
                            <div className="p-2 bg-gray-50 text-sm">
                                <div>{timeSlot.start}</div>
                                <div>{timeSlot.end}</div>
                            </div>
                            <div className="p-2">
                                {lessons.length > 0 ? (
                                    <div className={`space-y-2 ${hasMultipleLessons ? 'bg-red-50 p-2 rounded' : ''}`}>
                                        {lessons.map((lesson, idx) => (
                                            <div key={idx} className="text-sm">
                                                <div className="font-medium">{lesson.subject}</div>
                                                <div className="text-gray-600">
                                                    <div>{lesson.type}</div>
                                                    {lesson.subgroup !== 0 && (
                                                        <div>Подгруппа {lesson.subgroup}</div>
                                                    )}
                                                    <div>{lesson.teachers.map(t => t.teacher_name).join(', ')}</div>
                                                    <div>{lesson.auditories.map(a => a.auditory_name).join(', ')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400">—</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DaySchedule;