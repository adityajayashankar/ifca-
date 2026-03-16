const Guidelines = ({ img, text }) => {
  return (
    <div className="flex flex-col items-center rounded-lg bg-[#F1F1F1] justify-around border-[2px]  b-white w-[270px] h-[275px] py-[10px] px-[20px]">
      <span className="bg-[#3554C566] rounded-[50%] p-[20px] items-center justify-center">
        <img src={img} alt="" className="w-[32px] h-[32px]" />
      </span>
      <p className="text-orange-500 font-[600] text-[21px] text-center">{text}</p>
    </div>
  );
};

export default Guidelines;
