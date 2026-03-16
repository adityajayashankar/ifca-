import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { MdSend, MdLink, MdPlayArrow, MdPause } from "react-icons/md";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";

export default function StorySpotlightActivity({ activity, activityData, isModerator }) {
  const [story, setStory] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const user = useSelector(selectUser);

  const videoUrl = activityData.videoUrl || activityData.url;
  const topic = activityData.topic || activityData.title || activityData.prompt || "Story Spotlight";
  const questions = activityData.questions || [];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmit = async () => {
    if (!story && Object.keys(answers).length === 0) {
      toast.error('Please share your story or answer the questions');
      return;
    }

    try {
      // Submit story/answers
      toast.success('Your story has been shared!');
      setSubmitted(true);
      
      // Add to messages
      const storyMessage = {
        text: story || Object.values(answers).join('\n'),
        userId: user?.unifiedUserId || user?.id,
        userName: user?.name || user?.email || 'Anonymous',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, storyMessage]);
      setStory("");
      setAnswers({});
    } catch (error) {
      console.error('Error submitting story:', error);
      toast.error('Failed to submit story');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      text: newMessage,
      userId: user?.unifiedUserId || user?.id,
      userName: user?.name || user?.email || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    try {
      setMessages(prev => [...prev, messageData]);
      setNewMessage("");
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Topic Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-2">{topic}</h3>
        {activityData.description && (
          <p className="text-gray-300">{activityData.description}</p>
        )}
      </div>

      {/* Video Section (if available) */}
      {videoUrl && (
        <div className="relative bg-black h-64 md:h-80 flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            controls={false}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <button
                onClick={togglePlay}
                className="w-20 h-20 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-opacity pointer-events-auto"
              >
                <MdPlayArrow className="w-12 h-12 ml-1" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Story/Questions Form */}
      {!submitted && (
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900">
          {questions.length > 0 && (
            <div className="space-y-4 mb-4">
              {questions.map((question, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-white mb-2">
                    {question}
                  </label>
                  <textarea
                    value={answers[idx] || ''}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder="Your answer..."
                    className="w-full p-3 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border border-gray-700"
                    rows={3}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Your Story
            </label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Share your story here..."
              className="w-full p-3 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border border-gray-700"
              rows={6}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Share Story
          </button>
        </div>
      )}

      {/* Discussion Messages */}
      {(submitted || messages.length > 0) && (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No stories shared yet.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {message.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-white font-semibold">{message.userName}</span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{message.text}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Add a comment or share thoughts..."
                rows={2}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MdSend className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}










