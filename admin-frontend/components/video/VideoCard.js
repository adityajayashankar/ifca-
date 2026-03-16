import { setSelectedVideo } from "@/store/features/videoSlice";
import Image from "next/image";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";


function VideoCard({ video, baseURL }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const handleSelection = (e) => {
    e.preventDefault();
    dispatch(setSelectedVideo(video));
    router.push(`/${baseURL}/video/${video.id}`);
  };
  return (
    <div className="category__card" onClick={handleSelection}>
      <div className="category__card__image">
        <Image
          src={video.thumbnailURL || "https://loremflickr.com/1080/720"}
          alt={video.title}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="category__card__body">
        <img
          src="/assets/images/playbtn.svg"
          className="absolute top-1/3 left-1/3 text-white w-1/3 h-1/3"
        />
        <h3 className="category__card__body__title">{video.title}</h3>
        <p className="category__card__body__desc">{video.desc}</p>
      </div>
    </div>
  );
}


export default VideoCard;
