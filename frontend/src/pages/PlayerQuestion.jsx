import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import { sessionService } from "../services/sessionService";
import { getWebSocketUrl } from "../api/axios";

function normalizeQuestion(payload) {
  if (payload.answerOptions) {
    return payload;
  }

  return {
    id: payload.questionId ?? payload.id,
    text: payload.text,
    type: payload.type ?? "SINGLE",
    imageUrl: payload.imageUrl,
    answerOptions: payload.options ?? payload.answerOptions ?? [],
  };
}

function isMultipleChoice(question) {
  return question?.type === "MULTIPLE";
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

  const [timeLeft, setTimeLeft] = useState(20);
  const [answersLocked, setAnswersLocked] = useState(false);

  const multipleChoice = isMultipleChoice(question);

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
            setTimeLeft(20);
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

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
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

    setSelectedAnswers([optionId]);
    setSubmitError(null);

    try {
      const result = await sessionService.submitAnswer(sessionId, {
        questionId: question.id,
        answerOptionId: optionId,
      });
      setAnswerResult(result);
      setAnswered(true);
    } catch (err) {
      setSelectedAnswers([]);
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
          <div className="text-6xl font-black text-blue-600">{timeLeft}</div>
          <div className="text-gray-500 mt-2">seconds left</div>
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
            {question.answerOptions.map((option) => {
              const isSelected = selectedAnswers.includes(option.id);
              const isCorrectAnswer = Boolean(
                answerResult?.isCorrect ?? answerResult?.correct
              );
              const answeredOptionClass =
                answered && isSelected
                  ? isCorrectAnswer
                    ? "bg-green-600 text-white border-green-600 shadow-xl"
                    : "bg-red-600 text-white border-red-600 shadow-xl"
                  : "";

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
                    ${answered && !isSelected ? "opacity-50" : ""}
                  `}
                >
                  <span className="flex items-center gap-3">
                    {multipleChoice && (
                      <span
                        className={`inline-flex w-5 h-5 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? `border-white bg-white ${
                                answered
                                  ? isCorrectAnswer
                                    ? "text-green-600"
                                    : "text-red-600"
                                  : "text-blue-600"
                              }`
                            : "border-gray-300 bg-white text-transparent"
                        }`}
                      >
                        ✓
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
                className={`inline-block px-8 py-4 rounded-2xl font-bold text-lg ${
                  Boolean(answerResult?.isCorrect ?? answerResult?.correct)
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {Boolean(answerResult?.isCorrect ?? answerResult?.correct)
                  ? "Correct!"
                  : "Incorrect!"}
              </div>
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
