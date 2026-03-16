import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import api from '@/utils/apiSetup';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import { MdRadioButtonChecked, MdCheckBox, MdShortText, MdArrowDropDownCircle, MdDescription } from "react-icons/md";
import Topbar from '@/components/topbar/Topbar';
import Footer from '@/components/footer';

const accentColor = "#f59e42"; // saffron

const FormResponsePage = () => {
  const router = useRouter();
  const { formId, communityId } = router.query;
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector(selectUser)
  const [uploadingFiles, setUploadingFiles] = useState({}); // { [questionId]: true/false }
  const [uploadProgress, setUploadProgress] = useState({}); // { [questionId]: percent }
 
const [hasResponded, setHasResponded] = useState(false);
const [previousResponses, setPreviousResponses] = useState({});
const [submittedAt, setSubmittedAt] = useState(null);

  // Fetch form data
  useEffect(() => {
    if (!formId) return;

    const fetchForm = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Environment:', process.env.NODE_ENV);
        console.log('Fetching form with ID:', formId);
        console.log('API base URL:', api.defaults.baseURL);
        console.log('Full URL will be:', `${api.defaults.baseURL}/forms/${formId}`);
        
        // Test API connection first
        try {
          const testResponse = await api.get('/forms');
          console.log('API connection test successful:', testResponse.status);
        } catch (testErr) {
          console.error('API connection test failed:', testErr);
        }
        
        const response = await api.get(`/forms/${formId}`);
        console.log('Form API response:', response.data);
        
        if (response.data.form) {
          setForm(response.data.form);
          console.log('Form fetched successfully:', response.data.form);
        } else {
          console.error('No form data in response');
          setError('No form data received');
        }
      } catch (err) {
        console.error('Error fetching form:', err);
        console.error('Error details:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          config: err.config
        });
        setError(err.response?.data?.error || 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  // Check if user has already responded
  useEffect(() => {
    if (!formId || (!user?.unifiedUser?.id && !user?.id)) {
      console.log('Skipping user response check - missing formId or user:', { formId, user });
      return;
    }

    const checkAlreadySubmitted = async () => {
      try {
        console.log('Checking if user has already submitted form:', { formId, communityId, user });
        console.log('API base URL:', api.defaults.baseURL);
        console.log('Full URL will be:', `${api.defaults.baseURL}/forms/user-response-status`);
        
        // Check if user is authenticated
        const token = localStorage.getItem("ifca-jwt");
        console.log('Auth token available:', !!token);
        
        const res = await api.get(`/forms/user-response-status`, {
          params: {
            formId,
            communityId,
          },
        });

        console.log('User response status:', res.data);

      if (res.data.hasResponded) {
        setHasResponded(true);
        setSubmittedAt(res.data.submittedAt);

        const prev = {};
        res.data.responses.forEach(r => {
          try {
            // Handle different answer types
            if (r.question?.answerType === 'selectMulti' || r.question?.answerType === 'multiSelect') {
              prev[r.questionId] = JSON.parse(r.answer);
            } else if (r.question?.answerType === 'rating' || r.question?.answerType === 'number') {
              prev[r.questionId] = parseInt(r.answer);
            } else {
              prev[r.questionId] = r.answer;
            }
          } catch (e) {
            console.log('Could not parse answer for question', r.questionId, 'using raw value:', r.answer);
            prev[r.questionId] = r.answer;
          }
        });
        setPreviousResponses(prev);
        console.log('Previous responses loaded:', prev);
      }
            } catch (err) {
          console.error("❌ Error checking previous response", err);
          console.error('Error details:', {
            message: err.message,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            config: err.config
          });
        }
  };

  checkAlreadySubmitted();
}, [formId, user, communityId]);





 

  const handleResponseChange = (questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleMultiSelectChange = (questionId, option, checked) => {
    setResponses((prev) => {
      const selectedValues = prev[questionId] || [];
      return {
        ...prev,
        [questionId]: checked
          ? [...selectedValues, option]
          : selectedValues.filter((val) => val !== option),
      };
    });
  };

  const handleSubmit = async () => {
    // Check if user has already submitted
    if (hasResponded) {
      alert('You have already submitted this form. You cannot submit it again.');
      return;
    }

    // Check if formId is available
    if (!formId) {
      alert('Form ID is missing. Please try again.');
      return;
    }

    // Check if user is available
    if (!user?.unifiedUser?.id && !user?.id) {
      alert('User information is missing. Please log in again.');
      return;
    }

    // Validate required fields
    const missingFields = form?.Question?.filter(
      (question) => {
        if (!question.isRequired) return false;
        
        const response = responses[question.id];
        if (question.answerType === 'multiSelect') {
          return !Array.isArray(response) || response.length === 0;
        }
        return !response || response.toString().trim() === '';
      }
    );
  
    if (missingFields?.length > 0) {
      alert(`Please fill all required fields: ${missingFields.map(q => q.question).join(', ')}`);
      return;
    }

    // Prepare the submission data - communityId is required by backend
    // Stringify all answers
    const stringifiedResponses = {};
    for (const [qid, value] of Object.entries(responses)) {
      if (typeof value === 'string') {
        stringifiedResponses[qid] = value;
      } else {
        stringifiedResponses[qid] = JSON.stringify(value);
      }
    }
    const submissionData = {
      responses: stringifiedResponses,
      communityId: communityId || 1 // Default to 1 if not provided, as backend requires it
    };

    console.log('Submitting form data:', submissionData);
  
    try {
      const response = await api.post(`/forms/${formId}/submit`, submissionData);
      console.log('Form submission response:', response);
      alert('Form submitted successfully!');
      setResponses({});
      // Go back to previous page
      router.back();
    } catch (error) {
      console.error('Error submitting form:', error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert('Error submitting form. Please try again.');
      }
    }
  };

  // File upload handler for file-type questions
  const handleFileUpload = async (qid, file) => {
    if (!file) return;
    setUploadingFiles(prev => ({ ...prev, [qid]: true }));
    setUploadProgress(prev => ({ ...prev, [qid]: 0 }));
    try {
      // 1. Get presigned URL from backend
      const res = await api.post("/images/generate-presigned-url", {
        fileName: file.name,
        fileType: file.type,
        folder: "form-uploads",
      });
      const { uploadUrl, fileUrl } = res.data;
      // 2. Upload file to S3
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [qid]: percent }));
        },
      });
      // 3. Store fileUrl in responses
      setResponses(prev => ({ ...prev, [qid]: fileUrl }));
    } catch (err) {
      alert("File upload failed. Please try again.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [qid]: false }));
      setUploadProgress(prev => ({ ...prev, [qid]: 0 }));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading form...</p>
        <p className="text-sm text-gray-500">Form ID: {formId}</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 text-lg">{error}</p>
        <p className="text-sm text-gray-500 mt-2">Form ID: {formId}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full" style={{ fontFamily: 'Roboto, Helvetica Neue, Arial, sans-serif' }}>
    <Topbar/>
      <div className="w-full max-w-2xl mx-auto pt-8 pb-16 px-2 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden mt-[65px]">
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-t-4 w-full max-w-2xl mx-auto" style={{ borderTopColor: accentColor }}>
          <div className="w-full text-3xl font-bold border-b border-gray-300 mb-2 text-gray-900" style={{ fontSize: '2rem' }}>
            {form?.formName || 'Untitled form'}
          </div>
          {form?.Question?.[0]?.description && (
            <div className="w-full text-sm text-gray-600 border-b border-gray-200 pb-2 mb-2">
              {form.Question[0].description}
            </div>
          )}
          {form?.isCommunitySpecific && form?.communityData?.length > 0 && (
            <div className="mb-2 text-sm text-orange-700">
              Community: {form.communityData.map(c => c.communityName).join(', ')}
            </div>
          )}
          
          {/* Show submission status */}
          {hasResponded && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-green-800 font-semibold">Form Already Submitted</h3>
                  <p className="text-green-600 text-sm">
                    You have already submitted this form on {submittedAt ? new Date(submittedAt).toLocaleDateString() : 'previously'}.
                    Your responses are shown below in read-only mode.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            Form ID: {formId} | Questions: {form?.Question?.length || 0}
          </div>
        </div>

        {/* Questions */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {form?.Question && Array.isArray(form.Question) && form.Question.length > 0 ? (
            <div>
                        {console.log('Rendering questions:', form.Question.length, 'Has responded:', hasResponded, 'Previous responses:', previousResponses)}
          {form.Question.map((question, index) => {
            const previousResponse = previousResponses[question.id];
            console.log(`Question ${index + 1}:`, question.question, 'Previous response:', previousResponse);
            return (
                <div
                  key={question.id}
                  className="bg-white rounded-lg shadow-sm p-6 mb-6 border-t-4 w-full max-w-full"
                  style={{ borderTopColor: accentColor }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-gray-500">{index + 1}</span>
                    <span className="flex-1 text-base font-semibold text-gray-900">
                      {question.question || 'Question'}
                    </span>
                  </div>
                  {/* Answer Type and Options */}
                  {(() => {
  switch (question.answerType) {
    case 'shortText':
      return (
        <input
          type="text"
          className="w-full border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent text-gray-700 placeholder-gray-400 py-1"
          placeholder="Your answer"
          value={hasResponded ? previousResponses[question.id] || '' : responses[question.id] || ''}
          onChange={e => !hasResponded && handleResponseChange(question.id, e.target.value)}
          required={question.isRequired}
          disabled={hasResponded}
        />
      );
    case 'longText':
      return (
        <textarea
          className="w-full border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent text-gray-700 placeholder-gray-400 py-1"
          placeholder="Your detailed answer"
          value={hasResponded ? previousResponses[question.id] || '' : responses[question.id] || ''}
          onChange={e => !hasResponded && handleResponseChange(question.id, e.target.value)}
          required={question.isRequired}
          disabled={hasResponded}
        />
      );
    case 'selectSingle':
      return (
        <div className="space-y-2">
          {question.options.map((option, optIndex) => (
            <label key={optIndex} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`q_${question.id}`}
                value={option}
                checked={
                  hasResponded
                    ? previousResponses[question.id] === option
                    : responses[question.id] === option
                }
                onChange={() => !hasResponded && handleResponseChange(question.id, option)}
                className="accent-orange-500"
                required={question.isRequired}
                disabled={hasResponded}
              />
              <span className="text-gray-700 text-base">{option}</span>
            </label>
          ))}
        </div>
      );
    case 'selectMulti':
      return (
        <div className="space-y-2">
          {question.options.map((option, optIndex) => (
            <label key={optIndex} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name={`q_${question.id}`}
                value={option}
                checked={
                  hasResponded
                    ? Array.isArray(previousResponses[question.id]) && previousResponses[question.id].includes(option)
                    : Array.isArray(responses[question.id]) && responses[question.id].includes(option)
                }
                onChange={e => !hasResponded && handleMultiSelectChange(question.id, option, e.target.checked)}
                className="accent-orange-500"
                required={question.isRequired}
                disabled={hasResponded}
              />
              <span className="text-gray-700 text-base">{option}</span>
            </label>
          ))}
        </div>
      );
    case 'dropdown':
      return (
        <select
          className="w-full border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent text-gray-700 py-1"
          value={hasResponded ? previousResponses[question.id] || '' : responses[question.id] || ''}
          onChange={e => !hasResponded && handleResponseChange(question.id, e.target.value)}
          required={question.isRequired}
          disabled={hasResponded}
        >
          <option value="" disabled>Select an option</option>
          {question.options.map((option, optIndex) => (
            <option key={optIndex} value={option}>{option}</option>
          ))}
        </select>
      );
    case 'date':
      return (
        <input
          type="date"
          className="w-full border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent text-gray-700 placeholder-gray-400 py-1"
          value={hasResponded ? previousResponses[question.id] || '' : responses[question.id] || ''}
          onChange={e => !hasResponded && handleResponseChange(question.id, e.target.value)}
          required={question.isRequired}
          disabled={hasResponded}
        />
      );
    case 'time':
      return (
        <input
          type="time"
          className="w-full border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent text-gray-700 placeholder-gray-400 py-1"
          value={hasResponded ? previousResponses[question.id] || '' : responses[question.id] || ''}
          onChange={e => !hasResponded && handleResponseChange(question.id, e.target.value)}
          required={question.isRequired}
          disabled={hasResponded}
        />
      );
    case 'file':
      return (
        <div>
          <input
            type="file"
            className="w-full border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent text-gray-700 placeholder-gray-400 py-1"
            onChange={e => handleFileUpload(question.id, e.target.files[0])}
            disabled={hasResponded || uploadingFiles[question.id]}
            required={question.isRequired && !responses[question.id]}
          />
          {uploadingFiles[question.id] && (
            <div className="text-xs text-orange-600 mt-1">Uploading... {uploadProgress[question.id] || 0}%</div>
          )}
          {hasResponded && previousResponses[question.id] && (
            <div className="text-xs text-green-600 mt-1">
              File uploaded: <a href={previousResponses[question.id]} target="_blank" rel="noopener noreferrer" className="underline">View file</a>
            </div>
          )}
          {!hasResponded && responses[question.id] && (
            <div className="text-xs text-green-600 mt-1">
              File uploaded: <a href={responses[question.id]} target="_blank" rel="noopener noreferrer" className="underline">View file</a>
            </div>
          )}
        </div>
      );
    case 'email':
      return (
        <input
          type="email"
          className="w-full border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent text-gray-700 placeholder-gray-400 py-1"
          placeholder="Your email"
          value={hasResponded ? previousResponses[question.id] || '' : responses[question.id] || ''}
          onChange={e => !hasResponded && handleResponseChange(question.id, e.target.value)}
          required={question.isRequired}
          disabled={hasResponded}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          className="w-full border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent text-gray-700 placeholder-gray-400 py-1"
          placeholder="Your number"
          value={hasResponded ? previousResponses[question.id] || '' : responses[question.id] || ''}
          onChange={e => !hasResponded && handleResponseChange(question.id, e.target.value)}
          required={question.isRequired}
          disabled={hasResponded}
        />
      );
    case 'rating':
      return (
        <div className="flex gap-1">
          {[1,2,3,4,5].map(star => (
            <span
              key={star}
              className={`text-2xl cursor-pointer ${
                (hasResponded
                  ? previousResponses[question.id] >= star
                  : responses[question.id] >= star)
                  ? 'text-orange-500'
                  : 'text-gray-300'
              }`}
              onClick={() => !hasResponded && handleResponseChange(question.id, star)}
              style={{ pointerEvents: hasResponded ? 'none' : 'auto' }}
            >
              ★
            </span>
          ))}
        </div>
      );
    default:
      return null;
  }
})()}
                  {question.isRequired && (
                    <div className="mt-2 text-xs text-orange-600 font-semibold">* Required</div>
                  )}
                </div>
              );
            })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No questions found in this form.</p>
              <p className="text-sm text-gray-400 mt-2">Form data: {JSON.stringify(form, null, 2)}</p>
            </div>
          )}

          {!hasResponded ? (
            <button
              type="submit"
              className="w-full py-3 mt-4 bg-orange-600 text-white rounded-lg font-bold text-lg hover:bg-orange-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Submit Form
            </button>
          ) : (
            <div className="space-y-3 mt-4">
              <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg font-bold text-lg text-center">
                Form Already Submitted
              </div>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Back to Previous Page
              </button>
            </div>
          )}
        </form>
      </div>
      <Footer/>
    </div>
  );
};

export default FormResponsePage;
