import StarIcon from "@mui/icons-material/Star";

const TrainerClass = () => {
  return (
    <div className="flex items-center gap-5 bg-white rounded-[10px] mt-5">
      <div>
        <img src="/trainerClassImg.svg" alt="" />
      </div>
      <div>
        <h4 className="m-0 text-xl font-medium">
          Class Title Lorem ipsum dolor sit amet{" "}
        </h4>
        <p className="m-0 font-medium text-gray-500 my-[10px]">
          21 hours &bull; 5 sessions &bull; Beginner
        </p>
        <div className="flex items-center justify-between mt-5">
          <span className="font-medium text-orange-500 text-lg">FREE</span>
          <span className="font-medium text-gray-500 flex items-center gap-[10px] text-lg">
            4.5{" "}
            <span className="text-[#F0C932]">
              <StarIcon />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrainerClass;
