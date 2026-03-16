import React, { useState, useEffect } from 'react';
import { XMarkIcon, VideoCameraIcon, CalendarIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import moment from 'moment';

const CatchUpModal = ({ isOpen, onClose, onInstantCatchUp, onScheduledCatchUp, communityName, scheduledCatchups = [] }) => {
  const [selectedOption, setSelectedOption] = useState('instant');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // Custom calendar state
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(20);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleInstantCatchUp = () => {
    onInstantCatchUp();
    onClose();
  };

  const validateScheduledDateTime = (dateTime) => {
    if (!dateTime) {
      setValidationError('Please select date and time');
      return false;
    }

    const selectedTime = moment(dateTime);
    const now = moment();
    
    // Check if selected time is in the past
    if (selectedTime.isBefore(now)) {
      setValidationError('Date and time must be in the future');
      return false;
    }

    // Check if selected time is at least 1 hour in the future
    const oneHourFromNow = moment().add(1, 'hour');
    if (selectedTime.isBefore(oneHourFromNow)) {
      setValidationError('CatchUp must be scheduled at least 1 hour in advance');
      return false;
    }

    // Check for time conflicts with existing scheduled catchups
    const hasConflict = scheduledCatchups.some(catchup => {
      const existingTime = moment(catchup.scheduledAt);
      const timeDifference = Math.abs(selectedTime.diff(existingTime, 'minutes'));
      
      // Consider it a conflict if within 30 minutes of existing catchup
      return timeDifference < 30;
    });

    if (hasConflict) {
      setValidationError('There is already a CatchUp scheduled within 30 minutes of this time. Please choose a different time.');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleScheduledCatchUp = () => {
    if (!validateScheduledDateTime(scheduledDateTime)) {
      return;
    }

    onScheduledCatchUp({
      scheduledAt: scheduledDateTime,
      title: title || 'Scheduled CatchUp',
      description: description || 'Scheduled CatchUp for community members'
    });
    onClose();
  };

  const getMinDateTime = () => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour
    return oneHourFromNow.toISOString().slice(0, 16);
  };

  // Set initial datetime to minimum allowed time when scheduled option is selected
  useEffect(() => {
    if (selectedOption === 'scheduled' && !scheduledDateTime) {
      const minDateTime = getMinDateTime();
      setScheduledDateTime(minDateTime);
      
      // Set custom calendar initial values
      const minMoment = moment(minDateTime);
      setSelectedDate(minMoment);
      setSelectedHour(minMoment.hour());
      setSelectedMinute(minMoment.minute());
    }
  }, [selectedOption]);

  // Update scheduledDateTime when custom calendar values change
  useEffect(() => {
    if (selectedDate && selectedHour !== null && selectedMinute !== null) {
      const newDateTime = selectedDate.clone()
        .hour(selectedHour)
        .minute(selectedMinute)
        .second(0)
        .millisecond(0);
      
      setScheduledDateTime(newDateTime.format('YYYY-MM-DDTHH:mm'));
      setValidationError(''); // Clear validation error when user changes the date/time
    }
  }, [selectedDate, selectedHour, selectedMinute]);

  // Custom calendar functions
  const getDaysInMonth = () => {
    const start = currentDate.clone().startOf('month').startOf('week');
    const end = currentDate.clone().endOf('month').endOf('week');
    const days = [];
    let day = start.clone();

    while (day.isBefore(end) || day.isSame(end, 'day')) {
      days.push(day.clone());
      day.add(1, 'day');
    }
    return days;
  };

  const isDateDisabled = (date) => {
    const now = moment();
    const today = now.clone().startOf('day');
    const dateToCheck = date.clone().startOf('day');
    
    // Disable all dates before today
    if (dateToCheck.isBefore(today)) {
      return true;
    }
    
    // For today, check if it's too late (less than 1 hour from now)
    if (dateToCheck.isSame(today)) {
      const oneHourFromNow = now.clone().add(1, 'hour');
      const latestPossibleTime = date.clone().hour(23).minute(59);
      // If even the latest time today would be less than 1 hour from now, disable the entire day
      return latestPossibleTime.isBefore(oneHourFromNow);
    }
    
    return false;
  };

  const isDateSelected = (date) => {
    return selectedDate && date.isSame(selectedDate, 'day');
  };

  const handleDateClick = (date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
      setValidationError(''); // Clear any previous errors
    } else {
      // Show specific error message for past dates
      const now = moment();
      const today = now.clone().startOf('day');
      const dateToCheck = date.clone().startOf('day');
      
      if (dateToCheck.isBefore(today)) {
        setValidationError('❌ You cannot select past dates. Please choose a future date.');
      } else if (dateToCheck.isSame(today)) {
        setValidationError('❌ Today\'s date is too late to schedule. Please choose a future date.');
      }
    }
  };

  const handleHourClick = (hour) => {
    if (!isHourDisabled(hour)) {
      setSelectedHour(hour);
      setValidationError(''); // Clear any previous errors
    } else {
      setValidationError('❌ You cannot select past hours. Please choose a future time.');
    }
  };

  const handleMinuteClick = (minute) => {
    if (!isMinuteDisabled(minute)) {
      setSelectedMinute(minute);
      setValidationError(''); // Clear any previous errors
    } else {
      setValidationError('❌ You cannot select past minutes. Please choose a future time.');
    }
  };

  const handlePrevMonth = () => {
    const newDate = currentDate.clone().subtract(1, 'month');
    const now = moment();
    const currentMonth = now.clone().startOf('month');
    
    // Don't allow navigation to months before current month
    if (newDate.isBefore(currentMonth)) {
      return;
    }
    
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, 'month'));
  };

  const isPrevMonthDisabled = () => {
    const prevMonth = currentDate.clone().subtract(1, 'month');
    const now = moment();
    const currentMonth = now.clone().startOf('month');
    return prevMonth.isBefore(currentMonth);
  };

  const handleToday = () => {
    const today = moment();
    const oneHourFromNow = today.clone().add(1, 'hour');
    setSelectedDate(oneHourFromNow);
    setCurrentDate(oneHourFromNow);
  };

  const handleClear = () => {
    setSelectedDate(null);
    setScheduledDateTime('');
  };

  // Time validation functions
  const isHourDisabled = (hour) => {
    if (!selectedDate) return false;
    
    const now = moment();
    const today = now.clone().startOf('day');
    
    // If selected date is not today, no hours are disabled
    if (!selectedDate.isSame(today, 'day')) {
      return false;
    }
    
    // For today, disable hours that would result in past time
    const oneHourFromNow = now.clone().add(1, 'hour');
    const testTime = selectedDate.clone().hour(hour).minute(0);
    
    return testTime.isBefore(oneHourFromNow);
  };

  const isMinuteDisabled = (minute) => {
    if (!selectedDate || selectedHour === null) return false;
    
    const now = moment();
    const today = now.clone().startOf('day');
    
    // If selected date is not today, no minutes are disabled
    if (!selectedDate.isSame(today, 'day')) {
      return false;
    }
    
    // For today, disable minutes that would result in past time
    const oneHourFromNow = now.clone().add(1, 'hour');
    const testTime = selectedDate.clone().hour(selectedHour).minute(minute);
    
    return testTime.isBefore(oneHourFromNow);
  };

  // Generate hours and minutes for time picker
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // If not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <VideoCameraIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
              <h2 className="text-lg font-semibold text-gray-900">
                  Start CatchUp
              </h2>
                <p className="text-sm text-gray-500">{communityName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Option Selection */}
            <div className="space-y-3 mb-6">
              {/* Instant Option */}
              <button
                onClick={() => setSelectedOption('instant')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedOption === 'instant'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedOption === 'instant' ? 'bg-orange-500' : 'bg-gray-200'
                  }`}>
                    <VideoCameraIcon className={`w-5 h-5 ${
                      selectedOption === 'instant' ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Start Instant CatchUp</h3>
                    <p className="text-sm text-gray-500">Begin immediately</p>
                  </div>
                </div>
              </button>

              {/* Scheduled Option */}
              <button
                onClick={() => setSelectedOption('scheduled')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedOption === 'scheduled'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedOption === 'scheduled' ? 'bg-orange-500' : 'bg-gray-200'
                  }`}>
                    <CalendarIcon className={`w-5 h-5 ${
                      selectedOption === 'scheduled' ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Schedule CatchUp</h3>
                    <p className="text-sm text-gray-500">Set a future date and time</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Scheduled Form */}
            {selectedOption === 'scheduled' && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter CatchUp title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter CatchUp description"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time *
                    </label>
                
                {/* Custom Date Time Picker */}
                <div className="relative">
                    <input
                    type="text"
                    value={scheduledDateTime ? moment(scheduledDateTime).format('DD-MM-YYYY HH:mm') : ''}
                    placeholder="dd-mm-yyyy --:--"
                    readOnly
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 cursor-pointer ${
                      validationError 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                {/* Custom Calendar Dropdown */}
                {showCalendar && (
                  <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-full max-w-sm">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={handlePrevMonth}
                        disabled={isPrevMonthDisabled()}
                        className={`p-1 rounded transition-colors ${
                          isPrevMonthDisabled()
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                      </button>
                      <h3 className="font-semibold">
                        {currentDate.format('MMMM, YYYY')}
                      </h3>
                      <button
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
                          {day}
                        </div>
                      ))}
                      {getDaysInMonth().map((day, index) => {
                        const isDisabled = isDateDisabled(day);
                        const isSelected = isDateSelected(day);
                        const isCurrentMonth = day.month() === currentDate.month();
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleDateClick(day)}
                            disabled={isDisabled}
                            className={`p-1 text-xs rounded transition-colors ${
                              isDisabled
                                ? 'text-gray-300 cursor-not-allowed'
                                : isSelected
                                ? 'bg-gray-800 text-white'
                                : isCurrentMonth
                                ? 'text-gray-900 hover:bg-gray-100'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {day.format('D')}
                          </button>
                        );
                      })}
                    </div>

                    {/* Time Picker */}
                    <div className="flex gap-4 mb-4">
                      {/* Hours */}
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Hour</label>
                        <div className="h-32 overflow-y-auto border border-gray-200 rounded">
                          {hours.map(hour => {
                            const hourDisabled = isHourDisabled(hour);
                            return (
                              <button
                                key={hour}
                                onClick={() => handleHourClick(hour)}
                                disabled={hourDisabled}
                                className={`w-full p-1 text-xs text-center transition-colors ${
                                  hourDisabled
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : selectedHour === hour 
                                    ? 'bg-orange-500 text-white' 
                                    : 'hover:bg-gray-100'
                                }`}
                              >
                                {hour.toString().padStart(2, '0')}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Minutes */}
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Minute</label>
                        <div className="h-32 overflow-y-auto border border-gray-200 rounded">
                          {minutes.map(minute => {
                            const minuteDisabled = isMinuteDisabled(minute);
                            return (
                              <button
                                key={minute}
                                onClick={() => handleMinuteClick(minute)}
                                disabled={minuteDisabled}
                                className={`w-full p-1 text-xs text-center transition-colors ${
                                  minuteDisabled
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : selectedMinute === minute 
                                    ? 'bg-orange-500 text-white' 
                                    : 'hover:bg-gray-100'
                                }`}
                              >
                                {minute.toString().padStart(2, '0')}
                              </button>
                            );
                          })}
                  </div>
                  </div>
                </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between">
                      <button
                        onClick={handleClear}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleToday}
                        className="text-xs text-orange-600 hover:text-orange-800"
                      >
                        Today
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 1 hour in the future
                </p>
                
                {/* Immediate validation feedback */}
                {validationError && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium text-red-800">{validationError}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{validationError}</span>
                  </div>
                </div>
              )}

              {scheduledDateTime && !validationError && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-800">
                      <ClockIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">
                      Scheduled for {moment(scheduledDateTime).format('MMMM D, YYYY [at] h:mm A')}
                      </span>
                    </div>
                  </div>
                )}

              {/* Show existing scheduled catchups */}
              {scheduledCatchups.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Existing Scheduled CatchUps:</span>
                  </div>
                  <div className="space-y-2">
                    {scheduledCatchups.map((catchup, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        • {moment(catchup.scheduledAt).format('MMM D, YYYY [at] h:mm A')}
                        {catchup.title && ` - ${catchup.title}`}
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={selectedOption === 'instant' ? handleInstantCatchUp : handleScheduledCatchUp}
            disabled={selectedOption === 'scheduled' && !!validationError}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedOption === 'scheduled' && validationError
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
            >
              {selectedOption === 'instant' ? 'Start Now' : 'Schedule'}
            </button>
          </div>
      </div>
      </div>
  );
};

export default CatchUpModal; 