import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "@/utils/apiSetup";

export default function QuizActivity({ activity, activityData, isModerator }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(activityData.timeLimit || 300);
  const [timerActive, setTimerActive] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [winners, setWinners] = useState([]);

  const questions = activityData.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeRemaining, timerActive, submitted, questions.length]);

  const handleStartQuiz = () => {
    setTimerActive(true);
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setTimerActive(false);
    setSubmitted(true);

    try {
      const answerArray = questions.map((q, idx) => ({
        questionId: q.id || (idx + 1),
        selectedAnswer: answers[q.id || (idx + 1)] ?? -1
      }));

      const response = await api.post(`/huddle/activity/${activity.id}/quiz/submit`, {
        answers: answerArray
      });

      if (response.data.success) {
        setResults(response.data);
        setUserAnswers(response.data.userAnswers || {});
        setWinners(response.data.winners || []);
        toast.success('Quiz submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!timerActive && !submitted) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h3 className="text-2xl font-bold text-white mb-4">Quiz</h3>
          {activityData.title && (
            <h4 className="text-xl text-gray-300 mb-2">{activityData.title}</h4>
          )}
          {activityData.description && (
            <p className="text-gray-400 mb-6">{activityData.description}</p>
          )}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <p className="text-white font-semibold mb-2">Quiz Information</p>
            <p className="text-gray-300">
              {questions.length} questions • {Math.floor((activityData.timeLimit || 300) / 60)} minutes
            </p>
          </div>
          <button
            onClick={handleStartQuiz}
            className="px-8 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (submitted && results) {
    return (
      <div className="w-full h-full overflow-y-auto p-8 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">Quiz Results</h3>

          {/* User's Answers Summary */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h4 className="text-xl font-semibold text-white mb-4">Your Answers</h4>
            <div className="space-y-4">
              {questions.map((question, qIdx) => {
                const userAnswer = userAnswers[question.id || (qIdx + 1)];
                const isCorrect = userAnswer?.isCorrect;
                const selectedAnswer = question.options?.[userAnswer?.selectedAnswer];
                const correctAnswer = question.options?.[question.correctAnswer];

                return (
                  <div
                    key={qIdx}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect ? 'bg-green-900 border-green-500' : 'bg-red-900 border-red-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white font-medium">{question.question}</p>
                      {isCorrect ? (
                        <span className="text-green-400 font-semibold">✓ Correct</span>
                      ) : (
                        <span className="text-red-400 font-semibold">✗ Wrong</span>
                      )}
                    </div>
                    <div className="space-y-2 mt-3">
                      <div>
                        <p className="text-sm text-gray-300">Your answer:</p>
                        <p className={`text-sm font-medium ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                          {selectedAnswer || 'Not answered'}
                        </p>
                      </div>
                      {!isCorrect && (
                        <div>
                          <p className="text-sm text-gray-300">Correct answer:</p>
                          <p className="text-sm font-medium text-green-300">{correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <p className="text-white font-semibold text-center">
                Your Score: {results.userScore || 0} / {questions.length}
              </p>
            </div>
          </div>

          {/* Winners List */}
          {winners.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Winners</h4>
              <div className="space-y-3">
                {winners.map((winner, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-orange-500">#{idx + 1}</span>
                      <div>
                        <p className="text-white font-medium">{winner.name}</p>
                        <p className="text-gray-400 text-sm">Score: {winner.score}</p>
                      </div>
                    </div>
                    {idx === 0 && (
                      <span className="text-yellow-400 text-xl">🏆</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No questions available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white p-8">
      {/* Timer */}
      {timerActive && (
        <div className="mb-6 text-center">
          <div className="inline-block bg-red-600 px-6 py-3 rounded-lg">
            <p className="text-3xl font-mono font-bold">{formatTime(timeRemaining)}</p>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full">
          <div className="mb-6 text-center">
            <p className="text-gray-400 text-sm mb-2">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <h3 className="text-2xl font-bold mb-4">{currentQuestion.question}</h3>
            {currentQuestion.description && (
              <p className="text-gray-300">{currentQuestion.description}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion.id || (currentQuestionIndex + 1), index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  answers[currentQuestion.id || (currentQuestionIndex + 1)] === index
                    ? 'border-orange-500 bg-orange-900 bg-opacity-50'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                    answers[currentQuestion.id || (currentQuestionIndex + 1)] === index
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-gray-500'
                  }`}>
                    {answers[currentQuestion.id || (currentQuestionIndex + 1)] === index && (
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="flex-1 text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-8 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

