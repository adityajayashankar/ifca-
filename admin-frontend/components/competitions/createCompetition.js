import React, { useEffect, useState } from "react";
import Select from "react-select";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { verifyCompetitionInput } from "../../helpers/verifyCompetitionInput";
import "react-quill/dist/quill.snow.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { MdEmojiEvents, MdTitle, MdDescription, MdDateRange, MdImage, MdListAlt, MdGroups, MdQuestionAnswer } from 'react-icons/md';
import { setAllExperts } from "@/store/features/expert";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
import { Divider } from "@mui/material";
import UploadImage from "../UploadImage";

const DEFAULT_IMAGE_URL='https://fastly.picsum.photos/id/20/3670/2462.jpg?hmac=CmQ0ln-k5ZqkdtLvVO23LjVAEabZQx2wOaT4pyeG10I'

function CreateCompetition({partner}) {
  const user = useSelector(selectUser)
  const router = useRouter();
  const dispatch = useDispatch();
  const [activeExpertList, setActiveExpertList] = useState([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [stages, setStages] = useState([]);
  const [error, seterror] = useState(null);
  const Answertypes = [
    {
      label: "Text",
      value: "text",
      // options: {
      //   maxChar: "",
      // },
    },
    { label: "Number", value: "number",
      //  options: { max: "", min: "" }
       },
    {
      label: "Single Choice",
      value: "singleChoice",
      options: { values: [] },
    },
    {
      label: "Multiple Choice",
      value: "multipleChoice",
      options: { values: [] },
    },
    { label: "File", value: "file", options: { maxSize: 10 } },
    // { label: "Table", value: "table", options: { rowHeaders: [] } },
  ];
  const [competitionDetails, setCompetitionDetails] = useState({});
  const [imageBlob, setImageBlob] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); 
  const [selectedFile, setSelectedFile] = useState(null); 
  const [imageFileName, setImageFileName] = useState(null)
  const fileref = React.useRef(null);
  const [emailInput, setEmailInput] = useState('');
  const [imageUrl, setImageUrl] = useState('')

  const AnswerTypeOptions = Answertypes.map((item) => {
    return { label: item.label, value: item.value };
  });

  // Upload image using backend API (presigned URL)
  const uploadImageToS3 = async (file) => {
    if (!file) return DEFAULT_IMAGE_URL;
    try {
      // Step 1: Get a presigned URL from the backend
      const response = await api.post("/images/generate-presigned-url", {
        fileName: file.name,
        fileType: file.type,
        folder: "competitions",
      });
      const { uploadUrl, fileUrl } = response.data;
      // Step 2: Upload the file directly to S3 using the presigned URL
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      return fileUrl;
    } catch (error) {
      console.error("Image upload failed:", error);
      return DEFAULT_IMAGE_URL;
    }
  };

  const addStageHandler = () => {
    setStages((prevStages) => {
      const newStageNumber = prevStages.length > 0 ? prevStages[prevStages.length - 1].stageNumber + 1 : 1;
  
      return [
        ...prevStages,
        {
          stageNumber: newStageNumber,
          fields: [],
          evaluators: [],
          evaluatorQuestions: [],
          email: '',
        },
      ];
    });
  };
  
  
  // const deleteStageHandler = (stageNumber) => {
  //   setStages((prevStages) => {
  //     const updatedStages = prevStages.filter(stage => stage.stageNumber !== stageNumber);
  
  //     return updatedStages.map((stage, index) => ({
  //       ...stage,
  //       stageNumber: index + 1, 
  //     }));
  //   });
  // };

  const deleteStageHandler = (stageindex, questionIndex) => {
    const tempstages = [...stages];
    tempstages[stageindex].fields.splice(questionIndex, 1);
    setStages(tempstages);
  };
  

  const AddquestionHandler = (stageIndex) => {
    const tempstages = [...stages];
    tempstages[stageIndex].fields.push({
      question: "",
      answerOptions: '',
    });
    setStages(tempstages);
  };


  const addEvaluatorQuestionHandler = (stageindex) => {
    const question = prompt("Enter Question");
    if (!question) return;

    const tempstages = [...stages];

    if (!tempstages[stageindex].evaluatorQuestion) {
        tempstages[stageindex].evaluatorQuestion = [];
    }

    tempstages[stageindex].evaluatorQuestion.push({
      question: question,
      answerOptions: {},
    });

    setStages(tempstages);
};

  const DeleteEvaulatorQuestion = (stageindex, questionIndex) => {
    const tempstages = [...stages];
    tempstages[stageindex].evaluatorQuestion.splice(questionIndex, 1);
    setStages(tempstages);
  };

  const CreateCompetitionHandler = async (e) => {
    e.preventDefault();
    seterror(null);

    let imageUrl = competitionDetails.banner || "";
    if (selectedFile) {
      imageUrl = await uploadImageToS3(selectedFile); 
    }

    const [success, err] = verifyCompetitionInput(competitionDetails, stages, imageUrl);
    if (err) {
      // seterror(err);
      toast.error(err)
      return;
    }
    const body = {
      ...competitionDetails,
      stages: stages,
      creatorId:user?.unifiedUser?.id,
      bannerUrl: imageUrl || DEFAULT_IMAGE_URL,
    };
      await api.post('/competitions', body)
      .then((res)=>{
        toast.success('Competition created Successfully')
        router.push(partner ? '/partner/competitions': '/admin/competitions')
      })
      .catch((err)=>{
        console.log('error', err)
        toast.error('Something Went Wrong')
      })


  };

  useEffect(() => {
  }, [competitionDetails]);
  // const crumps = [
  //   {
  //     name: "Dashboard",
  //     link: "/myIncubator/",
  //   },
  //   {
  //     name: "Competitions",
  //     link: "/myIncubator/competitions",
  //   },
  //   {
  //     name: "Create",
  //     link: "/myIncubator/competitions/new",
  //   },
  // ];

  const handleFileChange = (event) => {
    
    const file = event.target.files[0];
    setImageFileName(file?.name)
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl); 
      setSelectedFile(file);
    }
  };


  // const handleFileUpload = async (e) => {
  //   if (!e.target.files || e.target.files.length === 0) return;

  //   const file = e.target.files[0];
  //   console.log("File selected:", file);

  //   try {
  //     const imageUrl = await uploadImageToS3(file);
  //     console.log("Uploaded Image URL:", imageUrl);

  //     setCompetitionDetails((prev) => ({
  //       ...prev,
  //       bannerUrl: imageUrl,
  //     }));

  //     setImageBlob(URL.createObjectURL(file));
  //   } catch (error) {
  //     console.error("Error uploading image:", error);
  //   }
  // };

  // const handleFileUpload = (e) => {
  //   console.log("File input change triggered");
  
  //   if (!e.target.files || e.target.files.length === 0) {
  //     console.log("No file selected");
  //     return;
  //   }
  
  //   const file = e.target.files[0];
  //   console.log("File selected:", file);
  // };

  const handleEmailChange = (e, index) => {
    if (stages[index]) {
      const updatedStages = [...stages];
  
      updatedStages[index].email = e.target.value;
  
      setStages(updatedStages);
    } else {
      console.error("Stage not found at index:", index);
    }
  };

  const onUploadSuccess =(url)=>{
    setImageUrl(url)
  }

  // Function to fetch all active expert emails
  const fetchActiveExpertEmails = async () => {
    setLoadingExperts(true);
    try {
      const response = await dispatch(setAllExperts());
      if (response.payload && response.payload.activeExperts) {
        const experts = response.payload.activeExperts.filter(expert => expert.email);
        setActiveExpertList(experts);
      }
    } catch (error) {
      console.error('Error fetching expert emails:', error);
    } finally {
      setLoadingExperts(false);
    }
  };

  // Fetch expert emails on component mount
  useEffect(() => {
    fetchActiveExpertEmails();
  }, []);
  
  return (
    <div className="w-full max-w-[1920px] mx-auto flex flex-col min-h-[calc(100vh-70px)]">
      {/* Compact Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <MdEmojiEvents className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-[16px] font-bold">
                Create Competition
              </h1>
              <p className="text-[12px] text-orange-100">
                Build an engaging competition for your community
              </p>
            </div>
          </div>
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-3 py-1">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-white text-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
              <span className="text-[10px] font-medium">Basic</span>
            </div>
            <div className="w-4 h-0.5 bg-white bg-opacity-50"></div>
            <div className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${competitionDetails.title ? 'bg-white text-orange-600' : 'bg-white bg-opacity-30 text-white'}`}>{competitionDetails.title ? '✓' : '2'}</div>
              <span className="text-[10px] font-medium">Stages</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <form className="max-w-7xl mx-auto p-4 space-y-4" method="POST" onSubmit={CreateCompetitionHandler}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {/* Left Column: Basic Info & Banner Image */}
            <div className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <MdTitle className="text-white text-sm" />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-bold text-gray-900">Basic Information</h2>
                      <p className="text-[12px] text-gray-600">Start with the essential details</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="form-group relative">
                    <label htmlFor="title" className="block text-[14px] font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Competition Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      onChange={(e) => {
                        setCompetitionDetails((competitionDetails) => ({
                          ...competitionDetails,
                          [e.target.name]: e.target.value,
                        }));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-[14px] shadow-sm hover:border-orange-300"
                      placeholder="Enter an engaging competition title..."
                    />
                  </div>

                  <div className="form-group relative">
                    <label htmlFor="description" className="block text-[14px] font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows="3"
                      onChange={(e) => {
                        setCompetitionDetails((competitionDetails) => ({
                          ...competitionDetails,
                          [e.target.name]: e.target.value,
                        }));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-[14px] shadow-sm hover:border-orange-300 resize-none"
                      placeholder="Describe what participants will experience..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="startDate" className="block text-[14px] font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="startDate"
                        id="startDate"
                        min={new Date().toISOString()}
                        onChange={(e) => {
                          setCompetitionDetails((competitionDetails) => ({
                            ...competitionDetails,
                            [e.target.name]: e.target.value,
                          }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-[14px] shadow-sm hover:border-orange-300"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="endDate" className="block text-[14px] font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="endDate"
                        id="endDate"
                        min={competitionDetails.startDate}
                        onChange={(e) => {
                          setCompetitionDetails((competitionDetails) => ({
                            ...competitionDetails,
                            [e.target.name]: e.target.value,
                          }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-[14px] shadow-sm hover:border-orange-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner Image Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <MdImage className="text-white text-sm" />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-bold text-gray-900">Competition Banner</h2>
                      <p className="text-[12px] text-gray-600">Add a compelling banner image</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="form-group">
                    <label className="block text-[14px] font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Banner Image <span className="text-red-500">*</span>
                    </label>
                    <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4 mb-2">
                      <input
                        type="file"
                        name="banner"
                        id="banner"
                        accept="image/*"
                        className="w-full rounded border border-gray-300 p-1 px-2"
                        onChange={handleFileChange}
                        hidden
                        ref={fileref}
                      />
                      <div className="flex flex-row gap-4">
                        <div>
                          {previewImage ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200">
                              <img
                                src={previewImage}
                                className="h-40 w-full object-cover object-center"
                                alt="Banner preview"
                              />
                            </div>
                          ) : (
                            <div className="flex h-28 w-32 cursor-pointer items-center justify-center rounded-lg border border-gray-300 p-1 px-2 text-[12px] bg-gray-50">
                              No Preview
                            </div>
                          )}
                        </div>
                        <div className="flex w-full flex-col gap-2 rounded p-3">
                          <div className="border shadow-sm rounded-lg">
                            <div className="flex flex-row items-center gap-4 p-2">
                              <div
                                onClick={() => {
                                  fileref.current.click();
                                }}
                                className="rounded border border-orange-500 px-3 py-2 text-[12px] font-semibold text-orange-500 cursor-pointer hover:bg-orange-50 transition-colors"
                              >
                                {previewImage ? 'Change Image File' : 'Choose Image File'}
                              </div>
                              <p className="text-[12px] text-gray-600">
                                {imageFileName || "No file selected"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                      <div className="text-[14px] font-semibold text-blue-800 mb-1 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Banner Image Guidelines
                      </div>
                      <ul className="text-[12px] text-blue-700 ml-2 list-disc">
                        <li>Landscape format <b>(1200x630 recommended)</b></li>
                        <li>Any aspect ratio allowed, but landscape looks best</li>
                        <li>Max 2MB file size</li>
                        <li>Supported formats: JPG, PNG, GIF</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

        
            </div>

            {/* Right Column: Stages */}
            <div className="space-y-8">
              {/* Stages Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <MdListAlt className="text-white text-sm" />
                      </div>
                      <div>
                        <h2 className="text-[16px] font-bold text-gray-900">Competition Stages</h2>
                        <p className="text-[12px] text-gray-600">Define the competition structure</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addStageHandler}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all flex items-center gap-2 shadow-sm text-[14px] font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Stage
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {stages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MdListAlt className="text-orange-500 text-2xl" />
                      </div>
                      <p className="text-[14px] font-semibold text-gray-700 mb-2">No stages added yet</p>
                      <p className="text-[12px] text-gray-500">Add stages to define your competition structure</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stages?.map((stage, index) => (
                        <Accordion key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                            className="bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex w-[90%] flex-row items-center justify-between">
                              <p className="text-[16px] font-semibold text-gray-900">
                                Stage {index + 1}
                              </p>
                              <span
                                className="text-[12px] font-semibold text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  let tempstages = [...stages];
                                  tempstages.splice(index, 1);
                                  setStages(tempstages);
                                }}
                              >
                                Delete Stage
                              </span>
                            </div>
                          </AccordionSummary>
                          <Divider style={{marginBottom:'15px'}}/>
                          <AccordionDetails>
                            <div className="flex flex-col lg:flex-row justify-between gap-6" key={stage.stage_id}>
                              {/* Left: Questions & Evaluator Email */}
                              <div className="flex w-full lg:w-1/2 flex-col gap-4 rounded-lg border border-gray-200 p-4 shadow-sm">
                                <div className="space-y-3">
                                  <p className="font-semibold text-gray-700 text-[14px] flex items-center gap-2">
                                    <MdGroups className="text-orange-500" />
                                    Evaluator Email
                                  </p>
                                  {loadingExperts ? (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-[12px] text-gray-500">Loading experts...</div>
                                  ) : activeExpertList.length > 0 ? (
                                    <Select
                                      className="text-[14px]"
                                      options={activeExpertList.map(expert => ({
                                        value: expert.email,
                                        label: expert.name || expert.email,
                                        expert
                                      }))}
                                      value={activeExpertList.find(e => e.email === stages[index]?.email) ? {
                                        value: stages[index]?.email,
                                        label: activeExpertList.find(e => e.email === stages[index]?.email)?.name || stages[index]?.email,
                                        expert: activeExpertList.find(e => e.email === stages[index]?.email)
                                      } : null}
                                      onChange={option => handleEmailChange({ target: { value: option.value } }, index)}
                                      placeholder="Select evaluator"
                                      formatOptionLabel={({ expert }) => (
                                        <div className="flex items-center gap-2">
                                          <img src={expert.photoURL || '/t6.svg'} alt={expert.name} className="w-7 h-7 rounded-full object-cover border border-gray-200" onError={e => { e.target.src = '/t6.svg'; }} />
                                          <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 text-[14px]">{expert.name}</span>
                                            <span className="text-gray-600 text-[12px]">{expert.email}</span>
                                          </div>
                                        </div>
                                      )}
                                      isClearable
                                    />
                                  ) : (
                                    <input
                                      type="email"
                                      value={stages[index]?.email || ''}
                                      onChange={e => handleEmailChange(e, index)}
                                      placeholder="Enter evaluator email"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-[14px]"
                                    />
                                  )}
                                </div>

                                <hr className="my-4" />
                                
                                <div className="space-y-4">
                                  <div className="flex flex-row items-center justify-between">
                                    <p className="font-semibold text-gray-700 text-[14px] flex items-center gap-2">
                                      <MdQuestionAnswer className="text-orange-500" />
                                      Questions
                                    </p>
                                  </div>
                                  
                                  {stage.fields.length === 0 ? (
                                    <div className="text-center py-4">
                                      <p className="text-[12px] text-gray-500">No questions added yet</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      {stage.fields.map((field, fieldIndex) => (
                                        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 bg-gray-50" key={field.question_id}>
                                          <div>
                                            <div className="flex flex-row items-center justify-between mb-2">
                                              <p className="text-[14px] font-semibold text-gray-700">
                                                Question {fieldIndex + 1}
                                              </p>
                                              <span
                                                className="text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                                                onClick={() => {
                                                  deleteStageHandler(index, fieldIndex);
                                                }}
                                              >
                                                <DeleteOutlineOutlinedIcon className="text-[16px]" />
                                              </span>
                                            </div>
                                            <input
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-[14px]"
                                              placeholder="Type your question here"
                                              value={field.question}
                                              onChange={(e) => {
                                                let tempstages = [...stages];
                                                tempstages[index].fields[fieldIndex].question = e.target.value;
                                                setStages(tempstages);
                                              }}
                                            />
                                          </div>
                                          
                                          <div className="space-y-3">
                                            <p className="text-[12px] font-medium text-gray-700">Answer Type</p>
                                            <Select
                                              className="text-[14px]"
                                              options={AnswerTypeOptions}
                                              onChange={(e) => {
                                                const answerOption = Answertypes.find(
                                                  (item) => item.value === e.value,
                                                );
                                                let tempstages = [...stages];
                                                tempstages[index].fields[fieldIndex].answerOptions = {
                                                  type: e.value,
                                                  options: answerOption.options,
                                                };
                                                setStages(tempstages);
                                              }}
                                            />
                                            
                                            {field.answerOptions.type === "singleChoice" || field.answerOptions.type === "multipleChoice" ? (
                                              <div className="space-y-3">
                                                <p className="text-[12px] font-medium text-gray-700">Answer Options</p>
                                                <div className="space-y-2">
                                                  {field?.answerOptions?.options?.values?.map((item, valueindex) => (
                                                    <div className="flex w-full flex-row items-center gap-2" key={valueindex}>
                                                      <span className="flex-1 rounded border-2 border-gray-300 px-3 py-2 text-[12px] capitalize text-gray-700 bg-white">
                                                        {valueindex + 1}. {item}
                                                      </span>
                                                      <span
                                                        className="text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                          let tempstages = [...stages];
                                                          tempstages[index].fields[fieldIndex].answerOptions.options.values.splice(valueindex, 1);
                                                          setStages(tempstages);
                                                        }}
                                                      >
                                                        <DeleteOutlineOutlinedIcon className="text-[16px]" />
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                                <button
                                                  type="button"
                                                  className="bg-orange-500 mt-2 w-fit rounded px-3 py-2 text-[12px] text-white hover:bg-orange-600 transition-colors"
                                                  onClick={() => {
                                                    const values = prompt("Enter value for option");
                                                    if (!values) return;
                                                    let tempstages = [...stages];
                                                    tempstages[index].fields[fieldIndex].answerOptions?.options?.values?.push(values);
                                                    setStages(tempstages);
                                                  }}
                                                >
                                                  Add Option
                                                </button>
                                              </div>
                                            ) : field.answerOptions.type === "file" ? (
                                              <div className="space-y-2">
                                                <p className="text-[12px] font-medium text-gray-700">File Upload Settings</p>
                                                <p className="text-[12px] text-gray-600">
                                                  Max size (in MB) <span className="text-gray-400">(optional)</span>
                                                </p>
                                                <input
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-[14px]"
                                                  type="number"
                                                  min={0}
                                                  max={100}
                                                  onInput={(e) => {
                                                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                                                  }}
                                                  onChange={(e) => {
                                                    let tempstages = [...stages];
                                                    tempstages[index].fields[fieldIndex].answerOptions.options.maxSize = Number(e.target.value);
                                                    setStages(tempstages);
                                                  }}
                                                  placeholder="Enter max file size in MB"
                                                />
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      className="bg-orange-500 w-fit rounded px-4 py-2 text-[12px] text-white hover:bg-orange-600 transition-colors cursor-pointer"
                                      onClick={() => {
                                        AddquestionHandler(index);
                                      }}
                                    >
                                      Add Question
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right: Evaluator Questions */}
                              <div className="w-full lg:w-1/2 grow rounded-lg border border-gray-200 p-4 shadow-sm">
                                <div className="flex flex-row items-center justify-between mb-4">
                                  <p className="text-[14px] font-semibold text-gray-700 flex items-center gap-2">
                                    <MdQuestionAnswer className="text-orange-500" />
                                    Evaluator Questions
                                  </p>
                                </div>
                                <hr className="my-3" />
                                
                                <div className="space-y-3">
                                  {stage?.evaluatorQuestion?.length === 0 ? (
                                    <div className="text-center py-4">
                                      <p className="text-[12px] text-gray-500">No evaluator questions added</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {stage?.evaluatorQuestion?.map((item, questionIndex) => (
                                        <div className="flex flex-row items-center justify-between gap-3 border-b border-gray-200 pb-2" key={item.question_id}>
                                          <p className="text-[12px] capitalize text-gray-700 flex-1">
                                            {questionIndex + 1}. {item.question}
                                          </p>
                                          <DeleteOutlineOutlinedIcon
                                            className="text-red-500 hover:text-red-700 cursor-pointer transition-colors text-[16px]"
                                            onClick={() => {
                                              DeleteEvaulatorQuestion(index, questionIndex);
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex justify-end py-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      addEvaluatorQuestionHandler(index);
                                    }}
                                    className="bg-orange-500 rounded px-4 py-2 text-[12px] text-white hover:bg-orange-600 transition-colors cursor-pointer"
                                  >
                                    Add Evaluator Question
                                  </button>
                                </div>
                              </div>
                            </div>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Action Buttons */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 text-[14px] font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={false}
            className="px-6 py-2.5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 text-[14px] font-semibold shadow-lg bg-orange-600 hover:bg-orange-700 hover:shadow-xl"
            onClick={CreateCompetitionHandler}
          >
            Create Competition
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateCompetition;
