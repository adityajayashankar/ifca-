import { useState } from "react";
import UserModal from "./userModal";
import { useRouter } from "next/router";

const ActiveUser = ({ isActive, user }) => {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleUserClick = () => {
    // const userId = user?.unifiedUser?.user?.id || 
    //               user?.unifiedUser?.admin?.id || 
    //               user?.unifiedUser?.partner?.id || 
    //               user?.unifiedUser?.expert?.id;
    const userId = user?.unifiedUser?.id
    if (userId) {
      router.push(`/user/${userId}`);
    }
  };

  const userName = user?.unifiedUser?.user?.name || 
                  user?.unifiedUser?.admin?.name || 
                  user?.unifiedUser?.partner?.name || 
                  user?.unifiedUser?.expert?.name;

  const userPhoto = user?.unifiedUser?.user?.photoURL || 
                   user?.unifiedUser?.admin?.photoURL || 
                   user?.unifiedUser?.partner?.photoURL || 
                   user?.unifiedUser?.expert?.photoURL;


  return (
    <div 
      className="flex items-center gap-x-4 bg-white border border-gray-200 p-2 rounded-lg  hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={handleUserClick}
    >
      <div className="relative">
        <img
          src={userPhoto || "/Landing_Our Expert_Expand.png"}
          className="w-12 h-12 ring-2 ring-gray-100 overflow-hidden rounded-full object-cover group-hover:ring-primary-500 transition-all duration-200"
          alt={userName || "User avatar"}
        />
        {isActive && (
          <div className="w-4 h-4 rounded-full absolute bg-green-500 bottom-0 right-0 border-2 border-white"></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 font-semibold text-base truncate group-hover:text-primary-500 transition-colors">
          {userName}
        </p>
        <div className="text-xs text-gray-500 italic">{user?.unifiedUser?.userId ? "Member" : user?.unifiedUser?.adminId ? "Admin" : user?.unifiedUser?.partnerId ? "Partner" : user?.unifiedUser?.expertId ? "Expert" : ""}</div>
      </div>
      {showModal && <UserModal props={user} setShowModal={setShowModal} />}
    </div>
  );
};

export default ActiveUser;
