import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";

export default function DebateActivity({ activity, activityData = {}, isModerator }) {
  const user = useSelector(selectUser);
  const [forArgs, setForArgs] = useState([]);
  const [againstArgs, setAgainstArgs] = useState([]);
  const [newArg, setNewArg] = useState("");
  const [selectedSide, setSelectedSide] = useState("for");
  const [serverUnsupported, setServerUnsupported] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false };
  }, []);

  useEffect(() => {
    // Load existing debate arguments from backend, fallback to activityData
    const load = async () => {
      if (!activity?.id) return;
      if (serverUnsupported) {
        // backend doesn't support debate endpoint; use fallback
        setForArgs(activityData.sides?.for?.arguments || []);
        setAgainstArgs(activityData.sides?.against?.arguments || []);
        return;
      }

      try {
        const res = await api.get(`/huddle/activity/${activity.id}/debate`);
        if (res.data?.success && res.data.debate) {
          setForArgs(res.data.debate.sides?.for?.arguments || []);
          setAgainstArgs(res.data.debate.sides?.against?.arguments || []);
          setServerUnsupported(false);
          return;
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setServerUnsupported(true);
        }
        // ignore other errors and fallback
      }

      // Fallback to activityData structure
      setForArgs(activityData.sides?.for?.arguments || []);
      setAgainstArgs(activityData.sides?.against?.arguments || []);
    };

    load();
  }, [activity?.id]);

  const handleAddArgument = async () => {
    if (!newArg.trim()) return;
    if (!activity?.id) return;

    const payload = {
      side: selectedSide,
      text: newArg.trim(),
      userId: user?.unifiedUserId || user?.id,
      userName: user?.name || user?.email || 'Anonymous'
    };

    const optimistic = {
      ...payload,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    if (selectedSide === 'for') setForArgs(prev => [...prev, optimistic]);
    else setAgainstArgs(prev => [...prev, optimistic]);

    setNewArg("");

    try {
      if (serverUnsupported) {
        // backend not available for debate endpoints — keep optimistic state
        toast.info('Argument saved locally (no server endpoint)');
        return;
      }

      const res = await api.post(`/huddle/activity/${activity.id}/debate/argument`, payload);
      if (res.data?.success) {
        // replace the optimistic entry with server-provided if needed
        // simple approach: reload debate list
        try {
          const refresh = await api.get(`/huddle/activity/${activity.id}/debate`);
          if (refresh.data?.success && refresh.data.debate) {
            setForArgs(refresh.data.debate.sides?.for?.arguments || []);
            setAgainstArgs(refresh.data.debate.sides?.against?.arguments || []);
          }
        } catch (e) {
          if (e?.response?.status === 404) setServerUnsupported(true);
        }
        toast.success('Argument added');
      }
    } catch (error) {
      // If backend doesn't support debate endpoint, keep optimistic state
      if (error.response?.status === 404) {
        toast.info('Argument saved locally (server endpoint missing)');
      } else {
        toast.error('Failed to add argument');
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-2">{activityData.topic || activityData.title || 'Debate'}</h3>
        {activityData.description && (
          <p className="text-gray-300">{activityData.description}</p>
        )}
        {activityData.instructions && (
          <p className="text-gray-400 text-sm mt-2">{activityData.instructions}</p>
        )}
      </div>

      <div className="flex-1 p-6 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col">
          <h4 className="text-lg font-semibold text-white mb-2">For</h4>
          <div className="flex-1 overflow-auto space-y-3">
            {forArgs.length === 0 ? (
              <p className="text-gray-400">No arguments yet. Add one!</p>
            ) : (
              forArgs.map((a, i) => {
                const key = a?.id || a?.timestamp || (typeof a === 'string' ? a : null) || i;
                return (
                  <div key={key} className="bg-gray-700 p-3 rounded">
                    <div className="text-sm text-white font-semibold">{a?.userName}</div>
                    <div className="text-gray-300 mt-1">{a?.text || a?.argument || a}</div>
                    <div className="text-xs text-gray-400 mt-2">{new Date(a?.timestamp || a?.createdAt || Date.now()).toLocaleTimeString()}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 flex flex-col">
          <h4 className="text-lg font-semibold text-white mb-2">Against</h4>
          <div className="flex-1 overflow-auto space-y-3">
            {againstArgs.length === 0 ? (
              <p className="text-gray-400">No arguments yet. Add one!</p>
            ) : (
              againstArgs.map((a, i) => {
                const key = a?.id || a?.timestamp || (typeof a === 'string' ? a : null) || i;
                return (
                  <div key={key} className="bg-gray-700 p-3 rounded">
                    <div className="text-sm text-white font-semibold">{a?.userName}</div>
                    <div className="text-gray-300 mt-1">{a?.text || a?.argument || a}</div>
                    <div className="text-xs text-gray-400 mt-2">{new Date(a?.timestamp || a?.createdAt || Date.now()).toLocaleTimeString()}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex items-center gap-3">
        <select value={selectedSide} onChange={(e) => setSelectedSide(e.target.value)} className="px-3 py-2 bg-gray-700 text-white rounded">
          <option value="for">For</option>
          <option value="against">Against</option>
        </select>
        <input
          value={newArg}
          onChange={(e) => setNewArg(e.target.value)}
          placeholder="Add your argument..."
          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
        />
        <button onClick={handleAddArgument} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Add</button>
      </div>
    </div>
  );
}
