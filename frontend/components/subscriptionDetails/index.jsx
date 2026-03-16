import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useState } from "react";

const SubscriptionDetails = ({ planDetails, setSelectedId, isCurrent, price }) => {
  return (
    <div
      onClick={() => setSelectedId(planDetails.id)}
      className={`bg-white p-[10px] rounded-[10px] my-[10px] relative cursor-pointer ${isCurrent && "border-2 border-solid  bg-[#3554C51A]"
        }`}
    >
      <h3 className="mt-[5px] flex items-center gap-y-[10px] m-y-[15px] m-x-[7.5px] text-gray-500">
        {/* {planDetails.name !== "Free" && (
          <img src={planDetails.img} alt="" className="w-5 h-5" />
          
        )} */}
        {/* <img src={planDetails.img} alt="" className="w-5 h-5" /> */}
        1 Member
      </h3>
      {/* <p className="m-[7.5px] text-gray-500 font-medium">
        {planDetails.limit} User(s)
      </p> */}
      <p className="m-[7.5px] text-gray-500 font-medium">
         Access to Resources
      </p>
      <p className="m-[7.5px] text-gray-500 font-medium">
      Access to Exclusive Content
      </p>
      {/* <p className="m-[7.5px] text-gray-500 font-medium">
        {planDetails.exclusive
          ? "Access to Exclusive Content"
          : "No exclusive content"}
      </p> */}
      <p className="m-[7.5px] text-gray-500 font-medium">
        Rs.{price}
      </p>
      {isCurrent && (
        <span className="absolute top-[10px] right-[10px] gradient_background h-[30px] w-[30px] rounded-[50%] text-white flex items-center justify-center">
          <CheckCircleOutlineIcon />
        </span>
      )}
    </div>
  );
};

export default SubscriptionDetails;
