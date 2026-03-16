import Layout from "@/components/layout";
import Head from "next/head";
import CommProduct from "@/components/commProduct";
import CommCart from "@/components/commCart";
import ComHeading from "@/components/comHeading";
import { useSelector } from "react-redux";
import {
  selectCommunity,
  selectCommunityUsers,
  setCommunityById,
  setCommunityUsers,
} from "@/store/features/communitySlice";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { useRouter } from "next/router";

const Commerce = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = router.query;
  const comId = id;

  useEffect(() => {
    if (comId) {
      dispatch(setCommunityById(comId));
      dispatch(setCommunityUsers(comId));
    }
  }, [comId]);

  const currentCommunityUsers = useSelector(selectCommunityUsers);

  const expertDetails = currentCommunityUsers.filter((item) => {
    return item.expertId !== null;
  })[0];

  const det = useSelector(selectCommunity);

  console.log(det);

  const details = {
    peopleCount: 120,
    timings: "4pm to 6pm - Weekends",
    schedule: "1 to 28 Dec - 12 Sessions",
    isLive: false,
    title: "Tabla Lessons",
    level: "Basic",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    discount: 1500,
    price: 3500,
    image: "/cardImg.svg",
    startingDate: "1 Dec",
  };

  return (
    <>
      <Head>
        <title>Class Details</title>
      </Head>
      <Layout>
        <div>
          <ComHeading />
          <div className="mt-5 bg-white p-5 rounded-[10px]">
            <div className="flex items-center gap-5">
              <img src="/comPic.svg" alt="" />
              <span class="font-medium text-lg">{expertDetails.name}</span>
            </div>
            <div className="flex gap-5">
              <div className="flex flex-col items-center justify-center gap-[5px] mt-5 flex-grow-0 flex-shrink-0 basis-10">
                <img src="/upArr.svg" alt="" />
                <span className="text-gray-500">23</span>
                <img src="/downArr.svg" alt="" />
                <span className="text-gray-500">2</span>
              </div>
              <p className="mt-5 leading-normal">{expertDetails.desc}</p>
            </div>
          </div>
          <div className="w-[95%] mt-12">
            <CommProduct details={details} />
            <CommProduct details={details} />
          </div>
          <div className="w-full mt-12">
            <h4 className="m-0">Cart</h4>
            <div className="flex items-start bg-white rounded-[10px] p-5 mt-5 pb-5">
              <div className="flex-grow-0 flex-shrink-0 basis-1/2 pr-[15px] flex flex-col g-5">
                <CommCart details={details} />
                <CommCart details={details} />
              </div>
              <form className="flex flex-col border-l-2 border-solid border-gray-500 gap-[10px] pl-[15px] flex-grow-0 flex-shrink-0 basis-1/2">
                <label className="mt-2 font-medium text-lg" htmlFor="">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Enter Delivery Address"
                  className="border-none bg-[#F6F6F6] p-[15px] rounded-[10px] w-full"
                />
                <label className="mt-2 font-medium text-lg" htmlFor="">
                  Contact
                </label>
                <input
                  type="text"
                  placeholder="Enter Contact Number"
                  className="border-none bg-[#F6F6F6] p-[15px] rounded-[10px] w-full"
                />
                <button
                  type="submit"
                  className="border-none bg-[#3554C5] text-white text-lg font-medium p-[15px] rounded-[10px] mt-5 self-end w-max"
                >
                  Proceed to Buy
                </button>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Commerce;
