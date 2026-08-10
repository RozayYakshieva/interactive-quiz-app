import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Heart,
  MonitorSmartphone,
  Play,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

const DEMO_QUESTIONS = [
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter"],
    correct: 1,
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean"],
    correct: 2,
  },
  {
    question: "How many continents are there?",
    options: ["5", "7", "9"],
    correct: 1,
  },
  {
    question: "What is the fastest land animal?",
    options: ["Lion", "Cheetah", "Horse"],
    correct: 1,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(1);
  const [timeLeft, setTimeLeft] = useState(8);

  const question = DEMO_QUESTIONS[questionIndex];

  const token = localStorage.getItem("authToken");

  const handleCreateQuiz = () => {
    navigate(token ? "/create-quiz" : "/login");
  };

  const handleMyQuizzes = () => {
    navigate(token ? "/dashboard" : "/login");
  };

  const handleDemoAnswer = (index) => {
    setSelectedAnswer(index);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 8;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const questionTimer = setInterval(() => {
      setQuestionIndex((prev) => {
        if (prev >= DEMO_QUESTIONS.length - 1) {
          return 0;
        }

        return prev + 1;
      });

      setSelectedAnswer(1);
      setTimeLeft(8);
    }, 8000);

    return () => clearInterval(questionTimer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-hidden">
      <header className="h-24 bg-[#f8f8ff] border-b border-gray-100 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-8 flex items-center justify-between">

          <Link
            to="/"
            className="text-2xl font-extrabold tracking-tight text-[#0058BE]"
          >
            QuizMaster
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
            <button
              type="button"
              onClick={handleMyQuizzes}
              className="hover:text-[#0058BE] transition-colors"
            >
              My Quizzes
            </button>

            <Link
              to={token ? "/dashboard" : "/login"}
              className="hover:text-[#0058BE] transition-colors"
            >
              History
            </Link>
          </nav>

          <div className="flex items-center gap-5">

            <Link
              to="/login"
              className="text-sm font-semibold text-[#0058BE] hover:text-blue-700 transition"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="text-sm font-semibold text-[#0058BE] hover:text-blue-700 transition"
            >
              Sign up
            </Link>

            <button
              type="button"
              onClick={handleCreateQuiz}
              className="
                px-6 py-3
                rounded-full
                bg-[#0058BE]
                text-white
                text-sm
                font-bold
                shadow-md
                shadow-blue-200
                hover:bg-blue-700
                hover:-translate-y-0.5
                transition-all
              "
            >
              Create Quiz
            </button>

          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[590px] flex items-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">

            <Star
              size={14}
              className="absolute top-8 left-[18%] text-blue-100 fill-blue-50"
            />

            <Star
              size={13}
              className="absolute top-32 left-[6%] text-indigo-300"
            />

            <Star
              size={12}
              className="absolute top-[45%] left-[38%] text-blue-100"
            />

            <Star
              size={12}
              className="absolute bottom-20 left-[15%] text-indigo-100"
            />

            <Star
              size={11}
              className="absolute top-[38%] right-[18%] text-blue-100"
            />

            <Star
              size={12}
              className="absolute bottom-24 right-[42%] text-indigo-100"
            />

            <div className="absolute -left-32 top-20 w-96 h-96 rounded-full bg-blue-50/50 blur-3xl" />

            <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-indigo-50/60 blur-3xl" />

          </div>

          <div className="relative max-w-7xl w-full mx-auto px-8 py-16">

            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div className="max-w-xl">

                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-full
                    bg-blue-50
                    text-[#0058BE]
                    text-sm
                    font-semibold
                    mb-7
                  "
                >
                  <Zap size={15} />
                  Make every question count
                </div>

                <h1
                  className="
                    text-5xl
                    md:text-6xl
                    font-extrabold
                    tracking-tight
                    leading-[1.05]
                    text-[#0058BE]
                  "
                >
                  Host Interactive
                  <br />
                  <span className="text-[#3456b8]">
                    Quizzes
                  </span>
                </h1>

                <p className="mt-7 text-gray-600 text-lg leading-relaxed max-w-lg">
                  For education, work, and parties. Create questions,
                  launch games and watch the leaderboard change in real time.
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-9">

                  <button
                    type="button"
                    onClick={handleCreateQuiz}
                    className="
                      group
                      inline-flex
                      items-center
                      gap-2
                      px-8
                      py-4
                      rounded-full
                      bg-[#3984ed]
                      text-white
                      font-bold
                      shadow-lg
                      shadow-blue-200
                      hover:bg-[#2675df]
                      hover:-translate-y-1
                      transition-all
                    "
                  >
                    <Play size={18} fill="currentColor" />
                    Create Quiz
                  </button>

                  <Link
                    to="/join"
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-8
                      py-4
                      rounded-full
                      border-2
                      border-[#7184ff]
                      text-[#4e5fd5]
                      font-bold
                      hover:bg-indigo-50
                      hover:-translate-y-1
                      transition-all
                    "
                  >
                    <Users size={18} />
                    Join by Code
                  </Link>

                </div>

                <div className="flex items-center gap-8 mt-10 text-sm text-gray-500">

                  <div className="flex items-center gap-2">

                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Users size={16} className="text-blue-600" />
                    </div>

                    <span>
                      Live multiplayer
                    </span>

                  </div>

                  <div className="flex items-center gap-2">

                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Trophy size={16} className="text-indigo-600" />
                    </div>

                    <span>
                      Real-time results
                    </span>

                  </div>

                </div>

              </div>

              <div className="relative flex justify-center lg:justify-end">
                <div className="absolute -inset-8 bg-blue-100/30 blur-3xl rounded-full" />

                <div className="relative w-full max-w-[430px]">
                  <Star
                    size={18}
                    className="
                      absolute
                      -left-8
                      top-16
                      text-indigo-300
                      fill-indigo-100
                    "
                  />

                  <Star
                    size={14}
                    className="
                      absolute
                      right-4
                      -top-7
                      text-blue-200
                      fill-blue-50
                    "
                  />

                  <Heart
                    size={18}
                    className="
                      absolute
                      -right-8
                      bottom-20
                      text-blue-200
                      fill-blue-50
                    "
                  />

                  <div
                    className="
                      bg-white
                      rounded-[28px]
                      shadow-[0_20px_60px_rgba(45,90,170,0.16)]
                      border
                      border-white
                      p-6
                      transform
                      rotate-[1.5deg]
                    "
                  >
                    <div className="flex items-center justify-between mb-5">

                      <span
                        className="
                          px-3
                          py-1.5
                          rounded-full
                          bg-[#2978e8]
                          text-white
                          text-xs
                          font-bold
                        "
                      >
                        Question {questionIndex + 1}/10
                      </span>

                      <div className="flex items-center gap-1 text-sm font-bold text-indigo-500">

                        <Star
                          size={16}
                          fill="currentColor"
                        />

                        850 pts

                      </div>

                    </div>

                    <h2
                      className="
                        text-[18px]
                        font-semibold
                        text-gray-800
                        leading-relaxed
                        mb-6
                      "
                    >
                      {question.question}
                    </h2>

                    <div className="space-y-3">

                      {question.options.map((option, index) => {

                        const selected =
                          selectedAnswer === index;

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              handleDemoAnswer(index)
                            }
                            className={`
                              w-full
                              flex
                              items-center
                              gap-4
                              px-5
                              py-4
                              rounded-[22px]
                              text-left
                              transition-all
                              duration-200
                              border-2

                              ${
                                selected
                                  ? "bg-blue-50 border-[#0065c9] shadow-sm"
                                  : "bg-[#f1f2fc] border-transparent hover:bg-blue-50"
                              }
                            `}
                          >

                            <span
                              className="
                                w-8
                                h-8
                                shrink-0
                                rounded-full
                                flex
                                items-center
                                justify-center
                                text-sm
                                font-bold
                                bg-[#2879e8]
                                text-white
                              "
                            >
                              {String.fromCharCode(65 + index)}
                            </span>

                            <span
                              className={`
                                text-sm
                                ${
                                  selected
                                    ? "font-bold text-[#0058BE]"
                                    : "font-medium text-gray-700"
                                }
                              `}
                            >
                              {option}
                            </span>

                            {selected && (
                              <span
                                className="
                                  ml-auto
                                  w-5
                                  h-5
                                  rounded-full
                                  border-2
                                  border-[#0058BE]
                                  flex
                                  items-center
                                  justify-center
                                "
                              >
                                <span
                                  className="
                                    w-2
                                    h-2
                                    rounded-full
                                    bg-[#0058BE]
                                  "
                                />
                              </span>
                            )}

                          </button>
                        );
                      })}

                    </div>

                    <div className="mt-7">

                      <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">

                        <div
                          className="
                            h-full
                            rounded-full
                            bg-[#0065c9]
                            transition-all
                            duration-1000
                          "
                          style={{
                            width: `${(timeLeft / 8) * 100}%`,
                          }}
                        />

                      </div>

                      <div className="text-center text-xs font-bold text-gray-600 mt-2">
                        Time remaining: {timeLeft}s
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>

        <section className="relative px-6 pb-16">

          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">

            <FeatureCard
              icon={BarChart3}
              iconClass="bg-blue-100 text-blue-600"
              title="Real-time Results"
              text="Watch the leaderboard shift as players submit their answers live!"
            />

            <FeatureCard
              icon={Zap}
              iconClass="bg-indigo-100 text-indigo-600"
              title="Easy Room Codes"
              text="Players join in seconds by entering a simple 6-digit pin on any device."
            />

            <FeatureCard
              icon={MonitorSmartphone}
              iconClass="bg-emerald-100 text-emerald-600"
              title="Works Anywhere"
              text="No app required. Works seamlessly in any modern mobile or desktop browser."
            />

          </div>

        </section>

      </main>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  iconClass,
  title,
  text,
}) {
  return (
    <div
      className="
        group
        bg-white
        rounded-[24px]
        border
        border-gray-100
        p-7
        text-center
        shadow-[0_10px_35px_rgba(30,60,120,0.06)]
        hover:-translate-y-1
        hover:shadow-[0_15px_40px_rgba(30,60,120,0.1)]
        transition-all
      "
    >

      <div
        className={`
          w-12
          h-12
          mx-auto
          rounded-full
          flex
          items-center
          justify-center
          ${iconClass}
        `}
      >
        <Icon size={22} />
      </div>

      <h3 className="mt-5 font-bold text-gray-800">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-gray-500">
        {text}
      </p>

    </div>
  );
}