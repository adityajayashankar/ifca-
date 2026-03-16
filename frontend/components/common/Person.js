import {
  setExpertCommunities,
  setExpertSession,
  setSelectedExpert,
} from "@/store/features/expertSlice";
import { selectUser } from "@/store/features/userSlice";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

const Person = ({ name, desc, photoURL, expertId, auth }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const user = useSelector(selectUser);
  const handleRoutePerson = (e) => {
    e.preventDefault();
    if (auth && !user) {
      router.replace(`/auth`);
    } else {
      dispatch(setSelectedExpert({ name, desc, photoURL, expertId }));
      dispatch(setExpertSession(expertId));
      dispatch(setExpertCommunities(expertId));
      router.push(`/expert/${expertId}`);
    }
  };
  return (
    <div className="shadow-xl mx-8 mt-4 p-4 flex flex-col justify-center items-center h-76 ">
      <div className="h-24">
        <img
          src={photoURL}
          height={100}
          width={100}
          className={"rounded-full"}
        />
      </div>
      <h2 className="text-3xl mt-4 text-black mx-auto font-semibold">{name}</h2>
      <p className="text-justify mt-4 line-clamp-2 h-12">{desc}</p>
      {/* <Link href={`/expert/${expertId}`} passHref> */}
      <button className="btn btn-blue my-4" onClick={handleRoutePerson}>
        Consult
      </button>
      {/* </Link> */}
    </div>
  );
};

export default Person;
