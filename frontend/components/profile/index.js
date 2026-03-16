import React, { useEffect, useRef, useState } from "react";
import { Avatar } from "@mui/material"; // Material-UI Avatar component
import { useRouter } from "next/router";
import ConnectionsModal from "../ConnectionsModal";
import { Edit, EmojiEvents, Logout, Person, Settings } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/store/features/userSlice";


const Profile = ({ currentUser, rewardPoints, setEditModal }) => {

  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push("/onBoard");
  };

  const handleSettingsClick = () => {
    setShowConnectionsModal(true);
    setDropdownOpen(false);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <Avatar
          src={currentUser?.photoURL || ""}
          alt={currentUser?.name || "User"}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
        />

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-[280px] bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden z-50">
            {/* User Info Section */}
            <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={currentUser?.photoURL || ""}
                  alt={currentUser?.name || "User"}
                  className="w-12 h-12 border-2 border-white"
                />
                <div>
                  <h3 className="font-semibold text-lg">{currentUser?.name || "User"}</h3>
                  <p className="text-sm text-white/80">{currentUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Rewards Section - Only show if user is authenticated and has rewards */}
            {currentUser && rewardPoints !== null && rewardPoints !== undefined && rewardPoints > 0 && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <EmojiEvents className="text-yellow-500" />
                    <span className="text-gray-700">Rewards Points</span>
                  </div>
                  <span className="text-xl font-bold text-primary-600">{rewardPoints}</span>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  router.push(`/user/${currentUser?.unifiedUser?.id}`);
                  setDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 transition-colors"
              >
                <Person className="text-gray-500" />
                <span>View Profile</span>
              </button>

              <button
                onClick={() => {
                  router.push(`/user/edit/${currentUser?.id}`);
                  setDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 transition-colors"
              >
                <Edit className="text-gray-500" />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={handleSettingsClick}
                className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 transition-colors"
              >
                <Settings className="text-gray-500" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  router.push("/rewards/history");
                  setDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 transition-colors"
              >
                <EmojiEvents className="text-gray-500" />
                <span>Rewards History</span>
              </button>
            </div>

            {/* Logout Button */}
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left flex items-center space-x-3 text-red-600 hover:bg-red-50 transition-colors rounded-md"
              >
                <Logout />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connections Modal */}
      <ConnectionsModal
        open={showConnectionsModal}
        onClose={() => setShowConnectionsModal(false)}
        userId={currentUser?.unifiedUser?.id}
        initialTab="settings"
      />
    </>
  );
};

export default Profile;
