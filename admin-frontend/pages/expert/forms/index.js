import React, { useState, useEffect, useRef } from "react";
import { CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { MdChevronRight, MdHome, MdAdd, MdDelete, MdEdit, MdVisibility, MdSearch, MdMoreVert, MdShare, MdContentCopy, MdDescription, MdShortText, MdRadioButtonChecked, MdCheckBox, MdArrowDropDownCircle } from "react-icons/md";
import Head from "next/head";
import ShareModal from "@/components/common/ShareModal";

const AdminFormResponses = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const user = useSelector(selectUser);
  const creatorId = user?.unifiedUser?.id;
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFormId, setDeleteFormId] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [sortOption, setSortOption] = useState('az');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);
  const [shareModalData, setShareModalData] = useState({});

  const router = useRouter();

  useEffect(() => {
  if (data) {
    let filtered = data.filter(form => 
      form.formName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
   
    filtered = filtered.sort((a, b) => {
      switch (sortOption) {
        case 'az':
          return a.formName.toLowerCase().localeCompare(b.formName.toLowerCase());
        case 'za':
          return b.formName.toLowerCase().localeCompare(a.formName.toLowerCase());
        case 'recent':
         
          return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
        default:
          return 0;
      }
    });
  
    setFilteredData(filtered);
  }
}, [searchQuery, data, sortOption]);

  const formDeleteHandler = async (formId) => {
    setDeleteFormId(formId);
    setShowDeleteModal(true);
  };

  const confirmDeleteForm = async () => {
    const formToDelete = data.find(form => form.formId === deleteFormId);
    if (!formToDelete || deleteInput !== formToDelete.formName) {
      toast.error('Please type the form name correctly to confirm deletion');
      return;
    }

    try {
      await api.delete(`/forms/${deleteFormId}`);
      toast.success('Form Deleted Successfully');
      setData((prevData) => prevData.filter((form) => form.formId !== deleteFormId));
      setShowDeleteModal(false);
      setDeleteInput("");
      setDeleteFormId(null);
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error('Failed to delete form');
    }
  };

  const handleShareForm = (form) => {
    setSelectedForm(form);
    setShareModalData({
      title: `Form: ${form.formName}`,
      text: `Please fill out this form: ${form.formName}`,
      url: `${window.location.origin}/forms/${form.id}`,
      hashtags: "#IFCA #Form"
    });
    setShowShareModal(true);
  };



  useEffect(() => {
    const fetchFormResponses = async () => {
      if (!creatorId) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/forms/responses/${creatorId}`);
        const forms = response?.data?.forms || [];
        setData(forms);
        setFilteredData(forms);
      } catch (error) {
        console.error('Error fetching responses:', error);
        toast.error('Failed to fetch forms');
      } finally {
        setLoading(false);
      }
    };

    fetchFormResponses();
  }, [creatorId]);

  const handleCreateForm = async () => {
    // Create 3 example forms
    const exampleForms = [
      {
        formName: 'Customer Feedback',
        formDesc: 'Collect feedback from your customers.',
        questions: [
          { question: 'How satisfied are you?', answerType: { type: 'selectSingle', options: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'] }, isRequired: true },
          { question: 'What can we improve?', answerType: { type: 'longText' }, isRequired: false },
        ],
      },
      {
        formName: 'Event Registration',
        formDesc: 'Register participants for your event.',
        questions: [
          { question: 'Full Name', answerType: { type: 'shortText' }, isRequired: true },
          { question: 'Email Address', answerType: { type: 'shortText' }, isRequired: true },
          { question: 'Will you attend?', answerType: { type: 'selectSingle', options: ['Yes', 'No', 'Maybe'] }, isRequired: true },
        ],
      },
      {
        formName: 'Employee Survey',
        formDesc: 'Gather feedback from employees.',
        questions: [
          { question: 'Department', answerType: { type: 'shortText' }, isRequired: true },
          { question: 'How do you rate your work environment?', answerType: { type: 'selectSingle', options: ['Excellent', 'Good', 'Average', 'Poor'] }, isRequired: true },
        ],
      },
    ];
    try {
      for (const form of exampleForms) {
        await api.post('/forms', {
          formName: form.formName,
          formDescription: form.formDesc,
          questions: form.questions,
          creatorId: user?.unifiedUser?.id,
          isGlobal: true,
        });
      }
      toast.success('3 example forms created!');
      // Refresh forms list
      const response = await api.get(`/forms/responses/${user?.unifiedUser?.id}`);
      const forms = response?.data?.forms || [];
      setData(forms);
      setFilteredData(forms);
    } catch (err) {
      toast.error('Failed to create example forms');
    }
  };

  const handleViewResponses = (formId) => {
    router.push(`/expert/forms/viewResponses/${formId}`);
  };

  const handleFormView = (formId) => {
    router.push(`/expert/forms/create/${formId}`);
  };

  const getCount = (val) => {
    if (typeof val === 'number') return val;
    if (Array.isArray(val)) return val.length;
    if (val && typeof val === 'object' && 'length' in val) return val.length;
    return 0;
  };

  // Click-away handler for menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    }
    if (menuOpenId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpenId]);

  // Example forms for default cards
  const exampleForms = [
    {
      formName: 'Customer Feedback',
      formDesc: 'Collect feedback from your customers.',
      questions: [
        { question: 'How satisfied are you?', answerType: { type: 'selectSingle', options: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'] }, isRequired: true },
        { question: 'What can we improve?', answerType: { type: 'longText' }, isRequired: false },
      ],
    },
    {
      formName: 'Event Registration',
      formDesc: 'Register participants for your event.',
      questions: [
        { question: 'Full Name', answerType: { type: 'shortText' }, isRequired: true },
        { question: 'Email Address', answerType: { type: 'shortText' }, isRequired: true },
        { question: 'Will you attend?', answerType: { type: 'selectSingle', options: ['Yes', 'No', 'Maybe'] }, isRequired: true },
      ],
    },
    {
      formName: 'Employee Survey',
      formDesc: 'Gather feedback from employees.',
      questions: [
        { question: 'Department', answerType: { type: 'shortText' }, isRequired: true },
        { question: 'How do you rate your work environment?', answerType: { type: 'selectSingle', options: ['Excellent', 'Good', 'Average', 'Poor'] }, isRequired: true },
      ],
    },
  ];

  // Handler for clicking a default card
  const handleDefaultCardClick = (form) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('exampleFormDraft', JSON.stringify(form));
      router.push('/expert/forms/create');
    }
  };

  // Helper for type icon and label (string type)
  const typeIconAndLabel = (type) => {
    switch(type) {
      case 'shortText': return { icon: <MdShortText className="text-orange-400" />, label: 'Short answer' };
      case 'longText': return { icon: <MdShortText className="text-orange-400" />, label: 'Paragraph' };
      case 'selectSingle': return { icon: <MdRadioButtonChecked className="text-orange-400" />, label: 'Multiple choice' };
      case 'selectMulti': return { icon: <MdCheckBox className="text-orange-400" />, label: 'Checkboxes' };
      case 'dropdown': return { icon: <MdArrowDropDownCircle className="text-orange-400" />, label: 'Dropdown' };
      case 'date': return { icon: <span role="img" aria-label="date" className="text-orange-400">📅</span>, label: 'Date' };
      case 'time': return { icon: <span role="img" aria-label="time" className="text-orange-400">⏰</span>, label: 'Time' };
      case 'file': return { icon: <MdDescription className="text-orange-400" />, label: 'File upload' };
      case 'email': return { icon: <span role="img" aria-label="email" className="text-orange-400">✉️</span>, label: 'Email' };
      case 'number': return { icon: <span role="img" aria-label="number" className="text-orange-400">#</span>, label: 'Number' };
      case 'rating': return { icon: <span role="img" aria-label="star" className="text-orange-400">⭐</span>, label: 'Rating' };
      default: return { icon: <MdShortText className="text-orange-400" />, label: type };
    }
  };

  return (
    <>
      <Head>
        <title>Forms Management</title>
      </Head>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/expert')}
            className="flex items-center hover:text-orange-700"
          >
            <MdHome className="w-4 h-4" />
          </button>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">Forms</span>
        </div>
      </div>

      <div className="min-h-[calc(100vh-138px)] bg-gray-50 mx-auto px-2 md:px-4 lg:px-0 max-w-[1920px]">
        <div className="max-w-[1920px] mx-auto py-6">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
              {/* Left: Icon and Title */}
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 rounded-full p-2">
                  <MdDescription className="text-2xl text-orange-500" />
                </div>
                <span className="text-2xl font-bold text-gray-900">Forms</span>
              </div>
              {/* Center: Search and Sort */}
              <div className="flex flex-1 items-center gap-3 w-full md:w-auto max-w-xl">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by form title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                  />
                  <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                {/* Sort Dropdown */}
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={sortOption || 'az'}
                  onChange={e => setSortOption(e.target.value)}
                  style={{ minWidth: 90 }}
                >
                  <option value="az">A-Z</option>
                  <option value="za">Z-A</option>
                  <option value="recent">Recent</option>
                </select>
              </div>
              {/* Right: Create Form Button */}
              <button
                onClick={() => router.push('/expert/forms/create')}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300 whitespace-nowrap"
                style={{ minWidth: 180 }}
              >
                + Create Form
              </button>
            </div>
          </div>

          {/* Forms List */}
          <div className="bg-white rounded-2xl shadow p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <CircularProgress className="text-orange-500" />
              </div>
            ) : (
              <>
                {/* Default/example cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {exampleForms.map((item, idx) => (
                    <div
                      key={item.formName}
                      className="relative flex flex-col bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl shadow group transition-all duration-200 hover:shadow-2xl hover:border-orange-500 cursor-pointer min-h-[160px]"
                      style={{ minHeight: 160 }}
                      onClick={() => handleDefaultCardClick(item)}
                      title={`Start with the ${item.formName} template`}
                    >
                      <div className="flex-1 flex flex-col pl-5 pr-3 pt-4 pb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MdAdd className="text-orange-500 text-xl" />
                          <h3 className="text-lg font-bold text-orange-700 truncate">
                            {item.formName}
                          </h3>
                        </div>
                        <p className="text-xs text-orange-700 mb-2">{item.formDesc}</p>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold w-fit">
                          {item.questions.length} Questions
                        </span>
                        <span className="mt-auto text-xs text-orange-400">Template</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* User's forms */}
                {filteredData && filteredData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredData.map((item) => {
                  // Use new API structure
                  const questions = item.Question || [];
                  const uniqueTypes = Array.from(new Set(questions.map(q => q.answerType)));
                  const communities = (item.FormCommunity || []).map(fc => fc.Community?.title).filter(Boolean);
                  return (
                    <div
                      key={item.formId || item.id}
                      className="relative flex flex-col bg-white rounded-2xl shadow group transition-all duration-200 border border-gray-100 hover:shadow-2xl hover:border-orange-400 min-h-[160px] overflow-visible"
                      style={{ minHeight: 160 }}
                    >
                      {/* Orange accent bar */}
                      <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-orange-500 to-orange-400" />
                      {/* Card content */}
                      <div className="flex-1 flex flex-col pl-5 pr-3 pt-4 pb-3">
                        {/* Top: Title and More menu */}
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                              {item.formName}
                            </h3>
                            {item.formDesc && (
                              <p className="text-xs text-gray-500 truncate">{item.formDesc}</p>
                            )}
                            {/* Question types summary row */}
                            <div className="flex flex-wrap gap-2 mt-2 mb-1">
                              {uniqueTypes.map(type => {
                                const { icon, label } = typeIconAndLabel(type);
                                return (
                                  <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold border border-orange-100">
                                    {icon}
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                            {/* Community badges row */}
                            {communities.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-1">
                                {communities.map((title, idx) => (
                                  <span key={title + idx} className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                                    {title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Three-dot menu, only visible on card hover */}
                          <div className="relative ml-2">
                            <button
                              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none transition-opacity"
                              onClick={() => setMenuOpenId(menuOpenId === item.formId ? null : item.formId)}
                              title="More actions"
                              tabIndex={0}
                            >
                              <MdMoreVert className="text-xl" />
                            </button>
                            {menuOpenId === item.formId && (
                              <div ref={menuRef} className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-[100]">
                                <button
                                  onClick={() => { handleShareForm(item); setMenuOpenId(null); }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50"
                                >
                                  <MdShare className="text-lg text-orange-500" /> Share
                                </button>
                                {/* <button
                                  onClick={() => { handleFormView(item.formId); setMenuOpenId(null); }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50"
                                >
                                  <MdEdit className="text-lg" /> Edit
                                </button> */}
                                <button
                                  onClick={() => { formDeleteHandler(item.formId); setMenuOpenId(null); }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-xl"
                                >
                                  <MdDelete className="text-lg" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Stats badges */}
                        <div className="flex gap-2 mt-1 mb-2">
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold">
                            {getCount(item.responses)} Responses
                          </span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold">
                            {getCount(item.questions)} Questions
                          </span>
                        </div>
                        {/* Actions row (no Edit button here) */}
                        <div className="flex justify-end items-center gap-2 mt-auto">
                          <button
                            onClick={() => handleViewResponses(item.formId)}
                            className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
                            title="View Responses"
                          >
                            <MdVisibility className="text-base" />
                            <span className="hidden sm:inline">Responses</span>
                          </button>
                          <button
                            onClick={() => handleFormView(item.formId)}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold py-1.5 px-5 rounded-xl shadow transition-all duration-200 focus:ring-2 focus:ring-orange-300 text-sm"
                            title="Open Form"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No forms available</p>
                <button
                  onClick={handleCreateForm}
                  className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
                >
                  Create your first form
                </button>
              </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto flex flex-col gap-6 relative">
            <button 
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteInput("");
                setDeleteFormId(null);
              }} 
              className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-2xl font-bold"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-orange-700">Delete Form</h2>
            <p className="text-gray-700">To confirm deletion, please type the form name below:</p>
            <div 
              className="bg-orange-50 text-orange-700 px-3 py-2 rounded font-semibold text-center select-all cursor-pointer" 
              onClick={() => {
                const formName = data.find(form => form.formId === deleteFormId)?.formName;
                if (formName) {
                  navigator.clipboard.writeText(formName);
                }
              }}
            >
              {data.find(form => form.formId === deleteFormId)?.formName || ''}
            </div>
            <input
              type="text"
              className="border border-orange-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
              placeholder="Type form name to confirm..."
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInput("");
                  setDeleteFormId(null);
                }}
              >
                Cancel
              </button>
              <button
                className={`relative overflow-hidden group bg-gradient-to-r from-pink-500 to-orange-500 hover:from-orange-600 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow focus:ring-2 focus:ring-pink-300 ${deleteInput !== data.find(form => form.formId === deleteFormId)?.formName ? 'cursor-not-allowed opacity-60' : ''}`}
                onClick={confirmDeleteForm}
                disabled={deleteInput !== data.find(form => form.formId === deleteFormId)?.formName}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center z-10">Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSelectedForm(null);
        }}
        shareData={shareModalData}
      />
    </>
  );
};

export default AdminFormResponses;