import React, { useState, useEffect } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import ComboboxSelect from '../ui/ComboboxSelect';
import Button from '../ui/Button';

const SUBGROUP_OPTIONS = {
    NONE: 'none',
    FIRST: 'first',
    SECOND: 'second',
    BOTH: 'both'
};

const LessonEditModal = ({ isOpen, onClose, lesson, timeSlot, onSave, uniqueValues = {} }) => {
    // Добавляем значения по умолчанию для uniqueValues
    const {
        subjects = [],
        teachers = [],
        auditories = [],
        types = []
    } = uniqueValues;

    const [subgroupMode, setSubgroupMode] = useState(() => {
        if (!lesson) return SUBGROUP_OPTIONS.NONE;
        return lesson.subgroup === 0 ? SUBGROUP_OPTIONS.NONE :
            lesson.subgroup === 1 ? SUBGROUP_OPTIONS.FIRST :
                SUBGROUP_OPTIONS.SECOND;
    });

    const [lessonData, setLessonData] = useState({
        first: {
            subject: '',
            teachers: [],
            auditories: [],
            type: '',
        },
        second: {
            subject: '',
            teachers: [],
            auditories: [],
            type: '',
        }
    });

    // Обновляем данные при изменении lesson
    useEffect(() => {
        if (lesson) {
            // Определяем режим подгрупп
            const mode = lesson.subgroup === 0 ? SUBGROUP_OPTIONS.NONE :
                        lesson.subgroup === 1 ? SUBGROUP_OPTIONS.FIRST :
                        lesson.subgroup === 2 ? SUBGROUP_OPTIONS.SECOND :
                        SUBGROUP_OPTIONS.NONE;
            setSubgroupMode(mode);

            // Обновляем данные в зависимости от подгруппы
            const target = mode === SUBGROUP_OPTIONS.SECOND ? 'second' : 'first';
            setLessonData(prev => ({
                ...prev,
                [target]: {
                    subject: lesson.subject || '',
                    teachers: lesson.teachers || [],
                    auditories: lesson.auditories || [],
                    type: lesson.type || '',
                }
            }));
        } else {
            // Сброс данных при отсутствии урока
            setLessonData({
                first: {
                    subject: '',
                    teachers: [],
                    auditories: [],
                    type: '',
                },
                second: {
                    subject: '',
                    teachers: [],
                    auditories: [],
                    type: '',
                }
            });
            setSubgroupMode(SUBGROUP_OPTIONS.NONE);
        }
    }, [lesson]);

    const validateLessonData = (lesson) => {
        return lesson.subject &&
               lesson.type &&
               lesson.teachers.length > 0 &&
               lesson.teachers[0].teacher_name &&
               lesson.auditories.length > 0 &&
               lesson.auditories[0].auditory_name;
    };

    const handleSave = () => {
        const newLessons = [];

        if (subgroupMode === SUBGROUP_OPTIONS.NONE) {
            if (!validateLessonData(lessonData.first)) {
                alert('Пожалуйста, заполните все поля');
                return;
            }
            newLessons.push({
                ...lessonData.first,
                time: timeSlot.number,
                subgroup: 0
            });
        } else if (subgroupMode === SUBGROUP_OPTIONS.BOTH) {
            if (!validateLessonData(lessonData.first) || !validateLessonData(lessonData.second)) {
                alert('Пожалуйста, заполните все поля для обеих подгрупп');
                return;
            }
            newLessons.push(
                {
                    ...lessonData.first,
                    time: timeSlot.number,
                    subgroup: 1
                },
                {
                    ...lessonData.second,
                    time: timeSlot.number,
                    subgroup: 2
                }
            );
        } else {
            const data = subgroupMode === SUBGROUP_OPTIONS.FIRST ? lessonData.first : lessonData.second;
            if (!validateLessonData(data)) {
                alert('Пожалуйста, заполните все поля');
                return;
            }
            newLessons.push({
                ...data,
                time: timeSlot.number,
                subgroup: subgroupMode === SUBGROUP_OPTIONS.FIRST ? 1 : 2
            });
        }

        onSave(newLessons);
        onClose();
    };

    const handleDelete = () => {
        onSave([]);
        onClose();
    };

    // Обработчик клавиши Escape
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const renderSubgroupForm = (subgroup) => (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Предмет
                </label>
                <ComboboxSelect
                    options={subjects}
                    value={lessonData[subgroup].subject}
                    onChange={(value) => setLessonData(prev => ({
                        ...prev,
                        [subgroup]: {
                            ...prev[subgroup],
                            subject: value
                        }
                    }))}
                    placeholder="Выберите предмет"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Тип занятия
                </label>
                <ComboboxSelect
                    options={types}
                    value={lessonData[subgroup].type}
                    onChange={(value) => setLessonData(prev => ({
                        ...prev,
                        [subgroup]: {
                            ...prev[subgroup],
                            type: value
                        }
                    }))}
                    placeholder="Выберите тип"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Преподаватель
                </label>
                <ComboboxSelect
                    options={teachers}
                    value={lessonData[subgroup].teachers[0]?.teacher_name || ''}
                    onChange={(value) => setLessonData(prev => ({
                        ...prev,
                        [subgroup]: {
                            ...prev[subgroup],
                            teachers: [{ teacher_name: value }]
                        }
                    }))}
                    placeholder="Выберите преподавателя"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Аудитория
                </label>
                <ComboboxSelect
                    options={auditories}
                    value={lessonData[subgroup].auditories[0]?.auditory_name || ''}
                    onChange={(value) => setLessonData(prev => ({
                        ...prev,
                        [subgroup]: {
                            ...prev[subgroup],
                            auditories: [{ auditory_name: value }]
                        }
                    }))}
                    placeholder="Выберите аудиторию"
                />
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalHeader>
                Редактирование пары ({timeSlot.start}-{timeSlot.end})
            </ModalHeader>

            <ModalBody>
                <div className="space-y-6">
                    <div className="flex space-x-4 border-b pb-4">
                        {[
                            { id: SUBGROUP_OPTIONS.NONE, label: 'Без подгрупп' },
                            { id: SUBGROUP_OPTIONS.FIRST, label: '1-ая подгруппа' },
                            { id: SUBGROUP_OPTIONS.SECOND, label: '2-ая подгруппа' },
                            { id: SUBGROUP_OPTIONS.BOTH, label: 'Обе подгруппы' }
                        ].map(option => (
                            <button
                                key={option.id}
                                className={`px-4 py-2 rounded transition-colors ${
                                    subgroupMode === option.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                onClick={() => setSubgroupMode(option.id)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {(subgroupMode === SUBGROUP_OPTIONS.NONE ||
                          subgroupMode === SUBGROUP_OPTIONS.FIRST ||
                          subgroupMode === SUBGROUP_OPTIONS.BOTH) && (
                            <div>
                                <h3 className="font-medium mb-2">
                                    {subgroupMode === SUBGROUP_OPTIONS.BOTH
                                        ? '1-ая подгруппа'
                                        : 'Детали пары'}
                                </h3>
                                {renderSubgroupForm('first')}
                            </div>
                        )}

                        {(subgroupMode === SUBGROUP_OPTIONS.SECOND ||
                          subgroupMode === SUBGROUP_OPTIONS.BOTH) && (
                            <div>
                                <h3 className="font-medium mb-2">2-ая подгруппа</h3>
                                {renderSubgroupForm('second')}
                            </div>
                        )}
                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <div className="flex justify-between w-full">
                    <Button variant="danger" onClick={handleDelete}>
                        Удалить пару
                    </Button>
                    <div className="space-x-2">
                        <Button variant="secondary" onClick={onClose}>
                            Отмена
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Сохранить
                        </Button>
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    );
};

export default LessonEditModal;