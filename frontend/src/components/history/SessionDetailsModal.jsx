import { useEffect } from "react";
import { Check, X, XIcon } from "lucide-react";

const UNANSWERED_LABEL = "Didn't answer";

function AnswerCell({ answer }) {
  const answered = Boolean(answer?.answered);
  const isCorrect = Boolean(answer?.isCorrect);
  const text =
    answered && answer?.selectedAnswerText
      ? answer.selectedAnswerText
      : UNANSWERED_LABEL;

  const cellClass = isCorrect
    ? "bg-green-50 text-green-800 border-green-100"
    : "bg-red-50 text-red-800 border-red-100";

  return (
    <td className="px-3 py-3 align-top">
      <div
        className={`min-w-[160px] max-w-[240px] rounded-xl border px-3 py-2.5 ${cellClass}`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {isCorrect ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
          </span>
          <span className="text-sm font-medium leading-5 break-words">{text}</span>
        </div>
      </div>
    </td>
  );
}

function formatScore(score, maxScore = 100) {
  const value = Number(score);
  const points = Number.isFinite(value) ? Math.round(value) : 0;
  return `${points} / ${maxScore}`;
}

export default function SessionDetailsModal({
  open,
  onClose,
  sessionTitle,
  sessionCode,
  details,
  loading,
  error,
  maxScore = 100,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const questions = details?.questions || [];
  const participants = details?.participants || [];
  const title = details?.quizTitle || sessionTitle || "Session details";
  const code = details?.code || sessionCode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Close session details"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Session summary
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{title}</h2>
            {code && <p className="mt-1 text-sm text-gray-500">Room: {code}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-slate-100 hover:text-gray-700"
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {loading && (
            <div className="flex h-48 items-center justify-center text-gray-500">
              Loading session details...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && participants.length === 0 && (
            <div className="rounded-xl border border-gray-100 bg-slate-50 px-4 py-10 text-center text-gray-500">
              No players joined this session.
            </div>
          )}

          {!loading && !error && participants.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-gray-500">
                    <th className="sticky left-0 z-20 min-w-[180px] bg-slate-50 px-4 py-3 font-semibold">
                      Player
                    </th>
                    <th className="sticky left-[180px] z-20 min-w-[110px] bg-slate-50 px-4 py-3 font-semibold">
                      Score
                    </th>
                    {questions.map((question, index) => (
                      <th
                        key={question.id}
                        className="min-w-[180px] px-3 py-3 font-semibold"
                        title={question.text}
                      >
                        <div>Question {index + 1}</div>
                        {question.text && (
                          <div className="mt-1 max-w-[220px] truncate text-[11px] font-medium normal-case tracking-normal text-gray-400">
                            {question.text}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {participants.map((participant) => (
                    <tr key={participant.participantId} className="align-top">
                      <td className="sticky left-0 z-10 bg-white px-4 py-4 font-semibold text-gray-900">
                        {participant.playerName}
                      </td>
                      <td className="sticky left-[180px] z-10 bg-white px-4 py-4 font-bold text-blue-600">
                        {formatScore(participant.score, maxScore)}
                      </td>
                      {(participant.answers || []).map((answer) => (
                        <AnswerCell
                          key={`${participant.participantId}-${answer.questionId}`}
                          answer={answer}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
