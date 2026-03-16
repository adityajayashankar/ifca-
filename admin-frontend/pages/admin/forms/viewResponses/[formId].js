import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import api from "@/utils/apiSetup";
import moment from "moment";
import { Box, Typography, Avatar, CircularProgress, IconButton, Menu, MenuItem } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { MdHome, MdChevronRight, MdDescription, MdMoreVert, MdChevronLeft, MdChevronRight as MdChevronRightIcon, MdPerson, MdCalendarToday } from "react-icons/md";
import { saveAs } from 'file-saver';
import Link from "next/link";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from "react-toastify";

const accentColor = "#f59e42"; // saffron
const accentGradient = "linear-gradient(90deg, #f59e42 0%, #fbbf24 100%)";
const pieColors = ["#f59e42", "#fbbf24", "#f87171", "#60a5fa", "#34d399", "#a78bfa", "#f472b6", "#38bdf8"]; // for pie chart slices

const ViewResponsesPage = () => {
  const router = useRouter();
  const { formId } = router.query;
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('summary');
  const [questionTabIndex, setQuestionTabIndex] = useState(0);
  const [individualTabIndex, setIndividualTabIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const menuOpen = Boolean(anchorEl);

  // Fetch form data and responses
  const fetchFormData = async (page = 1) => {
    if (!formId) return;
    
    try {
      setLoading(true);
      
      // Fetch form details
      const formResponse = await api.get(`/forms/${formId}`);
      const form = formResponse.data.form;
      
      // Fetch responses with pagination
      const responsesResponse = await api.get(`/forms/responseByFormId/${formId}?page=${page}&limit=${pagination.limit}`);
      const { data: responses, pagination: paginationData } = responsesResponse.data;
      
      setFormData({
        ...form,
        responses: responses || []
      });
      setPagination(paginationData);
    } catch (error) {
      console.error("Error fetching form responses:", error);
      toast.error('Failed to fetch form data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormData();
  }, [formId]);

  // Handle pagination for responses
  const handlePageChange = (newPage) => {
    fetchFormData(newPage);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!formData) {
    return (
      <Box textAlign="center" mt={5}>
        <Typography variant="h6" color="text.secondary">
          Form not found
        </Typography>
      </Box>
    );
  }

  if (formData?.responses?.length === 0) {
    return (
      <Box textAlign="center" mt={5}>
        <Typography variant="h6" color="text.secondary">
          No Responses yet!!
        </Typography>
      </Box>
    );
  }

  // Truncate form name for breadcrumbs if too long
  const formNameCrumb = formData?.formName?.length > 32
    ? formData.formName.slice(0, 32) + '...'
    : formData?.formName;

  const totalResponses = formData?.responses?.length || 0;

  // Get creator name from unifiedUser
  const getCreatorName = (form) => {
    if (!form.unifiedUser) return 'Unknown Creator';
    
    const { user, partner, admin, expert } = form.unifiedUser;
    return user?.name || partner?.name || admin?.name || expert?.name || 'Unknown Creator';
  };

  // Get creator type
  const getCreatorType = (form) => {
    if (!form.unifiedUser) return 'Unknown';
    
    const { user, partner, admin, expert } = form.unifiedUser;
    if (user) return 'User';
    if (partner) return 'Partner';
    if (admin) return 'Admin';
    if (expert) return 'Expert';
    return 'Unknown';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Menu handlers
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // CSV export handler
  const handleExportCSV = () => {
    if (!formData?.responses?.length) return;
    
    const questions = formData.Question || [];
    const csvRows = [
      ['Name', 'Creator Type', 'Submitted', ...questions.map(q => q.question)],
      ...formData.responses.map(r => {
        const userName = r.userName || 'Unknown User';
        const creatorType = r.userEmail ? 'User' : 'Unknown';
        
        return [
          userName,
          creatorType,
          moment(r.submittedAt).format('LLL'),
          ...questions.map(q => {
            const answer = r.answers?.find(a => a.questionId === q.id);
            return answer?.answer || '';
          })
        ];
      })
    ];
    
    const csvContent = csvRows.map(row => row.map(val => '"' + (val || '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${formNameCrumb || 'responses'}.csv`);
  };

  // View in Sheets handler (simulate by opening CSV in a new tab)
  const handleViewInSheets = () => {
    if (!formData?.responses?.length) return;
    
    const questions = formData.Question || [];
    const csvRows = [
      ['Name', 'Creator Type', 'Submitted', ...questions.map(q => q.question)],
      ...formData.responses.map(r => {
        const userName = r.userName || 'Unknown User';
        const creatorType = r.userEmail ? 'User' : 'Unknown';
        
        return [
          userName,
          creatorType,
          moment(r.submittedAt).format('LLL'),
          ...questions.map(q => {
            const answer = r.answers?.find(a => a.questionId === q.id);
            return answer?.answer || '';
          })
        ];
      })
    ];
    
    const csvContent = csvRows.map(row => row.map(val => '"' + (val || '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const csvDataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    window.open(csvDataUrl, '_blank');
  };

  // --- Helper for per-question and per-individual rendering ---
  const renderAnswerValue = (type, displayValue) => {
    if (type === 'file' && typeof displayValue === 'string' && displayValue.startsWith('http')) {
      const ext = displayValue.split('.').pop().toLowerCase();
      const isImage = /^(jpg|jpeg|png|gif|webp|avif)$/i.test(ext);
      const isVideo = /^(mp4|webm|mov|ogg)$/i.test(ext);
      const isPdf = ext === 'pdf';
      if (isImage) {
        return (
          <span>
            <img src={displayValue} alt="file" style={{ maxWidth: 120, marginTop: 8, borderRadius: 8 }} />
            <a href={displayValue} target="_blank" rel="noopener noreferrer" className="block underline text-blue-600 mt-1">View image</a>
          </span>
        );
      }
      if (isVideo) {
        return (
          <span>
            <video src={displayValue} controls style={{ maxWidth: 180, marginTop: 8, borderRadius: 8 }} />
            <a href={displayValue} target="_blank" rel="noopener noreferrer" className="block underline text-blue-600 mt-1">View video</a>
          </span>
        );
      }
      if (isPdf) {
        return (
          <span>
            <PictureAsPdfIcon fontSize="large" />
            <a href={displayValue} target="_blank" rel="noopener noreferrer" className="block underline text-blue-600 mt-1">View PDF</a>
          </span>
        );
      }
      // Other file
      return (
        <span>
          <InsertDriveFileIcon fontSize="large" />
          <a href={displayValue} target="_blank" rel="noopener noreferrer" className="block underline text-blue-600 mt-1">Download file</a>
        </span>
      );
    }
    if (type === 'rating') {
      const rating = typeof displayValue === 'number' ? displayValue : Number(displayValue);
      return (
        <span className="text-orange-500 text-xl">
          {[1,2,3,4,5].map(star => (
            <span key={star}>{rating >= star ? '★' : '☆'}</span>
          ))}
        </span>
      );
    }
    if (type === 'selectMulti' || type === 'multiSelect') {
      if (Array.isArray(displayValue)) {
        return displayValue.join(', ');
      }
      return displayValue;
    }
    if (type === 'number') {
      return <span>{displayValue}</span>;
    }
    return <span>{displayValue}</span>;
  };

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-2 mb-6 max-w-[90%] mx-auto">
        <div className="mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <Link href="/admin">
            <span className="flex items-center text-orange-500 hover:underline">
              <MdHome className="mr-1 text-lg" /> Home
            </span>
          </Link>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <Link href="/admin/forms">
            <span className="hover:underline text-orange-500">Forms</span>
          </Link>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]" title={formData?.formName}>{formNameCrumb}</span>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">Responses</span>
        </div>
      </div>

      {/* Header with response count and actions */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold">{totalResponses} response{totalResponses !== 1 ? 's' : ''}</span>
            {/* Creator info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MdPerson className="text-gray-400" />
              <span>{getCreatorName(formData)}</span>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {getCreatorType(formData)}
              </span>
            </div>
            {/* Date info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MdCalendarToday className="text-gray-400" />
              <span>Created {formatDate(formData.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-green-600 hover:underline" onClick={handleViewInSheets}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M8 6v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/></svg>
              View in Sheets
            </button>
            <IconButton onClick={handleMenuOpen}>
              <MdMoreVert className="text-xl" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
              <MenuItem onClick={() => { handleExportCSV(); handleMenuClose(); }}>Export CSV</MenuItem>
              <MenuItem onClick={handleMenuClose}>Delete All Responses</MenuItem>
            </Menu>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex justify-center items-center gap-2 mt-6 mb-8 max-w-6xl mx-auto">
          <button
            className={`flex-1 py-2 font-medium border-b-2 transition-colors duration-150 ${selectedTab === 'summary' ? 'text-orange-700 border-orange-700 bg-orange-50' : 'text-gray-500 border-transparent bg-white'}`}
            onClick={() => setSelectedTab('summary')}
          >
            Summary
          </button>
          <button
            className={`flex-1 py-2 font-medium border-b-2 transition-colors duration-150 ${selectedTab === 'question' ? 'text-orange-700 border-orange-700 bg-orange-50' : 'text-gray-500 border-transparent bg-white'}`}
            onClick={() => setSelectedTab('question')}
          >
            Questions
          </button>
          <button
            className={`flex-1 py-2 font-medium border-b-2 transition-colors duration-150 ${selectedTab === 'individual' ? 'text-orange-700 border-orange-700 bg-orange-50' : 'text-gray-500 border-transparent bg-white'}`}
            onClick={() => setSelectedTab('individual')}
          >
            Individual
          </button>
        </div>
      </div>

      {/* --- Summary Tab --- */}
      {selectedTab === 'summary' && (
        <div className="bg-white rounded-xl shadow p-8 mb-6 max-w-6xl mx-auto">
          {/* Total responses */}
          <div className="mb-6 flex items-center gap-6">
            <div className="text-3xl font-bold text-orange-600">{totalResponses}</div>
            <div className="text-lg text-gray-700">Total Responses</div>
          </div>
          {/* Response trend (simple bar chart) */}
          <div className="mb-8">
            <div className="font-semibold mb-2 text-gray-800">Responses Over Time</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={(() => {
                // Group responses by date (day)
                const dateCounts = {};
                (formData?.responses || []).forEach(r => {
                  const day = moment(r.submittedAt).format("YYYY-MM-DD");
                  dateCounts[day] = (dateCounts[day] || 0) + 1;
                });
                const days = Object.keys(dateCounts).sort();
                return days.map(day => ({
                  name: moment(day).format("MMM D"),
                  count: dateCounts[day]
                }));
              })()}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={accentColor} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Per-question summary */}
          <div>
            <div className="font-semibold mb-4 text-gray-800">Question Summaries</div>
            {formData?.Question?.map((question, qIdx) => {
              // Gather all answers for this question by questionId
              const allAnswers = (formData?.responses || []).map(r => {
                const ansObj = r.answers?.find(a => a.questionId === question.id);
                return ansObj ? ansObj.answer : null;
              }).filter(a => a !== null && a !== undefined);

              // For options, count occurrences
              let optionCounts = {};
              if (["selectSingle","dropdown","selectMulti","multiSelect"].includes(question.answerType)) {
                (question.options || []).forEach(opt => { optionCounts[opt] = 0; });
                allAnswers.forEach(ans => {
                  if (question.answerType === "selectMulti" || question.answerType === "multiSelect") {
                    try {
                      const arr = JSON.parse(ans);
                      if (Array.isArray(arr)) arr.forEach(a => { if (optionCounts[a] !== undefined) optionCounts[a]++; });
                      else if (optionCounts[ans] !== undefined) optionCounts[ans]++;
                    } catch { if (optionCounts[ans] !== undefined) optionCounts[ans]++; }
                  } else {
                    if (optionCounts[ans] !== undefined) optionCounts[ans]++;
                  }
                });
              }

              // For rating, calculate average and counts
              let avgRating = null;
              let ratingCounts = {};
              if (question.answerType === 'rating' && allAnswers.length > 0) {
                const nums = allAnswers.map(a => Number(a)).filter(n => !isNaN(n));
                avgRating = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null;
                nums.forEach(n => { ratingCounts[n] = (ratingCounts[n] || 0) + 1; });
              }

              return (
                <div key={question.id} className="mb-8 p-6 rounded-xl shadow border border-orange-100 bg-orange-50">
                  <div className="font-bold text-lg text-gray-900 mb-2">{qIdx + 1}. {question.question}</div>
                  <div className="text-xs text-orange-700 mb-2">Type: {question.answerType}</div>
                  {/* --- Bar chart for single-select/dropdown --- */}
                  {["selectSingle","dropdown"].includes(question.answerType) && (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={question.options.map(opt => ({ name: opt, count: optionCounts[opt] || 0 }))}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill={accentColor} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {/* --- Pie chart for multi-select --- */}
                  {["selectMulti","multiSelect"].includes(question.answerType) && (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={question.options.map(opt => ({ name: opt, value: optionCounts[opt] || 0 }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill={accentColor}
                          label
                        >
                          {question.options.map((opt, idx) => (
                            <Cell key={opt} fill={pieColors[idx % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {/* --- Bar chart for ratings --- */}
                  {question.answerType === 'rating' && (
                    <>
                      <div className="mb-1 text-sm text-orange-600">Average rating: <span className="font-bold">{avgRating}</span> <span className="text-orange-500 text-lg">★</span></div>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={Object.keys(ratingCounts).map(rating => ({ name: `${rating}★`, count: ratingCounts[rating] }))}>
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill={accentColor} />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                  {/* Text/number/email/date/time answers */}
                  {["shortText","longText","number","email","date","time"].includes(question.answerType) && (
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto mt-2">
                      {allAnswers.length === 0 && <span className="text-gray-400 italic">No responses yet.</span>}
                      {allAnswers.slice(-5).map((ans, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white border border-orange-200 rounded text-sm text-gray-700">{ans}</span>
                      ))}
                      {allAnswers.length > 5 && <span className="text-xs text-gray-500">+{allAnswers.length - 5} more</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Question Tab --- */}
      {selectedTab === 'question' && (
        <div className="bg-white rounded-xl shadow p-8 mb-6 max-w-6xl mx-auto">
          {/* Dropdown for question selection */}
          <div className="flex items-center mb-6">
            <button
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              disabled={questionTabIndex === 0}
              onClick={() => setQuestionTabIndex(i => Math.max(i - 1, 0))}
            >&#8592;</button>
            <select
              value={questionTabIndex}
              onChange={e => setQuestionTabIndex(Number(e.target.value))}
              className="border rounded px-3 py-2 mx-4"
            >
              {formData?.Question?.map((q, idx) => (
                <option key={q.id} value={idx}>{q.question}</option>
              ))}
            </select>
            <button
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              disabled={questionTabIndex === (formData?.Question?.length || 1) - 1}
              onClick={() => setQuestionTabIndex(i => Math.min(i + 1, (formData?.Question?.length || 1) - 1))}
            >&#8594;</button>
          </div>
          {/* Show only the selected question */}
          {formData?.Question?.slice(questionTabIndex, questionTabIndex + 1).map((question, qIdx) => {
            // Gather all answers for this question by questionId
            const allAnswers = (formData?.responses || []).map(r => {
              const ansObj = r.answers?.find(a => a.questionId === question.id);
              return ansObj ? ansObj.answer : null;
            }).filter(a => a !== null && a !== undefined);
            // For multi-select, flatten arrays
            let flatAnswers = allAnswers;
            if (question.answerType === 'selectMulti' || question.answerType === 'multiSelect') {
              flatAnswers = [];
              allAnswers.forEach(ans => {
                try {
                  const arr = JSON.parse(ans);
                  if (Array.isArray(arr)) flatAnswers.push(...arr);
                  else flatAnswers.push(ans);
                } catch { flatAnswers.push(ans); }
              });
            }
            // For rating, calculate average and counts
            let avgRating = null;
            let ratingCounts = {};
            if (question.answerType === 'rating' && allAnswers.length > 0) {
              const nums = allAnswers.map(a => Number(a)).filter(n => !isNaN(n));
              avgRating = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null;
              nums.forEach(n => { ratingCounts[n] = (ratingCounts[n] || 0) + 1; });
            }
            // For options, count occurrences
            let optionCounts = {};
            if (["selectSingle","dropdown","selectMulti","multiSelect"].includes(question.answerType)) {
              (question.options || []).forEach(opt => { optionCounts[opt] = 0; });
              flatAnswers.forEach(ans => { if (optionCounts[ans] !== undefined) optionCounts[ans]++; });
            }
            // For file/image/video, collect previews
            let filePreviews = [];
            if (question.answerType === 'file') {
              filePreviews = allAnswers.filter(a => typeof a === 'string' && a.startsWith('http'));
            }
            return (
              <div key={question.id} className="mb-8 p-6 rounded-xl shadow border border-orange-100 bg-orange-50">
                <div className="font-bold text-lg text-gray-900 mb-2">{qIdx + 1}. {question.question}</div>
                <div className="text-xs text-orange-700 mb-2">Type: {question.answerType}</div>
                {/* Option/Rating summary */}
                {(["selectSingle","dropdown"].includes(question.answerType)) && (
                  <div className="flex flex-col gap-2 mb-2">
                    {(question.options || []).map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-white border border-orange-200 rounded text-sm font-medium text-orange-700">{opt}</span>
                        <div className="flex-1 bg-orange-100 rounded h-3 mx-2" style={{ minWidth: 40 }}>
                          <div className="bg-orange-500 h-3 rounded" style={{ width: `${(optionCounts[opt] / (flatAnswers.length || 1)) * 100}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-700">{optionCounts[opt] || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(["selectMulti","multiSelect"].includes(question.answerType)) && (
                  <div className="flex flex-col gap-2 mb-2">
                    {(question.options || []).map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-white border border-orange-200 rounded text-sm font-medium text-orange-700">{opt}</span>
                        <div className="flex-1 bg-orange-100 rounded h-3 mx-2" style={{ minWidth: 40 }}>
                          <div className="bg-orange-500 h-3 rounded" style={{ width: `${(optionCounts[opt] / (flatAnswers.length || 1)) * 100}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-700">{optionCounts[opt] || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
                {question.answerType === 'rating' && (
                  <div className="mb-2">
                    <div className="mb-1 text-sm text-orange-600">Average rating: <span className="font-bold">{avgRating}</span> <span className="text-orange-500 text-lg">★</span></div>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(star => (
                        <div key={star} className="flex flex-col items-center">
                          <span className="text-orange-500 text-xl">{star}★</span>
                          <div className="w-8 h-2 bg-orange-100 rounded mt-1 mb-1">
                            <div className="bg-orange-500 h-2 rounded" style={{ width: `${((ratingCounts[star] || 0) / (allAnswers.length || 1)) * 100}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-700">{ratingCounts[star] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* File/image/video gallery */}
                {question.answerType === 'file' && filePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-4 mb-2">
                    {filePreviews.map((url, idx) => {
                      const ext = url.split('.').pop().toLowerCase();
                      const isImage = /^(jpg|jpeg|png|gif|webp|avif)$/i.test(ext);
                      const isVideo = /^(mp4|webm|mov|ogg)$/i.test(ext);
                      const isPdf = ext === 'pdf';
                      if (isImage) return <div key={idx}><img src={url} alt="file" style={{ maxWidth: 100, borderRadius: 8 }} /><a href={url} target="_blank" rel="noopener noreferrer" className="block underline text-blue-600 mt-1">View image</a></div>;
                      if (isVideo) return <div key={idx}><video src={url} controls style={{ maxWidth: 120, borderRadius: 8 }} /><a href={url} target="_blank" rel="noopener noreferrer" className="block underline text-blue-600 mt-1">View video</a></div>;
                      if (isPdf) return <div key={idx}><PictureAsPdfIcon fontSize="large" /><a href={url} target="_blank" rel="noopener noreferrer" className="block underline text-blue-600 mt-1">View PDF</a></div>;
                      return <div key={idx}><InsertDriveFileIcon fontSize="large" /><a href={url} target="_blank" rel="noopener noreferrer" className="block underline text-blue-600 mt-1">Download file</a></div>;
                    })}
                  </div>
                )}
                {/* Text/number/email/date/time answers */}
                {["shortText","longText","number","email","date","time"].includes(question.answerType) && (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {allAnswers.length === 0 && <span className="text-gray-400 italic">No responses yet.</span>}
                    {allAnswers.map((ans, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white border border-orange-200 rounded text-sm text-gray-700">{ans}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- Individual Tab --- */}
      {selectedTab === 'individual' && (
        <>
          {/* Navigation for individual responses */}
          <div className="flex items-center gap-2 bg-white rounded-xl shadow px-4 py-2 mb-4 max-w-6xl mx-auto">
            <button
              disabled={individualTabIndex === 0}
              onClick={() => setIndividualTabIndex(i => Math.max(i - 1, 0))}
              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              <MdChevronLeft className="w-5 h-5" />
            </button>
            <select
              value={individualTabIndex}
              onChange={e => setIndividualTabIndex(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {formData?.responses?.map((r, idx) => (
                <option key={idx} value={idx}>
                  {r.userName || `Response ${idx + 1}`}
                </option>
              ))}
            </select>
            <span className="text-sm">{individualTabIndex + 1} of {totalResponses}</span>
            <button
              disabled={individualTabIndex === totalResponses - 1}
              onClick={() => setIndividualTabIndex(i => Math.min(i + 1, totalResponses - 1))}
              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              <MdChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
          {/* Individual Response Card */}
          {formData?.responses?.[individualTabIndex] && (
            <Box
              sx={{
                borderRadius: 3,
                background: "#fff",
                mb: 4,
                borderTop: `4px solid ${accentColor}`,
                boxShadow: '0 1px 4px 0 rgba(31,38,135,0.04)',
                overflow: 'hidden',
                position: 'relative',
              }}
              className="max-w-6xl mx-auto"
            >
              <Box display="flex" alignItems="center" px={2} pt={2} pb={1}>
                <Avatar sx={{ bgcolor: accentColor, mr: 2, width: 36, height: 36, fontWeight: 700, fontSize: 18 }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1e293b', fontSize: '1rem', mb: 0 }}>
                    {formData.responses[individualTabIndex].userName || 'Unknown User'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a0aec0', fontSize: '0.89rem' }}>
                    {moment(formData.responses[individualTabIndex].submittedAt).fromNow()}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ px: 3, pb: 2, pt: 0.5 }}>
                {formData.responses[individualTabIndex].answers?.map((answer, answerIndex) => {
                  // Find the question type
                  const questionObj = formData?.Question?.find(q => q.id === answer.questionId);
                  const type = questionObj?.answerType;
                  let displayValue = answer.answer;
                  // Parse value if needed
                  if (type === 'selectMulti' || type === 'multiSelect') {
                    try { displayValue = JSON.parse(answer.answer); } catch { displayValue = answer.answer; }
                  }
                  return (
                    <React.Fragment key={answerIndex}>
                      <Box
                        sx={{
                          background: '#f7fafc',
                          borderRadius: 2,
                          p: 1.5,
                          mb: 0,
                          borderLeft: `3px solid ${accentColor}`,
                          fontSize: '0.98rem',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{ fontWeight: 700, fontSize: '0.98rem', mb: 0.5 }}
                        >
                          {questionObj?.question || 'Unknown Question'}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 400, color: '#374151', pl: 0.5, pt: 0.5, fontSize: '0.97rem' }}>
                          {renderAnswerValue(type, displayValue)}
                        </Typography>
                      </Box>
                      {answerIndex < formData.responses[individualTabIndex].answers.length - 1 && (
                        <Box sx={{ height: 1, background: '#f3f4f6', my: 1.5, borderRadius: 1 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 mb-6">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-3 py-2 text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default ViewResponsesPage;
