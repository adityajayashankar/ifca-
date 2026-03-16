import { selectAllCommunities, setCommunities } from "@/store/features/communitySlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { FormControl, InputLabel, ListItemText, MenuItem, Select, IconButton, Tooltip, Menu } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { MdAdd, MdDelete, MdContentCopy, MdDragIndicator, MdImage, MdMoreVert, MdShortText, MdRadioButtonChecked, MdCheckBox, MdArrowDropDown, MdArrowDropDownCircle, MdClose, MdArrowUpward, MdArrowDownward, MdChevronRight, MdHome } from "react-icons/md";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Link from "next/link";

const accentColor = "#f59e42"; // saffron
const accentGradient = "linear-gradient(90deg, #f59e42 0%, #fbbf24 100%)";

const FormCreate = () => {
  const dispatch = useDispatch();
  const [questions, setQuestions] = useState([{
    answerType: { type: 'shortText' },
    isRequired: false,
  }]);
  const [formName, setFormName] = useState("Untitled form");
  const [formDescription, setFormDescription] = useState("");
  const [isCommunitySpecific, setIsCommunitySpecific] = useState(false);
  const [selectedCommunityIds, setSelectedCommunityIds] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  const communities = useSelector(selectAllCommunities);
  const user = useSelector(selectUser);
  const router = useRouter();

  useEffect(() => {
    dispatch(setCommunities({userId: user?.unifiedUser?.id}));
  }, []);

  // Prefill from template if present in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('exampleFormDraft');
      if (draft) {
        try {
          const data = JSON.parse(draft);
          setFormName(data.formName || 'Untitled form');
          setFormDescription(data.formDesc || '');
          setQuestions(data.questions || [{ answerType: { type: 'shortText' }, isRequired: false }]);
        } catch (e) { /* ignore */ }
        localStorage.removeItem('exampleFormDraft');
      }
    }
  }, []);

  // Prevent horizontal scroll globally
  useEffect(() => {
    const originalOverflowX = document.body.style.overflowX;
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = originalOverflowX;
    };
  }, []);

  const [errorState, seterrorState] = useState({
    question_id: null,
    message: "",
  });

  const inputChangeHandler = (e, index) => {
    const tempObj = { ...questions[index], [e.target.name]: e.target.value };
    const tempQuestions = [...questions];
    tempQuestions[index] = tempObj;
    setQuestions(tempQuestions);
  };

  const answerTypeSelectHandler = (type, index) => {
    const tempObj = { ...questions[index], answerType: { type } };
    if (["selectSingle", "selectMulti"].includes(type)) {
      tempObj.answerType.options = questions[index].answerType.options && questions[index].answerType.options.length > 0
        ? questions[index].answerType.options
        : ["Option 1"];
    }
    const tempQuestions = [...questions];
    tempQuestions[index] = tempObj;
    setQuestions(tempQuestions);
  };

  const AddQuestionHandler = () => {
    setQuestions((q) => [
      ...q,
      {
        answerType: { type: 'shortText' },
        isRequired: false,
      },
    ]);
  };

  const DeleteQuestionHandler = (index) => {
    const tempQuestions = [...questions];
    tempQuestions.splice(index, 1);
    setQuestions(tempQuestions);
  };

  const DuplicateQuestionHandler = (index) => {
    const tempQuestions = [...questions];
    const duplicatedQuestion = JSON.parse(JSON.stringify(tempQuestions[index]));
    tempQuestions.splice(index + 1, 0, duplicatedQuestion);
    setQuestions(tempQuestions);
  };

  const MoveQuestionHandler = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const tempQuestions = [...questions];
    [tempQuestions[index], tempQuestions[newIndex]] = [tempQuestions[newIndex], tempQuestions[index]];
    setQuestions(tempQuestions);
  };

  const addOptionHandler = (index) => {
    const temp = prompt("Please Enter the value.");
    if (temp === null) return;
    const tempObj = JSON.parse(JSON.stringify(questions[index]));
    tempObj.answerType.options = [...(tempObj.answerType.options || []), temp];
    const tempQuestions = [...questions];
    tempQuestions[index] = tempObj;
    setQuestions(tempQuestions);
  };

  const deleteOptionHandler = (tobedeleted, index) => {
    const tempObj = JSON.parse(JSON.stringify(questions[index]));
    if (tempObj.answerType.options.length <= 1) return;
    tempObj.answerType.options = tempObj.answerType.options.filter(
      (item) => item != tobedeleted,
    );
    const tempQuestions = [...questions];
    tempQuestions[index] = tempObj;
    setQuestions(tempQuestions);
  };

  const handleChange = (event) => {
    const value = event.target.value;
    setSelectedCommunityIds(
      typeof value === "string" ? value.split(",") : value
    );
  };

  const handleMenuOpen = (event, index) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedQuestionIndex(index);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedQuestionIndex(null);
  };

  const GenreateFormHandler = async (e) => {
    e.preventDefault();
  
    try {
      const response = await api.post('/forms', {
        formName,
        formDescription,
        questions,
        communityIds: selectedCommunityIds,
        creatorId: user?.unifiedUser?.id,
        isGlobal: selectedCommunityIds.length === 0,
      });
      
      toast.success('Form created successfully!');
      router.push('/partner/forms');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleDiscard = () => {
    router.push('/partner/forms');
  };

  const getAnswerTypeIcon = (type) => {
    switch(type) {
      case 'shortText': return <MdShortText />;
      case 'longText': return <MdShortText />;
      case 'selectSingle': return <MdRadioButtonChecked />;
      case 'selectMulti': return <MdCheckBox />;
      case 'dropdown': return <MdArrowDropDownCircle />;
      case 'date': return <span role="img" aria-label="date">📅</span>;
      case 'time': return <span role="img" aria-label="time">⏰</span>;
      case 'file': return <MdImage />;
      case 'email': return <span role="img" aria-label="email">✉️</span>;
      case 'number': return <span role="img" aria-label="number">#</span>;
      case 'rating': return <span role="img" aria-label="star">⭐</span>;
      default: return <MdShortText />;
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full" style={{ fontFamily: 'Roboto, Helvetica Neue, Arial, sans-serif' }}>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-1 mb-6  mx-auto">
        <nav className="flex items-center text-sm text-gray-500 px-4 py-3" aria-label="Breadcrumb">
          <Link href="/partner">
            <span className="flex items-center text-orange-700 hover:underline">
              <MdHome className="mr-1 text-lg" /> Home
            </span>
          </Link>
          <MdChevronRight className="w-4 h-4 text-gray-400" />
          <Link href="/partner/forms">
            <span className="hover:underline text-orange-700">Forms</span>
          </Link>
          <MdChevronRight className="mx-1 text-orange-700" />
          <span className="text-gray-700 font-medium">Create</span>
        </nav>
      </div>
      {/* Main Content */}
      <div className="w-full max-w-5xl mx-auto pt-2 pb-16 px-2 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden">
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-t-4 w-full max-w-5xl mx-auto" style={{ borderTopColor: accentColor }}>
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full text-3xl font-bold border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent mb-2 placeholder-gray-400"
            placeholder="Untitled form"
            style={{ fontSize: '2rem' }}
          />
          <input
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full text-sm border-b border-gray-200 focus:border-orange-400 focus:outline-none bg-transparent placeholder-gray-400"
            placeholder="Form description"
            style={{ fontSize: '0.95rem' }}
          />
        </div>

        {/* Questions */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {questions.map((question, index) => (
                  <Draggable key={index} draggableId={`question-${index}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-lg shadow-sm p-6 mb-6 border-t-4 transition-shadow duration-200 w-full max-w-full ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                        style={{
                          ...provided.draggableProps.style,
                          borderTopColor: accentColor,
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div {...provided.dragHandleProps} className="cursor-move mt-2">
                            <MdDragIndicator className="text-orange-500 text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-gray-500">{index + 1}</span>
                              <input
                                value={question.question || ""}
                                onChange={(e) => inputChangeHandler(e, index)}
                                name="question"
                                required
                                className="flex-1 text-base border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent placeholder-gray-400"
                                placeholder="Question"
                                style={{ fontSize: '0.98rem' }}
        />
      </div>

                            {/* Answer Type Selection */}
                            <div className="flex items-center gap-2 mb-4">
                              <Tooltip title="Change question type">
                                <IconButton size="small" className="text-orange-500">
                                  {getAnswerTypeIcon(question.answerType?.type)}
                                </IconButton>
                              </Tooltip>
                              <Select
                                value={question.answerType?.type || 'shortText'}
                                onChange={(e) => answerTypeSelectHandler(e.target.value, index)}
                                size="small"
                                className="text-sm"
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(245, 158, 66, 0.2)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(245, 158, 66, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: accentColor,
              },
            }}
          >
                                <MenuItem value="shortText">Short answer</MenuItem>
                                <MenuItem value="longText">Paragraph</MenuItem>
                                <MenuItem value="selectSingle">Multiple choice</MenuItem>
                                <MenuItem value="selectMulti">Checkboxes</MenuItem>
                                <MenuItem value="dropdown">Dropdown</MenuItem>
                                <MenuItem value="date">Date</MenuItem>
                                <MenuItem value="time">Time</MenuItem>
                                <MenuItem value="file">File upload</MenuItem>
                                <MenuItem value="email">Email</MenuItem>
                                <MenuItem value="number">Number</MenuItem>
                                <MenuItem value="rating">Rating</MenuItem>
                              </Select>
                            </div>

                            {/* Answer Input/Options */}
                            {(() => {
                              switch (question.answerType?.type) {
                                case 'selectSingle':
                                case 'selectMulti':
                                case 'dropdown':
                                  return (
                                    <div className="space-y-2">
                                      {question.answerType?.options?.map((option, optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-2">
                                          {question.answerType.type === 'selectSingle' ? (
                                            <MdRadioButtonChecked className="text-orange-500" />
                                          ) : question.answerType.type === 'selectMulti' ? (
                                            <MdCheckBox className="text-orange-500" />
                                          ) : (
                                            <MdArrowDropDown className="text-orange-500" />
                                          )}
                                          <input
                                            value={option}
                                            onChange={(e) => {
                                              const tempObj = JSON.parse(JSON.stringify(question));
                                              tempObj.answerType.options[optIndex] = e.target.value;
                                              const tempQuestions = [...questions];
                                              tempQuestions[index] = tempObj;
                                              setQuestions(tempQuestions);
                                            }}
                                            className="flex-1 border-b border-gray-200 focus:border-orange-400 focus:outline-none bg-transparent text-gray-600 placeholder-gray-400"
                                            placeholder={`Option ${optIndex + 1}`}
                                            style={{ fontSize: '0.95rem' }}
                                          />
                                          <IconButton
                                            size="small"
                                            onClick={() => deleteOptionHandler(option, index)}
                                            className={`text-gray-400 hover:text-red-500 ${question.answerType.options.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={question.answerType.options.length === 1}
                                          >
                                            <MdDelete />
                                          </IconButton>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => addOptionHandler(index)}
                                        className="text-orange-600 text-sm font-medium hover:bg-orange-50 px-2 py-1 rounded"
                                        type="button"
                                      >
                                        Add option
                                      </button>
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

                            {/* Required Toggle */}
                            <div className="mt-4 flex items-center gap-2">
                              <Checkbox
                                size="small"
                                checked={question.isRequired}
                                onChange={(e) => {
                                  const tempObj = { ...question, isRequired: e.target.checked };
                                  const tempQuestions = [...questions];
                                  tempQuestions[index] = tempObj;
                                  setQuestions(tempQuestions);
                                }}
                                sx={{
                                  color: 'rgba(245, 158, 66, 0.5)',
                                  '&.Mui-checked': {
                                    color: accentColor,
                                  },
                                }}
                              />
                              <span className="text-sm text-gray-600">Required</span>
                            </div>
                          </div>

                          {/* Question Actions */}
                          <div className="flex items-center gap-1">
                            <Tooltip title="Move up">
                              <IconButton
                                size="small"
                                onClick={() => MoveQuestionHandler(index, 'up')}
                                disabled={index === 0}
                                className="text-orange-500"
                              >
                                <MdArrowUpward />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Move down">
                              <IconButton
                                size="small"
                                onClick={() => MoveQuestionHandler(index, 'down')}
                                disabled={index === questions.length - 1}
                                className="text-orange-500"
                              >
                                <MdArrowDownward />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="More options">
                              <IconButton size="small" onClick={(e) => handleMenuOpen(e, index)} className="text-orange-500">
                                <MdMoreVert />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Add Question Button */}
        <button
          onClick={AddQuestionHandler}
          className="flex items-center gap-2 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg"
        >
          <MdAdd />
          <span>Add question</span>
        </button>

        {/* Form Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 overflow-x-hidden w-full max-w-full z-50">
          <div className="max-w-5xl w-full mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                size="small"
                checked={isCommunitySpecific}
                onChange={(e) => setIsCommunitySpecific(e.target.checked)}
                sx={{
                  color: 'rgba(245, 158, 66, 0.5)',
                  '&.Mui-checked': {
                    color: accentColor,
                  },
                }}
              />
              <span className="text-sm text-gray-600">Make this form community specific</span>
            </div>
            {isCommunitySpecific && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            multiple
            value={selectedCommunityIds}
            onChange={handleChange}
                  displayEmpty
            renderValue={(selected) => {
                    if (selected.length === 0) return "Select communities";
              return selected
                      .map((id) => communities.find((c) => c.id === id)?.title)
                .join(", ");
            }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(245, 158, 66, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(245, 158, 66, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: accentColor,
                    },
            }}
          >
            {communities.map((community) => (
              <MenuItem key={community.id} value={community.id}>
                      <Checkbox 
                        checked={selectedCommunityIds.indexOf(community.id) > -1}
                        sx={{
                          color: 'rgba(245, 158, 66, 0.5)',
                          '&.Mui-checked': {
                            color: accentColor,
                          },
                        }}
                      />
                <ListItemText primary={community.title} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Discard
              </button>
              <button
                onClick={GenreateFormHandler}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 max-w-full"
              >
                Create Form
              </button>
            </div>
          </div>
        </div>

        {/* Question Options Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            DuplicateQuestionHandler(selectedQuestionIndex);
            handleMenuClose();
          }}>
            <MdContentCopy className="mr-2 text-orange-500" /> Duplicate
          </MenuItem>
          <MenuItem onClick={() => {
            DeleteQuestionHandler(selectedQuestionIndex);
            handleMenuClose();
          }}>
            <MdDelete className="mr-2 text-orange-500" /> Delete
          </MenuItem>
        </Menu>
        </div>
    </div>
  );
};

export default FormCreate;
