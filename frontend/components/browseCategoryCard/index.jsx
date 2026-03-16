import { useRouter } from "next/router";

const BrowseCategoryCard = ({ uid, title, number, img }) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/catSessions/${uid}`)}
      className="flex bg-white rounded-lg overflow-hidden cursor-pointer whitespace-nowrap w-full drop-shadow-[0px 0px 30px rgba(53, 84, 197, 0.1)]"
    >
      <div className="mr-[4px] md:mr-[10px] overflow-hidden">
        {/* <img
          className="w-full object-cover md:w-[105px] h-full md:h-[83px]"
          src="browseComp.svg"
          alt=""
        /> */}
      </div>
      <div className="px-[20px] py-[20px] flex flex-col justify-center">
        <h3 className="text-lg md:text-xl font-semibold md:font-bold m-0">
          {title}
        </h3>
        {/* <p className="text-sm text-gray-400">{number} sessions</p> */}
      </div>
    </div>
  );
};

export default BrowseCategoryCard;
