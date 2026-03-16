import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const Theme = ({ themeImg, isActive }) => {
  return (
    <div className="relative w-[30%]">
      <img src={themeImg} alt="" className="h-full w-full" />
      <span className="absolute text-xl font-medium text-white bottom-[15px] left-[15px] mix-blend-difference">
        Theme Name
      </span>
      {isActive && (
        <span className="absolute top-[10px] right-[10px] bg-white rounded-[50%] text-orange-500 flex items-center justify-center p-[2.5px]">
          <CheckCircleOutlineIcon fontSize="large" />
        </span>
      )}
    </div>
  );
};

export default Theme;
