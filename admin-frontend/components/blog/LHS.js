import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import BlogActions from "./BlogActions";
import {
  MdOutlineDeleteOutline,
  MdArchive,
  MdOutlineArchive,
} from "react-icons/md";
const LHS = ({
  tags,
  blogId,
  numLikes,
  numReplies,
  liked,
  createdAt,
  baseURL,
  author,
}) => {
  const loggedUser = useSelector(selectUser);
  const [like, setLike] = useState(liked || false);
  const [unumLikes, setUNumLikes] = useState(numLikes);
  const router = useRouter();
  const handleLike = (e) => {
    e?.preventDefault();
    let config = { headers: { noLoad: true } };
    api
      .patch(`/blog/${blogId}/user/${loggedUser.unifiedUserId.id}`, {}, config)
      .then((res) => {
        if (res.data) {
          setLike(res.data.like ? true : false);
          if (res.data.like === 0) {
            setUNumLikes((prev) => prev - 1);
          } else {
            setUNumLikes(res.data.like.blog._count.BlogLikes);
          }
        }
      });
  };
  const handleViewReply = (e) => {
    e?.preventDefault();
    router.push(`/${baseURL}/blog/${blogId}#Replies`);
  };

  const handleBlogArchive = (e) => {
    e?.preventDefault();
    api.patch(`/blog/${blogId}`, { isArchived: true }).then((res) => {
      toast(`Archive blog`);
      router.replace(`/${baseURL}/blog`);
    });
  };
  const handleBlogDelete = (e) => {
    e?.preventDefault();
    let ans = confirm(
      "Are you sure you want to delete? This action is irreversible"
    );
    if (ans) {
      api.delete(`/blog/${blogId}`).then((res) => {
        toast(`Deleted blog`);
        router.replace(`/${baseURL}/blog`);
      });
    }
  };
  return (
    <div className="hidden xl:inline-grid md:col-span-2 h-screen">
      <div className="col-span-2 flex flex-col item-center px-4 justify-center">
        {tags?.length > 0 && (
          <div className="flex flex-col bg-gray-100 shadow-xl p-4 rounded-md">
            <div>
              <h2 className="font-semibold text-step-2">#tags</h2>
            </div>
            <div>
              <div className="flex flex-wrap ">
                {tags?.map((item, index) => (
                  <div
                    className={`bg-green-600 text-white my-auto text-xs ml-2 px-2 p-1 rounded mt-1`}
                    key={index}
                  >
                    {item.tag.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {author && author?.uid === loggedUser?.unifiedUser?.id && (
          <>
            <button
              className="btn btn-blue w-32 my-4 flex items-center"
              onClick={handleBlogDelete}
            >
              <MdOutlineDeleteOutline className="mr-2" />
              Delete
            </button>
            <button
              className="btn btn-pink w-32 my-4 flex items-center"
              onClick={handleBlogArchive}
            >
              <MdOutlineArchive className="mr-2" />
              Archive
            </button>
            <p className="text-sm text-gray-400">
              If you Archive, blog would be only visible to you and not to
              public
            </p>
          </>
        )}

        <BlogActions
          like={like}
          handleLike={handleLike}
          handleViewReply={handleViewReply}
          numLikes={unumLikes}
          numReplies={numReplies}
          blogId={blogId}
        />
      </div>
    </div>
  );
};

export default LHS;
