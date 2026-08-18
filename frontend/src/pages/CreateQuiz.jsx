import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ArrowLeft, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import SortableItem from '../components/quiz/SortableItem';
import { quizService } from '../services/quizService';

const STEPS = ['Basics', 'Questions', 'Settings', 'Launch'];

const TIME_OPTIONS = [
  { label: '15s', value: 15 },
  { label: '30s (default)', value: 30 },
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
];

function createEmptyQuestion(defaultTimeLimit = 30) {
  return {
    id: crypto.randomUUID(),
    serverId: null,
    text: '',
    type: 'SINGLE',
    imageUrl: '',
    timeLimit: defaultTimeLimit,
    unlimitedTime: false,
    options: [
      { id: crypto.randomUUID(), serverId: null, text: '', isCorrect: false },
      { id: crypto.randomUUID(), serverId: null, text: '', isCorrect: false },
      { id: crypto.randomUUID(), serverId: null, text: '', isCorrect: false },
      { id: crypto.randomUUID(), serverId: null, text: '', isCorrect: false },
    ],
  };
}

function normalizeQuestionType(type) {
  if (!type) return 'SINGLE';
  return String(type).toUpperCase() === 'MULTIPLE' ? 'MULTIPLE' : 'SINGLE';
}

function extractApiError(error, fallback) {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || fallback;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data.errors)) {
    return data.errors.map((item) => item.defaultMessage || item.message).join(', ');
  }

  return data.message || data.detail || data.error || fallback;
}

function mapQuestionFromApi(question, defaultTimeLimit = 30) {
  const options = question.answerOptions ?? question.options ?? [];
  const correctCount = options.filter((option) => option.isCorrect ?? option.correct).length;
  const rawTimeLimit = question.timeLimit;
  const unlimitedTime = rawTimeLimit == null || rawTimeLimit === 0;

  return {
    id: crypto.randomUUID(),
    serverId: question.id ?? null,
    text: question.text ?? '',
    type: normalizeQuestionType(question.type ?? (correctCount > 1 ? 'MULTIPLE' : 'SINGLE')),
    imageUrl: question.imageUrl ?? '',
    timeLimit: unlimitedTime ? defaultTimeLimit : Number(rawTimeLimit),
    unlimitedTime,
    options: options.map((option) => ({
      id: crypto.randomUUID(),
      serverId: option.id ?? null,
      text: option.text ?? '',
      isCorrect: Boolean(option.isCorrect ?? option.correct),
    })),
  };
}

function toQuestionPayload(question, orderIndex) {
  const timeLimit = question.unlimitedTime
    ? null
    : Number(question.timeLimit);

  return {
    text: question.text.trim(),
    type: normalizeQuestionType(question.type),
    imageUrl: question.imageUrl?.trim() || null,
    timeLimit: Number.isFinite(timeLimit) && timeLimit > 0 ? timeLimit : null,
    orderIndex,
    options: question.options
      .filter((option) => option.text.trim())
      .map((option) => ({
        ...(option.serverId ? { id: Number(option.serverId) } : {}),
        text: option.text.trim(),
        isCorrect: Boolean(option.isCorrect),
      })),
  };
}

