import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MdCalendarToday, MdAccessTime } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedSession } from "store/features/sessionSlice";
import {
  selectUser,
  selectUserAttendance,
  setSelectedUserSession,
} from "store/features/userSlice";
const Card = ({ session, line, link, expired, auth }) => {
  const dispatch = useDispatch();
  const attendance = useSelector(selectUserAttendance);
  const router = useRouter();
  const [displayLine, setDisplayLine] = useState("Join");
  const user = useSelector(selectUser);
  const handleSessionSelection = () => {
    if (expired) return;
    if (auth && !user) {
      router.replace(`/auth`);
    } else {
      if (link) {
        let obj = { session: session };

        attendance.every((item) => {
          if (item.session.id === session.id) {
            // console.log(item);
            obj["attendance"] = item;
            obj["SessionSlot"] = item.sessionSlot;
            return false;
          }
          return true;
        });

        dispatch(setSelectedUserSession(obj));
        router.push(`/session/bought/${session.id}`);
        return;
      }
      dispatch(setSelectedSession(session));
      router.push(`/session/${session.id}`);
    }
  };

  function handleLineChange() {
    if (expired) {
      setDisplayLine("Session Expired");
    }
    if (line) {
      setDisplayLine(line);
    }
  }

  useEffect(() => {
    handleLineChange();
  }, []);

  return (
    <div className="card">
      <div className="card__header">
        <Image
          src={session.infoImgs[0] || "/assets/images/image2.jpg"}
          alt="card image"
          layout="fill"
        />
      </div>
      <div className="card__body">
        <p className="font-bold line-clamp-1">{session.title}</p>
        <p className="text-sm line-clamp-2">{session.desc}</p>
      </div>
      <div className="card__footer">
        {!link && (
          <div className="flex flex-row w-full justify-between">
            <p className="text-sm text-pink-500 font-bold flex items-center">
              <MdAccessTime className="mr-2" />

              {session.SessionSlot[0]
                ? new Date(session.SessionSlot[0].startTime).toLocaleTimeString(
                    "en-US",
                    { hour: "2-digit", minute: "2-digit" }
                  )
                : ""}
            </p>
            <div className="text-sm text-pink-500 font-bold flex items-center">
              <MdCalendarToday className="mr-2" />
              {session.SessionSlot[0]
                ? ` ${new Date(
                    session.SessionSlot[0].startTime
                  ).toLocaleDateString("en-US", { month: "short" })}
                            ${new Date(
                              session.SessionSlot[0].startTime
                            ).toLocaleDateString("en-US", { day: "numeric" })}
                             `
                : ""}
            </div>
          </div>
        )}
        {/* <Link href={`/session/${session.id}`} passHref> */}
        <button
          className={expired ? "btn btn-gray w-full" : `btn btn-blue w-full`}
          onClick={handleSessionSelection}
        >
          {displayLine}
        </button>
        {/* </Link> */}
      </div>
    </div>
  );
};

export default Card;
