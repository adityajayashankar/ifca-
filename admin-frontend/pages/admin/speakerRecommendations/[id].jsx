import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from "next/link";

const id = () => {
  const [myRec, setMyRec] = useState([]);

  const user = useSelector(selectUser);

  useEffect(() => {
    const getMyRecommendations = async () => {
      try {
        const res = await api.get(`/recommendation/${window.location.pathname.split("/")[3]}`);
        setMyRec(res.data.recommendationsBySpeaker);
      } catch (err) {
        toast.error("Could not fetch recommendations");
      }
    };
    getMyRecommendations();
  }, [user]);

  if(myRec.length <= 0){
    return <div className="h-full mt-10 w-full flex items-center justify-center font-bold text-gray-500">No recommended Sessions</div>
  }

  return (
    <div className="mt-5 ml-10">
        <div className='input__group__header'>
            <h2 className="">Recommendations by {myRec && myRec[0]?.speakerDetails.name}</h2>
        </div>
        <div className="mt-10 flex flex-wrap gap-5">
            {myRec?.map((item, index) => (
                <div className="border-2 border-gray-200 rounded-xl p-5" key={index}>
                    <p className="font-bold text-blue-300">{item.recommendedTitle}</p>
                    <p className="text-gray-500">{item.recommendedDesc}</p>
                    <div className="my-5"><CheckCircleIcon className='text-green-500' /> Sent by <Link href={`/admin/speakerRecommendations/${item.speakerDetails.id}`}>{item.speakerDetails.name}</Link></div>
                </div>
            ))}
        </div>
    </div>
  )
};

export default id;
