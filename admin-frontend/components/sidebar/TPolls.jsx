const TPolls = ({ black }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity={black ? "1" : "0.6"}>
        <path
          d="M1.5 14.5H14.5"
          stroke="#303030"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M12.5 14.5V4.5"
          stroke="#303030"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M8.5 14.5V8.5"
          stroke="#303030"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M4.5 14.5V1.5"
          stroke="#303030"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  );
};

export default TPolls;
