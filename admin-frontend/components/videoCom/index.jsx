import styles from "./videoCom.module.scss";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const VideoCom = () => {
  return (
    <div className={`${styles.videoCom} w-full`}>
      <div className={styles.topCont}>
        <img src="/videoThumb.svg" alt="" />
        <button className="bg-gray-200 rounded-full">
          <PlayArrowIcon fontSize="large" />
        </button>
      </div>
      <div className={styles.btmCont}>
        <div className="my-5">
          <span>Lecture 1</span>
          <span>
            <AccessTimeOutlinedIcon />4 mins
          </span>
        </div>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. </p>
      </div>
    </div>
  );
};

export default VideoCom;
