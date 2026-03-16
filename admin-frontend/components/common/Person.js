import Link from "next/link";
import Image from "next/image";

const Person = ({ name, desc, photoURL }) => {
  return (
    <div className="shadow-xl mx-8 mt-4 p-4 flex flex-col justify-center items-center h-76 custor-pointer">
      <div className="h-24">
        <img
          src={photoURL}
          className={"w-24 h-24 mb-3 rounded-full shadow-lg"}
        />
      </div>
      <h2 className="text-3xl mt-4 text-black mx-auto font-semibold">{name}</h2>
      <p className="text-justify mt-4 line-clamp-2 h-12">{desc}</p>
    </div>
  );
};

export default Person;
