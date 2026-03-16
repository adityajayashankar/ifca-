import { useState } from "react";
import { toast } from "react-toastify";
import api from "@/utils/apiSetup";

export default function PollActivity({ activity, activityData, isModerator }) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(activityData.results || []);

  const handleOptionToggle = (optionIndex) => {
    if (activityData.allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(optionIndex)
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
    } else {
      setSelectedOptions([optionIndex]);
    }
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) {
      toast.error('Please select at least one option');
      return;
    }

    try {
      const response = await api.post(`/huddle/activity/${activity.id}/vote`, {
        selectedOptions: selectedOptions
      });

      if (response.data.success) {
        setResults(response.data.results);
        setSubmitted(true);
        toast.success('Vote submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
    }
  };

  if (submitted) {
    const totalVotes = results.reduce((sum, r) => sum + (r.votes || 0), 0);
    return (
      <div className="w-full h-full overflow-y-auto p-8 bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">
            {activityData.title || 'Poll Results'}
          </h3>
          {activityData.description && (
            <p className="text-gray-300 text-center mb-6">{activityData.description}</p>
          )}
          
          <div className="bg-gray-800 rounded-lg p-6 mb-4">
            <p className="text-white font-semibold text-center mb-4">
              Total Votes: {totalVotes}
            </p>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => {
              const percentage = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;
              const isSelected = selectedOptions.includes(index);
              return (
                <div key={index} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-medium text-lg">{result.option}</span>
                    <span className="text-orange-400 font-semibold">
                      {result.votes} votes ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        isSelected ? 'bg-orange-600' : 'bg-gray-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">✓ Your vote has been recorded!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gray-900">
      <div className="max-w-3xl w-full">
        <h3 className="text-3xl font-bold text-white mb-4 text-center">
          {activityData.question || activityData.title || 'Poll'}
        </h3>
        {activityData.description && (
          <p className="text-gray-300 text-center mb-8">{activityData.description}</p>
        )}

        <div className="space-y-4 mb-8">
          {activityData.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionToggle(index)}
              className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                selectedOptions.includes(index)
                  ? 'border-orange-500 bg-orange-900 bg-opacity-50'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-800'
              }`}
            >
              <div className="flex items-center">
                {activityData.allowMultiple ? (
                  <div className={`w-6 h-6 rounded border-2 mr-4 flex items-center justify-center ${
                    selectedOptions.includes(index)
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-gray-500'
                  }`}>
                    {selectedOptions.includes(index) && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                    selectedOptions.includes(index)
                      ? 'border-orange-500'
                      : 'border-gray-500'
                  }`}>
                    {selectedOptions.includes(index) && (
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    )}
                  </div>
                )}
                <span className="flex-1 text-white text-lg">{option}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={selectedOptions.length === 0}
          className="w-full px-8 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
        >
          Submit Vote
        </button>
      </div>
    </div>
  );
}

