import { selectCommunity } from "@/store/features/communitySlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { BsFillChatDotsFill, BsFillPersonPlusFill } from "react-icons/bs";
import { FcInvite } from "react-icons/fc";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { copyTextToClipboard } from "@/utils/copyClipboard";
import { domainConf } from "@/utils/domainConfig";
const Lhs = ({ userCommunity }) => {
  let community = useSelector(selectCommunity);
  const router = useRouter();
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const handleInvite = (e) => {
    e.preventDefault();
    copyTextToClipboard(
      `${domainConf[process.env.NODE_ENV]}/community/bought/${community.id}`
    )
      .then(() => {
        toast(`Copied Community Link!`, { type: "success" });
      })
      .catch((err) => {
        console.log("couldnt copy link");
      });
  };
  const handleRouteChat = (e) => {
    e.preventDefault();
    router.push(`/expert/community/chat?id=${community.subscriptionId}`);
  };

  const handleJoinCommunity = async (e) => {
    let now = new Date();
    let expiry = new Date(
      now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
      (now.getMonth() + 1) % 12,
      now.getDate()
    );

    console.log(now);
    console.log(expiry);
    let obj = {
      userId: user.id,
      communityId: community.id,
      expiresAt: expiry,
      startsAt: now,
      amount: community.price,
      transactionId: `xSxssdefg`,
      paymentId: "sauasevgr2133",
    };
    const res = await api.post(`/pay/`, obj);
    console.log(res.data);
    toast(`Enrolled successfully!`, { type: "success", delay: 250 });
    // dispatch(setUserCommunities(user.id));
  };

  return (
    <div className="hidden xl:inline-grid md:col-span-2 h-screen">
      <div className="col-span-2 flex flex-col item-center px-4 md:items-start">
        <div className="bg-white rounded-lg overflow-hidden relative flex flex-col items-center text-center border hidden:md pb-4  shadow-xl">
          <img class="" src={community?.bannerImg} alt="" />
          <div className="mt-2 py-4 space-x-0.5">
            <h4 className="hover:underline decoration-purple-700 underline-offset-1 cursor-pointer">
              {community?.title}
            </h4>
            <p className="text-black/60 text-sm text-left p-2">
              {community?.desc}
            </p>
          </div>

          {userCommunity ? (
            <div className="hidden md:inline text-left text-gray-500 text-sm">
              <div className="flex flex-col items-start justify-around">
                <button
                  className="btn btn-blue w-36 flex items-center"
                  onClick={handleRouteChat}
                >
                  <BsFillChatDotsFill className="mr-2" />
                  View Chat
                </button>
                <button
                  className="btn btn-pink my-4 w-36 flex items-center"
                  onClick={handleInvite}
                >
                  <FcInvite className="mr-2" />
                  Invite people
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:inline text-left text-gray-500 text-sm">
              <div className="flex flex-col items-start justify-around">
                <button
                  className="btn btn-pink w-36 flex items-center"
                  onClick={handleJoinCommunity}
                >
                  <BsFillPersonPlusFill className="mr-2 text-xl" />
                  Join Community
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lhs;
