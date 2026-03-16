import {
  selectCommunity,
  selectCommunityUsers,
} from "@/store/features/communitySlice";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Person from "@/components/common/Person";
import { selectSubcommunities } from "@/store/features/subCommunitySlice";
import { BsFillChatDotsFill } from "react-icons/bs";
import { useRouter } from "next/router";

const Rhs = () => {
  const communityUsers = useSelector(selectCommunityUsers);
  const groups = useSelector(selectSubcommunities);
  const community = useSelector(selectCommunity);
  const [sortedUsers, setSortedUsers] = useState([]);

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
  const sortExpertsFirst = () => {
    let resultPeople = [];
    if (communityUsers) {
      resultPeople = communityUsers.filter((item) => item.expertId);
      resultPeople = [
        ...resultPeople,
        ...communityUsers.filter((item) => !item.expertId),
      ];
    }
    setSortedUsers(resultPeople.slice(0, 8));
  };

  useEffect(() => {
    sortExpertsFirst();
  }, [communityUsers]);
  const router = useRouter();
  const handleChatNavigate = (e) => {
    e.preventDefault();
    router.push(`/expert/community/chat?id=${community.subscriptionId}`);
  };
  return (
    <div className="hidden xl:inline-grid md:col-span-2">
      <div>
        <div className="mb-8">
          <h2 className="font-semibold text-xl">People</h2>
          <hr />
          <div className="">
            {sortedUsers?.map((item, index) => (
              <div className="flex items-center justify-around bg-slate-100 rounded-xl px-4 py-0 my-2 shadow-md">
                <img src={item?.photoURL} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="ml-2 font-semibold text-md">{item?.name}</p>
                </div>
                {item?.expertId > 0 ? (
                  <div
                    className={` bg-sky-300 text-black w-16
               my-auto  text-xs font-semibold ml-2 px-2.5 rounded `}
                  >
                    {"Expert"}
                  </div>
                ) : (
                  <div
                    className={`${
                      isCaregiverJSON(item)
                        ? "bg-green-600 text-white w-16 px-1"
                        : "bg-blue-100 text-white px-2.5"
                    } my-auto  text-xs font-semibold ml-2  rounded `}
                  >
                    {isCaregiverJSON(item) ? "Caregiver" : "Warrior"}
                  </div>
                )}
                {/* <div
                  className={`${
                    item?.expertId > 0
                      ? "bg-sky-300 text-black w-16"
                      : "bg-blue-100 text-white "
                  } my-auto  text-xs font-semibold ml-2 px-2.5 rounded `}
                >
                  {item?.expertId > 0 ? "Expert" : "Member"}
                </div> */}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-xl">Groups</h2>
          <hr />
          <div className="">
            {groups?.slice(0, 5).map((item, index) => (
              <div className="flex items-center justify-around bg-slate-100 rounded-xl px-4 py-0 my-2 shadow-md">
                <img src={item?.photoURL} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="ml-2 font-semibold text-md">{item?.name}</p>
                </div>
                <div>
                  <button
                    className="btn-blue btn ml-2"
                    onClick={handleChatNavigate}
                  >
                    <BsFillChatDotsFill />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rhs;
