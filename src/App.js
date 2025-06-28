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
    setTimeLeft(parsed.length * 60); // 60s mỗi câu
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
    <div className="max-w-3xl mx-auto p-4 space-y-4 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold">Tạo đề trắc nghiệm từ văn bản hoặc file .docx</h1>

      <textarea
        className="w-full h-48 p-2 border rounded bg-white dark:bg-gray-800"
        placeholder="Dán văn bản câu hỏi vào đây"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      ></textarea>

      <input type="file" accept=".docx" onChange={handleFileUpload} className="mt-2" />

      <button onClick={handleGenerate} className="px-4 py-2 bg-blue-500 text-white rounded">
        Tạo đề
      </button>

      {quiz.length > 0 && (
        <div className="space-y-6">
          {timeLeft !== null && !submitted && (
            <div className="text-lg font-semibold">Thời gian còn lại: {formatTime(timeLeft)}</div>
          )}

          {quiz.map((q, idx) => (
            <div key={idx} className="border p-4 rounded bg-white dark:bg-gray-900">
              <p className="font-semibold">{q.question}</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {q.options.map((opt, i) => (
  <button
    key={i}
    onClick={() => handleSelect(idx, opt)}
    className={
      "p-2 border rounded text-left " +
      (q.userAnswer === opt ? "bg-blue-100 border-blue-500" : "")
    }
  >
    {opt}
  </button>
))}

              </div>
              {submitted && (
                <p className="mt-2 text-sm">
                  Đáp án đúng: <b>{q.answer}</b>
                </p>
              )}
            </div>
          ))}

          {!submitted && (
            <button
              onClick={() => setSubmitted(true)}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Nộp bài
            </button>
          )}
          {submitted && (
            <div className="text-xl font-bold">Bạn đúng {score}/{quiz.length} câu</div>
          )}
        </div>
      )}
    </div>
  );
}
