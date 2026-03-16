import StarIcon from "@mui/icons-material/Star";

const CommProduct = ({ details }) => {
  return (
    <div className="bg-white rounded-[10px] flex items-center justify-between mt-[20px] drop-shadow-[0px 0px_20px_rgba(0,0,0,0.15)]">
      <div className="flex gap[10px]">
        <img src="/tablaCommProduct.svg" className="h-full" alt="" />
        <div className="flex flex-col justify-between p-4">
          <h4 className="m-0 text-xl">Product Name</h4>
          <p className="m-0 flex items-center gap-[10px]">
            <span className="text-orange-500 font-semibold">
              ₹ {details.price - details.discount}
            </span>
            <span className="line-through text-gray-500">
              ₹ {details.price}
            </span>
          </p>
        </div>
      </div>
      <div className="p-[10px] flex flex-col justify-between">
        <p className="flex items-center justify-end gap-[5px] text-[#F0C932] my-[5px] mt-0 mb-[7.5px]">
          <StarIcon />
          <span className="text-black font-semibold text-lg">4.5</span>
        </p>
        <div className="flex items-center gap-[5px]">
          <button className="ml-[10px] rounded font-medium text-base py-[7.5px] px-[15px] border-2 border-solid border-gray-500 bg-transparent text-gray-500">
            View Details
          </button>
          <button className="ml-[10px] rounded text-base py-[8.5px] px-[16px] border-none bg-[#3554C540] text-[#3554C5] font-bold">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommProduct;
