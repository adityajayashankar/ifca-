const AdvertiseCard = ({ image, heading, desc }) => {
  return (
    <div className="gradient_background rounded-lg text-white py-[40px] px-[20px] mt-5 flex flex-col justify-between lg:w-[32%]">
      <div>
        <span className="rounded-full bg-white flex items-center justify-center h-[50px] w-[50px] p-[5px]">
          <img className="object-cover" src={image} alt="" />
        </span>
        <h3 className="mt-[10px] mb-[20px] text-xl font-bold">{heading}</h3>
      </div>
      <p className="text-[17px]">{desc}</p>
    </div>
  );
};

export default AdvertiseCard;
