import React from "react";
import CloseIcon from "@mui/icons-material/Close";

const UserModal = (props) => {
  console.log(props, "props");
  return (
    <div className="fixed top-0 w-screen h-screen backdrop-blur-sm bg-black/10 z-50 left-0 flex items-center justify-center">
      <div className="rounded overflow-hidden bg-white sm:w-4/5 md:w-1/2 p-5">
        <div className="flex justify-between items-center pb-4">
          <p className="text-xl font-medium">User Details</p>
          <button
            onClick={() => props.setShowModal(false)}
            className="text-orange-500"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex divide-x-2">
          <img
            src={
              props.props.photoURL === ""
                ? "/Landing_Our Expert_Expand.png"
                : props.props.photoURL
            }
            className="w-40 h-40 cover rounded object-cover"
          />
          <div className="px-5 flex flex-col gap-2 font-semibold">
            <h3 className="m-0">{props.props.name}</h3>
            <a
              href={`tel:${props.props.phone}`}
              className="hover:underline text-orange-500 "
            >
              +91 {props.props.phone}
            </a>
            <a
              href={`mailto:${props.props.email}`}
              className="hover:undelline text-orange-500 "
            >
              {" "}
              {props.props.email}
            </a>
            <p className="text-sm py-2">{props.props.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
