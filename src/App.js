import React, { useState, useEffect } from "react";
import mammoth from "mammoth";

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function parseQuestions(rawText) {
  const questions = [];
  const blocks = rawText.split(/\n(?=\d+\))/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 5) continue;

    const questionLine = lines[0];
    const options = lines.slice(1, 5);
    const answerLine = lines.find((line) =>
      line.toLowerCase().includes("đáp án")
    );

    if (!answerLine) continue;

    const correctLetter = answerLine
      .slice(answerLine.indexOf(":") + 1)
      .trim()
      .toUpperCase();

    const correctOption = options.find(
      (opt) => opt.trim().toUpperCase().startsWith(correctLetter)
    );

    questions.push({
      question: questionLine,
      options: shuffleArray(options),
      answer: correctOption,
      userAnswer: "",
    });
  }

  return questions;
}

export default function QuizGenerator() {
  const [inputText, setInputText] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const handleGenerate = () => {
    const parsed = parseQuestions(inputText);
    setQuiz(parsed);
    setSubmitted(false);
    setTimeLeft(parsed.length * 60); // 60 giây mỗi câu
  };

  const handleSelect = (qIdx, option) => {
    const updatedQuiz = [...quiz];
    updatedQuiz[qIdx].userAnswer = option;
    setQuiz(updatedQuiz);
  };

  const score = quiz.filter((q) => q.answer === q.userAnswer).length;

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) {
      setSubmitted(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    setInputText(result.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white text-gray-900 dark:text-gray-100 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">📝 Tạo đề trắc nghiệm</h1>

        <textarea
          className="w-full h-48 p-3 border rounded bg-white dark:bg-gray-800 shadow-sm"
          placeholder="Dán văn bản câu hỏi vào đây"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        ></textarea>

        <input type="file" accept=".docx" onChange={handleFileUpload} className="mt-2" />

        <button
          onClick={handleGenerate}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow transition w-full"
        >
          🚀 Tạo đề trắc nghiệm
        </button>

        {quiz.length > 0 && (
          <div className="space-y-6">
            {!submitted && timeLeft !== null && (
              <div className="text-lg font-semibold text-center">
                ⏱ Thời gian còn lại: {formatTime(timeLeft)}
              </div>
            )}

            {quiz.map((q, idx) => (
              <div key={idx} className="border border-gray-300 p-4 rounded-xl shadow bg-white">
                <p className="font-semibold mb-2">{q.question}</p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(idx, opt[0].toUpperCase())}
                      className={`p-3 rounded-xl border transition font-medium text-left ${
                        q.userAnswer === opt[0].toUpperCase()
                          ? "bg-green-100 border-green-500 text-green-700 shadow"
                          : "hover:bg-gray-100 border-gray-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {submitted && (
                  <p className="mt-3 text-sm text-gray-600">
                    Đáp án đúng:{" "}
                    <b className="text-green-700">{q.answer}</b>
                  </p>
                )}
              </div>
            ))}

            {!submitted && (
              <button
                onClick={() => setSubmitted(true)}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow"
              >
                ✅ Nộp bài
              </button>
            )}

            {submitted && (
              <div className="text-xl font-bold text-center text-blue-700">
                🎉 Bạn đúng {score}/{quiz.length} câu
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
