import CategoryCard from "@/components/community/categorycard";
import {
  selectAllCommunities,
  selectAllSessions,
} from "@/store/features/resourceSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import Card from "@/components/common/Card";
import { useRouter } from "next/router";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import ResourceCarousel from "@/components/common/ResourceCarousel";
import { selectExpertSessions } from "@/store/features/expert";

const AddResource = () => {
  const form = useRef(null);
  const allCommunities = useSelector(selectAllCommunities);
  const allSessions = useSelector(selectExpertSessions);
  const user = useSelector(selectUser);
  const router = useRouter();

  const [resource, setResource] = useState({
    name: "",
    link: "",
    authorId: user?.unifiedUser?.id,
    sessionArr: [],
    communityArr: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setResource({ 
      ...resource, 
      [name]: type === "checkbox" ? checked : value 
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.post(`/resources/-1`, resource);
    if (res.data.success) {
      router.push(`/expert/resources`);
    }
  };
  const handleSelectCommunity = (item) => {
    const arr = resource.communityArr;
    arr.push(item);
    setResource({ ...resource, communityArr: arr });
  };
  const handleSelectSession = (item) => {
    const arr = resource.sessionArr;
    arr.push(item);
    setResource({ ...resource, sessionArr: arr });
  };
  const handleDeleteCommunity = (item) => {
    setResource({
      ...resource,
      communityArr: resource.communityArr.filter((x) => x.id != item.id),
    });
  };
  const handleDeleteSession = (item) => {
    setResource({
      ...resource,
      sessionArr: resource.sessionArr.filter((x) => x.id != item.id),
    });
  };
  const handleClearForm = (e) => {
    e.preventDefault();
    form.current.reset();
    setResource({
      name: "",
      link: "",
      sessionArr: [],
      communityArr: [],
      authorId: user.unifiedUserId.id,
      isPreSession: false, 
      isPostSession: false, 
    });
  };
  return (
    <div className="flex justify-center items-center">
      <div className="createsessionform__container">
        <form
          ref={form}
          onSubmit={handleSubmit}
          method="POST"
          className="createsessionform__form"
        >
          <div className="input__group">
            <div className="input__group__header">
              <p>Create A Resource</p>
            </div>
            <label htmlFor="name" className="label">
              <span className="label__text">
                Name
                <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                id="name"
                name="name"
                className="input"
                required
                value={resource.name || ""}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="link" className="label">
              <span className="label__text">
                Link
                <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                id="link"
                name="link"
                className="input"
                required
                value={resource.link || ""}
                onChange={handleChange}
              />
            </label>
            <span className="label__text pt-4 text-xl">
              {resource.communityArr.length ? (
                <div>Communities having this resource :</div>
              ) : (
                <></>
              )}
            </span>

            <ResourceCarousel
              arr={resource.communityArr}
              isCommunity={true}
              isDelete={true}
              fun={handleDeleteCommunity}
              baseURL={"expert"}
            />

            <span className="label__text pt-4 text-xl">
              Available Communities :{" "}
            </span>

            <ResourceCarousel
              arr={allCommunities?.filter(
                (x) => !resource.communityArr?.some((i) => i.id === x.id)
              )}
              isCommunity={true}
              isDelete={false}
              fun={handleSelectCommunity}
              baseURL={"expert"}
            />

            <span className="label__text pt-4 text-xl">
              {resource.sessionArr.length ? (
                <div>Sessions having this resource :</div>
              ) : (
                <></>
              )}
            </span>

            {resource?.sessionArr?.length > 0 && <div className="flex gap-4">
              <label htmlFor="preSession" className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="preSession"
                  name="isPreSession"
                  checked={resource.isPreSession}
                  onChange={handleChange}
                />
                Display Resource Pre-Session
              </label>

              <label htmlFor="postSession" className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="postSession"
                  name="isPostSession"
                  checked={resource.isPostSession}
                  onChange={handleChange}
                />
                Display Resource Post-Session
              </label>
            </div>}

            <ResourceCarousel
              arr={resource.sessionArr}
              isCommunity={false}
              isDelete={true}
              fun={handleDeleteSession}
              baseURL={"expert"}
            />

            <span className="label__text pt-4 text-xl">Available Sessions:</span>
            <ResourceCarousel
              arr={allSessions?.filter(
                (x) => !resource.sessionArr?.some((i) => i.id === x.id)
              )}
              isCommunity={false}
              isDelete={false}
              fun={handleSelectSession}
              baseURL={"expert"}
            />
          </div>

          <div className="flex flex-row flex-wrap gap-2" type="submit">
            <button className="button button-blue flex-1">Add Resource</button>

            <button
              className="button button-blue flex-1"
              onClick={handleClearForm}
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResource;
