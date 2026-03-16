import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCommunity,
  selectCommunitySessions,
  selectCommunityUsers,
  setCommunities,
  setCommunityById,
  setCommunitySessions,
  setCommunityUsers,
} from "@/store/features/communitySlice";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { MdHighlightOff, MdSupervisorAccount, MdGroup } from "react-icons/md";
// import SessionCard from '@/components/community/SessionCard';
import Card from "@/components/common/Card";

import {
  selectSubcommunities,
  setCommunityGroups,
} from "@/store/features/subCommunitySlice";
import GroupCard from "@/components/community/groupCard";
const ManageCommunityPage = () => {
  const community2 = useSelector(selectCommunity);
  const [creatorName, setCreatorName] = useState("Bhaskar");
  const sessions = useSelector(selectCommunitySessions);
  const users = useSelector(selectCommunityUsers);
  const groups = useSelector(selectSubcommunities);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleEditCommunity = (e) => {
    e.preventDefault();
  };
  const handleDeleteCommunity = (e) => {
    e.preventDefault();
    let ans = prompt(
      "Sure You wanna delete community? Type YES in caps to confirm. This action is irreversible."
    );
    if (ans === "YES") {
      api.delete(`/community/${community2.id}`).then((res) => {
        if (res.data) {
          toast(`Community Deleted`);
          dispatch(setCommunities());
          router.replace(`/expert/community`);
        }
      });
    }
  };

  useEffect(() => {
    if (router && router.query["communityId"]) {
      dispatch(setCommunityById(router.query["communityId"]));
      dispatch(setCommunitySessions(router.query["communityId"]));
      dispatch(setCommunityUsers(router.query["communityId"]));
      dispatch(setCommunityGroups(router.query["communityId"]));
    }
  }, [router]);

  useEffect(() => {
    if (community2 && community2.creator?.name) {
      setCreatorName(community2.creator?.name);
    } else if (community2 && !community2.creator) {
      setCreatorName("Admin Team");
    }
  }, [community2]);
  return (
    <div className="min-h-screen max-w-7xl mx-auto py-20 px-4 lg:px-0">
      {community2 && creatorName ? (
        <div className="flex flex-col lg:flex-row gap-16 w-full">
          <section className="flex flex-0.5 flex-col gap-8 p-2">
            <div className="block">
              <Image
                src={community2.bannerImg || "https://loremflickr.com/400/400"}
                width={400}
                height={400}
                objectFit="cover"
                className="rounded-lg shadow-xl"
              />
            </div>
            <Link href={`/expert/community/add/${community2.id}`} passHref>
              <button className={"btn btn-pink font-bold"}>
                {"Edit Community"}
              </button>
            </Link>
            <button
              className={"btn btn-red font-bold"}
              onClick={handleDeleteCommunity}
            >
              {"Delete Community"}
            </button>

            {/* <div className='flex flex-col gap-2'>
                <p className='font-semibold text-step-1'>Time</p>
                <div className='flex flex-row flex-wrap gap-4 py-4'>
                    {times.map((time, index) => (
                        <div
                            className={`flex flex-col gap-1 items-center p-2 border rounded-lg hover:cursor-pointer ${
                                time.selected
                                    ? 'bg-gray-600 text-white'
                                    : ''
                            }`}>
                           
                        </div>
                    ))}
                </div>
            </div> */}

            {/* <div className='p-4 text-step-1 bg-gray-200 rounded-md'>
                <p className='font-bold'>You will get</p>
                <p className='text-base mt-4'>
                    Dummy accounts to practise on( too farfetched?),
                    small video snippets for each segment, online
                    assistance
                </p>
            </div> */}
          </section>
          <section className="flex flex-1 flex-col gap-8 p-2">
            <div className="flex flex-col gap-3">
              <h1 className="text-step-2 font-bold text-2xl max-w-[30ch]">
                {community2.title}
              </h1>
              {/* <p className="font-semibold text-orange-500">
                {`Manager: ${creatorName}`}
              </p> */}
              <p className="font-semibold px-4 py-1 bg-primary-500 text-white w-max rounded-full">
                Subscription Price: {community2.price}/m
              </p>
              <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 before:bg-blue-400 mt-2">Description</p>
              <p className="text-step-0">{community2.desc}</p>
            </div>

            <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 before:bg-blue-400">
              Our Members
              {/* <Link href={` /people`} passHref>
                <button
                  className="ml-8 btn btn-pink text-lg"
                  title="View all people"
                >
                  <div className="flex items-center">
                    <MdSupervisorAccount />
                    people
                  </div>
                </button>
              </Link> */}
            </p>
            <div className="flex flex-col gap-2">
              {/* <p className='font-semibold text-step-1'>Dates</p> */}
              <div className="flex flex-row flex-wrap gap-4 py-4">
                {users?.slice(0, 10).map((speaker, index) => (
                  <div
                    className={`flex flex-col gap-1 items-center p-2 border rounded-lg hover:cursor-pointer`}
                    key={`user-${index}`}
                  >
                    <p className={`text-sm font-semibold ${"text-orange-500"}`}>
                      {speaker.name}
                    </p>
                  </div>
                ))}
                {!users ||
                  (users.length === 0 && (
                    <div className="justify-center">
                      <h1 className="text-center text-sm font-extralight">
                        No users have enrolled yet
                      </h1>
                    </div>
                  ))}
              </div>

              <Link href={"/expert/community/subscription"} passHref>
                <button className="btn btn-pink w-64">+ Subscriptions</button>
              </Link>
            </div>
            <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 before:bg-blue-400">
              Interest Groups
              <Link href={`/expert/community/people`} passHref>
                <button
                  className="ml-8 btn btn-pink text-lg"
                  title="View all people"
                >
                  <div className="flex items-center">
                    <MdGroup />
                    View All
                  </div>
                </button>
              </Link>
            </p>
            <div className="flex flex-col gap-2">
              {/* <p className='font-semibold text-step-1'>Dates</p> */}
              <div className="grid grid-cols-3 gap-4">
                {groups?.slice(0, 10).map((item, index) => (
                  <GroupCard
                    key={`group-${index}`}
                    category={item}
                    baseURL={"partner"}
                  />
                ))}
                {!groups ||
                  (groups.length === 0 && (
                    <div className="justify-center">
                      <h1 className="text-center text-sm font-extralight">{`No groups yet! Create your first group!`}</h1>
                    </div>
                  ))}
              </div>

              <Link href={"/expert/community/group/add"} passHref>
                <button className="btn btn-pink w-64">+ Group</button>
              </Link>
            </div>
            <p className="text-step-2 font-bold relative ml-3 before:absolute before:top-0 before:-left-3 before:h-full before:w-1 before:bg-blue-400">
              Sessions
            </p>
            <div className="flex flex-col gap-2">
              {/* <p className='font-semibold text-step-1'>Dates</p> */}
              <div className="flex flex-row flex-wrap gap-4 py-4">
                {sessions?.map((session, index) => (
                  <Card session={session} baseURL={"partner"} view />
                ))}
                {sessions.length === 0 && (
                  <div className="justify-center">
                    <h1 className="text-center text-sm font-extralight">
                      It is a new community, you gotta understand :/
                    </h1>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div>
          <h1>Try logging out</h1>
        </div>
      )}
    </div>
  );
};

export default ManageCommunityPage;