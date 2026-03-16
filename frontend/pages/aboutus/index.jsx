import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import React from "react";

const aboutus = () => {
  const coordinates = [
    {
      image: "/co1.png",
      title: "Chair",
      name: "Poyni Bhat",
    },
    {
      image: "/co2.png",
      title: "Co Chair",
      name: "Suresh Narasimha",
    },
    {
      image: "/co3.png",
      title: "Chief Coordinates",
      name: "Karthik Kittu",
    },
  ];
  return (
    <>
      <Topbar />
      <div className="mt-[80px] bg-[url(/Bharat-Mandapam.png)] bg-cover bg-center w-full h-[600px] flex flex-col justify-end items-center">
        <div>
          <h2 className="text-center text-white text-2xl md:text-4xl w-[100vw]">
            18th - 20th March, 2024 <br />
            At Bharat Mandapam
          </h2>
        </div>
        <div className="w-full h-[80px] bg-gradient-to-t from-white to-transparent"></div>
      </div>
      <div className="md:h-[80vh] flex flex-col md:flex-row mx-auto">
        <div className="flex items-center justify-center gap-3 w-[50%] h-full min-h-[100px] mx-auto">
          <img
            src="/logoifca.png"
            alt="logo"
            width={600}
            height={48}
            layout="responsive"
            objectFit="contain"
          />
        </div>
        <div className="flex gap-3 flex-col px-4 md:px-12 py-4 justify-center md:w-[50%] text-base font-medium">
          <p>
            Startup Mahakumbh is scheduled as a three-day event from March
            18-20, 2024 (Monday to Wednesday).
          </p>
          <p>
            A first-of-its-kind event in India's entrepreneurial landscape in
            terms of size, scale, and thought leadership. Taking place at the
            sprawling Bharat Mandapam, along with Hall 1 and Hall 14, at Pragati
            Maidan, New Delhi, this event stands out not only for its sheer
            magnitude but also for its strategic significance and innovative
            approach to fostering entrepreneurship and innovation.
          </p>
          <p>
            It is envisioned to be one of the largest congregations of startups,
            and is set to host approximately 1,000 startups from India and
            around the globe, spanning a diverse range of industries. The event
            is driven by Industry Stakeholders, with a support from
            Government organizations.
          </p>
        </div>
      </div>
      <div className="bg-[#EF8130] text-white flex justify-center flex-col pt-6 pb-16">
        <h2 className="text-2xl md:text-5xl mx-auto">Incubator Pavilion</h2>
        <div className="bg-white w-[300px] mx-auto h-[4px] mt-2"></div>
        <p className="mt-8 mb-10 md:text-2xl text-center font-semibold px-4">
          Incubator pavilion is one of the 10 themes meant <br />
          to bring together all drives of ecosystem
        </p>
        <div className="bg-white w-[100px] mx-auto h-[4px] mt-2"></div>
        <h2 className="text-2xl md:text-5xl mx-auto mt-4">
          Coordinators of the <br />
          Incubator Pavilion
        </h2>
        <div className="flex flex-col md:flex-row gap-x-28 gap-y-20 items-center justify-center mx-auto px-20 my-10">
          {coordinates.map((data, index) => (
            <div key={index}>
              <img
                src={data.image}
                width={"200px"}
                height={"200px"}
                alt="coordinates"
              />
              <p className="text-lg font-semibold text-center mt-6">
                {data.title}
              </p>
              <p className="text-lg font-bold text-center">{data.name}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default aboutus;
