import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";

export default function ContestActivity({ activity, activityData = {}, isModerator }) {
  const user = useSelector(selectUser);
  const [submission, setSubmission] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [showDeadlineWarning, setShowDeadlineWarning] = useState(false);
  const [serverUnsupported, setServerUnsupported] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false };
  }, []);

  useEffect(() => {
    // Load existing contest submissions from backend
    const load = async () => {
      if (!activity?.id) return;
      if (serverUnsupported) {
        setSubmissions(activityData.submissions || []);
        return;
      }

      try {
        const res = await api.get(`/huddle/activity/${activity.id}/contest`);
        if (res.data?.success && res.data.contest) {
          setSubmissions(res.data.contest.submissions || []);
          setServerUnsupported(false);
          
          // Check if deadline passed
          if (res.data.contest.deadline && new Date(res.data.contest.deadline) < new Date()) {
            setShowDeadlineWarning(true);
          }
          return;
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setServerUnsupported(true);
        }
      }

      // Fallback to activityData
      setSubmissions(activityData.submissions || []);
      if (activityData.deadline && new Date(activityData.deadline) < new Date()) {
        setShowDeadlineWarning(true);
      }
    };

    load();
  }, [activity?.id]);

  const handleSubmit = async () => {
    if (!submission.trim()) {
      toast.warning("Please enter your submission text");
      return;
    }
    if (!activity?.id) return;

    const payload = {
      text: submission.trim(),
      userId: user?.unifiedUserId || user?.id,
      userName: user?.name || user?.email || 'Anonymous'
    };

    const optimistic = {
      ...payload,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    setSubmissions(prev => [...prev, optimistic]);
    setSubmission("");

    if (serverUnsupported) {
      toast.info('Submission saved locally (no server endpoint)');
      return;
    }

    try {
      const res = await api.post(`/huddle/activity/${activity.id}/contest/entry`, payload);
      if (res.data?.success) {
        // Refresh contest data
        try {
          const refresh = await api.get(`/huddle/activity/${activity.id}/contest`);
          if (refresh.data?.success && refresh.data.contest) {
            setSubmissions(refresh.data.contest.submissions || []);
          }
        } catch (e) {
          if (e?.response?.status === 404) setServerUnsupported(true);
        }
        toast.success('Submission added');
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        setServerUnsupported(true);
        toast.info('Submission saved locally (no server endpoint)');
      } else {
        toast.error('Failed to submit entry');
      }
    }
  };

  const isDeadlinePassed = activityData.deadline && new Date(activityData.deadline) < new Date();

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-purple-600 px-6 py-4 border-b border-purple-500">
        <h3 className="text-2xl font-bold text-white mb-2">{activityData.title || 'Contest'}</h3>
        {activityData.description && (
          <p className="text-gray-100">{activityData.description}</p>
        )}
        {showDeadlineWarning && (
          <div className="mt-3 p-2 bg-red-600 text-white rounded text-sm">
            ⏰ Contest deadline has passed
          </div>
        )}
      </div>

      {/* Content - Rules, Prizes, Criteria */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Rules */}
        {activityData.rules && activityData.rules.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Rules</h4>
            <ul className="space-y-2">
              {activityData.rules.map((rule, i) => (
                <li key={`rule-${i}`} className="flex items-start gap-3 text-gray-300">
                  <span className="text-orange-500 font-bold mt-1">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prizes */}
        {activityData.prizes && activityData.prizes.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">🎁 Prizes</h4>
            <ul className="space-y-2">
              {activityData.prizes.map((prize, i) => (
                <li key={`prize-${i}`} className="flex items-start gap-3 text-gray-300">
                  <span className="text-yellow-500 font-bold mt-1">★</span>
                  <span>{prize}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Criteria */}
        {activityData.criteria && activityData.criteria.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Evaluation Criteria</h4>
            <ul className="space-y-2">
              {activityData.criteria.map((criterion, i) => (
                <li key={`criterion-${i}`} className="flex items-start gap-3 text-gray-300">
                  <span className="text-blue-500 font-bold mt-1">✓</span>
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submissions List */}
        {submissions.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Submissions ({submissions.length})</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {submissions.map((sub, i) => {
                const key = sub?.id || sub?.timestamp || i;
                return (
                  <div key={key} className="bg-gray-700 p-3 rounded border-l-4 border-purple-500">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-white font-semibold">{sub?.userName}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(sub?.timestamp || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-gray-300 text-sm">{sub?.text || sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Submission Form */}
      {!isDeadlinePassed && (
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          <div className="flex flex-col gap-3">
            <textarea
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              placeholder="Enter your contest submission..."
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              rows="3"
            />
            <button
              onClick={handleSubmit}
              disabled={!submission.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Submit Entry
            </button>
          </div>
        </div>
      )}

      {isDeadlinePassed && (
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 text-center text-gray-400">
          Submission period has ended
        </div>
      )}
    </div>
  );
}
