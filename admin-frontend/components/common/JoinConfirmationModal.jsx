import React from 'react';
import { MdVideocam, MdPlayArrow } from 'react-icons/md';

const JoinConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Join Meeting",
  type = "catchup" // "instant" or "scheduled"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${
            type === "instant" ? "bg-orange-100" : "bg-green-100"
          }`}>
            {type === "instant" ? (
              <MdVideocam className="w-6 h-6 text-orange-600" />
            ) : (
              <MdPlayArrow className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700">
            Are you sure you want to join this meeting? You will be redirected to the video call.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${
              type === "instant" 
                ? "bg-orange-500 hover:bg-orange-600" 
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinConfirmationModal;





