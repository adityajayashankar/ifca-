import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import Person from "@/components/common/Person";

import { BsFillChatDotsFill } from "react-icons/bs";
import { MdDelete, MdEdit } from "react-icons/md";
import {
  selectGroup,
  selectGroupExperts,
  selectGroupUsers,
  setGroupUsers,
} from "@/store/features/subCommunitySlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  selectCommunityUsers,
  setCommunities,
} from "@/store/features/communitySlice";
import { useEffect } from "react";
import { numDays } from "@/utils/numDays";
import Link from "next/link";
function GroupIDPage() {
  // const community2=useSelector(selectCommunity);
  const group = useSelector(selectGroup);
  const users = useSelector(selectCommunityUsers);
  const experts = useSelector(selectGroupExperts);
  const router = useRouter();
  const dispatch = useDispatch();
  const handleDeleteGroup = (e) => {
    e.preventDefault();
    let ans = prompt(
      "Sure You wanna delete group? Type YES in caps to confirm. This action is irreversible."
    );
    if (ans === "YES") {
      api.delete(`/subcommunity/${group.id}`).then((res) => {
        if (res.data) {
          toast(`Group Deleted`);
          dispatch(setCommunities());
          router.replace(`/admin/community`);
        }
      });
    }
  };

  useEffect(() => {
    dispatch(setGroupUsers(group.id));
  }, [group]);

  return (
    <>
      <div className="min-h-screen max-w-4xl mx-auto px-4 lg:px-0 ">
        <section className="flex flex-col items-center relative shadow-sm">
          <div className="px-12 h-52">
            <Image
              src={group?.photoURL || "https://loremflickr.com/1080/720"}
              height={200}
              width={550}
              className="rounded-xl"
              layout="intrinsic"
              objectFit="cover"
            />
          </div>
          <h1 className="text-2xl font-semibold p-2 bg-slate-200 rounded-full absolute bottom-0 left-1/12 place-content-end grid">
            {group.name}
          </h1>
        </section>
        <div className="flex justify-around items-center">
          <button className="btn btn-red" onClick={handleDeleteGroup}>
            <MdDelete />
            {/* Delete Group */}
          </button>
          <Link href={`/admin/community/group/add/${group.id}`} passHref>
            <button className="btn btn-pink">
              <MdEdit />
            </button>
          </Link>
        </div>
        <main className="flex flex-col items-center my-8 ">
          <p className="small-underline-center font-semibold my-4 text-center">
            About
          </p>
          <div className="text-left my-4 max-w-2xl">
            <p>{group?.desc}</p>
          </div>
          <p className="small-underline-center font-semibold my-4 text-center">
            Experts
          </p>

          <div className="grid mt-4 grid-cols-3">
            {users
              .filter((item) => item.expertId)
              .map((item, index) => (
                <Person
                  name={item.name}
                  desc={item.desc}
                  photoURL={item.photoURL}
                />
              ))}
          </div>
          <p className="small-underline-center font-semibold my-4 text-center">
            People
          </p>
          {/* <p>We are a community of 200 individuals</p> */}
          <div className="grid mt-4 grid-cols-3 ">
            {users
              .filter((item) => !item.expertId)
              .map((item, index) => (
                <Person
                  name={item.name}
                  desc={`Joined on ${numDays(item.createdAt)
                    .split(".")
                    .slice(0, 2)
                    .join(",")}`}
                  photoURL={item.photoURL}
                />
              ))}
          </div>
        </main>
      </div>
    </>
  );
}

export default GroupIDPage;
