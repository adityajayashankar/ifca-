import { selectAllCommunities } from "@/store/features/communitySlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, TextField } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { MdRadioButtonChecked, MdCheckBox, MdShare, MdVisibility, MdChevronRight, MdHome } from "react-icons/md";
import Link from "next/link";
import ShareModal from "@/components/common/ShareModal";

const accentColor = "#f59e42"; // saffron

const FormView = () => {
  const [formData, setFormData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalData, setShareModalData] = useState({});

  const [errorState, seterrorState] = useState({
    question_id: null,
    message: "",
  });
  
  const communities = useSelector(selectAllCommunities);
  const user = useSelector(selectUser);
  const [selectedCommunityIds, setSelectedCommunityIds] = useState([])
  const router = useRouter();
  const [questions, setQuestions] = useState([])
  const { formId } = router.query;
  const [isCommunitySpecific, setIsCommunitySpecific] = useState(false);
  const [selectedCommunities, setSelectedCommunities] = useState([])

  console.log('formid here+++---', formId)
  console.log('formdata+++---', formData)

  const labelClass = "font-semibold";
  const inputClass = "border rounded p-1 px-2 w-full focus:outline-actionbtnBlue";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      isCommunitySpecific: checked,
    }));
  };

  const handleCommunityChange = (event) => {
    const { value } = event.target;
    setSelectedCommunityIds(
      typeof value === "string" ? value.split(",") : value
    );
  };

  const handleQuestionChange = (e, index) => {
    const { name, value } = e.target;
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [name]: value };
    setFormData((prevState) => ({
      ...prevState,
      questions: updatedQuestions,
    }));
  };
  

  const handleAnswerTypeChange = (e, index) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      answerType: { type: e.target.value },
    };
    setFormData((prevState) => ({
      ...prevState,
      questions: updatedQuestions,
    }));
  };
  

  const addQuestion = () => {
    setFormData((prevState) => ({
      ...prevState,
      questions: [...prevState.questions, { answerType: {} }],
    }));
  };

  const deleteQuestionHandler = (index) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions.splice(index, 1);
    setFormData((prevState) => ({
      ...prevState,
      questions: updatedQuestions,
    }));
  };

  const addOptionHandler = (e, index) => {
    const newOption = prompt("Please Enter the value.");
    if (newOption !== null) {
      const updatedQuestions = [...formData.questions];
      updatedQuestions[index].answerType.options = [
        ...updatedQuestions[index].answerType.options,
        newOption,
      ];
      setFormData((prevState) => ({
        ...prevState,
        questions: updatedQuestions,
      }));
    }
  };
  
  const deleteOptionHandler = (option, index) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index].answerType.options = updatedQuestions[index].answerType.options.filter(
      (item) => item !== option
    );
    setFormData((prevState) => ({
      ...prevState,
      questions: updatedQuestions,
    }));
  };
  

  const addQuestionHandler = () => {
    setQuestions((q) => [...q, { answerType: {} }]);
  };

  const getFormData = async () => {
    if (formId) {
      try {
        const response = await api.get(`/forms/${formId}`);
        console.log('response for edit__--', response.data.form.communityData);
        
        setFormData(response.data.form);
  
        setQuestions(response.data.form.Question);
  
        const initiallySelected = response.data.form.communityData.map((item) => item.communityId);
        setSelectedCommunityIds(initiallySelected); 
        setIsCommunitySpecific(response.data.form.communityData.length);
        setSelectedCommunities(response.data.form.communityData);
        
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast.error("Failed to load form data.", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    }
  };
  

  console.log('selectedCommunities', selectedCommunities)

  const updateFormData = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/forms/${formId}`, {
        ...formData,
        creatorId: user?.unifiedUser?.id,
        isGlobal: formData.selectedCommunityIds.length === 0,
      });
      toast.success("Form updated successfully!", {
        position: "top-right",
        autoClose: 5000,
      });
      router.push("/partner/forms");
    } catch (error) {
      console.error("Error updating form:", error);
      toast.error("Failed to update form. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  useEffect(() => {
    getFormData();
  }, [formId]);

  const handleDiscard = ()=>{
    router.push('/partner/forms')
  }

  console.log('questions', questions)

  if (!formData) return <div>Loading...</div>;

  // Share handler
  const handleShare = () => {
    setShareModalData({
      title: `Form: ${formData.formName}`,
      text: `Please fill out this form: ${formData.formName}`,
      url: window.location.href,
      hashtags: "#IFCA #Form"
    });
    setShowShareModal(true);
  };



  // User View handler
  const handleUserView = () => {
    if (formId) {
      window.open(`/forms/${formId}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full" style={{ fontFamily: 'Roboto, Helvetica Neue, Arial, sans-serif' }}>
      {/* Breadcrumb - full width */}
      <div className="w-full bg-white border-b border-gray-200 py-4 mb-4">
        <nav className="flex items-center text-sm text-gray-500 px-4 max-w-[1920px] mx-auto" aria-label="Breadcrumb">
          <Link href="/partner">
            <span className="flex items-center text-orange-700 hover:underline">
              <MdHome className="mr-1 text-lg" /> Home
            </span>
          </Link>
          <MdChevronRight className="w-4 h-4 text-orange-400" />
          <Link href="/partner/forms">
            <span className="hover:underline text-orange-700">Forms</span>
          </Link>
          <MdChevronRight className="mx-1 text-orange-400" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]" title={formData.formName}>{formData.formName || 'Form'}</span>
        </nav>
      </div>
      {/* Main content - max width */}
      <div className="w-full max-w-5xl mx-auto pt-8 pb-16 px-2 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden">
        {/* Action Bar */}
        <div className="flex justify-end items-center gap-3 mb-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium shadow-sm"
            title="Share form"
          >
            <MdShare className="text-lg" /> Share
          </button>

          <button
            onClick={handleUserView}
            className="flex items-center gap-1 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium shadow-sm"
            title="View as User"
          >
            <MdVisibility className="text-lg" /> User View
          </button>
        </div>
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-t-4 w-full max-w-5xl mx-auto" style={{ borderTopColor: accentColor }}>
          <div className="w-full text-3xl font-bold border-b border-gray-300 mb-2 text-gray-900" style={{ fontSize: '2rem' }}>
            {formData.formName || 'Untitled form'}
          </div>
          <div className="w-full text-sm text-gray-600 border-b border-gray-200 pb-2 mb-2">
            {formData.formDescription || ''}
          </div>
          {/* Community badges row */}
          {formData.FormCommunity && formData.FormCommunity.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.FormCommunity.map(fc => (
                <span key={fc.Community.id} className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                  {fc.Community.title}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Questions */}
        {formData.Question && formData.Question.length > 0 && (
          <div>
            {formData.Question.map((question, index) => (
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
                <div className="mb-2">
                  <span className="text-xs text-gray-500 mr-2">Type:</span>
                  <span className="text-xs text-orange-700 font-semibold">
                    {(() => {
                      switch (question.answerType) {
                        case 'shortText': return 'Short answer';
                        case 'longText': return 'Paragraph';
                        case 'selectSingle': return 'Multiple choice';
                        case 'selectMulti': return 'Checkboxes';
                        case 'dropdown': return 'Dropdown';
                        case 'date': return 'Date';
                        case 'time': return 'Time';
                        case 'file': return 'File upload';
                        case 'email': return 'Email';
                        case 'number': return 'Number';
                        case 'rating': return 'Rating';
                        default: return question.answerType;
                      }
                    })()}
                  </span>
                </div>
                {/* Render input preview for each type */}
                {(() => {
                  switch (question.answerType) {
                    case 'selectSingle':
                    case 'dropdown':
                      return (
                        <div className="space-y-2">
                          {question.options?.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <MdRadioButtonChecked className="text-orange-500" />
                              <span className="text-gray-700 text-base">{option}</span>
                            </div>
                          ))}
                        </div>
                      );
                    case 'selectMulti':
                      return (
                        <div className="space-y-2">
                          {question.options?.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <MdCheckBox className="text-orange-500" />
                              <span className="text-gray-700 text-base">{option}</span>
                            </div>
                          ))}
                        </div>
                      );
                    case 'date':
                      return <input type="date" className="border-b border-gray-200 focus:border-orange-400 focus:outline-none bg-transparent text-gray-600 text-sm" disabled placeholder="Date" />;
                    case 'time':
                      return <input type="time" className="border-b border-gray-200 focus:border-orange-400 focus:outline-none bg-transparent text-gray-600 text-sm" disabled placeholder="Time" />;
                    case 'file':
                      return <input type="file" className="border-b border-gray-200 focus:border-orange-400 focus:outline-none bg-transparent text-gray-600 text-sm" disabled placeholder="File upload" />;
                    case 'email':
                      return <input type="email" className="border-b border-gray-200 focus:border-orange-400 focus:outline-none bg-transparent text-gray-600 text-sm" disabled placeholder="Email" />;
                    case 'number':
                      return <input type="number" className="border-b border-gray-200 focus:border-orange-400 focus:outline-none bg-transparent text-gray-600 text-sm" disabled placeholder="Number" />;
                    case 'rating':
                      return <span className="text-orange-500 text-2xl">★★★★★</span>;
                    case 'shortText':
                      return <div className="text-gray-400 text-sm">Short answer text</div>;
                    case 'longText':
                      return <div className="text-gray-400 text-sm">Long answer text</div>;
                    default:
                      return <div className="text-gray-400 text-sm">Short answer text</div>;
                  }
                })()}
                <div className="mt-4 flex items-center gap-2">
                  <input type="checkbox" checked={question.isRequired} disabled className="accent-orange-500" />
                  <span className="text-sm text-gray-600">Required</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareData={shareModalData}
      />
    </div>
  );
};

export default FormView;
