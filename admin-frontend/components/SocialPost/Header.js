import { selectTags, setCommunityPosts } from "@/store/features/postsSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import React from "react";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import DotsMenu from "../common/DotsMenu";
import Modal from "../common/Modal";
import TagsInput from "../common/Tags";
import GroupsIcon from "@mui/icons-material/Groups";

const Header = ({ user, tags, threadId, createdAt, cb, postData }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const [visibleTagModal, setVisible] = useState(false);
  const suggestionTags = useSelector(selectTags);
  let date = new Date(createdAt);
  let time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const [newTags, setNewTags] = useState(
    tags?.map((item) => ({
      id: `${item.tag.name}-${item.tag.id}`,
      text: item.tag.name,
    }))
  );
  let dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  let dateTimeStr = `${dateStr} ${time}`;
  
  function isCaregiverJSON(item) {
    if (!item) {
      return false;
    }
    try {
      const desc = JSON.parse(item.desc);
      return desc.isCaregiver;
    } catch (e) {
      return false;
    }
  }
  
  const addTags = () => {
    setVisible(true);
  };
  
  const dispatch = useDispatch();
  const router = useRouter();
  
  const handlePatchTags = (e) => {
    e.preventDefault();
    let tempTags = newTags?.map((item) => {
      if (!isNaN(parseInt(item.id.split("-")[1]))) {
        return { id: parseInt(item.id.split("-")[1]), name: item.text };
      } else {
        return { name: item.text };
      }
    });
    api.patch(`/thread/${threadId}/tag`, { newTags: tempTags }).then((res) => {
      dispatch(setCommunityPosts(parseInt(router.query["communityId"])));
      setVisible(false);
    });
  };
  
  return (
    <div className="flex items-start w-full gap-3">
      {/* User Avatar */}
      <img 
        src={user?.photoURL || "/t6.svg"} 
        className="w-10 h-10 rounded-full object-cover border border-gray-200" 
        alt={user?.name}
        onError={(e) => { e.target.src = "/t6.svg"; }}
      />
      
      {/* User Info and Actions */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between w-full">
          <div className="flex-1 min-w-0">
            {/* User Name and Role */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || "User"}
              </h2>
              {user?.role === "admin" && (
                <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Admin
                </div>
              )}
            </div>
            
            {/* Timestamp and Post Type */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span>{dateTimeStr}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <GroupsIcon fontSize="small" className="text-gray-400" />
                <span>Post</span>
              </div>
            </div>
          </div>
          
          {/* Dots Menu */}
          <div className="flex-shrink-0">
            <DotsMenu
              visible={openMenu}
              setVisible={setOpenMenu}
              user={user}
              threadId={threadId}
              addTags={addTags}
              cb={cb}
              postData={postData}
              existingTags={tags}
            />
          </div>
        </div>
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags?.map((item, index) => (
              <div
                className="text-blue-600 text-xs font-medium hover:text-blue-700 cursor-pointer bg-blue-50 px-2 py-1 rounded-full"
                key={index}
              >
                #{item.tag.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags Modal */}
      <Modal
        showModal={visibleTagModal}
        setShowModal={setVisible}
        title={`Set Tags`}
      >
        <div className="flex flex-col items-center">
          <p className="py-4">Tag your post for specifics</p>

          <TagsInput
            tags={newTags}
            setTags={setNewTags}
            suggestions={suggestionTags}
          />

          <button className="btn btn-pink" onClick={handlePatchTags}>
            Save Tags
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Header;
