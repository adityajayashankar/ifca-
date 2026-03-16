import React, { useEffect, useRef } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import CreatePostContainer from "../community/home/CreatePostContainer";
import PostX from "../SocialPost/PostX";

const BlogRender = ({ handleRouteBack, blogData }) => {
  const divRef = useRef();
  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = blogData.content;
    }
  }, [divRef, blogData]);
  return (
    <div className="col-span-full scrollbar-hide border-x max-h-screen overflow-scroll lg:col-span-5 xl:mr-5 items-center">
      <div className="mx-4">
        <div className="flex items-center">
          <AiOutlineArrowLeft
            className="mr-4 cursor-pointer"
            onClick={handleRouteBack}
          />
          <h1 className="input__group__header my-4">{blogData?.title}</h1>
        </div>

        <div className="">
          <div ref={divRef} className="ml-8 "></div>
        </div>

        <div id="Replies" className="my-8">
          <hr />
          <h3 className="my-4">Replies</h3>
          {blogData?.Post?.length === 0 ? (
            <CreatePostContainer
              placeholder={`Be the first to reply!`}
              blogId={blogData?.id}
            />
          ) : (
            <CreatePostContainer
              placeholder={`Tell what you liked!`}
              blogId={blogData?.id}
            />
          )}

          {blogData?.Post?.map((item, index) => (
            <PostX
              key={`blog-post-${index}`}
              user={item.creator}
              title={item.title}
              createdAt={item.createdAt}
              content={item.content}
              threadId={item.id}
              tags={item.tags}
              media={item.assets}
              numLikes={item.likes.length}
              numReplies={item._count.childrenPosts}
              liked={false}
              userCommunity={true}
              blogId={blogData?.id}
            />
          ))}
          {blogData?.Post.length === 0 && <div>No replies yet..</div>}
        </div>
      </div>
    </div>
  );
};

export default BlogRender;
