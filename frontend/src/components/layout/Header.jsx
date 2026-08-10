export default function Header() {
  return (
    <header className="flex justify-between items-center px-16 py-8">
      <h1 className="text-3xl font-bold text-blue-600">QuizMaster</h1>
      <button className="text-blue-600 font-medium hover:text-blue-700 transition">
        Create Quiz
      </button>
    </header>
  );
}
