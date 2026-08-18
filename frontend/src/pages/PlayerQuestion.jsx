import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import { sessionService } from "../services/sessionService";
import { getWebSocketUrl } from "../api/axios";

function normalizeQuestion(payload) {
  const timeLimit = payload.timeLimit ?? payload.duration ?? null;

  if (payload.answerOptions) {
    return { ...payload, timeLimit };
  }

  return {
    id: payload.questionId ?? payload.id,
    text: payload.text,
    type: payload.type ?? "SINGLE",
    imageUrl: payload.imageUrl,
    timeLimit,
    answerOptions: payload.options ?? payload.answerOptions ?? [],
  };
}

function getQuestionTimeLimit(question) {
  const value = question?.timeLimit ?? question?.duration;
  if (value == null || value === 0) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function isMultipleChoice(question) {
  return question?.type === "MULTIPLE";
}

function isOptionCorrect(option) {
  return Boolean(option?.isCorrect ?? option?.correct);
}

function optionLetter(index) {
  return String.fromCharCode(65 + index);
}

function formatCorrectAnswers(options = []) {
  return options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => isOptionCorrect(option))
    .map(({ option, index }) => `${optionLetter(index)}. ${option.text}`)
    .join(", ");
}

function getEarnedPoints(answerResult) {
  const value = answerResult?.earnedPoints;
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resultBannerClass({ overallCorrect, partiallyCorrect }) {
  if (overallCorrect) return "bg-green-100 text-green-700";
  if (partiallyCorrect) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-700";
}

function resultBannerText({ overallCorrect, partiallyCorrect, earnedPoints }) {
  if (partiallyCorrect) {
    return `Partially correct: +${earnedPoints} pts`;
  }
  if (overallCorrect) {
    return earnedPoints != null ? `Correct! +${earnedPoints} pts` : "Correct!";
  }
  return "Incorrect!";
}

function QuestionImage({ imageUrl }) {
  if (!imageUrl?.trim()) return null;

  return (
    <div className="mb-8 flex justify-center">
      <img
        src={imageUrl.trim()}
        alt="Question illustration"
        className="max-h-64 rounded-2xl object-contain border border-gray-100 shadow-sm"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

export default function PlayerQuestion() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const [timeLeft, setTimeLeft] = useState(null);
  const [answersLocked, setAnswersLocked] = useState(false);

  const multipleChoice = isMultipleChoice(question);
  const overallCorrect = Boolean(answerResult?.isCorrect ?? answerResult?.correct);
  const earnedPoints = getEarnedPoints(answerResult);
  const partiallyCorrect = Boolean(
    answered && !overallCorrect && earnedPoints != null && earnedPoints > 0
  );
  const correctAnswersLabel = formatCorrectAnswers(question?.answerOptions);
  const hasTimeLimit = getQuestionTimeLimit(question) > 0;

  useEffect(() => {
    let cancelled = false;

    async function loadQuestion() {
      try {
        const data = await sessionService.getCurrentQuestion(sessionId);
        if (!cancelled) setQuestion(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQuestion();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    const client = new Client({
      brokerURL: getWebSocketUrl(),
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/session/${sessionId}`, (message) => {
          const body = JSON.parse(message.body);

          if (body.type === "QUESTION") {
            setQuestion(normalizeQuestion(body.payload));
            setSelectedAnswers([]);
            setAnswered(false);
            setAnswerResult(null);
            setSubmitError(null);
            setAnswersLocked(false);
          }

          if (body.type === "EVENT" && body.payload?.event === "GAME_FINISHED") {
            navigate(`/leaderboard/${sessionId}`);
          }
        });
      },
    });

    client.activate();

    return () => client.deactivate();
  }, [sessionId, navigate]);

  useEffect(() => {
    if (!question) return;
    if (answersLocked) return;

    const limit = getQuestionTimeLimit(question);
    if (!limit) {
      setTimeLeft(null);
      return;
    }

    setTimeLeft(limit);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == null || prev <= 1) {
          clearInterval(timer);
          setAnswersLocked(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [question, answersLocked]);

  const toggleAnswer = (optionId) => {
    if (answersLocked || answered) return;

    setSelectedAnswers((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const submitSingleAnswer = async (optionId) => {
    if (answersLocked || answered) return;

    const selectedOption = question.answerOptions.find(
      (option) => option.id === optionId
    );
    const instantlyCorrect = isOptionCorrect(selectedOption);

    setSelectedAnswers([optionId]);
    setSubmitError(null);
    setAnswered(true);
    setAnswerResult({ isCorrect: instantlyCorrect });

    try {
      const result = await sessionService.submitAnswer(sessionId, {
        questionId: question.id,
        answerOptionId: optionId,
      });
      setAnswerResult(result);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to submit answer. Try again."
      );
    }
  };

  const submitMultipleAnswers = async () => {
    if (answersLocked || answered) return;

    if (selectedAnswers.length === 0) {
      setSubmitError("Select at least one answer.");
      return;
    }

    setSubmitError(null);

    try {
      const result = await sessionService.submitAnswer(sessionId, {
        questionId: question.id,
        answerOptionIds: selectedAnswers,
      });
      setAnswerResult(result);
      setAnswered(true);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to submit answer. Try again."
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Waiting for question...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-6xl font-black text-blue-600">
            {hasTimeLimit ? (timeLeft ?? getQuestionTimeLimit(question)) : "∞"}
          </div>
          <div className="text-gray-500 mt-2">
            {hasTimeLimit ? "seconds left" : "no time limit"}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h1 className="text-3xl font-bold text-center mb-6">{question.text}</h1>

          <QuestionImage imageUrl={question.imageUrl} />

          {multipleChoice && !answered && (
            <p className="text-center text-sm text-gray-500 mb-6">
              Select all correct answers, then click Submit
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {question.answerOptions.map((option, index) => {
              const isSelected = selectedAnswers.includes(option.id);
              const optionIsCorrect = isOptionCorrect(option);
              const showCorrect = answered && optionIsCorrect;
              const showIncorrect = answered && isSelected && !optionIsCorrect;

              let answeredOptionClass = "";
              if (showCorrect) {
                answeredOptionClass =
                  "bg-green-100 text-green-800 border-green-500 shadow-xl";
              } else if (showIncorrect) {
                answeredOptionClass =
                  "bg-red-100 text-red-800 border-red-500 shadow-xl";
              }

              const dimUnselected = answered && !isSelected && !optionIsCorrect;

              return (
                <button
                  key={option.id}
                  disabled={answersLocked || answered}
                  onClick={() =>
                    multipleChoice
                      ? toggleAnswer(option.id)
                      : submitSingleAnswer(option.id)
                  }
                  className={`
                    rounded-2xl
                    p-6
                    text-left
                    text-lg
                    font-semibold
                    border-2
                    transition-all
                    duration-300
                    ${
                      answeredOptionClass ||
                      (isSelected
                        ? "bg-blue-600 text-white border-blue-600 scale-105 shadow-xl"
                        : "bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:scale-105")
                    }
                    ${answersLocked || answered ? "cursor-not-allowed" : ""}
                    ${dimUnselected ? "opacity-50" : ""}
                  `}
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex w-7 h-7 shrink-0 items-center justify-center rounded-full border border-current text-sm font-bold">
                      {optionLetter(index)}
                    </span>
                    {multipleChoice && !answered && (
                      <span
                        className={`inline-flex w-5 h-5 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? "border-white bg-white text-blue-600"
                            : "border-gray-300 bg-white text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    )}
                    {showCorrect && (
                      <span className="inline-flex w-6 h-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold">
                        ✓
                      </span>
                    )}
                    {showIncorrect && (
                      <span className="inline-flex w-6 h-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white text-sm font-bold">
                        ✕
                      </span>
                    )}
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {multipleChoice && !answered && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={submitMultipleAnswers}
                disabled={answersLocked || selectedAnswers.length === 0}
                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Submit Answer
              </button>
            </div>
          )}

          {answered && (
            <div className="mt-10 text-center">
              <div
                className={`inline-block px-8 py-4 rounded-2xl font-bold text-lg ${resultBannerClass(
                  { overallCorrect, partiallyCorrect }
                )}`}
              >
                {resultBannerText({
                  overallCorrect,
                  partiallyCorrect,
                  earnedPoints,
                })}
              </div>
              {!overallCorrect && correctAnswersLabel && (
                <p className="mt-4 text-sm font-medium text-gray-700">
                  Correct answers: {correctAnswersLabel}
                </p>
              )}
            </div>
          )}

          {submitError && (
            <div className="mt-10 text-center">
              <div className="inline-block px-8 py-4 rounded-2xl bg-red-100 text-red-700 font-bold text-lg">
                {submitError}
              </div>
            </div>
          )}

          {answersLocked && !answered && (
            <div className="mt-10 text-center">
              <div className="inline-block px-8 py-4 rounded-2xl bg-red-100 text-red-700 font-bold text-lg">
                Time is up!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
