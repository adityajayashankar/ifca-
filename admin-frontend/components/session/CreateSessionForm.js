import {
  selectAllCommunities,
  setCommunities,
} from "@/store/features/communitySlice";
import { setAllExperts } from "@/store/features/expert";
import { selectPartner } from "@/store/features/partnerSlice";
import {
  allSessions,
  oneSession,
  setAllSessions,
} from "@/store/features/session";
import { selectUser, setLoading } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import getFutureDates, { decipherBaseSlots } from "@/utils/findRecurring";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  addSlot,
  clearForm,
  initSession,
  mainDataFormOnChange,
  selectSession,
  updateInfoImg,
  updateBannerImg,
} from "../../store/features/createSessionSlice";
import DependentImageUploader from "../common/ParentImageUpload";
import SlotForm from "./SlotForm";

import TagsInput from "../common/Tags";
import axios from "axios";
import sessionRoomType from "@/utils/sessionRoomType";
import { RttRounded } from "@mui/icons-material";
import { selectSessionResources } from "@/store/features/resourceSlice";
import { validateConfig } from "next/dist/server/config-shared";
import session from "redux-persist/lib/storage/session";
import UploadImage from "../UploadImage";
import { MdTitle, MdDescription, MdGroup, MdLayers, MdLink, MdCollectionsBookmark } from 'react-icons/md';

