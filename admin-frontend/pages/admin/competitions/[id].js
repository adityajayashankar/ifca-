import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Head from "next/head";

import PublicPageApplyButton from "@/components/competitions/incubator/micro/PublicPageApplyButton";


function Competion() {

  const [logoURL, setlogoUrl] = useState(undefined);
  const [quill, setquill] = useState(null);
  


  const props = {
    compDetails: {
      successObject: {
        title: "AI Hackathon 2024",
        banner: "https://via.placeholder.com/800x400", 
        startDate: "2024-06-10T09:00:00",
        endDate: "2024-06-15T18:00:00",
        application_ends_on: "2025-06-05T23:59:59",
        competition_id: "12345",
        accept_applications: true,
        stages:['stage1', 'stage2', 'stage3']
      },
    },
    user: {
      id: "user_001",
      name: "John Doe",
      isAuthenticated: true,
    },
  };
  
  if (props.user) {
    return (

        <div className=" cust_sm:px-8 relative  antialiased">
          <Head>
            <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
            <style>
              {/*  remove editor border and padding */}
              {`
            .ql-editor {
                border: none !important;
                padding: 10px 0px !important;
                }
                .ql-container.ql-snow
                {
                    border: none !important;
                }
            `}
            </style>
          </Head>
          {/* <nav className="fixed border flex-wrap z-10 bg-white shadow-lg shadow-amber-50 top-5 inset-x-[20%] px-6 py-2  rounded-full flex flex-row items-center justify-between cust_sm:inset-x-[5%] ">
            {logoURL === null ? (
              <img
                className=" object-contain max-h-16 h-12 "
                src={CO_CREATE_LOGO.src}
              />
            ) : (
              <div className="max-h-16 h-12 ">
                <img src={logoURL} fill className="h-full w-full" />
              </div>
            )}
            <div className=" flex flex-row-reverse  gap-5 antialiased max-w-fit  ">
              {!props.user ? (
                <>
                  <a
                    href={`/login?redirect=${encodeURI(redirect)}`}
                    className=" hover:scale-105 hover:z-10 hover:font-semibold hover:text-headingColor transition ease-in-out"
                  >
                    login
                  </a>
                  <a
                    href="/signup"
                    className=" hover:scale-105 hover:z-10  hover:font-semibold hover:text-headingColor transition ease-in-out"
                  >
                    signup
                  </a>
                </>
              ) : (
                <a
                  href="/login"
                  className=" hover:scale-105 hover:z-10  hover:font-semibold hover:text-headingColor transition ease-in-out"
                >
                  My Dashboard
                </a>
              )}
              <a
                href="/startups"
                className=" hover:scale-105 hover:z-10 cust_sm:hidden hover:font-semibold  hover:text-headingColor transition ease-in-out"
              >
                Startups
              </a>
              <a
                href="/incubators"
                className=" hover:scale-105 hover:z-10 cust_sm:hidden hover:font-semibold hover:text-headingColor transition ease-in-out"
              >
                Incubators
              </a>
            </div>
          </nav> */}
          <div className="absolute top-24  inset-x-[10%] cust_sm:inset-x-[5%] p-4 flex flex-col gap-3">
            <p className="text-center py-2 text-4xl font-semibold capitalize text-headingColor border-b-2 ">
              {props.compDetails.successObject.title}
            </p>
            <img
              src={props.compDetails.successObject.banner}
              className="w-full h-[50vh] cust_sm:h-[25vh] rounded-md object-cover "
            />
            <div className="grid grid-cols-7  cust_sm:gap-2  lg:gap-5 ">
              <div className="col-span-7 lg:hidden ">
                <div className="border shadow-lg rounded-md w-full p-3 flex flex-col gap-y-3">
                  <p className="text-lg text-headingColor border-b-2">
                    Timeline
                  </p>
                  <p className="text-sm">
                    Start Date :{" "}
                    <span className="font-semibold">
                      {props.compDetails.successObject.startDate.split("T")[0]}{" "}
                      &nbsp;
                      {props.compDetails.successObject.startDate.split("T")[1]}
                    </span>
                  </p>
                  <p className="text-sm">
                    End Date :{" "}
                    <span className="font-semibold">
                      {props.compDetails.successObject.endDate.split("T")[0]}{" "}
                      &nbsp;
                      {props.compDetails.successObject.endDate.split("T")[1]}
                    </span>
                  </p>
                  <p className="text-sm">
                    Application Stops on :<br />
                    <span className="font-semibold">
                      {
                        props.compDetails.successObject.application_ends_on.split(
                          "T"
                        )[0]
                      }{" "}
                      &nbsp;
                      {
                        props.compDetails.successObject.application_ends_on.split(
                          "T"
                        )[1]
                      }
                    </span>
                  </p>
                  <PublicPageApplyButton
                    user={props.user}
                    competion={props.compDetails.successObject}
                    competition_id={
                      props.compDetails.successObject.competition_id
                    }
                    accept_application={
                      props.compDetails.successObject.accept_applications
                    }
                    application_ends_on={
                      props.compDetails.successObject.application_ends_on
                    }
                  />
                </div>
              </div>
              <div
                id="editor"
                className="border-none -py-[12px] -px-[15px] col-span-5 cust_sm:col-span-7  w-full flex flex-col gap-3"
              ></div>
              <div className="col-span-2 cust_sm:hidden ">
                <div className="border shadow-lg rounded-md p-3 flex flex-col gap-3">
                  <p className="text-lg text-headingColor border-b-2">
                    Timeline
                  </p>
                  <div className="flex flex-col gap-1 border-b-2 pb-3">
                    <p className="font-semibold text-sm">Start Date</p>
                    <div className="flex flex-row justify-between text-sm">
                      <span className="text-xs">
                        {
                          props.compDetails.successObject.startDate.split(
                            "T"
                          )[0]
                        }{" "}
                      </span>
                      <span className="text-xs">
                        {
                          props.compDetails.successObject.startDate.split(
                            "T"
                          )[1]
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 border-b-2 pb-3">
                    <p className="font-semibold text-sm">End Date</p>
                    <div className="flex flex-row justify-between text-sm">
                      <span className="text-xs">
                        {props.compDetails.successObject.endDate.split("T")[0]}{" "}
                      </span>
                      <span className="text-xs">
                        {props.compDetails.successObject.endDate.split("T")[1]}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pb-3">
                    <p className="font-semibold text-sm">
                      Application Stops on
                    </p>
                    <div className="flex flex-row justify-between text-sm">
                      <span className="text-xs">
                        {props.compDetails.successObject.endDate.split("T")[0]}{" "}
                      </span>
                      <span className="text-xs">
                        {props.compDetails.successObject.endDate.split("T")[1]}
                      </span>
                    </div>
                  </div>
                  <PublicPageApplyButton
                    user={props.user}
                    competion={props.compDetails.successObject}
                    competition_id={
                      props.compDetails.successObject.competition_id
                    }
                    accept_application={
                      props.compDetails.successObject.accept_applications
                    }
                    application_ends_on={
                      props.compDetails.successObject.application_ends_on
                    }
                  />
                </div>
              </div>
            </div>
            {/* <div>
              <Footer />
            </div> */}
          </div>
          {/* <div className="absolute top-24">{JSON.stringify(props.user)}</div> */}
        </div>
    );
  } else {
    return (
      <div className="px-32 relative  antialiased">
        <Head>
          <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
          <style>
            {/*  remove editor border and padding */}
            {`
              .ql-editor {
                  border: none !important;
                  padding: 10px 0px !important;
                  }
                  .ql-container.ql-snow
                  {
                      border: none !important;
                  }
              `}
          </style>
        </Head>
        <nav className="fixed border z-10 bg-white shadow-lg shadow-amber-50 top-5 inset-x-[20%] px-6 py-2  rounded-full flex flex-row items-center justify-between cust_sm:inset-x-[5%] ">
          {logoURL === null ? (
            <img
              className=" object-contain max-h-16 h-12 "
              src={CO_CREATE_LOGO.src}
            />
          ) : (
            <div className="max-h-16 h-12 ">
              <img src={logoURL} fill className="h-full w-full" />
            </div>
          )}
          {/* <div className=" flex flex-row-reverse gap-5 antialiased max-w-fit  ">
            {!props.user ? (
              <>
                <a
                  href={`/login?redirect=${encodeURI(redirect)}`}
                  className=" hover:scale-105 hover:z-10 hover:font-semibold hover:text-headingColor transition ease-in-out"
                >
                  login
                </a>
                <a
                  href="/signup"
                  className=" hover:scale-105 hover:z-10  hover:font-semibold hover:text-headingColor transition ease-in-out"
                >
                  signup
                </a>
              </>
            ) : (
              <a
                href="/login"
                className=" hover:scale-105 hover:z-10  hover:font-semibold hover:text-headingColor transition ease-in-out"
              >
                My Dashboard
              </a>
            )}
            <a
              href="/startups"
              className=" hover:scale-105 hover:z-10 cust_sm:hidden hover:font-semibold  hover:text-headingColor transition ease-in-out"
            >
              Startups
            </a>
            <a
              href="/incubators"
              className=" hover:scale-105 hover:z-10 cust_sm:hidden hover:font-semibold hover:text-headingColor transition ease-in-out"
            >
              Incubators
            </a>
          </div> */}
        </nav>
        <div className="absolute top-24  inset-x-[10%] cust_sm:inset-x-[5%] p-4 flex flex-col gap-3">
          <p className="text-center py-2 text-4xl font-semibold capitalize text-headingColor border-b-2 ">
            {props.compDetails.successObject.title}
          </p>
          <img
            src={props.compDetails.successObject.banner}
            className="w-full h-[30rem] rounded-md object-cover mb-3"
          />
          <div className="grid grid-cols-7 cust_sm:grid-cols-1 lg:gap-5 cust_sm:gap-y-3  ">
            <div className="col-span-7 lg:hidden ">
              <div className="border shadow-lg rounded-md p-3 flex flex-col gap-3">
                <p className="text-lg text-headingColor border-b-2">Timeline</p>
                <div className="flex flex-col gap-1 border-b-2 pb-3">
                  <p className="font-semibold text-sm">Start Date</p>
                  <div className="flex flex-row justify-between text-sm">
                    <span className="text-xs">
                      {props.compDetails.successObject.startDate.split("T")[0]}{" "}
                    </span>
                    <span className="text-xs">
                      {props.compDetails.successObject.startDate.split("T")[1]}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 border-b-2 pb-3">
                  <p className="font-semibold text-sm">End Date</p>
                  <div className="flex flex-row justify-between text-sm">
                    <span className="text-xs">
                      {props.compDetails.successObject.endDate.split("T")[0]}{" "}
                    </span>
                    <span className="text-xs">
                      {props.compDetails.successObject.endDate.split("T")[1]}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pb-3">
                  <p className="font-semibold text-sm">Application Stops on</p>
                  <div className="flex flex-row justify-between text-sm">
                    <span className="text-xs">
                      {props.compDetails.successObject.endDate.split("T")[0]}{" "}
                    </span>
                    <span className="text-xs">
                      {props.compDetails.successObject.endDate.split("T")[1]}
                    </span>
                  </div>
                </div>
                <PublicPageApplyButton
                  user={props.user}
                  competion={props.compDetails.successObject}
                  competition_id={
                    props.compDetails.successObject.competition_id
                  }
                  accept_application={
                    props.compDetails.successObject.accept_applications
                  }
                  application_ends_on={
                    props.compDetails.successObject.application_ends_on
                  }
                />
              </div>
            </div>
            <div className="col-span-5   w-full flex flex-col gap-3">
              <div
                id="editor"
                className="border-none -py-[12px] -px-[15px]"
              ></div>
            </div>
            <div className="col-span-2 cust_sm:hidden ">
              <div className="border shadow-lg rounded-md p-3 flex flex-col gap-3">
                <p className="text-lg text-headingColor border-b-2">Timeline</p>
                <div className="flex flex-col gap-1 border-b-2 pb-3">
                  <p className="font-semibold text-sm">Start Date</p>
                  <div className="flex flex-row justify-between text-sm">
                    <span className="text-xs">
                      {props.compDetails.successObject.startDate.split("T")[0]}{" "}
                    </span>
                    <span className="text-xs">
                      {props.compDetails.successObject.startDate.split("T")[1]}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 border-b-2 pb-3">
                  <p className="font-semibold text-sm">End Date</p>
                  <div className="flex flex-row justify-between text-sm">
                    <span className="text-xs">
                      {props.compDetails.successObject.endDate.split("T")[0]}{" "}
                    </span>
                    <span className="text-xs">
                      {props.compDetails.successObject.endDate.split("T")[1]}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pb-3">
                  <p className="font-semibold text-sm">Application Stops on</p>
                  <div className="flex flex-row justify-between text-sm">
                    <span className="text-xs">
                      {props.compDetails.successObject.endDate.split("T")[0]}{" "}
                    </span>
                    <span className="text-xs">
                      {props.compDetails.successObject.endDate.split("T")[1]}
                    </span>
                  </div>
                </div>
                <PublicPageApplyButton
                  user={props.user}
                  competion={props.compDetails.successObject}
                  competition_id={
                    props.compDetails.successObject.competition_id
                  }
                  accept_application={
                    props.compDetails.successObject.accept_applications
                  }
                  application_ends_on={
                    props.compDetails.successObject.application_ends_on
                  }
                />
              </div>
            </div>
          </div>
          <div>
            <Footer />
          </div>
        </div>
        {/* <div className="absolute top-24">{JSON.stringify(props.user)}</div> */}
      </div>
    );
  }
}

export default Competion;

// export const getServerSideProps = withSession(async ({ req, res, query }) => {
//   const user = await getUserSettings({ req, res });
//   console.log("userSetting ", user);
//   const { id } = query;
//   const PublicAPIService = new PublicApis();
//   const compDetails = await PublicAPIService.getCompetitionDetailsForPublic(id);
//   if (!compDetails.status) {
//     return {
//       redirect: {
//         destination: "/",
//         permanent: false,
//       },
//     };
//   }
//   return {
//     props: { user, compDetails },
//   };
// });
