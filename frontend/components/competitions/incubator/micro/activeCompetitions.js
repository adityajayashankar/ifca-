import { useEffect, useState } from "react";
import api from "@/utils/apiSetup";

function ActiveCompetions() {
  const [activeComps, setActivecomps] = useState([]);
  useEffect(() => {
    fetchActiveCompetitions()
  }, []);

  const fetchActiveCompetitions = async ()=>{
    await api.get('/competitions')
    .then((res)=>{
      setActivecomps(res?.data)
    })
    .catch((err)=>{
      console.log('error--', err)
    })
  }

  return (
    <div className="py-4 flex flex-col gap-3">
      <p className="text-headingColor text-lg font-semibold">Active</p>
      <div className="grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-6 p-4">
        {activeComps?.length === 0 ? (
          <p className="font-semibold">No Competitions to display yet!!</p>
        ) : (
          activeComps?.map((item) => (
            <div
              key={item.id}
              className="relative flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 group"
            >
              {/* Image with overlay */}
              <div className="relative w-full aspect-[4/3]  bg-gray-100 flex items-center justify-center">
                <img
                  src={item.bannerUrl}
                  alt={item.title}
                  className="object-cover w-full aspect-[4/3] h-full max-h-[250px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="absolute top-3 left-3 bg-orange-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                  {item?.Stage?.length} Stage{item?.Stage?.length === 1 ? '' : 's'}
                </span>
                <span className="absolute bottom-3 right-3 bg-white/90 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold shadow">
                  Deadline: {item.endDate.split("T")[0]}
                </span>
              </div>
              {/* Card content */}
              <div className="flex flex-col gap-2 p-4 grow">
                <a
                  href={`/competitions/${item.id}`}
                  className="text-lg font-bold text-gray-900 hover:text-orange-700 transition line-clamp-1"
                >
                  {item.title}
                </a>
                <p className="capitalize text-xs text-gray-500 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex justify-end mt-auto">
                  <a
                    href={`/competitions/${item.id}`}
                    className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 text-xs font-semibold group-hover:underline transition"
                  >
                    View Details <span className="text-base">→</span>
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActiveCompetions;