const Modal = ({
  text,
  setModal,
  newResources,
  deleteResources,
  resourceArr,
  form,
  setResourceArr,
  resources,
  setNewResources,
  setDeleteResources,
  clearForm,
  isEdit,
  urlRef,
  createForm,
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const userType = user?.userType;


  const handleReset = () => {
    form.current.reset();
    setResourceArr([]);
    setNewResources([]);
    setDeleteResources([]);
    dispatch(clearForm());
    urlRef.current = "";
    setModal(false);
  };
  const handleYes = async () => {
    await createForm();
    const resourcePost = {};
    if (newResources.length > 0) {
      resourcePost = await api.post(
        `/resources/session/${window.location.pathname.split("/")[4]}`,
        newResources
      );
    }
    // console.log(resourcePost);
    const deletePost = {};
    if (deleteResources.length > 0) {
      deletePost = await api.delete(
        `/resources/session/${window.location.pathname.split("/")[4]}`,
        { data: { deleteResources } }
      );
    }

    const editPost = {};
    if (resourceArr.length > 0) {
      editPost = await api.post(
        `/resources/session/edit/${window.location.pathname.split("/")[4]}`,
        resourceArr
      );
    }
    if (
      deletePost?.data?.success ||
      resourcePost?.data?.success ||
      editPost?.data?.success
    ) {
      if (userType === 'admin') {
      router.push('/admin/session');
    } else if (userType === 'partner') {
      router.push('/partner/session'); 
    } 
    }
    setModal(false);
  };

  const handleNo = () => {
    setModal(false);
  };

  return (
    <div className="w-full h-full fixed top-0 left-0 backdrop-blur-md flex justify-center items-center">
      <div className="bg-white relative p-4 lg:min-w-[500px] ">
        <div className="p-1 text-xl pb-12 pt-4">{text}</div>
        <div className="flex justify-center items-center">
          <button
            className="w-full bg-red-600 px-2 py-1 m-1 text-white"
            onClick={isEdit ? handleYes : handleReset}
          >
            Yes
          </button>
          <button
            className="w-full bg-blue-600 px-2 py-1 m-1 text-white"
            onClick={handleNo}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

function CreateSessionForm({ isEdit, id }) {
  const form = useRef(null);

  const sessionForm = useSelector(selectSession);
  console.log("sessionForm", sessionForm);
  // const uploading=useSelector(selectUploading)
  const [uploading, setUploading] = useState(0);
  const allCommunities = useSelector(selectAllCommunities);
  const [error, setError] = useState("");
  const [repeatCount, setRepeatCount] = useState(2);
  const [communityId, setCommunityId] = useState(0);
  const [isCourseDisabled, setIsCourseDisabled] = useState(false);
  const urlRef = useRef("");
  const bannerUrlRef = useRef("");
  const [sessionImage, setSessionImage] = useState(sessionForm?.infoImgs[0])
  const [bannerImage, setBannerImage] = useState(sessionForm?.bannerImgs[0])
  console.log("urlRef", urlRef.current);
  const dispatch = useDispatch();
  const [tags, setTags] = useState([]);
  const user = useSelector(selectUser);

  const resources = useSelector(selectSessionResources);
  // const communities = useSelector(selectAllCommunities);
  const sessions = useSelector(allSessions);

  const [suggestions, setSuggestions] = useState([]);
  const [newResources, setNewResources] = useState([]);
  const [resourceArr, setResourceArr] = useState(resources);
  const [deleteResources, setDeleteResources] = useState([]);

  const [makeModal, setMakeModal] = useState(false);
  const [discardModal, setDiscardModal] = useState(false);

  const [count, setCount] = useState(0);

  const initResource = {
    id: 0,
    name: "",
    link: "",
    authorId: user?.unifiedUser?.id,
  };

  const handleAddResource = () => {
    setCount(count + 1);
    setNewResources([...newResources, { ...initResource, id: count }]);
  };

  const handleRemoveResource = (item) => {
    const arr = newResources.filter((x) => {
      // x.name != item.name && x.link != item.link;
      return x.id != item.id;
    });
    setCount(count - 1);
    setNewResources(arr);
  };
  useEffect(() => {
    dispatch(setAllExperts());
    dispatch(setCommunities({ take: 100, skip: 0 }));
  }, []);

  useEffect(() => {
    // if (sessionForm?.infoImgs) {
    //   urlRef.current = sessionForm?.infoImgs[0];
    // }
    if (sessionForm?.isExclusive && !communityId) {
      setCommunityId(sessionForm?.communityId || allCommunities[0]?.id);
    }
    // if (sessionForm?.tags) {
    //   let tempData = sessionForm?.tags.map((item) => {
    //     return {
    //       id: item.tag.name,
    //       text: item.tag.name,
    //       originalId: item.tag.id,
    //     };
    //   });
    //   // console.log(sess);
    //   setTags(tempData);
    // }
  }, [sessionForm]);
  const handleClearForm = (e) => {
    e.preventDefault();
    setDiscardModal(true);
    // form.current.reset();
    // setResourceArr(resources);
    // setNewResources([]);
    // setDeleteResources([]);
    // dispatch(clearForm());
    // urlRef.current = "";
  };
  // useEffect(async () => {
  //   const temp = await api.get("/tag");
  //   console.log(temp?.data?.tags);

  //   let tempData = temp.data.tags.map((item) => {
  //     return { id: item.name, text: item.name, originalId: item.id };
  //   });

  //   console.log(tempData);
  //   setSuggestions(tempData);
  // }, []);

  const handleRemove = (ele) => {
    const newArr = resources.filter((item) => item.id != ele.id);
    setResourceArr(newArr);
    resources = newArr;
    setDeleteResources((item) => [...item, ele]);
  };
  const handleExistingChange = (index) => (e) => {
    const editArr = resources.map((item, i) => {
      if (index == i)
        return {
          ...item,
          [e.target.name]: e.target.value,
          authorId: user.id,
        };
      else return item;
    });
    resources = editArr;
    // setResourceArr(editArr);
  };

  const handleNewChange = (index) => (e) => {
    setCount(count + 1);
    const newRes = newResources.map((item, i) => {
      if (index == i)
        return { ...item, [e.target.name]: e.target.value, id: index };
      else return item;
    });

    setNewResources(newRes);
  };
  const validate = () => {
    const titleRegex = new RegExp("[a-zA-Z]$");
    console.log(form.title);
    if (!titleRegex.test(sessionForm?.title)) {
      return { status: false, message: "Title not in correct format" };
    }
    // if(sessionForm.infoImgs[0].length === 0){
    //   return {status: false,message:"No image provided"}
    // }
    return { status: true, message: "Validation Successful" };
  };

  const validateSessionform = (formObj) => {
    let err = { status: true, message: "" };

    // infoImgs is now optional
    if (formObj?.slots.length < 1) {
      err.status = false;
      err.message = "Session cant be created without slots";
    }
    if (formObj?.title === "" || formObj?.title === " ") {
      err.status = false;
      err.message = "Title is Primary in search";
    }

    return err;
  };

  const resolvesWhenUploaded = () => {
    return new Promise((resolve, reject) => {
      let tries = 0;
      const inter = setInterval(() => {
        if (uploading === 2 || urlRef.current) {
          resolve({ msg: "Successfully uploaded" });
          clearInterval(inter);
        } else if (error || uploading === -1) {
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
  const bundleSlots = (slotsx, futureDates) => {
    let n = slotsx.length;
    let allSlots = JSON.parse(
      JSON.stringify(
        slotsx.map((item) => ({
          ...item,
          startTime: new Date(item.startTime).toISOString(),
          endTime: new Date(item.endTime).toISOString(),
        }))
      )
    );
    futureDates?.forEach((item, index) => {
      let obj = slotsx[index % n];
      obj = {
        ...obj,
        startTime: new Date(item.startTime).toISOString(),
        endTime: new Date(item.endTime).toISOString(),
      };
      allSlots.push(obj);
    });
    return allSlots;
  };

  const sanitizer = ({ slotsx }) => {
    return slotsx.map((item) => {
      if (item.isOnline && item.id && item.location) {
        delete item.speakers;
        return { ...item, location: item.location };
      }
      return item;
    });
  };

  const isDateTimePast = (dateTime) => {
    const selectedDateTime = new Date(dateTime);
    const currentDateTime = new Date();
    return selectedDateTime < currentDateTime;
  };

  const createForm = async () => {
    let postSlots = bundleSlots(sessionForm.slots, []);

    let slots = sessionForm?.slots;

    if (slots.length > 0) {
      slots.forEach((slot) => {
        if (isDateTimePast(slot.startTime) || isDateTimePast(slot.endTime)) {
          toast.error("Slot start or end time is in the past!");
        }
      });
    }

    if (sessionForm.isRecurring !== "none" && !isEdit) {
      let futureDates = getFutureDates(
        sessionForm?.slots.map((item) => ({
          startTime: item.startTime,
          endTime: item.endTime,
        })),
        sessionForm.isRecurring,
        parseInt(repeatCount)
      );
      postSlots = bundleSlots(sessionForm.slots, futureDates);
    }

    try {
      let postObj = JSON.parse(JSON.stringify(sessionForm));
      postObj = { ...postObj, infoImgs: sessionImage ? [sessionImage] : [sessionForm.infoImgs[0]], slots: postSlots };
      postSlots = sanitizer({ slotsx: postSlots });
      // if (urlRef.current) {
      //   console.log(urlRef.current);
      //   // postObj = { ...postObj, infoImgs: sessionImage, slots: postSlots };
      // } else {
      //   console.log("reached");
      //   postObj = { ...postObj, slots: postSlots, infoImgs: [] };
      // }
      if (communityId) {
        postObj = { ...postObj, communityId: communityId };
      } else {
        delete postObj.communityId;
      }
      console.log(postObj);
      let resultValidate = validateSessionform(postObj);
      if (!resultValidate.status) {
        throw Error(resultValidate.message);
      }

      let tempTags = tags?.map((item) => {
        if (!parseInt(item?.originalId)) {
          return { id: parseInt(item.originalId), name: item.text };
        } else {
          return { name: item.text };
        }
      });
      console.log("tempTags", tempTags);
      if (tempTags) {
        postObj = { ...postObj, tagsData: tempTags };
      } else {
        postObj = { ...postObj };
      }
      delete postObj.tags;
      console.log(postObj);

      if (!isEdit) {
        console.log("before creating token ");
        const tkn = await api.get("/session/token");

        console.log("token value is ", tkn.data.token);
        const config = {
          headers: {
            Authorization: `Bearer ${tkn.data.token}`,
            "Content-Type": "application/json",
          },
        };

        let roomName = postObj.title.replace(/ /g, "_");
        console.log("room name is ", roomName);

        const response = await axios.post(
          "https://api.100ms.live/v2/rooms",
          {
            name: roomName || "Sample Room",
            description: "This is a sample description for the room",
          },
          config
        );

        const roomId = response?.data?.id;

        console.log("room id is", roomId);
        postObj = { ...postObj, roomId: roomId, creatorId: user?.unifiedUser?.id };

        await api.post("/session", {
          session: postObj,
          resources: newResources,
        }).then((res) => {
          toast(`Created session`, { type: "success" });
          router.back()

        }).catch((err) => {
          console.log('error creating session', err)
        })

      } else {
        const res = await api.patch(`/session/${id}`, {
          ...postObj,
          id: parseInt(id),
        });
        toast(`Edit Session, ${postObj.title}`);
        router.push("/admin/session");
      }
      // dispatch(setAllSessions());
      // urlRef.current = "";
      // setUploading(0);
    } catch (error) {
      if (error.msg) {
        console.log("toast  working");

        toast(error.msg, { type: "error" });
      } else {
        console.log("toast not working");
        console.log(error.message);
        toast(error.message, { type: "error" });
      }
      console.log(error);
    }
  };

  const onUploadSuccess=(url)=>{
    setSessionImage(url)
    dispatch(updateInfoImg([url]))
  }

  const onBannerUploadSuccess=(url)=>{
    setBannerImage(url)
    dispatch(updateBannerImg(url));
  }

  const [formChanged, setFormChanged] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  // Helper: Check if required fields are filled
  useEffect(() => {
    const required = {
      title: !!sessionForm.title?.trim(),
      desc: !!sessionForm.desc?.trim(),
      sessionType: !!sessionForm.sessionType,
      slots: Array.isArray(sessionForm.slots) && sessionForm.slots.length > 0,
      bannerImgs: true, // Banner image is now optional
    };
    
    // Debug logging
    console.log('Form Validation Debug:', {
      title: required.title,
      desc: required.desc,
      sessionType: required.sessionType,
      slots: required.slots,
      bannerImgs: required.bannerImgs,
      bannerImage,
      sessionFormBannerImgs: sessionForm.bannerImgs,
      isFormValid: Object.values(required).every(Boolean)
    });
    
    setErrors({
      title: required.title ? null : "Title is required",
      desc: required.desc ? null : "Description is required",
      sessionType: required.sessionType ? null : "Session type is required",
      slots: required.slots ? null : "At least one slot is required",
      bannerImgs: null, // Banner image is now optional, so no error display
    });
    setIsFormValid(Object.values(required).every(Boolean));
  }, [sessionForm, bannerImage]);

  // Helper: Track form changes for Edit
  const initialFormRef = useRef();
  useEffect(() => {
    if (isEdit && !initialFormRef.current) {
      initialFormRef.current = JSON.stringify(sessionForm);
    }
    if (isEdit && initialFormRef.current) {
      setFormChanged(JSON.stringify(sessionForm) !== initialFormRef.current);
    }
  }, [sessionForm, isEdit]);

  // Handle submit with confirmation for update
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log('Submit button clicked!');
    console.log('Form validation state:', { isFormValid, isEdit, formChanged });
    
    if (!isFormValid) {
      console.log('Form is not valid, preventing submission');
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (isEdit) {
      console.log('Edit mode, showing confirmation');
      setShowUpdateConfirm(true);
    } else {
      console.log('Creating new session...');
      await createForm();
    }
  };

  // Confirm update
  const handleUpdateConfirm = async () => {
    setShowUpdateConfirm(false);
    await createForm();
  };

  const handleChange = (e) => {
    const { type } = e.target;
    if (e.target.name === "isVideoChannel") {
      console.log("in is videoChannel");
      console.log(sessionForm);
      setIsCourseDisabled(!isCourseDisabled);
    }
    if (type === "checkbox") {
      dispatch(
        mainDataFormOnChange({
          name: e.target.name,
          value: e.target.checked,
        })
      );
    } else {
      console.log("hi");
      const alphanumericRegex = /^[a-zA-Z0-9\s]*$/;
      console.log(e.target.name);
      console.log(e.target.value);

      if (e.target.name == "title" && !alphanumericRegex.test(e.target.value)) {
        return;
      }

      dispatch(
        mainDataFormOnChange({
          name: e.target.name,
          value: e.target.value,
        })
      );
    }
  };

  const handleChangeCommunity = (e) => {
    e?.preventDefault();
    setCommunityId(parseInt(e.target.value));
  };
  const router = useRouter();
  const handleDiscardChanges = () => {
    // router.replace(`/admin/session`);
    setDiscardModal(true);
  };

  const handleChangeImg = (e) => {
    dispatch(updateInfoImg(e.target.value));
  };

  const handleSessionChange = (e) => {
    console.log(e.target.value);
  };

  console.log();

  // useEffect(() => {
  //   let postObj = JSON.parse(JSON.stringify(sessionForm))
  //   if (urlRef.current) {
  //     postObj = { ...postObj, infoImgs: [urlRef.current] }
  //   }
  // }, [urlRef.current]);

  return (
    <>
      {/* Compact Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <MdLayers className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-16px font-bold">
          {isEdit ? 'Edit Session' : 'Create New Session'}
        </h1>
              <p className="text-12px text-orange-100">
                {isEdit ? 'Update your session details' : 'Build an engaging session for your community'}
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
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-10px font-bold ${sessionForm.title ? 'bg-white text-orange-600' : 'bg-white bg-opacity-30 text-white'}`}>
                {sessionForm.title ? '✓' : '2'}
              </div>
              <span className="text-10px font-medium">Details</span>
            </div>
            <div className="w-4 h-0.5 bg-white bg-opacity-50"></div>
            <div className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-10px font-bold ${sessionForm.slots.length > 0 ? 'bg-white text-orange-600' : 'bg-white bg-opacity-30 text-white'}`}>
                {sessionForm.slots.length > 0 ? '✓' : '3'}
              </div>
              <span className="text-10px font-medium">Slots</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable Form Content */}
      <div className="bg-gray-50">
      <form
          className="max-w-7xl mx-auto p-4 space-y-4"
        method="POST"
        ref={form}
        onSubmit={handleSubmit}
      >
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="title" className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                    className={`w-full px-4 py-3 border ${errors.title ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300`}
                  required
                  value={sessionForm.title}
                  onChange={handleChange}
                  disabled={isEdit && user?.userType === 'expert'}
                    placeholder="Enter an engaging session title..."
                  />
                  {errors.title && <span className="text-red-500 text-12px mt-1 block">{errors.title}</span>}
          </div>

              <div className="form-group">
                  <label className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Session Type
                  </label>
                  {(user?.userType === "admin" || user?.userType === "partner") ? (
                    <div className="flex w-full rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shadow-sm">
                  <button
                    type="button"
                        className={`flex-1 py-3 text-14px font-semibold transition-all duration-200 focus:outline-none ${sessionForm.sessionType === sessionRoomType[1] ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-orange-50'}`}
                    onClick={() => handleChange({ target: { name: 'sessionType', value: sessionRoomType[1] } })}
                  >
                    Everyone can speak
                  </button>
                  <button
                    type="button"
                        className={`flex-1 py-3 text-14px font-semibold transition-all duration-200 focus:outline-none ${sessionForm.sessionType === sessionRoomType[2] ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-orange-50'}`}
                    onClick={() => handleChange({ target: { name: 'sessionType', value: sessionRoomType[2] } })}
                  >
                    Everyone is listener
                  </button>
                </div>
                  ) : (
                    <div className="px-4 py-3 bg-gray-100 rounded-lg text-14px text-gray-600">
                      {sessionForm.sessionType || 'Not specified'}
              </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="desc" className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="desc"
                  name="desc"
                  rows="3"
                  className={`w-full px-4 py-3 border ${errors.desc ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300 resize-none`}
                  value={sessionForm.desc || ''}
                  onChange={handleChange}
                  required
                  disabled={isEdit && user?.userType === 'expert'}
                  placeholder="Describe what participants will learn or experience..."
                />
                {errors.desc && <span className="text-red-500 text-12px mt-1 block">{errors.desc}</span>}
              </div>
            </div>
        </div>

          {/* Session Options Section */}
          {(user?.userType === "admin" || user?.userType === "partner") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <MdLayers className="text-white text-sm" />
              </div>
                  <div>
                    <h2 className="text-16px font-bold text-gray-900">Session Options</h2>
                    <p className="text-12px text-gray-600">Configure session behavior and settings</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Checkboxes */}
                  <div className="space-y-4">
                    <h3 className="text-14px font-semibold text-gray-800 mb-3">Session Features</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-orange-50 transition-colors">
                  <input
                    type="checkbox"
                    id="session-videoChannel"
                    name="isVideoChannel"
                          className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-md checked:border-orange-500 checked:bg-orange-500 focus:ring-2 focus:ring-orange-500 transition-all"
                    checked={sessionForm.isVideoChannel}
                    onChange={handleChange}
                  />
                        <span className="w-4 h-4 flex items-center justify-center border-2 border-gray-300 rounded-md bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all">
                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                        <div>
                          <span className="text-14px font-medium text-gray-700 group-hover:text-orange-600 transition-colors">Video Channel</span>
                          <p className="text-12px text-gray-500">Enable video streaming capabilities</p>
                        </div>
                </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-orange-50 transition-colors">
                  <input
                    type="checkbox"
                    id="session-course"
                    name="isCourse"
                          className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-md checked:border-orange-500 checked:bg-orange-500 focus:ring-2 focus:ring-orange-500 transition-all"
                    checked={sessionForm.isCourse}
                    onChange={handleChange}
                    disabled={isCourseDisabled}
                  />
                        <span className="w-4 h-4 flex items-center justify-center border-2 border-gray-300 rounded-md bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all">
                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                        <div>
                          <span className="text-14px font-medium text-gray-700 group-hover:text-orange-600 transition-colors">Course Mode</span>
                          <p className="text-12px text-gray-500">Group slots sold as one package</p>
                        </div>
                </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-orange-50 transition-colors">
                  <input
                    type="checkbox"
                    id="session-isexclusive"
                    name="isExclusive"
                          className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-md checked:border-orange-500 checked:bg-orange-500 focus:ring-2 focus:ring-orange-500 transition-all"
                    checked={sessionForm.isExclusive}
                    onChange={handleChange}
                  />
                        <span className="w-4 h-4 flex items-center justify-center border-2 border-gray-300 rounded-md bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all">
                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                        <div>
                          <span className="text-14px font-medium text-gray-700 group-hover:text-orange-600 transition-colors">Exclusive Session</span>
                          <p className="text-12px text-gray-500">Limit access to specific community</p>
                        </div>
                </label>
              </div>
                  </div>
                  
                  {/* Community Selection */}
                  <div className="space-y-4">
                    <h3 className="text-14px font-semibold text-gray-800 mb-3">Community Settings</h3>
                    {sessionForm?.isExclusive ? (
                      <div className="space-y-3">
                        <label className="block text-14px font-medium text-gray-700">
                    Select Community
                  </label>
                  <select
                    value={sessionForm.communityId || communityId}
                    onChange={handleChangeCommunity}
                    name="communityId"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
                  >
                    {allCommunities?.map((item) => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
                </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-12px">Enable "Exclusive Session" to select a specific community</span>
                        </div>
            </div>
          )}

                    {/* Tags Input */}
                    <div className="space-y-2">
                      <label className="block text-14px font-medium text-gray-700">
                        Category & Tags
              </label>
                      <TagsInput
                        tags={tags}
                        setTags={setTags}
                        suggestions={suggestions}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Session Images Section */}
          {(user?.userType === "admin" || user?.userType === "partner") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <MdCollectionsBookmark className="text-white text-sm" />
                  </div>
                  <div>
                    <h2 className="text-16px font-bold text-gray-900">Session Images</h2>
                    <p className="text-12px text-gray-600">Add compelling images to attract participants</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Images Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Banner Image (Landscape 1200x630) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <h3 className="text-16px font-semibold text-gray-900">Banner Image</h3>
                      <span className="text-12px text-gray-500">(Landscape format - 1200x630)</span>
                    </div>
                    <div className="w-full">
              <UploadImage
                folder="session"
                        imgUrl={bannerImage || sessionForm.bannerImgs[0]}
                        urlRef={bannerUrlRef}
                        onUploadSuccess={onBannerUploadSuccess}
                        previewAspectRatio="1200/630"
                      />
                    </div>
                  </div>

                  {/* Info Image (Square 400x400) - Optional */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <h3 className="text-16px font-semibold text-gray-900">Info Image</h3>
                      <span className="text-12px text-gray-500">(Square format - 400x400)</span>
                      <span className="text-12px text-gray-400">(Optional)</span>
                    </div>
                    <div className="w-full">
                      <UploadImage
                        folder="session"
                        imgUrl={sessionImage || sessionForm.infoImgs[0]}
                urlRef={urlRef}
                onUploadSuccess={onUploadSuccess}
                        aspectRatio="1:1"
                        previewAspectRatio="1/1"
              />
            </div>
                  </div>
        </div>

                {/* Image Guidelines */}
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-14px font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Image Guidelines
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-12px font-semibold text-blue-700 mb-2">Banner Image (Required)</h5>
                      <div className="space-y-1 text-12px text-blue-600">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>Landscape format (1200x630)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>Any aspect ratio allowed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>Max 2MB file size</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-12px font-semibold text-blue-700 mb-2">Info Image (Optional)</h5>
                      <div className="space-y-1 text-12px text-blue-600">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>Square format (400x400)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>1:1 aspect ratio required</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>Max 2MB file size</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center gap-2 text-12px text-blue-600">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span>Supported formats: JPG, PNG, GIF</span>
                    </div>
                  </div>
                </div>
                
                {/* Banner and info images are now optional, so no error display */}
              </div>
            </div>
          )}

          {/* Session Slots Section */}
          {(user?.userType === "admin" || user?.userType === "partner") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <MdLayers className="text-white text-sm" />
              </div>
                    <div>
                      <h2 className="text-16px font-bold text-gray-900">Session Slots</h2>
                      <p className="text-12px text-gray-600">Schedule your session time slots</p>
                    </div>
                  </div>
                <button
                  type="button"
                  onClick={() => dispatch(addSlot())}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all flex items-center gap-2 shadow-sm text-14px font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Slot
                </button>
              </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isEdit || sessionForm.isRecurring === "none"
                  ? sessionForm.slots.map((slot, index) => (
                      <SlotForm
                        key={"slot" + index + "form"}
                        slot={slot}
                        index={index}
                        comId={communityId}
                        allCommunities={allCommunities}
                      />
                    ))
                  : decipherBaseSlots(sessionForm.slots, sessionForm.isRecurring)?.map((slot, index) => (
                      <SlotForm
                        key={"slot" + index + "form"}
                        slot={slot}
                        index={index}
                        comId={communityId}
                        allCommunities={allCommunities}
                      />
                    ))}
              </div>
                {errors.slots && <span className="text-red-500 text-12px mt-2 block">{errors.slots}</span>}
              </div>
            </div>
          )}

          {/* Resources Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <MdLink className="text-white text-sm" />
            </div>
                  <div>
                    <h2 className="text-16px font-bold text-gray-900">Resources</h2>
                    <p className="text-12px text-gray-600">Add helpful materials for participants</p>
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
            <div className="p-6">
              <div className="space-y-4">
              {/* Existing Resources */}
              {isEdit && resources
                .filter((x) => !deleteResources.some((y) => y.id === x.id))
                ?.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h3 className="text-16px font-medium text-gray-900 mb-3">Resource {index + 1}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="form-group">
                          <label className="block text-14px font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          name="name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-14px"
                          value={item.name}
                          onChange={handleExistingChange(index)}
                        />
                      </div>
                      <div className="form-group">
                          <label className="block text-14px font-medium text-gray-700 mb-1">Link</label>
                        <input
                          type="text"
                          name="link"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-14px"
                          value={item.link}
                          onChange={handleExistingChange(index)}
                        />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        className="mt-3 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-14px"
                      >
                        Remove Resource
                      </button>
                  </div>
                ))}
                
              {/* New Resources */}
              {newResources.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-16px font-medium text-gray-900 mb-3">
                    New Resource {isEdit ? index + 1 + resources.length : index + 1}
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
                        value={item.name}
                        onChange={handleNewChange(index)}
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
                        value={item.link}
                        onChange={handleNewChange(index)}
                      />
                    </div>
                    </div>
                    <div className="flex gap-4 mt-3">
                      <label className="flex items-center gap-2 cursor-pointer group text-14px">
                        <input
                          type="checkbox"
                          name="isPreSession"
                          checked={item.isPreSession || false}
                          onChange={(e) => handleNewChange(index)({ target: { name: "isPreSession", value: e.target.checked } })}
                          className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-md checked:border-orange-500 checked:bg-orange-500 focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                        <span className="w-4 h-4 flex items-center justify-center border-2 border-gray-300 rounded-md bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all">
                          <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                        <span className="text-gray-700 group-hover:text-orange-600 transition-colors">Pre-Session</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group text-14px">
                        <input
                          type="checkbox"
                          name="isPostSession"
                          checked={item.isPostSession || false}
                          onChange={(e) => handleNewChange(index)({ target: { name: "isPostSession", value: e.target.checked } })}
                          className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-md checked:border-orange-500 checked:bg-orange-500 focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                        <span className="w-4 h-4 flex items-center justify-center border-2 border-gray-300 rounded-md bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all">
                          <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                        <span className="text-gray-700 group-hover:text-orange-600 transition-colors">Post-Session</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(item)}
                      className="mt-3 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-14px"
                    >
                      Remove Resource
                    </button>
                </div>
              ))}
            </div>
          </div>
          </div>
        </form>
        </div>

        {/* Action Buttons - not sticky, just at the bottom of the form */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 text-14px font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`px-6 py-2.5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 text-14px font-semibold shadow-lg ${
                !isFormValid ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 hover:shadow-xl'
              }`}
            >
              {isEdit ? 'Update Session' : 'Create Session'}
            </button>
          </div>
        </div>
      
      {/* Update Confirmation Modal */}
      {showUpdateConfirm && (
        <Modal
          text="Are you sure you want to update this session?"
          setModal={setShowUpdateConfirm}
          newResources={newResources}
          deleteResources={deleteResources}
          resourceArr={resourceArr}
          form={form}
          setResourceArr={setResourceArr}
          resources={resources}
          setNewResources={setNewResources}
          setDeleteResources={setDeleteResources}
          clearForm={handleClearForm}
          isEdit={isEdit}
          urlRef={urlRef}
          createForm={handleUpdateConfirm}
        />
      )}
    </>
  );
}

export default CreateSessionForm;
