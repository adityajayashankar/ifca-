import React, { useState, useEffect } from 'react';
import { MdVideocam, MdSchedule, MdClose, MdAccessTime, MdPerson, MdDescription, MdGroup, MdSettings, MdMic, MdMicOff, MdVideocamOff, MdScreenShare, MdChat, MdMoreVert } from 'react-icons/md';
import moment from 'moment';
import { toast } from 'react-toastify';
import api from '../../utils/apiSetup';

const CatchUpModal = ({ isOpen, onClose, onInstantCatchUp, onScheduledCatchUp, communityName, defaultToSchedule = false, communityId }) => {
  const [selectedOption, setSelectedOption] = useState(defaultToSchedule ? 'scheduled' : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Set default end time when start time changes
  useEffect(() => {
    if (scheduledDateTime) {
      const startTime = moment(scheduledDateTime);
      const endTime = startTime.clone().add(1, 'hour');
      setEndDateTime(endTime.format('YYYY-MM-DDTHH:mm'));
    }
  }, [scheduledDateTime]);

  // Set default option when modal opens
  useEffect(() => {
    if (isOpen && defaultToSchedule) {
      setSelectedOption('scheduled');
    }
  }, [isOpen, defaultToSchedule]);

  const handleInstantCatchUp = () => {
    onInstantCatchUp();
    handleClose();
  };

  // Validate time inputs
  const validateTimeInputs = () => {
    const now = moment();
    const startTime = moment(scheduledDateTime);
    const endTime = moment(endDateTime);

    // Check if start time is in the future
    if (startTime.isSameOrBefore(now)) {
      toast.error('Start time must be in the future');
      return false;
    }

    // Check if end time is after start time
    if (endTime.isSameOrBefore(startTime)) {
      toast.error('End time must be after start time');
      return false;
    }

    // Check if duration is at least 15 minutes
    const duration = moment.duration(endTime.diff(startTime));
    if (duration.asMinutes() < 15) {
      toast.error('CatchUp duration must be at least 15 minutes');
      return false;
    }

    return true;
  };

  // Check for overlapping catchups
  const checkForOverlappingCatchups = async () => {
    if (!communityId) return true; // Skip validation if no communityId

    try {
      const response = await api.get(`/catchup/scheduled/${communityId}`);
      if (response?.data?.success) {
        const existingCatchups = response.data.scheduledCatchups;
        const startTime = moment(scheduledDateTime);
        const endTime = moment(endDateTime);

        for (const catchup of existingCatchups) {
          const existingStart = moment(catchup.startTime);
          const existingEnd = moment(catchup.endTime);

          // Check for overlap
          if (
            (startTime.isBefore(existingEnd) && endTime.isAfter(existingStart)) ||
            (existingStart.isBefore(endTime) && existingEnd.isAfter(startTime))
          ) {
            toast.error(`There is already a CatchUp scheduled during this time (${existingStart.format('MMM D, h:mm A')} - ${existingEnd.format('h:mm A')})`);
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking for overlapping catchups:', error);
      return true; // Allow creation if check fails
    }
  };

  const handleScheduledCatchUp = async () => {
    if (!title || !scheduledDateTime || !endDateTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate time inputs
    if (!validateTimeInputs()) {
      return;
    }

    setIsValidating(true);

    try {
      // Check for overlapping catchups
      const noOverlap = await checkForOverlappingCatchups();
      if (!noOverlap) {
        setIsValidating(false);
        return;
      }

      // Create the scheduled catchup
    onScheduledCatchUp({
      title,
      description,
        scheduledAt: scheduledDateTime,
        endTime: endDateTime
    });
      
      toast.success('CatchUp scheduled successfully!');
    handleClose();
    } catch (error) {
      console.error('Error scheduling catchup:', error);
      toast.error('Failed to schedule CatchUp. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setSelectedOption(defaultToSchedule ? 'scheduled' : '');
    setTitle('');
    setDescription('');
    setScheduledDateTime('');
    setEndDateTime('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Orange Theme */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <MdVideocam className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Start a CatchUp</h2>
                <p className="text-orange-100 text-sm">for {communityName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Option Selection - Only show if not defaulting to schedule */}
          {!defaultToSchedule && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose how to join</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instant CatchUp Option */}
                <button
              onClick={() => setSelectedOption('instant')}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left group ${
                    selectedOption === 'instant'
                      ? 'border-orange-500 bg-orange-50 shadow-lg'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      selectedOption === 'instant' ? 'bg-orange-100' : 'bg-gray-100 group-hover:bg-orange-100'
                    }`}>
                      <MdVideocam className={`w-6 h-6 ${
                        selectedOption === 'instant' ? 'text-orange-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Instant CatchUp</h4>
                      <p className="text-sm text-gray-600 mb-3">Start immediately and invite others</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MdGroup className="w-4 h-4" />
                        <span>Unlimited participants</span>
                      </div>
                    </div>
                  </div>
                  {selectedOption === 'instant' && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
                
                {/* Scheduled CatchUp Option */}
                <button
              onClick={() => setSelectedOption('scheduled')}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left group ${
                    selectedOption === 'scheduled'
                      ? 'border-orange-500 bg-orange-50 shadow-lg'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      selectedOption === 'scheduled' ? 'bg-orange-100' : 'bg-gray-100 group-hover:bg-orange-100'
                    }`}>
                      <MdSchedule className={`w-6 h-6 ${
                        selectedOption === 'scheduled' ? 'text-orange-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Schedule CatchUp</h4>
                      <p className="text-sm text-gray-600 mb-3">Plan for a future date and time</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MdAccessTime className="w-4 h-4" />
                        <span>Send calendar invites</span>
                      </div>
                    </div>
                  </div>
                  {selectedOption === 'scheduled' && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Instant CatchUp Section */}
          {selectedOption === 'instant' && (
            <div className="space-y-6">
              {/* Join Button - Orange Theme */}
              <button
                onClick={handleInstantCatchUp}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
              >
                <MdVideocam className="w-6 h-6" />
                Join Now
              </button>
            </div>
          )}

          {/* Scheduled CatchUp Section */}
          {selectedOption === 'scheduled' && (
            <div className="space-y-6">
              {/* Form - Orange Theme */}
              <div className="space-y-6">
                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MdPerson className="w-4 h-4" />
                    CatchUp Title *
                  </label>
                  <input
                    type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title for your CatchUp"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-lg"
                required
                  />
                </div>
                
                {/* Description Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MdDescription className="w-4 h-4" />
                    Description
                  </label>
                  <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for participants (optional)"
                rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                  />
                </div>
                
                {/* Date & Time Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MdAccessTime className="w-4 h-4" />
                      Start Date & Time *
                    </label>
                    <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                      min={moment().format('YYYY-MM-DDTHH:mm')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Minimum: {moment().format('MMMM D, YYYY h:mm A')}
                    </p>
                  </div>

                  {/* End Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MdAccessTime className="w-4 h-4" />
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                      min={scheduledDateTime || moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Default: 1 hour duration
                    </p>
                  </div>
                </div>

                {/* Duration Display */}
                {scheduledDateTime && endDateTime && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-800">
                      <MdAccessTime className="w-5 h-5" />
                      <span className="font-medium">
                        Duration: {moment.duration(moment(endDateTime).diff(moment(scheduledDateTime))).humanize()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule Button - Orange Theme */}
              <button
                onClick={handleScheduledCatchUp}
                disabled={isValidating}
                className={`w-full font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg ${
                  isValidating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {isValidating ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <MdSchedule className="w-6 h-6" />
                Schedule CatchUp
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatchUpModal;





