import React from "react";

const ErrorFiller = (props) => {
  return (
    <div className="w-full flex justify-center items-center py-10">
      <p className="text-xl text-center text-gray-500 font-semibold">
        {props.children}
      </p>
    </div>
  );
};

export default ErrorFiller;
