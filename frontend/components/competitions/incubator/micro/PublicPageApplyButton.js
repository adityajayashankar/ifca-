import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import AWS from "aws-sdk";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_KEY;
const REGION = "ap-south-1";
const BUCKET_NAME = "subspacetest-0";

AWS.config.update({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: REGION,
});

const s3 = new AWS.S3();

function PublicPageApplyButton({
  competitionId,
  competition,
}) {
  const [disabled, setDisabled] = useState(false);
  const [allowed, setAllowed] = useState(true);

  const user = useSelector(selectUser);

  return (
    <ApplyButton
      competition={competition}
      competitionId={competitionId}
    />
  );
}

export default PublicPageApplyButton;

const ApplyButton = ({
  competitionId,
  competition,
}) => {
  const user = useSelector(selectUser); 
  const userId = user?.unifiedUser?.id; 
  const [open, setOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState(null); 
  

  const uploadFileToS3 = async (file) => {
    if (!file) {
      throw new Error("No file provided");
    }
  
    const fileType = file.type.split("/")[0]; 
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
  
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: file.type,
      ACL: "public-read", 
    };
  
    try {
      const data = await s3.upload(params).promise();
      return {
        url: data.Location, 
        type: fileType, 
      };
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw new Error("Failed to upload file");
    }
  };
  

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  

  useEffect(() => {
    if (competitionId && userId) {
      fetchStageForUser();
    }
  }, [competitionId, userId]);

  const fetchStageForUser = async () => {
    try {
      const response = await api.get(`/competitions/${competitionId}/stage/user/${userId}`);
      console.log('nexttt', response)
      setCurrentStage(response?.data?.nextStage?.fields || response?.data?.stages );
    } catch (error) {
      console.error("Error fetching user-specific stage:", error);
      toast.error("Failed to fetch the stage details for the user.");
    }
  };


  const submitApplication = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedAnswers = {};
  
    formData.forEach((value, key) => {
      if (updatedAnswers[key]) {
        if (!Array.isArray(updatedAnswers[key])) {
          updatedAnswers[key] = [updatedAnswers[key]];
        }
        updatedAnswers[key].push(value);
      } else {
        updatedAnswers[key] = value;
      }
    });
  

    Object.keys(updatedAnswers).forEach((key) => {
      if (typeof updatedAnswers[key] === "string") {
        try {
          const parsedValue = JSON.parse(updatedAnswers[key]);
          if (Array.isArray(parsedValue)) {
            updatedAnswers[key] = parsedValue;
          }
        } catch (error) {
        }
      }
    });
  
    Object.keys(updatedAnswers).forEach((key) => {
      if (key.includes("[]")) {
        const cleanKey = key.replace("[]", "");
        updatedAnswers[cleanKey] = updatedAnswers[key];
        delete updatedAnswers[key];
      }
    });
  
    const fileUploadPromises = Object.keys(updatedAnswers).map(async (key) => {
      if (updatedAnswers[key] instanceof File) {
        const url = await uploadFileToS3(updatedAnswers[key]);
        updatedAnswers[key] = url;
      }
    });
  
    await Promise.all(fileUploadPromises);
  
    console.log("Final Submitted Answers:", updatedAnswers);
  
    try {
          await api.post('/competitions/submitResponse', {
            updatedAnswers,
            submittedBy: userId,
          });
          toast.success('Response submitted successfully');
          setOpen(false);
        } catch (error) {
          console.error('Error:', error);
          if (error?.status === 400) {
            toast.error("Response Already submitted");
          } else {
            toast.error('Failed to submit response');
          }
        }
  };
  
  return (
    <>
      <button
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg shadow hover:shadow-lg transition-all duration-200"
        onClick={handleOpen}
      >
        Apply Now
      </button>
      
      {/* Custom Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Application for {competition?.title}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={submitApplication} className="space-y-6">
                {currentStage?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">No application questions available</p>
                  </div>
                ) : (
                  currentStage?.map((question, index) => (
                    <QuestionField key={question.id} question={question} index={index} />
                  ))
                )}
                
                {currentStage?.length !== 0 && (
                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button 
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg shadow hover:shadow-lg transition-all duration-200"
                    >
                      Submit Application
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export const QuestionField = ({ question, index }) => {
  return (
    <div className="space-y-3">
      <label className="block text-lg font-semibold text-gray-900">
        {index + 1}. {question.question}
      </label>
      <AnswerField answerOptions={question} question_id={question.id} />
    </div>
  );
};

const AnswerField = ({ answerOptions, question_id }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleCheckboxChange = (option, e) => {
    const isChecked = e.target.checked;
    setSelectedOptions((prev) =>
      isChecked ? [...prev, option] : prev.filter((item) => item !== option)
    );
  };

  if (answerOptions.type === "text") {
    return (
      <textarea 
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none" 
        name={question_id}
        rows="4"
        placeholder="Enter your answer..."
      />
    );
  }

  if (answerOptions.type === "number") {
    return (
      <input 
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
        type="number" 
        name={question_id}
        placeholder="Enter a number..."
      />
    );
  }

  if (answerOptions.type === "file") {
    return (
      <div className="space-y-2">
        <input
          type="file"
          name={question_id}
          accept="image/*,video/*,application/*,.pdf"
          onChange={handleFileChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        {selectedFile && (
          <p className="text-sm text-green-600">✓ File selected: {selectedFile.name}</p>
        )}
      </div>
    );
  }

  if (answerOptions.type === "singleChoice") {
    return (
      <div className="space-y-3">
        {answerOptions?.options?.values?.map((option, index) => (
          <label key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input 
              type="radio" 
              name={question_id} 
              value={option} 
              className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500" 
            />
            <span className="text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (answerOptions.type === "multipleChoice") {
    return (
      <div className="space-y-3">
        {answerOptions?.options?.values?.map((option, index) => (
          <label key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              name={`${question_id}[]`}
              value={option}
              checked={selectedOptions.includes(option)}
              onChange={(e) => handleCheckboxChange(option, e)}
              className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
            />
            <span className="text-gray-700">{option}</span>
          </label>
        ))}
        <input type="hidden" name={question_id} value={JSON.stringify(selectedOptions)} />
      </div>
    );
  }

  return null;
};


