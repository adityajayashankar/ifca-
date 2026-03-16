import React, { useState } from "react";
import CreatePostContainer from "./CreatePostContainer";
import Threads from "@/components/chat/threads";
// import PostComponent from "../../SocialPost/PostX";
import Post from "./Post";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCommunityPosts,
  selectLikeMap,
  setCommunityPosts,
} from "@/store/features/postsSlice";
import { useEffect } from "react";
import { selectCommunity } from "@/store/features/communitySlice";
import PostX from "@/components/SocialPost/PostX";
const Feed = ({ userCommunity }) => {
  const [showFeed, setShowFeed] = useState(true);
  const [newThreadModal, setNewThreadModal] = useState(false);
  const communityPosts = useSelector(selectCommunityPosts);
  const community = useSelector(selectCommunity);
  const likeMap = useSelector(selectLikeMap);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setCommunityPosts(community.id));
  }, []);

  const resolveUnifiedUser = (user) => {
    // returns userId,email,name,photoURL,desc, role
    if (user.userId) {
      return {
        userId: user.user.id,
        email: user.user.email,
        name: user.user.name,
        photoURL: user.user.photoURL,
        desc: user.user.desc,
        role: "Member",
      };
    }
    if (user.partnerId) {
      return {
        userId: user.partner.id,
        email: user.partner.email,
        name: user.partner.name,
        photoURL: user.partner.photoURL,
        desc: "user.partner.desc",
        role: "Partner",
      };
    }
    if (user.expertId) {
      return {
        userId: user.expert.id,
        email: user.expert.email,
        name: user.expert.name,
        photoURL: user.expert.photoURL,
        desc: user.expert.desc,
        role: "Expert",
      };
    }
    if (user.adminId) {
      return {
        userId: user.admin.id,
        email: user.admin.email,
        name: user.admin.name,
        photoURL: user.admin.photoURL,
        desc: "user.admin.desc",
        role: "Admin",
      };
    }
  };
  return (
    <div className="col-span-full scrollbar-hide border-x max-h-screen overflow-scroll lg:col-span-5 xl:mr-5 items-center">
      <div>
        {userCommunity ? (
          <CreatePostContainer posts={communityPosts} />
        ) : (
          <div className="bg-blue-300 text-white rounded-lg p-3 space-y-3 border border-gray-300 ">
            You have not joined this community. You can only view the posts..
          </div>
        )}
      </div>
      <hr />
      <div className="mb-32">
        {communityPosts
          ?.filter(item => !item.isArchived) // Filter out archived posts
          ?.map((item, index) => (
          <PostX
            key={`post-${index}`}
            user={item.creator}
            // unifiedUser={item.creator}
            title={item.title}
            createdAt={item.createdAt}
            content={item.content}
            threadId={item.id}
            tags={item.tags}
            media={item.assets}
            numLikes={item.likes.length}
            numReplies={item._count.childrenPosts}
            // likes={item.likes.length}
            liked={likeMap[item.id] ? true : false}
            userCommunity={userCommunity}
            communityId={item.communityId}
            isArchived={item.isArchived}
          />
        ))}
        {(!communityPosts || communityPosts.length === 0) && (
          <div className="h-screen bg-red-400 opacity-40 flex justify-center items-center">
            <h1 className="text-step-4 ml-8">No posts yet!</h1>
          </div>
        )}
        {/* <Post
          user={{
            name: "Lakshmi",
            photoURL: "https://robohash.org/001",
            expertId: 1,
          }}
          content={
            "Here's what you need to know about kannada rajyostava and feastivities around it"
          }
          tags={[
            "kannada",
            "rajyostava",
            "feastivities",
            "react",
            "nextjs",
            "tailwindcss",
            "typescript",
            "javascript",
          ]}
          threadId={1}
          media={[
            {
              id: 1,
              url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
              type: "image",
            },
            {
              id: 1,
              url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
              type: "image",
            },
            {
              id: 1,
              url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
              type: "image",
            },
            {
              id: 1,
              url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
              type: "image",
            },
          ]}
        />
        <Post
          user={{ name: "Ankur", photoURL: "https://robohash.org/001" }}
          content={"Here is one big post ig"}
          threadId={2}
          tags={["kannada", "rajyostava", "feastivities"]}
          media={[
            {
              id: 1,
              url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
              type: "image",
            },
            {
              id: 1,
              url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
              type: "image",
            },
            {
              id: 1,
              url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
              type: "image",
            },
          ]}
        />
        <Post
          user={{ name: "Ankur", photoURL: "https://robohash.org/001" }}
          content={"Here is one big post ig"}
          threadId={3}
          tags={["kannada", "rajyostava", "feastivities"]}
          media={[
            {
              id: 1,
              url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
              type: "image",
            },
          ]}
        />
        <Post
          user={{ name: "Ankur", photoURL: "https://robohash.org/001" }}
          content={"Here is one big post ig"}
          threadId={4}
          // tags = {["kannada", "rajyostava", "feastivities"]}
          media={[
            {
              id: 1,
              url: "https://pdffile.co.in/wp-content/uploads/pdf-thumbnails/2021/11/kannada-rajyotsava-speech-873-p2.jpg",
              type: "image",
            },
          ]}
        /> */}
      </div>
    </div>
  );
};

export default Feed;
