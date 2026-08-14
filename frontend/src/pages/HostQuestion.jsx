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

export default function HostQuestion() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answersCount, setAnswersCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  async function refreshAnswerProgress() {
    try {
      const progress = await sessionService.getAnswerProgress(sessionId);
      setAnswersCount(progress.answeredCount);
      setTotalParticipants(progress.totalParticipants);
    } catch {
      // ignore polling errors
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadQuestion() {
      try {
        const data = await sessionService.getCurrentQuestion(sessionId);
        if (cancelled) return;
        setQuestion(data);
        await refreshAnswerProgress();
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
    if (!question) return;

    const interval = setInterval(refreshAnswerProgress, 2000);
    return () => clearInterval(interval);
  }, [question, sessionId]);

  useEffect(() => {
    const client = new Client({
      brokerURL: getWebSocketUrl(),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/session/${sessionId}`, (message) => {
          const body = JSON.parse(message.body);

          if (body.type === "QUESTION") {
            setQuestion(normalizeQuestion(body.payload));
            setAnswersCount(0);
            refreshAnswerProgress();
          }

          if (body.type === "RESULT") {
            const totalAnswered = body.payload?.totalAnswered;
            if (typeof totalAnswered === "number") {
              setAnswersCount(totalAnswered);
            } else {
              setAnswersCount((prev) => prev + 1);
            }
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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [question]);

  async function nextQuestion() {
    try {
      const result = await sessionService.nextQuestion(sessionId);
      if (!result) {
        navigate(`/leaderboard/${sessionId}`);
      }
    } catch {
      navigate(`/leaderboard/${sessionId}`);
    }
  }

  const hasTimeLimit = getQuestionTimeLimit(question) > 0;
  const timeExpired = hasTimeLimit && timeLeft === 0;
  const allAnswered =
    totalParticipants > 0 && answersCount >= totalParticipants;
  const canProceed = !hasTimeLimit || timeExpired || allAnswered;
  const showResults = timeExpired || allAnswered;
  const multipleChoice = isMultipleChoice(question);
  const correctAnswersLabel = formatCorrectAnswers(question?.answerOptions);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!question) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100">
      <div className="max-w-6xl mx-auto py-10 px-6">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Host Screen</h1>
            <p className="text-gray-500">Control the game</p>
          </div>

          <div className="text-center">
            <div className="text-6xl font-black text-blue-600">
              {hasTimeLimit ? (timeLeft ?? getQuestionTimeLimit(question)) : "∞"}
            </div>
            <div className="text-gray-500">
              {hasTimeLimit ? "seconds" : "no time limit"}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-3xl font-bold text-center mb-6">{question.text}</h2>

          <QuestionImage imageUrl={question.imageUrl} />

          <div className="grid grid-cols-2 gap-5">
            {question.answerOptions.map((option, index) => {
              const optionIsCorrect = isOptionCorrect(option);
              let resultClass = "border-gray-200 bg-slate-50";

              if (showResults) {
                if (optionIsCorrect) {
                  resultClass = "border-green-500 bg-green-100 text-green-800";
                } else {
                  resultClass = "border-gray-200 bg-slate-50 opacity-60";
                }
              }

              return (
                <div
                  key={option.id}
                  className={`rounded-2xl border-2 p-6 text-xl font-semibold ${resultClass}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-full border border-current text-sm font-bold">
                      {optionLetter(index)}
                    </span>
                    {option.text}
                  </span>
                </div>
              );
            })}
          </div>

          {showResults && multipleChoice && correctAnswersLabel && (
            <p className="mt-6 text-center text-sm font-medium text-gray-700">
              Правильные ответы: {correctAnswersLabel}
            </p>
          )}

          <div className="mt-10 flex justify-between items-center">
            <div className="text-xl font-semibold">
              Answers received:
              <span className="ml-2 text-blue-600">
                {answersCount}
                {totalParticipants > 0 ? ` / ${totalParticipants}` : ""}
              </span>
            </div>

            <button
              onClick={nextQuestion}
              disabled={!canProceed}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold transition"
            >
              Next Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
