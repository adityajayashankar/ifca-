import { selectCommunity } from "@/store/features/communitySlice";
import { setCommunityPosts } from "@/store/features/postsSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import React from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

const DotsMenu = ({ visible, setVisible, user, threadId }) => {
  const dispatch = useDispatch();
  const loggedUser = useSelector(selectUser);
  const community = useSelector(selectCommunity);
  const handlePostDelete = (e) => {
    e.preventDefault();
    let ans = confirm("Sure you wanna delete post?");
    if (ans) {
      api.delete(`/thread/${threadId}`).then((res) => {
        if (res.data) {
          toast(`Successfully deleted post!`);
          dispatch(setCommunityPosts(community.id));
        }
      });
    }
  };
  return (
    <div
      class="relative inline-block text-left"
      onClick={() => {
        if (visible) {
          setVisible(false);
        }
      }}
    >
      <div>
        <BsThreeDotsVertical
          onClick={() => setVisible((prev) => !prev)}
          className="hover:bg-primary-600 hover:text-white rounded-xl cursor-pointer"
        />
      </div>

      {/* <!--
    Dropdown menu, show/hide based on menu state.

    Entering: "transition ease-out duration-100"
      From: "transform opacity-0 scale-95"
      To: "transform opacity-100 scale-100"
    Leaving: "transition ease-in duration-75"
      From: "transform opacity-100 scale-100"
      To: "transform opacity-0 scale-95"
  --> */}
      {visible && loggedUser?.unifiedUser?.id === user?.uid && (
        <div
          class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabindex="-1"
        >
          <div class="py-1" role="none">
            {/* <!-- Active: "bg-gray-100 text-gray-900", Not Active: "text-gray-700" --> */}

            {/* <p className="text-gray-700 block px-4 py-2 text-sm">Edit Post</p> */}
            <p
              className="text-white block px-4 py-2 text-sm bg-black" 
              onClick={handlePostDelete}
            >
              Delete Post 
            </p>
            {/* <p
              className="text-gray-700 block px-4 py-2 text-sm hover:bg-primary-500 hover:text-white"
              onClick={() => setVisible((prev) => !prev)}
            >
              Close menu
            </p> */}

            {/* <button className="btn btn-red block">Delete Post</button> */}
            {/* <br /> */}
            {/* <button className="btn btn-blue">Close</button> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default DotsMenu;