function validateQuestions(questions) {
  if (questions.length === 0) {
    return 'Add at least one question before saving.';
  }

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];

    if (!question.text.trim()) {
      return `Question ${index + 1}: text is required.`;
    }

    const filledOptions = question.options.filter((option) => option.text.trim());

    if (filledOptions.length < 2) {
      return `Question ${index + 1}: at least 2 answer options are required.`;
    }

    if (!filledOptions.some((option) => option.isCorrect)) {
      return `Question ${index + 1}: select a correct answer.`;
    }

    if (!question.unlimitedTime) {
      const limit = Number(question.timeLimit);
      if (!Number.isFinite(limit) || limit <= 0) {
        return `Question ${index + 1}: time limit must be greater than 0, or enable unlimited time.`;
      }
    }
  }

  return null;
}

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [questions, setQuestions] = useState([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const questionIds = useMemo(() => questions.map((question) => question.id), [questions]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setQuestions((items) => {
      const oldIndex = items.findIndex((question) => question.id === active.id);
      const newIndex = items.findIndex((question) => question.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadQuiz = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [quiz, quizQuestions] = await Promise.all([
          quizService.getQuizById(id),
          quizService.getQuestions(id),
        ]);

        if (cancelled) return;

        setTitle(quiz.title ?? '');
        setDescription(quiz.description ?? '');
        const quizTime = quiz.timePerQuestion ?? 30;
        setTimePerQuestion(quizTime);
        setQuestions(
          [...quizQuestions]
            .sort((a, b) => (a.orderIndex ?? a.id ?? 0) - (b.orderIndex ?? b.id ?? 0))
            .map((question) => mapQuestionFromApi(question, quizTime))
        );
        setDeletedQuestionIds([]);
      } catch (err) {
        if (cancelled) return;
        const message = err.response?.data?.message || 'Failed to load quiz.';
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadQuiz();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion(timePerQuestion)]);
  };

  const removeQuestion = (questionId) => {
    const question = questions.find((item) => item.id === questionId);

    if (question?.serverId) {
      setDeletedQuestionIds((prev) => [...prev, question.serverId]);
    }

    setQuestions((prev) => prev.filter((item) => item.id !== questionId));
  };

  const updateQuestionText = (questionId, text) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, text } : question
      )
    );
  };

  const updateQuestionType = (questionId, type) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, type } : question
      )
    );
  };

  const updateQuestionImage = (questionId, value) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, imageUrl: value } : question
      )
    );
  };

  const updateQuestionTimeLimit = (questionId, value) => {
    const parsed = Number(value);
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? { ...question, timeLimit: Number.isFinite(parsed) ? parsed : '' }
          : question
      )
    );
  };

  const updateQuestionUnlimited = (questionId, unlimitedTime) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              unlimitedTime,
              timeLimit: question.timeLimit || timePerQuestion,
            }
          : question
      )
    );
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;

        const options = [...question.options];
        options[optionIndex] = {
          ...options[optionIndex],
          text: value,
        };

        return { ...question, options };
      })
    );
  };

  const setCorrectAnswer = (questionId, optionIndex) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;

        const options =
          question.type === 'SINGLE'
            ? question.options.map((option, index) => ({
                ...option,
                isCorrect: index === optionIndex,
              }))
            : question.options.map((option, index) =>
                index === optionIndex
                  ? { ...option, isCorrect: !option.isCorrect }
                  : option
              );

        return { ...question, options };
      })
    );
  };

  const addOption = (questionId) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;

        return {
          ...question,
          options: [
            ...question.options,
            { id: crypto.randomUUID(), serverId: null, text: '', isCorrect: false },
          ],
        };
      })
    );
  };

  const removeOption = (questionId, optionIndex) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        if (question.options.length <= 2) return question;

        return {
          ...question,
          options: question.options.filter((_, index) => index !== optionIndex),
        };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a quiz title!');
      return;
    }

    const validationError = validateQuestions(questions);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        await quizService.updateQuiz(id, {
          title: title.trim(),
          description: description?.trim() || null,
          timePerQuestion: Number(timePerQuestion),
        });

        for (const questionId of deletedQuestionIds) {
          await quizService.deleteQuestion(id, questionId);
        }

        for (let index = 0; index < questions.length; index += 1) {
          const question = questions[index];
          const payload = toQuestionPayload(question, index);

          if (question.serverId) {
            await quizService.updateQuestion(id, Number(question.serverId), payload);
          } else {
            await quizService.createQuestion(id, payload);
          }
        }
      } else {
        await quizService.createQuiz({
          title,
          description,
          timePerQuestion,
          questions: questions.map((question, index) => toQuestionPayload(question, index)),
        });
      }

      navigate('/dashboard');
    } catch (err) {
      setError(extractApiError(err, isEditMode ? 'Failed to update quiz.' : 'Failed to create quiz.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClass =
    'w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#0058BE] focus:ring-2 focus:ring-[#0058BE]/20 outline-none transition-all placeholder:text-gray-400';

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className="text-gray-500 text-lg animate-pulse">Loading quiz...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <p className="text-sm text-gray-400 mb-6">Quiz Wizard</p>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Update Quiz' : 'Create a New Quiz'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isEditMode
              ? 'Edit quiz details, questions, and answer options.'
              : 'Fill in the basics to start your adventure.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-0 mb-10 max-w-2xl mx-auto">
          {STEPS.map((step, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === 1;

            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isActive ? 'bg-[#0058BE] text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {stepNum}
                  </div>
                  <span
                    className={`text-xs mt-2 whitespace-nowrap ${
                      isActive ? 'text-[#0058BE] font-medium' : 'text-gray-400'
                    }`}
                  >
                    {stepNum}. {step}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-3 mb-5 ${
                      isActive ? 'bg-[#0058BE]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="bg-slate-100/50 rounded-2xl p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a catchy title..."
                className={inputBaseClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this quiz about?"
                rows={4}
                className={`${inputBaseClass} resize-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time per question
              </label>
              <div className="relative">
                <select
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  className={`${inputBaseClass} appearance-none text-gray-700 cursor-pointer`}
                >
                  {TIME_OPTIONS.map(({ label, value }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Questions</h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#0058BE] hover:text-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Add Question
                </button>
              </div>

              {questions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">
                  No questions yet. Click &quot;Add Question&quot; to get started.
                </p>
              )}

              <div className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-4">
                    {questions.map((question, qIndex) => (
                      <SortableItem key={question.id} id={question.id}>
                        <div className="flex items-start justify-between gap-3">
                          <label className="text-sm font-semibold text-gray-700 pt-1">
                            Question {qIndex + 1}
                          </label>
                          <button
                            type="button"
                            onClick={() => removeQuestion(question.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={question.text}
                          onChange={(e) =>
                            updateQuestionText(question.id, e.target.value)
                          }
                          placeholder="Enter question text..."
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0058BE] focus:ring-2 focus:ring-[#0058BE]/20 outline-none transition-all placeholder:text-gray-400"
                        />

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Question Type
                          </label>
                          <div className="flex gap-6 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`type-${question.id}`}
                                checked={question.type === 'SINGLE'}
                                onChange={() => updateQuestionType(question.id, 'SINGLE')}
                                className="accent-[#0058BE]"
                              />
                              <span className="text-sm">Single Choice</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`type-${question.id}`}
                                checked={question.type === 'MULTIPLE'}
                                onChange={() => updateQuestionType(question.id, 'MULTIPLE')}
                                className="accent-[#0058BE]"
                              />
                              <span className="text-sm">Multiple Choice</span>
                            </label>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Image URL
                          </label>
                          <input
                            type="text"
                            value={question.imageUrl || ''}
                            onChange={(e) =>
                              updateQuestionImage(question.id, e.target.value)
                            }
                            placeholder="https://example.com/image.png"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#0058BE] focus:ring-2 focus:ring-[#0058BE]/20 outline-none transition-all"
                          />
                          {question.imageUrl?.trim() && (
                            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                                Preview
                              </p>
                              <img
                                src={question.imageUrl.trim()}
                                alt={`Question ${qIndex + 1} preview`}
                                className="max-h-48 w-full object-contain rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.replaceWith(
                                    Object.assign(document.createElement('p'), {
                                      className: 'text-sm text-red-500',
                                      textContent: 'Unable to load image from this URL.',
                                    })
                                  );
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Time per question (seconds)
                          </label>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <input
                              type="number"
                              min={1}
                              value={question.unlimitedTime ? '' : question.timeLimit ?? ''}
                              disabled={question.unlimitedTime}
                              onChange={(e) =>
                                updateQuestionTimeLimit(question.id, e.target.value)
                              }
                              placeholder={String(timePerQuestion)}
                              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#0058BE] focus:ring-2 focus:ring-[#0058BE]/20 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            />
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(question.unlimitedTime)}
                                onChange={(e) =>
                                  updateQuestionUnlimited(question.id, e.target.checked)
                                }
                                className="w-4 h-4 accent-[#0058BE]"
                              />
                              <span className="text-sm text-gray-700">
                                No time limit
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-700">
                              Answer Options
                            </label>
                            <button
                              type="button"
                              onClick={() => addOption(question.id)}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0058BE] hover:text-blue-700 transition-colors"
                            >
                              <Plus size={15} />
                              Add Option
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {question.options.map((option, oIndex) => (
                              <div key={option.id} className="flex items-center gap-3">
                                <input
                                  type={question.type === 'SINGLE' ? 'radio' : 'checkbox'}
                                  name={`correct-${question.id}`}
                                  checked={option.isCorrect}
                                  onChange={() => setCorrectAnswer(question.id, oIndex)}
                                  className="w-4 h-4 accent-[#0058BE]"
                                />

                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) =>
                                    updateOption(question.id, oIndex, e.target.value)
                                  }
                                  placeholder={`Answer option ${oIndex + 1}`}
                                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#0058BE] focus:ring-2 focus:ring-[#0058BE]/20 outline-none transition-all text-sm"
                                />

                                <button
                                  type="button"
                                  onClick={() => removeOption(question.id, oIndex)}
                                  disabled={question.options.length <= 2}
                                  className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Remove option"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </SortableItem>
                    ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Step Progress
                </span>
                <span className="text-xs font-medium text-[#0058BE]">
                  Step 1 of 4
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-[#0058BE] rounded-full transition-all duration-300" />
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm shadow-sm"
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-8 max-w-3xl mx-auto pb-8">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className={`px-8 py-2.5 rounded-full text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${
                title.trim() && !isSubmitting
                  ? 'bg-[#0058BE] hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? (
                'Update Quiz'
              ) : (
                'Save Quiz'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
