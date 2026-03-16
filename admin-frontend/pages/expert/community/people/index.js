import ComingSoon from "@/components/common/ComingSoon";
import Table from "@/components/common/Table";
import {
  selectCommunity,
  selectCommunityUsers,
  setCommunityById,
  setCommunityUsers,
} from "@/store/features/communitySlice";
import { selectAllExperts, setAllExperts } from "@/store/features/expert";
import {
  selectAllPartners,
  setAllPartners,
} from "@/store/features/partnerSlice";
import {
  selectAllUsers,
  selectUser,
  setAllUsers,
  setUserCommunities,
} from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

const PeoplePage = ({ }) => {
  const router = useRouter();
  const community = useSelector(selectCommunity);
  const dispatch = useDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [isExpert, setIsExpert] = useState(true);
  const user = useSelector(selectUser);
  const comPartner = community?.creator;
  const allUsers = comPartner
    ? useSelector(selectCommunityUsers).concat([comPartner])
    : useSelector(selectCommunityUsers);

  const comId = community?.id;

  useEffect(() => {
    dispatch(setCommunityById(comId));
  }, [router]);

  useEffect(() => {
    dispatch(setCommunityUsers(community.id));
  }, [router]);

  console.log("all---users---", allUsers)

  useEffect(() => {
    dispatch(setAllPartners(user?.id));
    dispatch(setAllExperts());
  }, [user]);

  const allProductExperts = useSelector(selectAllExperts).filter((item) => {
    return !allUsers
      .filter((item) => {
        return item?.expertId !== null;
      })
      .map((item) => {
        return item?.id;
      })
      .includes(item.id);
  });

const allPartners = (useSelector(selectAllPartners)?.partners) ?? [];

const allProductPartners = allPartners.filter(
  (item) => item?.id !== comPartner?.id
);





  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleJoinCommunity = async (e) => {
    e.preventDefault();
    if (!selectedUsers.length) {
      toast.error("No user selected");
      return false;
    }
    let now = new Date();
    let expiry = new Date(
      now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
      (now.getMonth() + 1) % 12,
      now.getDate()
    );
    let obj = {
      communityId: comId,
    };
    const arrObj = selectedUsers.map((item) => {
      return { ...obj, userId: item };
    });
    // const res = await api.post(`/pay/`, obj);
    const res = await Promise.all(
      arrObj.map(async (item) => {
        return await api.post(`/pay/subscription`, item);
      })
    );

    if (res) toast(`Enrolled successfully!`, { type: "success", delay: 250 });

    // fromPage.from === "sessionBuyPage" ? router.push(`/classDetails/${fromPage.id}`) : router.push(`/comHome/${comId}`)
    setModalOpen(false);
    setTimeout(() => window.location.reload(), 3000);
  };

  const handlePartnerJoinCommunity = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/community/${community.id}`, {
        creatorId: selectedUsers.length
          ? selectedUsers
          : allProductPartners[0].id,
      });
      toast.success("Added partners to community");
      res && setModalOpen(false);
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      toast.error("Error adding users to community");
    }
  };

  return (
    <div className="min-h-screen w-full">
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed w-screen h-screen bg-black/50 top-0 left-0 z-[999] flex items-center justify-center"
        >
          <form
            onSubmit={
              isExpert ? handleJoinCommunity : handleJoinCommunity
            }
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col bg-white p-5 rounded-xl"
          >
            <h1 className="text-blue-300">Add Expert/Partner</h1>
            <label className="my-5">Select User</label>
            {isExpert ? (
              <select
                multiple
                onChange={(e) => {
                  let value = Array.from(e.target.selectedOptions, (option) =>
                    parseInt(option.value, 10)
                  );
                  setSelectedUsers(value);
                }}
                className="border-2 p-3 border-gray-200 rounded-xl outline-none"
              >
                {allProductExperts?.map((item, index) => (
                  <option key={index} value={item.unifiedUserId.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                multiple
                onChange={(e) => {
                  let value = Array.from(e.target.selectedOptions, (option) =>
                    parseInt(option.value, 10)
                  );
                  setSelectedUsers(value);
                }}
                className="border-2 p-3 border-gray-200 rounded-xl outline-none"
              >
                {allProductPartners?.map((item, index) => (
                  <option key={index} value={item.unifiedUserId?.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
            <select
              className="my-5 border-2 border-gray-200 rounded-lg"
              onChange={(e) => setIsExpert(!isExpert)}
            >
              <option value={true}>Expert</option>
              <option value={false}>Partner</option>
            </select>
            <button
              className="bg-blue-300 text-white px-4 py-2 rounded-lg my-5"
              type="submit"
            >
              Add to Community
            </button>
          </form>
        </div>
      )}
      <section className="text-center py-10 max-w-7xl mx-auto">
        <div className="input__group__header">
          <h2>People</h2>
          <div className="flex gap-5">
            {/* <button
              className="button button-blue"
              onClick={() => router.push("/admin/people/add")}
            >
              + People
            </button>
            <button
              className="button button-blue"
              onClick={() => setModalOpen(true)}
            >
              + Experts/Partners
            </button> */}
          </div>
        </div>

        <div className="w-full my-12">
          {/* Put a table*/}
          <Table
            headers={[
              "sl",
              "Name",
              "Phone",
              "Active-Since",
              "Expiry-Subscription",
            ]}
            mode="usercommunity"
            data={allUsers}
          />
          {(!allUsers || allUsers.length === 0) && <p> No Users Yet</p>}
        </div>
      </section>
    </div>
  );
};

export default PeoplePage;
