import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import InfoForm from "@/components/content/InfoForm";
const ContentPage = ({}) => {
  const pages = [
    { name: "Landing Page", value: "landing" },
    { name: "About Us", value: "aboutus" },
  ];
  const pagesx = { landing: "Landing Page", aboutus: "About Us" };
  const [selectedPage, setSelectedPage] = useState("landing");
  const [changedData, setChangedData] = useState({
    banner: {
      mainText: "",
      tagLineText: "",
      bannerImg: "",
    },
    communitydata: {
      glance: "",
      title: "",
      content: "",
    },
    bannerImg: "",
    mainContent: "",
    headingText: "",
  });
  // const [banner,setBanner] = useState({
  //   mainText:"",
  //   taglineText:"",
  //   bannerImg:""
  // })

  const [descPoints, setDescPoints] = useState([]);
  useEffect(() => {
    // console.log(selectedPage);
    axios
      .get(`/contentapi/${selectedPage}`)
      .then((res) => {
        // console.log(res.data);
        setChangedData(res.data.page);
        if (selectedPage === "landing") {
          setDescPoints(res.data.page.description);
        }
      })
      .catch((err) => {
        // console.log(res);
        console.log(err);
      });
    // console.log(changedData);
  }, []);
  const handleChange = (e) => {
    e.preventDefault();
    // console.log(e.target.value);
    setChangedData({
      ...changedData,
      banner: { ...changedData.banner, [e.target.name]: e.target.value },
      communitydata: {
        ...changedData.communitydata,
        [e.target.name]: e.target.value,
      },
      [e.target.name]: e.target.value,
    });
  };

  const handlePageChange = (e) => {
    axios
      .get(`/contentapi/${e.target.value}`)
      .then((res) => {
        setChangedData(res.data.page);
      })
      .catch((e) => {
        console.log(e);
      });
    setSelectedPage(e.target.value);
  };

  const validate = () => {
    const mainTextReegEx = new RegExp();
    if (
      changedData.banner.mainText === "" ||
      changedData.banner.mainText === " "
    )
      return { status: false, message: "Banner main text cannot be empty" };
    if (
      changedData.banner.tagLineText === "" ||
      changedData.banner.tagLineText === " "
    )
      return { status: false, message: "Banner tag line cannot be empty" };
    if (
      changedData.banner.bannerImg === "" ||
      changedData.banner.bannerImg === " "
    )
      return { status: false, message: "Banner Image cannot be empty" };
    if (
      changedData.communitydata.glance === "" ||
      changedData.communitydata.glance === " "
    )
      return { status: false, message: "Community glance cannot be empty" };
    if (
      changedData.communitydata.title === "" ||
      changedData.communitydata.title === " "
    )
      return { status: false, message: "Community title cannot be empty" };
    if (
      changedData.communitydata.content === "" ||
      changedData.communitydata.content === " "
    )
      return { status: false, message: "Community content cannot be empty" };
    return { status: true, message: "Validation Successful" };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (!err.status) {
      toast(err.message, { type: "error" });
    } else {
      // console.log(changedData);
      if (selectedPage === "landing") {
        axios
          .post(`/contentapi/landing`, {
            ...changedData,
            description: descPoints,
          })
          .then((res) => {
            if (res.data) {
              setChangedData(res.data.page);
              toast(`Updated Landing page!`, { type: "success" });
            }
          })
          .catch((err) => {
            toast(`Error occured`, { type: "error" });
            console.log(err);
          });
      } else {
        axios
          .post(`/contentapi/aboutus`, changedData)
          .then((res) => {
            if (res.data) {
              setChangedData(res.data.page);
              toast(`Updated About us page!`, { type: "success" });
            }
          })
          .catch((err) => {
            toast(`Error occured`, { type: "error" });
            console.log(err);
          });
      }
    }
  };
  const changeDescription = (index, target, value) => {
    let temp = descPoints;
    temp[index].points[target] = value;
    setDescPoints(temp);
  };
  const handleRemoveCard = (index) => {
    let temp = descPoints;
    setDescPoints(temp.filter((item, i) => i !== index));
  };
  const handleAddCard = (e) => {
    e.preventDefault();
    let init = {
      title: "thisistitle",
      points: [{ subHeader: "subheader", main: "main", index: 1 }],
    };
    let temp = JSON.parse(JSON.stringify(descPoints));
    temp.push(init);
    setDescPoints(temp);
  };
  return (
    <div className="min-h-screen w-full">
      <section className="text-left py-10 max-w-7xl mx-auto">
        <div className="input__group__header">
          <h2>Customize Content</h2>
          <p className="text-sm text-gray-400">
            This lets you customize content available on the user page
          </p>
        </div>

        {/* <div className='my-4'>
          <div className='flex text-md text-gray-400 items-center'>
              <label>
                  <b>Show </b>
              <select onChange={handleTakeChange}>
                  <option value={4}>4 sessions</option>
                  <option value={8}>8 sessions</option>
              </select>
              </label>

              <HiArrowCircleLeft className={`text-2xl cursor-pointer ${skip!==0?'text-[#0C74D4]':'text-gray-400'}`} onClick={()=>handleFetchNext({newTake:take,newSkip:skip-take})}/>
              <HiArrowCircleRight className={`text-2xl cursor-pointer ${skip+take<totalSessions?'text-[#0C74D4]':'text-gray-400'}`} onClick={()=>handleFetchNext({newTake:take,newSkip:skip+take})}/>
              
          </div>
      </div> */}
        <div>
          <label>
            <b>Select Page </b>
            <select onChange={handlePageChange}>
              {Object.keys(pagesx).map((item, index) => (
                <option key={`option-${index}`} value={item}>
                  {pagesx[item]}
                </option>
              ))}
            </select>
          </label>
          {selectedPage === "landing" ? (
            <div>
              {/* Contains the required forms */}
              <h2 className="text-step-2 my-8">Banner Info</h2>
              <div className="ml-8 md:ml-16">
                <label htmlFor="name" className="label">
                  <span className="label__text">
                    Main Text
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    id="name"
                    name="mainText"
                    className="input"
                    required
                    // defaultValue={changedData?.banner?.mainText}
                    value={changedData?.banner?.mainText}
                    // readOnly={isEdit}
                    onChange={handleChange}
                  />
                </label>
                <label htmlFor="name" className="label">
                  <span className="label__text">
                    TagLine Text
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    id="name"
                    name="tagLineText"
                    className="input"
                    required
                    // defaultValue={changedData?.banner?.taglineText}
                    value={changedData?.banner?.taglineText}
                    // readOnly={isEdit}
                    onChange={handleChange}
                  />
                </label>
                <label htmlFor="desc" className="label">
                  <span className="label__text">
                    BannerImg
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    id="name"
                    name="bannerImg"
                    className="input"
                    required
                    // defaultValue={changedData?.banner?.bannerImg}
                    value={changedData?.banner?.bannerImg}
                    // readOnly={isEdit}
                    onChange={handleChange}
                  />
                </label>
              </div>
              <h2 className="text-step-2 my-8 ">Cards Info</h2>
              <div className="grid grid-cols-2">
                {descPoints.map((item, index) => {
                  return (
                    <>
                      <div
                        key={`info-${index}`}
                        className="flex bg-slate-200 m-4 p-4 rounded-lg"
                      >
                        <div className="flex flex-col">
                          <h3 className="m-8">{`Card-${index + 1}`}</h3>

                          <InfoForm
                            data={item}
                            id={index}
                            setData={changeDescription}
                          />
                        </div>

                        <button
                          className="btn bg-[#4E795E80] text-white m-4 h-16"
                          onClick={() => handleRemoveCard(index)}
                        >
                          Remove Card
                        </button>
                      </div>
                    </>
                  );
                })}
              </div>
              <button className="btn btn-pink" onClick={handleAddCard}>
                Add Card
              </button>
              <h2 className="text-step-2 my-8 ">Community Info</h2>
              <div className="ml-8 md:ml-16 ">
                <label htmlFor="name" className="label">
                  <span className="label__text">
                    Glance
                    <span className="text-red-500">*</span>
                  </span>
                  <p className="text-sm text-gray-500">
                    Sets what you see on top of the Community section
                    <span className="text-red-500">*</span>
                  </p>
                  <input
                    type="text"
                    id="name"
                    name="glance"
                    className="input"
                    required
                    defaultValue={changedData?.communitydata?.glance}
                    // readOnly={isEdit}
                    onChange={handleChange}
                  />
                </label>
                <label htmlFor="name" className="label">
                  <span className="label__text">
                    Title
                    <span className="text-red-500">*</span>
                  </span>
                  <p className="text-sm text-gray-500">
                    Sets what you see on top of the Community section
                    <span className="text-red-500">*</span>
                  </p>
                  <input
                    type="text"
                    id="name"
                    name="title"
                    className="input"
                    required
                    defaultValue={changedData?.communitydata?.title}
                    // readOnly={isEdit}
                    onChange={handleChange}
                  />
                </label>
                <label htmlFor="desc" className="label">
                  <span className="label__text">
                    Content
                    <span className="text-red-500">*</span>
                  </span>
                  <textarea
                    id="desc"
                    name="content"
                    className="input"
                    defaultValue={changedData?.communitydata?.content}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              {/* <h2 className="text-step-2 my-8">Activities</h2> */}
            </div>
          ) : (
            <div>
              <h2 className="text-step-2 my-8">About us</h2>
              <div className="ml-8 md:ml-16">
                <label htmlFor="name" className="label">
                  <span className="label__text">
                    Heading Text
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    id="name"
                    name="xxx.headingText"
                    className="input"
                    required
                    defaultValue={changedData?.headingText}
                    // readOnly={isEdit}
                    onChange={handleChange}
                  />
                </label>
                <label htmlFor="name" className="label">
                  <span className="label__text">
                    Main Content
                    <span className="text-red-500">*</span>
                  </span>
                  <textarea
                    id="desc"
                    name="xxx.mainContent"
                    className="input"
                    defaultValue={changedData?.mainContent}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label htmlFor="desc" className="label">
                  <span className="label__text">
                    BannerImg
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    id="name"
                    name="xxx.bannerImg"
                    className="input"
                    required
                    defaultValue={changedData?.bannerImg}
                    // readOnly={isEdit}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <button className="btn btn-blue my-8" onClick={handleSubmit}>
              Save Changes
            </button>
          </div>
        </div>
        {/* <div className="input__group__header">
          <h2>Completed Sessions</h2>
        </div>
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto gap-6 my-10 py-10 max-w-7xl"></div> */}
      </section>
    </div>
  );
};

export default ContentPage;
