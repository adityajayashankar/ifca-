import {
  selectCommunity,
  setCommunities,
} from "@/store/features/communitySlice";
import {
  selectGroup,
  setCommunityGroups,
} from "@/store/features/subCommunitySlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DependentImageUploader from "../common/ParentImageUpload";

const CreateSubCommunityForm = ({ isEdit, baseURL }) => {
  const formRef = useRef();
  const router = useRouter();
  const selectedCommunity = useSelector(selectCommunity);
  const selectedGroup = useSelector(selectGroup);

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  // creatorID to be replaced by the authed admin ID
  // const [uploading,set]
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const urlRef = useRef("");
  const initObj = {
    name: "",
    desc: "",
    photoURL: "",
    communityId: selectedCommunity.id,
  };
  const [communityForm, setCommunityForm] = useState(initObj);
  const handleChange = (e) => {
    setCommunityForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleClearForm = (e) => {
    e?.preventDefault();
    formRef.current.reset();
    setCommunityForm(initObj);
  };
  const handleDiscardChanges = (e) => {
    e.preventDefault();
    router.replace(`/${baseURL}/community/${selectedCommunity.id}`);
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast("Login & try again", { type: "warning" });
      router.replace(`/`);
      return;
    }
    try {
      setUploading(1);
      const checkBannerURL = await resolvesWhenUploaded();
      toast(checkBannerURL.msg, { type: "success" });
      if (!isEdit) {
        let postObj = communityForm;
        postObj = { ...postObj, photoURL: urlRef.current };
        // console.log(postObj)

        api.post(`/subcommunity`, { ...postObj }).then((res) => {
          if (res.data.community) {
            toast(`Successfully Created Group`, { type: "success" });
            dispatch(setCommunityGroups(selectedCommunity.id));
            handleClearForm();
            setUploading(0);
            urlRef.current = "";
            router.push(`/${baseURL}/community/${selectedCommunity.id}`);
          }
        });

        handleClearForm();
      } else {
        const id = selectedGroup.id;
        const { name, desc, photoURL, communityId } = communityForm;

        let obj = {
          name,
          desc,
          photoURL: urlRef.current,
          communityId: parseInt(communityId),
        };
        api.patch(`/subcommunity/${id}`, obj).then((res) => {
          if (res.data) {
            toast(`Successfully Updated`, { type: "success" });
          }
        });
        router.push(`/${baseURL}/community/${selectedCommunity.id}`);
      }
    } catch (error) {
      toast(error.msg, { type: "error" });
      console.log(error);
    }
  };
  useEffect(() => {
    if (isEdit && selectedGroup) {
      setCommunityForm(selectedGroup);
      urlRef.current = selectedGroup.photoURL;
    }
  }, []);
  return (
    <div className="createsessionform__container">
      <form
        className="createsessionform__form"
        method="POST"
        ref={formRef}
        onSubmit={handleSubmit}
      >
        <div className="input__group">
          <div className="input__group__header">
            <p>Basic Information</p>
          </div>

          <label htmlFor="name" className="label">
            <span className="label__text">Group name</span>
            <input
              type="text"
              id="title"
              name="name"
              className="input"
              required
              defaultValue={communityForm.name}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="name" className="label">
            <span className="label__text">Community</span>
            <input
              type="text"
              id="title"
              name="name"
              className="input"
              required
              defaultValue={selectedCommunity?.title}
              readOnly={isEdit}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="desc" className="label">
            <span className="label__text">Description</span>
            <textarea
              id="desc"
              name="desc"
              className="input"
              defaultValue={communityForm.desc}
              onChange={handleChange}
              required
            />
          </label>

          {communityForm.name && (
            <DependentImageUploader
              content={"Click to Upload Banner Image"}
              imgUrl={communityForm.photoURL}
              bucket={"subspace-test0"}
              bucket_name={"subcommunity-0"}
              name={"photoURL"}
              file_name={communityForm.name}
              uploading={uploading}
              setUploading={setUploading}
              setError={setError}
              error={error}
              urlRef={urlRef}
            />
          )}
        </div>
        {isEdit && (
          <div className="flex flex-row flex-wrap gap-2" type="submit">
            <button className="button button-blue flex-1">Edit Group</button>

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
            <button className="button button-blue flex-1">Create Group</button>

            <button
              className="button button-blue flex-1"
              onClick={handleClearForm}
            >
              Reset Form
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateSubCommunityForm;
