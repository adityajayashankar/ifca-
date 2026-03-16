import {
  selectCommunity,
} from "@/store/features/communitySlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { selectCommunityResources } from "@/store/features/resourceSlice";
import { selectAllCommunities } from "@/store/features/communitySlice";
import UploadImage from "../UploadImage";
import { Divider } from "@mui/material";
import { MdTitle, MdDescription, MdGroups, MdAttachMoney, MdCollectionsBookmark, MdQuestionAnswer, MdLocalOffer } from 'react-icons/md';
import PortalDropdown from "../common/PortalDropdown";

const CreateCommunityForm = ({ isEdit, baseURL, parentCommunityId: propParentCommunityId, onSuccess, onCancel, isPopup = false }) => {
  const formRef = useRef();
  const router = useRouter();
  const selectedCommunity = useSelector(selectCommunity);
  const allCommunities = useSelector(selectAllCommunities);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [uploading, setUploading] = useState(0);
  const [parentCommunityId, setParentCommunityId] = useState(propParentCommunityId || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const urlRef = useRef("");
  const [newClick, setNewClick] = useState(false);
  const [parentCommunities, setParentCommunities] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const resources = useSelector(selectCommunityResources);

  const inputContainerRef = useRef(null);

  // Fetch communities for parent selection
  const fetchParentCommunities = async () => {
    try {
      const response = await api.get('/community/parent-selection');
      if (response.data.success) {
        let filteredCommunities = response.data.communities;
        
        // DEBUG: Check what's in the response
        console.log('All communities:', response.data.communities);
        console.log('User ID:', user?.unifiedUser?.id);
        console.log('User type:', user?.userType);
        
        // If user is partner, show only their own communities
        if (user?.userType === "partner") {
          filteredCommunities = response.data.communities.filter(
            (com) => {
              console.log('Community:', com.title, 'CreatorId:', com.creatorId);
              return com.creatorId === user?.unifiedUser?.id;
            }
          ) || [];
          console.log('Filtered communities:', filteredCommunities);
        }
        
        setParentCommunities(filteredCommunities);
      }
    } catch (error) {
      console.error('Error fetching parent communities:', error);
    }
  };

  // Fetch available tags
  const fetchAvailableTags = async () => {
    try {
      const response = await api.get('/community/community-tags');
      // The response structure is { tags: [...] }
      setAvailableTags(response.data?.tags || []);
      console.log('Fetched available tags:', response.data?.tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // creatorID to be replaced by the authed admin ID
  const initObj = {
    title: "",
    desc: "",
    price: 0,
    bannerImg: "",
    gold_price: 0,
    silver_price: 0,
    platinum_price: 0,
    infoImgs: [],
    discountForCourses: 0,
    questions: [],
    initialCommunity: false,
    visibility: "PUBLIC"
  };

  const initResource = {
    name: "",
    link: "",
    authorId: user?.unifiedUser?.id,
    isApproved: true,
  };

  const [count, setCount] = useState(0);
  const [communityForm, setCommunityForm] = useState(initObj);
  const [resourceForm, setResourceForm] = useState(initResource);
  const [useDefaultQuestions, setUseDefaultQuestions] = useState(true);
  const [questions, setQuestions] = useState([
    "Why do you want to join this community?",
    "What skills or experience do you bring?",
    "How do you plan to contribute to the community?"
  ]);

  // const [resourceArr, setResourceArr] = useState(selectedCommunity.resource);
  const [resourceArr, setResourceArr] = isEdit
    ? useState(resources)
    : useState([]);
  const [newResources, setNewResources] = useState([]);
  const [deleteResources, setDeleteResources] = useState([]);

  const handleAddResource = () => {
    setCount(count + 1);
    setNewResources([...newResources, { ...initResource }]);
  };

  const handleNewRemove = (item) => {
    const arr = newResources.filter((x) => {
      // x.name != item.name && x.link != item.link;
      return x.id != item.id;
    });

    setCount(count - 1);
    setNewResources(arr);
  };
  const handleNewChange = (index) => (e) => {
    const newRes = newResources.map((item, i) => {
      if (index == i)
        return { ...item, [e.target.name]: e.target.value };
      else return item;
    });
    // console.log(user);
    setNewResources(newRes);
  };

  const handleExistingChange = (index) => (e) => {
    const editArr = resourceArr.map((item, i) => {
      if (index == i)
        return {
          ...item,
          [e.target.name]: e.target.value,
          authorId: user.unifiedUser.id,
        };
      else return item;
    });
    setResourceArr(editArr);
  };
  const handleRemove = (index) => async (e) => {
    const newArr = resourceArr.filter((item) => item.id != index);
    setResourceArr(newArr);
    setDeleteResources((item) => [...item, index]);

    // .then((res) => {
    //   // console.log(res);
    //   toast(`Resources deleted`, { type: "success" });
    //   handleClearForm();
    //   setUploading(0);
    //   urlRef.current = "";
    //   router.push(`/${baseURL}/community`);
    // });
    // const res = await del.json()
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCommunityForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClearForm = (e) => {
    e?.preventDefault();
    formRef.current.reset();
    setNewResources([]);
    setResourceArr(resources);
    setDeleteResources([]);
  };

  const handleDiscardChanges = (e) => {
    e.preventDefault();
    router.replace(`/${baseURL}/community`);
  };

  const resolvesWhenUploaded = () => {
    return new Promise((resolve, reject) => {
      let tries = 0;
      const inter = setInterval(() => {
        if (urlRef.current) {
          resolve({ msg: "Successfully uploaded" });
          clearInterval(inter);
        } else if (error) {
          console.log(error);
          reject({ msg: "Failed upload" });
          clearInterval(inter);
        }
        if (tries === 7) {
          reject({ msg: "Failed upload" });
          clearInterval(inter);
        }
        if (tries > 3 && uploading === 0) {
          resolve({ msg: "No item to upload" });
          clearInterval(inter);
        }
        tries++;
      }, 1000);
    });
  };

  const validateVisibility = () => {
    if (communityForm.visibility === "PARENT_MEMBERS_ONLY" && !parentCommunityId) {
      return {
        status: false,
        message: "Parent community must be selected for 'Parent Members Only' visibility"
      };
    }
    return { status: true };
  };

  const validate = () => {
    const titleRegEx = new RegExp("[a-zA-Z]$");
    const priceRegEx = new RegExp("[0-9]$");

    if (!titleRegEx.test(communityForm.title) || communityForm.title.length === 0)
      return { status: false, message: "Title is not in correct format" };
    if (!priceRegEx.test(communityForm.price))
      return { status: false, message: "Price contains invalid characters" };

    // Validate questions
    if (questions.length !== 3) {
      return { status: false, message: "Exactly 3 questions are required" };
    }
    if (questions.some(q => !q.trim())) {
      return { status: false, message: "All questions must be filled" };
    }

    // Validate visibility settings
    const visibilityValidation = validateVisibility();
    if (!visibilityValidation.status) {
      return visibilityValidation;
    }

    return { status: true, message: "Validation Successful" };
  };

  const handleParentCommunityChange = (e) => {
    e?.preventDefault();
    const selectedId = parseInt(e.target.value);
    setParentCommunityId(selectedId);
  };

  const handleQuestionChange = (index) => (e) => {
    const newQuestions = [...questions];
    newQuestions[index] = e.target.value;
    setQuestions(newQuestions);
  };

  const handleUseDefaultQuestions = (e) => {
    setUseDefaultQuestions(e.target.checked);
    if (e.target.checked) {
      setQuestions([
        "Why do you want to join this community?",
        "What skills or experience do you bring?",
        "How do you plan to contribute to the community?"
      ]);
    } else {
      // Keep the questions array but clear the text
      setQuestions(["", "", ""]);
    }
  };

  // Tag handling functions
  const handleTagSelect = (tag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
      console.log('Selected existing tag:', tag);
    }
  };

  const handleTagRemove = (tagId) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleNewTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewFromInput();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 200);
  };

  const handleOptionClick = (tag) => {
    handleTagSelect(tag);
    setInputValue("");
    // Don't close dropdown to allow multiple selections
  };

  const handleAddNewFromInput = () => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput && 
        !availableTags.find(tag => tag.name.toLowerCase() === trimmedInput.toLowerCase()) &&
        !selectedTags.find(tag => tag.name.toLowerCase() === trimmedInput.toLowerCase())) {
      const newTag = {
        id: `new_${Date.now()}`,
        name: trimmedInput,
        isNew: true
      };
      setSelectedTags([...selectedTags, newTag]);
      setInputValue("");
      console.log('Added new tag:', newTag);
      // Don't close dropdown to allow multiple selections
    }
  };

  const [createDefaultChildren, setCreateDefaultChildren] = useState(false);

  const DEFAULT_CHILD_COMMUNITIES = [
    {
      title: "Governance Group",
      desc: "A space for community governance, policy discussions, and decision-making processes",
      visibility: "MEMBERS_ONLY",
      communityType: "DEFAULT",
    },
    {
      title: "Member Approval Group",
      desc: "Manage and review new member applications, handle membership requests and approvals",
      visibility: "MEMBERS_ONLY",
      communityType: "DEFAULT",
    },
    {
      title: "Commercial Group",
      desc: "Handle business opportunities, partnerships, and commercial activities within the community",
      visibility: "MEMBERS_ONLY",
      communityType: "DEFAULT",
    },
    {
      title: "External Community Partnership Group",
      desc: "Manage relationships and collaborations with external communities and organizations",
      visibility: "MEMBERS_ONLY",
      communityType: "DEFAULT",
    }
  ];

  const [showChildSection, setShowChildSection] = useState(true);
  const [childCommunities, setChildCommunities] = useState([]);

  useEffect(() => {
    console.log('Initial setup - isEdit:', isEdit);
    console.log('Initial setup - selectedCommunity:', selectedCommunity);
    
    // Always set default communities initially
    setChildCommunities(DEFAULT_CHILD_COMMUNITIES);
    setShowChildSection(true);
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    console.log('Update effect - isEdit:', isEdit);
    console.log('Update effect - selectedCommunity:', selectedCommunity);
    console.log('Current childCommunities:', childCommunities);
    
    if (isEdit && selectedCommunity) {
      if (selectedCommunity.childCommunities && selectedCommunity.childCommunities.length > 0) {
        console.log('Setting existing child communities:', selectedCommunity.childCommunities);
        setChildCommunities(selectedCommunity.childCommunities);
        setShowChildSection(true);
      } else {
        console.log('No existing child communities, allowing creation of new ones');
        setChildCommunities(DEFAULT_CHILD_COMMUNITIES);
        setShowChildSection(true);
      }
    } else {
      console.log('Setting default child communities for new community');
      setChildCommunities(DEFAULT_CHILD_COMMUNITIES);
      setShowChildSection(true);
    }
  }, [isEdit, selectedCommunity]);

  useEffect(() => {
    const { parentId } = router.query;
    if (parentId && !isEdit) {
      const parentIdNum = parseInt(parentId);
      setParentCommunityId(parentIdNum);
    } else if (propParentCommunityId && !isEdit) {
      setParentCommunityId(propParentCommunityId);
    } else if (isEdit && selectedCommunity) {
      // For edit mode, set the parent community ID from the selected community
      if (selectedCommunity.parentCommunities && selectedCommunity.parentCommunities.length > 0) {
        setParentCommunityId(selectedCommunity.parentCommunities[0]?.id || 0);
      } else {
        setParentCommunityId(0);
      }
    }
  }, [router.query, isEdit, propParentCommunityId, selectedCommunity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast("Login & try again", { type: "warning" });
      router.replace(`/`);
      return;
    }
    const { status, message } = validate();
    if (!status) {
      toast(message, { type: "error" });
      return;
    }

    setLoading(true);
    try {
      const checkBannerURL = await resolvesWhenUploaded();
      if (!isEdit) {
        let {
          gold_price,
          platinum_price,
          silver_price,
          price,
          discountForCourses,
          id,
          role,
          forms,
          services,
          ...postObj
        } = communityForm;

        postObj = {
          ...postObj,
          bannerImg: urlRef.current,
          questions: questions,
          visibility: communityForm.visibility || "PUBLIC",
          initialCommunity: Boolean(communityForm.initialCommunity)
        };

        // Prepare tagIds array - existing tags by ID, new tags by name
        const tagIds = selectedTags.map(tag => {
          if (tag.isNew) {
            return tag.name; // Send name for new tags
          } else {
            return typeof tag.id === 'number' ? tag.id : parseInt(tag.id); // Ensure ID is a number
          }
        }).filter(tagId => tagId); // Filter out any null/undefined values
        
        console.log('Selected tags:', selectedTags);
        console.log('Tag IDs being sent:', tagIds);

        // Combine all resources (existing + new) for create
        const allResources = [...(resourceArr || []), ...newResources];

        // Remove relation arrays from postObj (CREATE branch only)
        ['subscriptions', 'FormCommunity', 'forms', 'services', 'subscriptionTrue', 'childCommunities', 'parentCommunities', 'tags'].forEach(field => {
          delete postObj[field];
        });

        const response = await api.post(`/community`, {
          ...postObj,
          gold_price: parseInt(gold_price),
          silver_price: parseInt(silver_price),
          platinum_price: parseInt(platinum_price),
          price: parseInt(price),
          discountForCourses: parseInt(discountForCourses),
          parentCommunityId: parentCommunityId > 0 ? parentCommunityId : null,
          creatorId: user?.unifiedUser?.id,
          tagIds: tagIds,
          resource: allResources
        });

        if (response.data.community) {
          const mainCommunityId = response.data.community.id;

          // Create child communities if enabled
          if (showChildSection && childCommunities.length > 0) {
            try {
              for (const child of childCommunities) {
                await api.post('/community', {
                  ...child,
                  parentCommunityId: mainCommunityId > 0 ? mainCommunityId : null,
                  creatorId: user?.unifiedUser?.id,
                  price: 0,
                  communityType: "DEFAULT",
                  gold_price: 0,
                  silver_price: 0,
                  platinum_price: 0,
                  discountForCourses: 0,
                  questions: [
                    "Why do you want to join this community?",
                    "What skills or experience do you bring?",
                    "How do you plan to contribute to the community?"
                  ],
                  bannerImg: urlRef.current || "",
                  resource: []
                });
              }
              toast("Child communities created successfully", { type: "success" });
            } catch (error) {
              console.error('Error creating child communities:', error);
              toast("Error creating child communities", { type: "error" });
            }
          }

          toast(`Successfully Created Community`, { type: "success" });
          if (isPopup && onSuccess) {
            onSuccess();
          } else {
            router.back();
          }
          handleClearForm();
        }
      } else {
        // Extract all fields from communityForm
        const {
          bannerImg,
          gold_price,
          silver_price,
          platinum_price,
          desc,
          title,
          price,
          discountForCourses,
          visibility,
          initialCommunity,
          isApproved,
          isCatchupLive,
          communityType,
          welcomeMsg,
          id,
          role,
          parentCommunities,
          childCommunities: existingChildCommunities,
          subscriptionTrue,
          resource,
          creatorId,
          createdAt,
          updatedAt,
          forms,
          services,
          ...rest
        } = communityForm;

        // Prepare the update object with proper type conversions
        const updateData = {
          bannerImg: urlRef.current || bannerImg,
          desc,
          title,
          price: parseInt(price) || 0,
          gold_price: parseInt(gold_price) || 0,
          silver_price: parseInt(silver_price) || 0,
          platinum_price: parseInt(platinum_price) || 0,
          discountForCourses: parseInt(discountForCourses) || 0,
          visibility: visibility || "PUBLIC",
          initialCommunity: Boolean(initialCommunity),
          isApproved: Boolean(isApproved),
          isCatchupLive: Boolean(isCatchupLive),
          communityType,
          welcomeMsg,
          questions: questions,
          parentCommunityId: parentCommunityId > 0 ? parentCommunityId : null,
          ...rest
        };

        // Add parent community ID if it exists
        if (parentCommunityId && parentCommunityId > 0) {
          updateData.parentCommunityId = parseInt(parentCommunityId);
        } else if (parentCommunities?.[0]?.id) {
          updateData.parentCommunityId = parseInt(parentCommunities[0].id);
        }

        // Prepare tagIds array for update
        const tagIds = selectedTags.map(tag => {
          if (tag.isNew) {
            return tag.name; // Send name for new tags
          } else {
            return typeof tag.id === 'number' ? tag.id : parseInt(tag.id); // Ensure ID is a number
          }
        }).filter(tagId => tagId); // Filter out any null/undefined values
        
        updateData.tagIds = tagIds;
        console.log('Update - Selected tags:', selectedTags);
        console.log('Update - Tag IDs being sent:', tagIds);

        // Combine all resources (existing + new) for update
        const allResources = [...(resourceArr || []), ...newResources];
        updateData.resource = allResources;

        // Remove relation arrays from updateData (UPDATE branch only)
        ['subscriptions', 'FormCommunity', 'forms', 'services', 'subscriptionTrue', 'childCommunities', 'parentCommunities', 'tags'].forEach(field => {
          delete updateData[field];
        });

        const communityId = communityForm.id;

        // Update main community (resources handled in backend)
        const communityEdit = await api.patch(
          `/community/${communityId}`,
          updateData
        );

        if (communityEdit.data.success) {
          toast(`Community Updated Successfully`, { type: "success" });
          setUploading(0);
          urlRef.current = "";
          router.push(`/${baseURL}/community`);
        } else {
          toast(`Failed to Update Community`, { type: "error" });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast(error.message || "Something went wrong", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit && selectedCommunity) {
      setCommunityForm({
        ...selectedCommunity,
        initialCommunity: Boolean(selectedCommunity.initialCommunity),
        visibility: selectedCommunity.visibility || "PUBLIC"
      });
      // Convert questions array to string array if needed
      setQuestions(Array.isArray(selectedCommunity.questions)
        ? selectedCommunity.questions.map(q => typeof q === 'object' ? q.text : q)
        : ["", "", ""]);
      urlRef.current = selectedCommunity.bannerImg;
      
      // Set existing tags
      if (selectedCommunity.tags && selectedCommunity.tags.length > 0) {
        setSelectedTags(selectedCommunity.tags.map(tagItem => tagItem.tag));
      }
    }
  }, [isEdit, selectedCommunity]);

  useEffect(() => {
    if (user && user.userType === "partner" || user.userType === "admin") {
      setCommunityForm((prev) => ({ ...prev, creatorId: user?.unifiedUser?.id }));
    }
  }, [user]);

  // Fetch parent communities on mount
  useEffect(() => {
    fetchParentCommunities();
    fetchAvailableTags();
  }, []);

  return (
    <div className="w-full max-w-[1920px] mx-auto flex flex-col min-h-[calc(100vh-70px)]">
      {/* Compact Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <MdGroups className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-16px font-bold">
                {isEdit ? 'Edit Community' : 'Create New Community'}
              </h1>
              <p className="text-12px text-orange-100">
                {isEdit ? 'Update your community details' : 'Build an engaging community for your members'}
              </p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-3 py-1">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-white text-orange-600 rounded-full flex items-center justify-center text-10px font-bold">1</div>
              <span className="text-10px font-medium">Basic</span>
            </div>
            <div className="w-4 h-0.5 bg-white bg-opacity-50"></div>
            <div className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-10px font-bold ${communityForm.title ? 'bg-white text-orange-600' : 'bg-white bg-opacity-30 text-white'}`}>
                {communityForm.title ? '✓' : '2'}
              </div>
              <span className="text-10px font-medium">Details</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <form
          className="max-w-7xl mx-auto p-4 space-y-4"
          method="POST"
          ref={formRef}
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 ">
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
                      <h2 className="text-16px font-bold text-gray-900">Basic Information</h2>
                      <p className="text-12px text-gray-600">Start with the essential details</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="form-group relative">
                    <label htmlFor="title" className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Community Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
                      required
                      defaultValue={communityForm.title}
                      onChange={handleChange}
                      placeholder="Enter an engaging community name..."
                    />
                  </div>
                  <div className="form-group relative">
                    <label htmlFor="desc" className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="desc"
                      name="desc"
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300 resize-none"
                      defaultValue={communityForm.desc}
                      onChange={handleChange}
                      required
                      placeholder="Describe what members will experience..."
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="parentComminity" className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Parent Community <span className="font-bold ml-2 text-12px">(If Applicable)</span>
                      {(router.query.parentId || propParentCommunityId) && (
                        <span className="text-12px text-green-600 bg-green-100 px-2 py-1 rounded-full ml-2">
                          Pre-selected
                        </span>
                      )}
                    </label>
                    <select
                      value={parentCommunityId}
                      onChange={handleParentCommunityChange}
                      name="communityId"
                      disabled={!!(router.query.parentId || propParentCommunityId) && !isEdit}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300 ${
                        !!(router.query.parentId || propParentCommunityId) && !isEdit 
                          ? "bg-gray-100 border-gray-300 cursor-not-allowed text-gray-600" 
                          : "border-gray-300"
                      }`}
                    >
                      <option value="0">Select Community</option>
                      {parentCommunities?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                    {(router.query.parentId || propParentCommunityId) && !isEdit && (
                      <p className="text-12px text-gray-600 mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Parent community has been automatically selected and cannot be changed.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Image Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <MdCollectionsBookmark className="text-white text-sm" />
                    </div>
                    <div>
                      <h2 className="text-16px font-bold text-gray-900">Community Banner</h2>
                      <p className="text-12px text-gray-600">Add a compelling banner image</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="form-group">
                    <label className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Banner Image <span className="text-red-500">*</span>
                    </label>
                    <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4 mb-2">
                      <UploadImage
                        folder="community"
                        imgUrl={communityForm.bannerImg}
                        urlRef={urlRef}
                        previewAspectRatio="1200/630"
                      />
                    </div>
                    <div className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                      <div className="text-14px font-semibold text-blue-800 mb-1 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Banner Image Guidelines
                      </div>
                      <ul className="text-12px text-blue-700 ml-2 list-disc">
                        <li>Landscape format <b>(1200x630 recommended)</b></li>
                        <li>Any aspect ratio allowed, but landscape looks best</li>
                        <li>Max 2MB file size</li>
                        <li>Supported formats: JPG, PNG, GIF</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Settings Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <MdGroups className="text-white text-sm" />
                    </div>
                    <div>
                      <h2 className="text-16px font-bold text-gray-900">Community Settings</h2>
                      <p className="text-12px text-gray-600">Configure visibility and access</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {!parentCommunityId && (
                    <div className="form-group relative">
                      <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-orange-50 transition-colors">
                        <input
                          type="checkbox"
                          name="initialCommunity"
                          checked={communityForm.initialCommunity}
                          onChange={(e) => setCommunityForm(prev => ({ ...prev, initialCommunity: e.target.checked }))}
                          className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-md checked:border-orange-500 checked:bg-orange-500 focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                        <span className="w-4 h-4 flex items-center justify-center border-2 border-gray-300 rounded-md bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all">
                          <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                        <div>
                          <span className="text-14px font-medium text-gray-700 group-hover:text-orange-600 transition-colors">Set as Initial Community</span>
                          <p className="text-12px text-gray-500">Make this the default community for new users</p>
                        </div>
                      </label>
                    </div>
                  )}
                  <div className="form-group relative">
                    <label htmlFor="visibility" className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Community Visibility <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="visibility"
                      name="visibility"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300 ${communityForm.visibility === "PARENT_MEMBERS_ONLY" && !parentCommunityId
                        ? "border-red-500"
                        : "border-gray-300"
                        }`}
                      value={communityForm.visibility}
                      onChange={handleChange}
                    >
                      <option value="PUBLIC">Public - Visible to everyone</option>
                      <option value="MEMBERS_ONLY">Members Only - Only visible to community members</option>
                      <option value="PARENT_MEMBERS_ONLY">Parent Members Only - Only visible to members of parent communities</option>
                    </select>
                    <div className="mt-2 space-y-1">
                      <p className={`text-12px ${communityForm.visibility === "PUBLIC"
                        ? "text-green-600"
                        : communityForm.visibility === "MEMBERS_ONLY"
                          ? "text-blue-600"
                          : "text-orange-600"
                        }`}>
                        {communityForm.visibility === "PUBLIC" && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Anyone can view this community
                          </span>
                        )}
                        {communityForm.visibility === "MEMBERS_ONLY" && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Only members can view this community
                          </span>
                        )}
                        {communityForm.visibility === "PARENT_MEMBERS_ONLY" && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Only members of parent communities can view this community
                          </span>
                        )}
                      </p>
                      {communityForm.visibility === "PARENT_MEMBERS_ONLY" && !parentCommunityId && (
                        <p className="text-12px text-red-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Please select a parent community for this visibility setting
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category (Tag) Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <MdLocalOffer className="text-white text-sm" />
                    </div>
                    <div>
                      <h2 className="text-16px font-bold text-gray-900">Community Category</h2>
                      <p className="text-12px text-gray-600">Select categories to help users find your community</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Input Container */}
                  <div
                    ref={inputContainerRef}
                    className={`min-h-[48px] border rounded-lg p-2 bg-white transition-all ${
                      showDropdown 
                        ? 'border-orange-500 ring-2 ring-orange-500 ring-opacity-20' 
                        : 'border-gray-300 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Selected Categories as Chips */}
                      {selectedTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-14px font-medium border border-orange-200"
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => handleTagRemove(tag.id)}
                            className="text-orange-600 hover:text-orange-800 transition-colors ml-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && inputValue.trim()) {
                            e.preventDefault();
                            handleAddNewFromInput();
                          }
                        }}
                        placeholder={selectedTags.length === 0 ? "Search or add categories..." : "Type to search or add more..."}
                        className="flex-1 min-w-[200px] bg-transparent border-none outline-none text-14px placeholder-gray-400"
                      />
                    </div>
                  </div>
                  
                  {/* Portal Dropdown */}
                  <PortalDropdown anchorRef={inputContainerRef} open={showDropdown}>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* Dropdown Header */}
                      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-12px text-gray-600 font-medium">Select categories</span>
                        <button
                          type="button"
                          onClick={() => setShowDropdown(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {/* Available Options */}
                      {availableTags
                        .filter(tag => 
                          !selectedTags.find(selected => selected.id === tag.id) &&
                          tag.name.toLowerCase().includes(inputValue.toLowerCase())
                        )
                        .map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onMouseDown={() => handleOptionClick(tag)}
                            className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-center gap-3"
                          >
                            <div className="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center">
                              <svg className="w-3 h-3 text-white opacity-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-14px text-gray-700">{tag.name}</span>
                          </button>
                        ))}
                      {/* Add New Option */}
                      {inputValue.trim() && 
                       !availableTags.find(tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase()) &&
                       !selectedTags.find(tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                        <button
                          type="button"
                          onClick={handleAddNewFromInput}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-t border-gray-100"
                        >
                          <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <span className="text-14px text-blue-600 font-medium">
                            Add "{inputValue.trim()}"
                          </span>
                        </button>
                      )}
                      {/* No Results */}
                      {availableTags.filter(tag => 
                        !selectedTags.find(selected => selected.id === tag.id) &&
                        tag.name.toLowerCase().includes(inputValue.toLowerCase())
                      ).length === 0 && !inputValue.trim() && (
                        <div className="px-4 py-3 text-14px text-gray-500">
                          No categories available
                        </div>
                      )}
                      {inputValue.trim() && 
                       availableTags.filter(tag => 
                         !selectedTags.find(selected => selected.id === tag.id) &&
                         tag.name.toLowerCase().includes(inputValue.toLowerCase())
                       ).length === 0 &&
                       !availableTags.find(tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                        <div className="px-4 py-3 text-14px text-gray-500">
                          Press Enter to add "{inputValue.trim()}"
                        </div>
                      )}
                      {inputValue.trim() && 
                       availableTags.find(tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase()) &&
                       selectedTags.find(tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                        <div className="px-4 py-3 text-14px text-gray-500">
                          Category already selected
                        </div>
                      )}
                    </div>
                  </PortalDropdown>
                </div>
              </div>
            </div>

            {/* Right Column: Resources, Pricing, Join Questions */}
            <div className="space-y-8">
              {/* Resources Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <MdCollectionsBookmark className="text-white text-sm" />
                      </div>
                      <div>
                        <h2 className="text-16px font-bold text-gray-900">Resources</h2>
                        <p className="text-12px text-gray-600">Add helpful materials for members</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddResource}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all flex items-center gap-2 shadow-sm text-14px font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Resource
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {resourceArr.length > 0 && <div className="font-semibold text-gray-700 mb-2">Existing Resources</div>}
                  {isEdit && resourceArr?.map((item, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-16px font-medium text-gray-900 mb-3">Resource {index + 1}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label className="block text-14px font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            name="name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-14px"
                            required
                            value={item.name}
                            onChange={handleExistingChange(index)}
                            placeholder="Resource name"
                          />
                        </div>
                        <div className="form-group">
                          <label className="block text-14px font-medium text-gray-700 mb-1">Link</label>
                          <input
                            type="text"
                            name="link"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-14px"
                            required
                            value={item.link}
                            onChange={handleExistingChange(index)}
                            placeholder="Resource link"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mt-3 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-14px"
                        onClick={handleRemove(item.id)}
                      >
                        Remove Resource
                      </button>
                    </div>
                  ))}
                  {newResources.map((item, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-16px font-medium text-gray-900 mb-3">
                        New Resource {isEdit ? index + 1 + resourceArr.length : index + 1}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label className="block text-14px font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-14px"
                            required
                            onChange={handleNewChange(index)}
                            value={item.name}
                            placeholder="Resource name"
                          />
                        </div>
                        <div className="form-group">
                          <label className="block text-14px font-medium text-gray-700 mb-1">
                            Link <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="link"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-14px"
                            required
                            onChange={handleNewChange(index)}
                            value={item.link}
                            placeholder="Resource link"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mt-3 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-14px"
                        onClick={() => handleNewRemove(item)}
                      >
                        Remove Resource
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <MdAttachMoney className="text-white text-sm" />
                    </div>
                    <div>
                      <h2 className="text-16px font-bold text-gray-900">Pricing</h2>
                      <p className="text-12px text-gray-600">Set membership pricing tiers</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="price" className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Membership price/mo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
                        required
                        min="0"
                        value={parseInt(communityForm.price)}
                        onChange={handleChange}
                        placeholder="Enter price"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="gold_price" className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Gold price/mo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="gold_price"
                        name="gold_price"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
                        required
                        min="0"
                        value={parseInt(communityForm.gold_price)}
                        onChange={handleChange}
                        placeholder="Enter gold price"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="silver_price" className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Silver price/mo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="silver_price"
                        name="silver_price"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
                        required
                        min="0"
                        value={parseInt(communityForm.silver_price)}
                        onChange={handleChange}
                        placeholder="Enter silver price"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="discountForCourses" className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Discount (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="discountForCourses"
                        name="discountForCourses"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
                        required
                        min="0"
                        value={parseInt(communityForm.discountForCourses)}
                        onChange={handleChange}
                        placeholder="Enter discount (%)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Join Questions Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <MdQuestionAnswer className="text-white text-sm" />
                    </div>
                    <div>
                      <h2 className="text-16px font-bold text-gray-900">Join Questions</h2>
                      <p className="text-12px text-gray-600">Required questions for new members</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-orange-50 transition-colors mb-4">
                    <input
                      type="checkbox"
                      checked={useDefaultQuestions}
                      onChange={handleUseDefaultQuestions}
                      className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-md checked:border-orange-500 checked:bg-orange-500 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                    <span className="w-4 h-4 flex items-center justify-center border-2 border-gray-300 rounded-md bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all">
                      <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                    <div>
                      <span className="text-14px font-medium text-gray-700 group-hover:text-orange-600 transition-colors">Use default questions</span>
                      <p className="text-12px text-gray-500">Standard questions for community membership</p>
                    </div>
                  </label>
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={index}>
                        <label htmlFor={`question-${index}`} className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Question {index + 1} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={`question-${index}`}
                          name={`question-${index}`}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
                          required
                          value={question}
                          onChange={handleQuestionChange(index)}
                          placeholder={`Enter question ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Default Child Communities Section */}
          {!isPopup && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <MdGroups className="text-white text-sm" />
                    </div>
                    <div>
                      <h2 className="text-16px font-bold text-gray-900">Child Communities</h2>
                      <p className="text-12px text-gray-600">Create default subcommunities</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showChildSection}
                      onChange={e => setShowChildSection(e.target.checked)}
                      className="w-4 h-4 border-2 border-orange-400 rounded-md checked:border-orange-500 checked:bg-orange-500"
                    />
                    <span className="text-orange-800 font-medium text-14px">
                      {isEdit && selectedCommunity?.childCommunities?.length > 0 
                        ? "Manage child communities" 
                        : isEdit 
                          ? "Create child communities"
                          : "Create default child communities"}
                    </span>
                  </label>
                </div>
              </div>
              
              {showChildSection && childCommunities && childCommunities.length > 0 && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {childCommunities.map((community, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-4">
                        <div className="mb-2 font-semibold text-orange-700 text-14px">
                          {isEdit && selectedCommunity?.childCommunities?.length > 0 
                            ? `Community ${idx + 1}${community.id ? ` (ID: ${community.id})` : ''}`
                            : isEdit
                              ? `New Community ${idx + 1}`
                              : `Default Community ${idx + 1}`}
                        </div>
                        <input
                          type="text"
                          className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-14px"
                          value={community.title || ''}
                          onChange={e => {
                            if (isEdit && selectedCommunity?.childCommunities?.length > 0) return;
                            const arr = [...childCommunities];
                            arr[idx].title = e.target.value;
                            setChildCommunities(arr);
                          }}
                          placeholder="Community Name"
                          disabled={isEdit && selectedCommunity?.childCommunities?.length > 0}
                        />
                        <textarea
                          className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-14px resize-none"
                          value={community.desc || ''}
                          onChange={e => {
                            if (isEdit && selectedCommunity?.childCommunities?.length > 0) return;
                            const arr = [...childCommunities];
                            arr[idx].desc = e.target.value;
                            setChildCommunities(arr);
                          }}
                          placeholder="Description"
                          disabled={isEdit && selectedCommunity?.childCommunities?.length > 0}
                          rows="3"
                        />
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-14px"
                          value={community.visibility || 'MEMBERS_ONLY'}
                          onChange={e => {
                            if (isEdit && selectedCommunity?.childCommunities?.length > 0) return;
                            const arr = [...childCommunities];
                            arr[idx].visibility = e.target.value;
                            setChildCommunities(arr);
                          }}
                          disabled={isEdit && selectedCommunity?.childCommunities?.length > 0}
                        >
                          <option value="MEMBERS_ONLY">Members Only</option>
                          <option value="PARENT_MEMBERS_ONLY">Parent Members Only</option>
                        </select>
                        {(!isEdit || (isEdit && !selectedCommunity?.childCommunities?.length)) && (
                          <button
                            type="button"
                            className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors"
                            onClick={() => setChildCommunities(childCommunities.filter((_, i) => i !== idx))}
                            disabled={childCommunities.length <= 1 || (isEdit && selectedCommunity?.childCommunities?.length > 0)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {(!isEdit || (isEdit && !selectedCommunity?.childCommunities?.length)) && (
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-sm text-14px font-medium"
                      onClick={() =>
                        setChildCommunities([
                          ...childCommunities,
                          { title: "", desc: "", visibility: "MEMBERS_ONLY" }
                        ])
                      }
                      disabled={isEdit && selectedCommunity?.childCommunities?.length > 0}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Community
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Sticky Action Buttons */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 text-14px font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 text-14px font-semibold shadow-lg ${
              loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 hover:shadow-xl'
            }`}
            onClick={handleSubmit}
          >
            {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Community' : 'Create Community')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunityForm;