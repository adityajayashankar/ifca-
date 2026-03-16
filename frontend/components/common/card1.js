import { setSelectedSession } from "@/store/features/sessionSlice";
import { Tooltip } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { MdAccessTime, MdCalendarToday } from "react-icons/md";
import { useDispatch } from "react-redux";

const Card1 = ({ session, baseURL, view, edit }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleSaveAndRedirect = (toroute) => {
    dispatch(setSelectedSession(session));
    router.push(toroute);
  };

  return (
    <div className="relative bg-white shadow-lg rounded-lg overflow-hidden hover:scale-105">
      <div className="relative h-48">
        <Image
          src={session?.infoImgs[0] || "https://loremflickr.com/1080/720"}
          alt={`${session.title}`}
          layout="fill"
          objectFit="cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-transparent via-black to-black  py-2 px-4 text-white">
          <div className="flex justify-between">
            <div className="flex items-center">
              <MdAccessTime className="text-white mr-1" />
              <p className="text-white text-xs font-bold">
                {session.SessionSlot[0]
                  ? new Date(
                      session.SessionSlot[0].startTime
                    ).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </p>
            </div>
            <div className="flex items-center ">
              <MdCalendarToday className="text-white mr-1" />
              <p className="text-white text-xs font-bold">
                {session.SessionSlot[0]
                  ? ` ${new Date(
                      session.SessionSlot[0].startTime
                    ).toLocaleDateString("en-US", { month: "short" })}
                                ${new Date(
                                  session.SessionSlot[0].startTime
                                ).toLocaleDateString("en-US", {
                                  day: "numeric",
                                })}
                                 `
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 my-2 divide-y-[1px]">
        <p className="text-sm font-bold text-gray-800  h-[40px]">
          {session.title}
        </p>
        <p className="mt-2 text-gray-600  my-2">
          {session?.desc?.length > 65 ? (
            <Tooltip title={session?.desc}>
              <span className="cursor-pointer">
                {session?.desc?.slice(0, 65)} {" ..."}
              </span>
            </Tooltip>
          ) : (
            session.desc
          )}
        </p>
      </div>
      <div className="px-6 border-t border-gray-200 ">
        <div className="my-4 flex flex-col gap-3">
          {view && (
            <button
              className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded mr-2 w-full"
              onClick={() =>
                handleSaveAndRedirect(`/${baseURL}/session/${session.id}`)
              }
            >
              View Details
            </button>
          )}
          {edit && (
            <button
              className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded w-full"
              onClick={() =>
                handleSaveAndRedirect(
                  `/${baseURL}/session/create/${session.id}`
                )
              }
            >
              Edit Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card1;
