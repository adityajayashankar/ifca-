import ComHeading from "@/components/comHeading";
import Layout from "@/components/layout";
import TrainerClass from "@/components/trainerClass";
import Head from "next/head";

const TrainorBio = () => {
  return (
    <>
      <Head>
        <title>Class Details</title>
      </Head>
      <Layout>
        <div>
          <ComHeading />
          <div>
            <div className="mt-[50px] flex gap-5">
              <div className="relative">
                <img src="/trainorImg.svg" alt="" />
                <span className="absolute top-0 left-0 bg-white p-[10px] flex items-center justify-center rounded-r-[10px] rounded-b-[10px]">
                  <img src="/verifiedTrainor.svg" alt="" />
                </span>
              </div>
              <div className="flex flex-col flex-shrink-0 flex-grow-0 basis-1/3 justify-between">
                <div className="mb-[10px]">
                  <p className="m-0 text-orange-500 font-medium">EXPERT</p>
                  <h3 className="my-[5px] text-xl font-semibold">Tyler B</h3>
                </div>
                <p className="my-10px font-medium text-gray-500 text-lg">
                  Qualifications Sed ut perspiciatis unde omnis iste natus error
                  sit voluptatem{" "}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center text-gray-400 text-lg font-medium">
                    <p>Total Students</p>
                    <p className="text-[#666] font-semibold">930,862</p>
                  </div>
                  <div className="flex flex-col items-center text-gray-400 text-lg font-medium">
                    <p className="m-0">Reviews</p>
                    <p className="m-0 text-[#666] font-semibolds">76,548</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-3/4 mt-[50px] text-gray-500">
              <h4 className="text-[#444]">About Me</h4>
              <p className="text-[17px]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
            <div>
              <h4>My Classes (5)</h4>
              <TrainerClass />
              <TrainerClass />
              <TrainerClass />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default TrainorBio;
