import React from "react";
import Person from "../common/Person";

const RHS = ({ author }) => {
  return (
    <div className="hidden xl:inline-grid md:col-span-2">
      <div className="col-span-2 flex flex-col item-center px-4 justify-center">
        <h3 className="text-step-2">{"About the Author"}</h3>
        <Person
          name={author.name}
          desc={author.desc}
          photoURL={author.photoURL}
        />
      </div>
    </div>
  );
};

export default RHS;
