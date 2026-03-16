import { numDays } from "@/utils/numDays";
import React from "react";
import { MdDelete, MdEdit } from "react-icons/md";

const CouponCard = ({ couponCard, noaction, deletecb, editcb }) => {
  return (
    <div className="max-w-96 flex flex-col text-center bg-gradient-to-r from-[#4E795E80] via-red-500 to-yellow-500 mx-4 rounded-md p-4 shadow-xl text-white">
      <h2>{`${couponCard.discountRate}% `}</h2>
      <p className="font-mono tracking-widest">{couponCard.code}</p>
      <p>{`Created ${numDays(couponCard.createdAt)}`}</p>
      {!noaction && (
        <div className="flex justify-around mt-4">
          <button className="btn " onClick={() => deletecb()}>
            {/* Bin */}
            <MdDelete />
          </button>
          <button className="btn " onClick={() => editcb()}>
            {/* Edit */}
            <MdEdit />
          </button>
        </div>
      )}
    </div>
  );
};

export default CouponCard;
