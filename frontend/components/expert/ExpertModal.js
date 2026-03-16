import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import ScheduleCard from "../scheduleCard";
import {
  selectExpertSessions,
  setExpertSession,
} from "@/store/features/expertSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import SessionCardList from "../sessionsCardList";

const ExpertModal = (props) => {
  const dispatch = useDispatch();

  const sessions = useSelector(selectExpertSessions);

  useEffect(() => {
    dispatch(setExpertSession(props.item.id));
  }, []);

  return (
    <div className="fixed top-0 w-screen h-screen backdrop-blur-sm bg-black/10 z-50 left-0 flex items-center justify-center">
      <div className="rounded overflow-hidden bg-white sm:w-4/5 md:w-3/4 p-5">
        <div className="flex justify-end">
          <button
            onClick={() => props.setShowModal(false)}
            className="text-orange-500"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex">
          <img
            src={props.item.photoURL || "/Landing_Our Expert_Expand.png"}
            className="w-40 h-40 cover rounded object-cover"
          />
          <div className="px-5">
            <h3 className="m-0">{props.item.name}</h3>
            <p className="text-sm py-2">{props.item.desc}</p>
            {props.item?.SessionSlots?.length && (
              <p>{props.item?.SessionSlots?.length} sessions</p>
            )}{" "}
          </div>
        </div>

        <SessionCardList Sessions={sessions} expertModal />
      </div>
    </div>
  );
};

export default ExpertModal;
