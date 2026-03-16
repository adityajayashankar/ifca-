import { useState } from "react";
import { toast } from "react-toastify";

export default function ReflectionActivity({ activity, activityData, isModerator }) {
  const [reflections, setReflections] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [allowSharing, setAllowSharing] = useState(false);

  const prompts = activityData.prompts || [];
  const instructions = activityData.instructions || "";

  const handleReflectionChange = (promptIndex, value) => {
    setReflections(prev => ({
      ...prev,
      [promptIndex]: value
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(reflections).length === 0) {
      toast.error('Please provide at least one reflection');
      return;
    }
    toast.success('Your reflections have been saved!');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✓</span>
          </div>
          <p className="text-green-400 font-semibold text-xl mb-2">Your reflections have been submitted!</p>
          <p className="text-gray-300 text-sm">Thank you for taking the time to reflect.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-2">Reflection</h3>
        {instructions && (
          <p className="text-gray-300">{instructions}</p>
        )}
      </div>

      {/* Reflection Form */}
      <div className="flex-1 p-6 space-y-6">
        {prompts.length > 0 ? (
          prompts.map((prompt, idx) => (
            <div key={idx}>
              <label className="block text-sm font-medium text-white mb-2">
                {prompt}
              </label>
              <textarea
                value={reflections[idx] || ''}
                onChange={(e) => handleReflectionChange(idx, e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-4 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border border-gray-700 resize-none"
                rows={5}
              />
            </div>
          ))
        ) : (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Share your reflections
            </label>
            <textarea
              value={reflections[0] || ''}
              onChange={(e) => handleReflectionChange(0, e.target.value)}
              placeholder="Take a moment to reflect on today's session..."
              className="w-full p-4 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none border border-gray-700 resize-none"
              rows={10}
            />
          </div>
        )}

        {activityData.allowSharing && (
          <div className="flex items-center p-4 bg-gray-800 rounded-lg border border-gray-700">
            <input
              type="checkbox"
              checked={allowSharing}
              onChange={(e) => setAllowSharing(e.target.checked)}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="ml-3 text-gray-300">Allow sharing my reflections with the community</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full px-6 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors text-lg"
        >
          Submit Reflections
        </button>
      </div>
    </div>
  );
}

