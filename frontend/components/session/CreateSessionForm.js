import {
  selectAllCommunities,
  setCommunities,
} from "@/store/features/communitySlice";
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
import { setAllExperts } from "@/store/features/expert";

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
      router.push(`http://localhost:3005/expert/session`);
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
  // const uploading=useSelector(selectUploading)
  const [uploading, setUploading] = useState(0);
  const allCommunities = useSelector(selectAllCommunities);
  const [error, setError] = useState("");
  const [repeatCount, setRepeatCount] = useState(2);
  const [communityId, setCommunityId] = useState(0);
  const [isCourseDisabled, setIsCourseDisabled] = useState(false);
  const urlRef = useRef("");
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

  const initResource = {
    id: 0,
    name: "",
    link: "",
    authorId: user.unifiedUser?.id,
  };
  const [count, setCount] = useState(0);

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
    if (sessionForm?.infoImgs) {
      urlRef.current = sessionForm?.infoImgs[0];
    }
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
  useEffect(async () => {
    const temp = await api.get("/tag");
    console.log(temp.data.tags);

    let tempData = temp.data.tags.map((item) => {
      return { id: item.name, text: item.name, originalId: item.id };
    });

    console.log(tempData);
    setSuggestions(tempData);
  }, []);

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

    if (formObj?.infoImgs.length === 0) {
      err.status = false;
      err.message = "Session cant be created without image";
    }
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

    setUploading(1);
    try {
      const checkBannerURL = await resolvesWhenUploaded();
      let postObj = JSON.parse(JSON.stringify(sessionForm));
      postSlots = sanitizer({ slotsx: postSlots });
      if (urlRef.current) {
        console.log(urlRef.current);
        postObj = { ...postObj, infoImgs: [urlRef.current], slots: postSlots };
      } else {
        console.log("reached");
        postObj = { ...postObj, slots: postSlots, infoImgs: [] };
      }
      if (communityId) {
        postObj = { ...postObj, communityId: communityId };
      } else {
        delete postObj.communityId;
      }
      console.log(postObj);
      let resultValidate = validateSessionform(postObj);
      if (!resultValidate.status) {
        // router.push('./')
        throw Error(resultValidate.message);
      }
      toast(checkBannerURL.msg, { type: "success" });

      // let tempTags = tags?.map((item) => {
      //   if (!isNaN(parseInt(item.id.split("-")[1]))) {
      //     return { id: parseInt(item.id.split("-")[1]), name: item.text };
      //   } else {
      //     return { name: item.text };
      //   }
      // });

      console.log("tags", tags);

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

        // sending request to 100ms for creating a room
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
        postObj = { ...postObj, roomId: roomId };

        const res = await api.post("/session", {
          session: { ...postObj, ...{ userCreatorId: Number(user?.id) } },
          resources: newResources,
        });
        toast(`Created session`, { type: "success" });
      } else {
        const res = await api.patch(`/session/${id}`, {
          ...postObj,
          id: parseInt(id),
        });
        toast(`Edit Session, ${postObj.title}`);
        router.push("/admin/session");
      }
      dispatch(setAllSessions());
      urlRef.current = "";
      setUploading(0);
      // router.replace(`/admin/session`);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (!err.status) {
      toast(err.message, { type: "error" });
    } else {
      if (isEdit) setMakeModal(true);
      else await createForm();
    }
    // console.log(deleteResources);
    // const resourcePost = {};
    // if (newResources.length > 0) {
    //   resourcePost = await api.post(
    //     `/resources/session/${window.location.pathname.split("/")[4]}`,
    //     newResources
    //   );
    // }
    // // console.log(resourcePost);
    // const deletePost = {};
    // if (deleteResources.length > 0) {
    //   deletePost = await api.delete(
    //     `/resources/session/${window.location.pathname.split("/")[4]}`,
    //     { data: { deleteResources } }
    //   );
    // }

    // const editPost = {};
    // if (resourceArr.length > 0) {
    //   editPost = await api.post(
    //     `/resources/session/edit/${window.location.pathname.split("/")[4]}`,
    //     resourceArr
    //   );
    // }
    // if (
    //   deletePost?.data?.success ||
    //   resourcePost?.data?.success ||
    //   editPost?.data.success
    // ) {
    //   router.push(`http://localhost:3005/expert/session`);
    // }
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

  return (
    <div className="createsessionform__container">
      <form
        className="createsessionform__form"
        method="POST"
        ref={form}
        onSubmit={handleSubmit}
      >
        <div className="input__group">
          <div className="input__group__header">
            <p>Basic Information</p>
          </div>
          <label htmlFor="title" className="label">
            <span className="label__text">
              Title
              <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              id="title"
              name="title"
              className="input"
              required
              value={sessionForm?.title}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="desc" className="label">
            <span className="label__text">
              Description
              <span className="text-red-500">*</span>
            </span>
            <textarea
              id="desc"
              name="desc"
              className="input"
              defaultValue={sessionForm?.desc}
              onChange={handleChange}
              required
            />
          </label>
          <label htmlFor="sessionType" className="label">
            <span className="label__text">
              Session Type
              <span className="text-red-500">*</span>
            </span>
            <label htmlFor="sessionType">
              <input
                type="radio"
                name="sessionType"
                value={sessionRoomType[1]}
                className="mr-2"
                required
                defaultChecked
                onChange={handleChange}
              />
              Allow everyone to speak
            </label>
            {/* <label htmlFor="sessionType">
              <input
                type="radio"
                name="sessionType"
                value={sessionRoomType[2]}
                className="mr-2"
                required
                onChange={handleChange}
              />
              Make everyone listener
            </label> */}
          </label>
          <div>
            <span className="label__text">Mention Category/ Add tags</span>
            <TagsInput
              tags={tags}
              setTags={setTags}
              suggestions={suggestions}
            />
          </div>

          <>
            <label
              className="label-checkbox"
              htmlFor={`session-isVideoChannel`}
            >
              <input
                type="checkbox"
                id={`session-videoChannel`}
                name="isVideoChannel"
                defaultValue={sessionForm?.isVideoChannel}
                onChange={handleChange}
              />
              <span className="label__text">
                {"Is the session a Video Channel?"}
              </span>
            </label>
            <label className="label-checkbox" htmlFor={`session-course`}>
              <input
                type="checkbox"
                id={`session-course`}
                name="isCourse"
                defaultValue={sessionForm.isCourse}
                onChange={handleChange}
                disabled={isCourseDisabled}
              />
              <span className="label__text">
                {"Is the session a course(group of slots sold as One)?"}
              </span>
            </label>
            {/* <label className="label-checkbox" htmlFor={`session-isexclusive`}>
              <input
                type="checkbox"
                id={`session-isexclusive`}
                name="isExclusive"
                defaultValue={sessionForm.isExclusive}
                onChange={handleChange}
              />
              <span className="label__text">
                {"Exclusive Session?"}
                <p className="text-sm text-gray-400 ml-4">
                  Session could only be accessible for a particular community
                </p>
              </span>
            </label> */}
          </>
          {sessionForm?.isExclusive && (
            <select
              defaultValue={sessionForm.communityId}
              onChange={handleChangeCommunity}
              value={item[0]?.title}
              name="communityId"
            >
              {allCommunities?.map((item) => (
                <option value={item.id}>{item.title}</option>
              ))}
            </select>
          )}
          {sessionForm.title && (
            <DependentImageUploader
              content={"Upload Session Image"}
              imgUrl={sessionForm.infoImgs[0]}
              bucket={"subspace-test0"}
              bucket_name={"session-images-0"}
              name={"infoImgs"}
              file_name={sessionForm.title}
              uploading={uploading}
              setUploading={setUploading}
              urlRef={urlRef}
              setError={setError}
              error={error}
            />
          )}
        </div>
        <div className="input__group">
          {!isEdit ? (
            <label className="label-checkbox" htmlFor={`session-course`}>
              <span className="label__text">
                {"Is it a recurring session?"}
              </span>
              <select
                className="input"
                name="isRecurring"
                id={`slot-recurring`}
                onChange={handleChange}
                defaultValue={"none"}
              >
                <option value={"none"}>Not Recurring</option>
                <option value={"weekly"} disabled>
                  Weekly Recurring
                </option>
                <option value={"monthly"} disabled>
                  Monthly Recurring
                </option>
              </select>
              <span className="text-sm text-gray-400">
                {"Weekly repetitive: eg, Every monday at 640pm."}
                <br />
                {" Monthly repetitive: eg, 15th of every month at 330pm"}
              </span>
            </label>
          ) : (
            <label className="label-checkbox" htmlFor={`session-course`}>
              <span className="label__text">
                {"Is it a recurring session?"}
              </span>
              <select
                className="input"
                name="isRecurring"
                id={`slot-recurring`}
                value={sessionForm.isRecurring}
              >
                <option value={"none"}>Not Recurring</option>
                <option value={"weekly"}>Weekly Recurring</option>
                <option value={"monthly"}>Monthly Recurring</option>
              </select>
              <span className="text-sm text-gray-400">
                {"You wont be able to change it now. Just for info."}
              </span>
            </label>
          )}
          {sessionForm?.isRecurring !== "none" && !isEdit && (
            <label className="label-checkbox" htmlFor={`session-number`}>
              <span className="label__text">{"How many repetitions?"}</span>
              <select
                className="input"
                name="number"
                id={`slot-number`}
                value={repeatCount}
                onChange={(e) => setRepeatCount(e.target.value)}
              >
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={5}>5x</option>
              </select>
            </label>
          )}
          <div className="input__group__header">
            <p>Session Slots</p>
            <button
              className="button button-blue"
              onClick={() => dispatch(addSlot())}
            >
              + Add Slot
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
            {!isEdit || sessionForm.isRecurring === "none"
              ? sessionForm.slots.map((slot, index) => {
                  return (
                    <SlotForm
                      key={"slot" + index + "form"}
                      slot={slot}
                      index={index}
                      comId={communityId}
                      allCommunities={allCommunities}
                    />
                  );
                })
              : decipherBaseSlots(
                  sessionForm.slots,
                  sessionForm.isRecurring
                )?.map((slot, index) => {
                  return (
                    <SlotForm
                      key={"slot" + index + "form"}
                      slot={slot}
                      index={index}
                      comId={communityId}
                      allCommunities={allCommunities}
                    />
                  );
                })}
          </div>
        </div>

        {/* resources */}
        {isEdit ? (
          resources
            .filter((x) => !deleteResources.some((y) => y.id === x.id))
            ?.map((item, index) => (
              <div className="">
                <label>Resource {index + 1}</label>
                <label htmlFor="resourceName" className="label">
                  <span className="label__text">Name</span>
                  <input
                    type="text"
                    id="res_name"
                    name="name"
                    className="input"
                    required
                    value={item.name}
                    onChange={handleExistingChange(index)}
                  />
                </label>
                <label htmlFor="resourceName" className="label">
                  <span className="label__text">Link</span>
                  <input
                    type="text"
                    id="res_name"
                    name="link"
                    className="input"
                    required
                    value={item.link}
                    onChange={handleExistingChange(index)}
                  />
                </label>
                <div className="mt-6">
                  <label
                    className="button button-blue flex-1"
                    onClick={
                      () => handleRemove(item)
                      // ()=>setResourceArr((ele)=>{
                      //   const arr = [...ele]
                      //   arr.splice(item.id,1)
                      //   return arr
                      // })
                    }
                  >
                    Remove
                  </label>
                </div>
              </div>
            ))
        ) : (
          <></>
        )}

        {newResources.map((item, index) => {
          return (
            <div className="">
              <label>
                Resource{" "}
                {isEdit
                  ? resources
                    ? index + 1 + resources.length
                    : index + 1
                  : index + 1}
              </label>
              <label htmlFor="resourceName" className="label">
                <span className="label__text">
                  Name
                  <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  id="res_name"
                  name="name"
                  className="input"
                  required
                  onChange={handleNewChange(index)}
                  value={item.name}
                />
              </label>
              <label htmlFor="resourceName" className="label">
                <span className="label__text">
                  Link
                  <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  id="res_name"
                  name="link"
                  className="input"
                  required
                  defaultValue={""}
                  onChange={handleNewChange(index)}
                  value={item.link}
                />
              </label>
              <div className="mt-6">
                <label
                  className="button button-blue flex-1"
                  onClick={() => handleRemoveResource(item)}
                >
                  Remove
                </label>
              </div>
            </div>
          );
        })}

        <label
          className="button button-blue flex-1"
          onClick={() => handleAddResource()}
        >
          Add New Resource
        </label>

        {isEdit && (
          <div className="flex flex-row flex-wrap gap-2" type="submit">
            <button className="button button-blue flex-1">Edit Session</button>

            <button
              className="button button-blue flex-1"
              onClick={handleDiscardChanges}
            >
              Discard Changes
            </button>
          </div>
        )}
        {!isEdit && (
          <div className="flex flex-row flex-wrap gap-2" type="submit">
            <button className="button button-blue flex-1">
              Create Session
            </button>

            <button
              className="button button-blue flex-1"
              onClick={handleClearForm}
            >
              Reset Form
            </button>
          </div>
        )}
      </form>
      {isEdit && makeModal ? (
        <Modal
          text={"Are you sure you want to make changes?"}
          setModal={setMakeModal}
          newResources={newResources}
          deleteResources={deleteResources}
          resourceArr={resourceArr}
          form={form}
          setResourceArr={setResourceArr}
          resources={resources}
          setNewResources={setNewResources}
          setDeleteResources={setDeleteResources}
          clearForm={clearForm}
          isEdit={true}
          urlRef={urlRef}
          createForm={createForm}
        />
      ) : (
        <></>
      )}
      {discardModal ? (
        <Modal
          text={"Are you sure you want to discard the changes?"}
          setModal={setDiscardModal}
          newResources={newResources}
          deleteResources={deleteResources}
          resourceArr={resourceArr}
          form={form}
          setResourceArr={setResourceArr}
          resources={resources}
          setNewResources={setNewResources}
          setDeleteResources={setDeleteResources}
          clearForm={clearForm}
          isEdit={false}
          urlRef={urlRef}
          createForm={createForm}
        />
      ) : (
        <></>
      )}
    </div>
  );
}

export default CreateSessionForm;
