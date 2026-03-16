import HighlightOffIcon from "@mui/icons-material/HighlightOff";

const CommCart = ({ details }) => {
  return (
    <div className="bg-transparent rounded-[10px] flex items-center justify-between relative border-2 border-solid border-[#3554C5]">
      <div className="flex gap-2">
        <img src="/tablaCommCart.svg" alt="" className="h-full" />
        <div className="flex flex-col justify-between p-4">
          <h4 className="m-0 text-xl">Product Name</h4>
          <p className="m-0 flex items-center justify-between">
            <span className="bg-gray-500 font-medium text-lg">QTY: 1</span>
            <span className="text-orange-500 font-semibold">
              ₹ {details.price - details.discount}
            </span>
          </p>
        </div>
      </div>
      <span className="absolute top-[10px] right-[10px] cursor-pointer text-orange-500">
        <HighlightOffIcon />
      </span>
    </div>
  );
};

export default CommCart;
