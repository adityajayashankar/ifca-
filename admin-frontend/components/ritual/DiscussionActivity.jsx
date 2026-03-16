import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { MdSend, MdLink } from "react-icons/md";

export default function DiscussionActivity({ activity, activityData, isModerator }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newLink, setNewLink] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const messagesEndRef = useRef(null);
  const user = useSelector(selectUser);
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPollingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activity?.id]);

  useEffect(() => {
    // Clear any existing timeout first
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;

    if (!activity?.id) return;
    
    // Load existing messages/discussion
    loadMessages();
    
    // Poll for new messages once after 2 minutes - only check for new messages once
    // Only poll if component is still mounted
    pollingIntervalRef.current = setTimeout(() => {
      if (isMountedRef.current && !isPollingRef.current && activity?.id) {
        isPollingRef.current = true;
        loadMessages().finally(() => {
          isPollingRef.current = false;
        });
      }
    }, 120000); // 2 minutes = 120 seconds
    
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, [activity?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!activity?.id || !isMountedRef.current) return;
    
    try {
      const response = await api.get(`/huddle/activity/${activity.id}/discussion/messages`);
      if (response.data.success && Array.isArray(response.data.messages)) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      // If endpoint doesn't exist yet, fallback to activityData
      if (error.response?.status === 404) {
        if (activityData.messages) {
          setMessages(activityData.messages);
        }
      } else {
        console.error('Error loading messages:', error);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !newLink.trim()) return;
    if (!activity?.id) return;

    const messageData = {
      text: newMessage.trim() || null,
      link: newLink.trim() || null,
      userId: user?.unifiedUserId || user?.id,
      userName: user?.name || user?.email || 'Anonymous'
    };

    // Clear input immediately for better UX
    const tempMessage = newMessage;
    const tempLink = newLink;
    setNewMessage("");
    setNewLink("");
    setShowLinkInput(false);

    try {
      // Send to backend
      const response = await api.post(`/huddle/activity/${activity.id}/discussion/message`, messageData);
      
      if (response.data.success) {
        // Message will be loaded by polling, but add optimistically for instant feedback
        const optimisticMessage = {
          ...messageData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMessage]);
        toast.success('Message sent!');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Restore input on error
      setNewMessage(tempMessage);
      setNewLink(tempLink);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Topic Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-2">
          {activityData.topic || activityData.title || 'Discussion'}
        </h3>
        {activityData.description && (
          <p className="text-gray-300">{activityData.description}</p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No messages yet. Start the discussion!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id || message.timestamp} className="bg-gray-800 rounded-lg p-4">
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
              {message.text && (
                <p className="text-gray-300 mb-2">{message.text}</p>
              )}
              {message.link && (
                <a
                  href={message.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 flex items-center gap-2 text-sm"
                >
                  <MdLink className="w-4 h-4" />
                  {message.link}
                </a>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
        {showLinkInput && (
          <div className="mb-3">
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="Paste link here..."
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLinkInput(!showLinkInput)}
            className={`p-2 rounded-lg transition-colors ${
              showLinkInput
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Add link"
          >
            <MdLink className="w-5 h-5" />
          </button>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or comment..."
            rows={2}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !newLink.trim()}
            className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <MdSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

