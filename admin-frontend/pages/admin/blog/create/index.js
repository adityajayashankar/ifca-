import Markup from "@/components/blog/BlogMarkup";
import TagsInput from "@/components/common/Tags";
import {
  selectAllCommunities,
  setCommunities,
} from "@/store/features/communitySlice";
import {
  selectGlobalTags,
  selectUser,
  setAllTags,
} from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import React, { useState, useRef, useEffect } from "react";
import { GiConfirmed } from "react-icons/gi";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
const BlogCreatePage = () => {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState(true);
  const [glance, setGlance] = useState("");
  const [privatex, setPrivate] = useState(false);
  const [privateCommunity, setPrivateCommunity] = useState(null);
  const [tags, setTags] = useState([]);
  const [preview, setPreview] = useState(false);
  const [title, setTitle] = useState("My First Blog");
  const [changeTitle, setChangeTitle] = useState(false);
  const dispatch = useDispatch();
  const loggedUser = useSelector(selectUser);
  const globalTags = useSelector(selectGlobalTags);
  const communities = useSelector(selectAllCommunities);
  const divRef = useRef();
  const router = useRouter();
  useEffect(() => {
    dispatch(setAllTags());
    dispatch(setCommunities());
  }, []);
  useEffect(() => {
    if (communities) {
      setPrivateCommunity(communities[0]);
    }
  }, [communities]);
  useEffect(() => {
    console.log("divRef", divRef.current);
    if (divRef.current) {
      divRef.current.innerHTML = content;
    }
  }, [preview, divRef.current, content]);

  const viewPreview = () => {
    setPreview((prev) => !prev);
    // divRef.current.innerHTML = content;
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    let obj = {
      title,
      content,
      draft: true,
      unifiedUserId: loggedUser.unifiedUserId.id,
    };
    api.post(`/blog`, obj).then((res) => {
      toast(`Saved Draft`, { type: "success" });
    });
  };

  const handlePublish = (e) => {
    if (preview) {
      let tempTags = tags?.map((item) => {
        if (!isNaN(parseInt(item.id.split("-")[1]))) {
          return { id: parseInt(item.id.split("-")[1]), name: item.text };
        } else {
          return { name: item.text };
        }
      });
      let obj = {
        title,
        content,
        draft: false,
        glance,
        isPrivate: privatex,
        unifiedUserId: loggedUser?.unifiedUser?.id,
        tagsData: tempTags,
      };

      if (privatex) {
        obj = { communityId: privateCommunity, ...obj };
      }

      api.post(`/blog`, obj).then((res) => {
        router.push(`/admin/blog`);
      });
    } else {
      setPreview(true);
    }
  };
  return (
    <div className="min-h-screen">
      {!preview ? (
        <div className="mx-8 mt-8">
          {changeTitle ? (
            <div className="flex">
              <input
                className="bg-gray-200 p-4 text-step-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button
                onClick={() => setChangeTitle(false)}
                className="text-2xl text-green-500 mx-3"
              >
                <GiConfirmed />
              </button>
            </div>
          ) : (
            <h1
              className="input__group__header my-4"
              onClick={() => setChangeTitle(true)}
            >
              {title}
            </h1>
          )}

          <p className="text-sm text-gray-500 my-4">
            Click on the title to change the title
          </p>
          <div className="text-center">
            <Markup data={content} setData={setContent} noSend />
            <div className="flex flex-col md:flex-row items-center justify-center">
              <button
                className="btn btn-pink my-4 mx-3"
                onClick={handlePublish}
              >
                Publish
              </button>
              <button
                className="btn btn-pink my-4 mx-3"
                onClick={handleSaveDraft}
              >
                Save as draft
              </button>

              <button
                className="btn btn-pink my-4"
                onClick={() => viewPreview()}
              >
                {!preview ? `Preview` : `Back to Edit`}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-8 mt-8">
          <h1 className="input__group__header my-4 text-step-2 ">Preview</h1>
          {changeTitle ? (
            <div className="flex">
              <input
                className="bg-gray-200 p-4 text-step-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button
                onClick={() => setChangeTitle(false)}
                className="text-2xl text-green-500 mx-3"
              >
                <GiConfirmed />
              </button>
            </div>
          ) : (
            <h1 className="" onClick={() => setChangeTitle(true)}>
              {title}
            </h1>
          )}
          <div className="bg-gray-200 md:w-1/2 p-4 my-4 rounded-md shadow-xl">
            <p className="my-4">Choose Tags to accelerate your reach!</p>
            <TagsInput tags={tags} setTags={setTags} suggestions={globalTags} />
            <label className="label-checkbox" htmlFor={`isPrivate`}>
              <input
                type="checkbox"
                id={`isprivate`}
                name="isPrivate"
                onChange={(e) => setPrivate(e.target.checked)}
              />
              <span className="label__text">{"Community Exclusive Blog"}</span>
            </label>

            {privatex && (
              <select onChange={(e) => setPrivateCommunity(e.target.value)}>
                {communities?.map((item, index) => (
                  <option key={`item-${index}`} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            )}

            <div>
              <p>Describe your post in one sentence..</p>
              <input
                type="text"
                className="w-32 bg-gray-200 rounded-md p-4"
                placeholder="Speak out!"
                value={glance}
                onChange={(e) => setGlance(e.target.value)}
              />
            </div>
          </div>
          <div className="my-8">
            <h2 className="font-light my-4">Content</h2>
            <hr />
            <div ref={divRef} className="render-blog"></div>
            <div className="flex flex-col md:flex-row items-center justify-center">
              <button
                className="btn btn-pink my-4 mx-3"
                onClick={handlePublish}
              >
                Publish
              </button>
              <button className="btn btn-pink my-4 mx-3">Save as draft</button>

              <button
                className="btn btn-pink my-4"
                onClick={() => viewPreview()}
              >
                {!preview ? `Preview` : `Back to Edit`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogCreatePage;
