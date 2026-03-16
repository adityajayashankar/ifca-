import React, { useState } from "react";
import { AiOutlineArrowUp, AiOutlineArrowDown } from "react-icons/ai";

function Accordion({ title, description, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div key={index} className={`w-full border-b-2 `}>
      <div
        className="relative cursor-pointer text-[#BB274B] font-xl w-full mt-2 text-left flex flex-row overflow-hidden"
        onClick={() => setOpen(!open)}
      >
        <div
          className={
            open ? `block line-clamp-none text-2xl` : `line-clamp-1 text-2xl`
          }
        >
          {title}
        </div>
        {open ? (
          <AiOutlineArrowUp className="absolute flex right-1 float-right p-0 ml-1 justify-end text-2xl transition-all ease-out duration-[0.2s]" />
        ) : (
          <AiOutlineArrowDown className="absolute right-0 p-0 ml-1 content-center text-2xl transition-all ease-out duration-[0.2s]" />
        )}
      </div>
      <div
        className={
          open
            ? "mt-1 opacity-1 max-h-full overflow-y-hidden transition-all ease-out duration-[0.2s] p-2"
            : "text-orange-500 mb-4 opacity-0 max-h-0 overflow-y-hidden transition-all duration-[0.2s] ease-in "
        }
      >
        {description}
      </div>
    </div>
  );
}

export default Accordion;
