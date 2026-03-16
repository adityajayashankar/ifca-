import ResourceCarousel from "@/components/common/ResourceCarousel";
import CategoryCard from "@/components/community/categorycard";
import {
  selectAllResources,
  setAllCommunities,
  setAllCommunitiesExpert,
  setAllResources,
  setAllSessions,
  setAllSessionsExpert,
  setResourceIdvl,
} from "@/store/features/resourceSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { CloseOutlined } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const DeleteModal = ({ item, setModal }) => {
  const router = useRouter();
  const handleYes = async () => {
    const res = await api.delete(`/resources/${item.id}`);
    if (res.data.success) {
      router.push(`./`);
      setModal(false);
    }
  };

  const handleNo = () => {
    setModal(false);
  };

  return (
    <div className="w-screen h-screen absolute top-0 backdrop-blur-md flex justify-center items-center">
      <div className="bg-white relative p-4 lg:min-w-[500px] ">
        <div className="p-1 text-xl pb-12 pt-4">
          Are you sure you want to delete this resource?
        </div>
        <div className="flex justify-center items-center">
          <button
            className="w-full bg-red-600 px-2 py-1 m-1 text-white"
            onClick={handleYes}
          >
            Yes
          </button>
          <button
            className="w-full bg-blue-600 px-2 py-1 m-1 text-white"
            onClick={handleNo}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ item, setModal }) => {
  const handleClick = () => {
    setModal(false);
  };

  return (
    <div
      className="w-screen h-screen absolute top-0 backdrop-blur-md flex justify-center items-center"
      onClick={handleClick}
    >
      <div
        className="bg-white border-2 border-black rounded-lg relative p-4 w-[1000px] sm:max-w-[500px] lg:max-w-[1000px] h-[500px] overflow-auto"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex justify-end">
          <button onClick={handleClick}>
            <CloseOutlined />
          </button>
        </div>
        <div>
          <div className="p-2">
            <label htmlFor="name" className="test-md sm:text-xl">
              Name : {item.name}
            </label>
          </div>
          <div className="p-2">
            <label htmlFor="link" className="test-md sm:text-xl">
              Link : <a href={item.link}>{item.link}</a>
            </label>
          </div>

          <div className="test-md sm:text-xl p-2">
            {item?.community?.length > 0 ? (
              <>Also present in these communities</>
            ) : (
              <>Not present in a community</>
            )}
          </div>
          <div className="p-2">
            <ResourceCarousel
              arr={item.community}
              isCommunity={true}
              isDelete={false}
              fun={"none"}
              baseURL={"expert"}
            />
          </div>

          <div className="p-2 test-md sm:text-xl">
            {item?.session?.length > 0 ? (
              <>Also present in these sessions</>
            ) : (
              <>Not present in any session</>
            )}
          </div>
          <div className="p-2">
            <ResourceCarousel
              arr={item.session}
              isCommunity={false}
              isDelete={false}
              fun={"none"}
              baseURL={"expert"}
            />
          </div>
        </div>
      </div>
    </div>
    // </div>
  );
};

const Resources = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const router = useRouter();

  const resources = useSelector(selectAllResources);
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const [currResource, setCurrResource] = useState();

  useEffect(() => {
    dispatch(setAllResources(user?.unifiedUser?.id));
    dispatch(setAllCommunitiesExpert(user?.unifiedUser?.id));
    dispatch(setAllSessionsExpert(user?.unifiedUser?.id));
    // console.log(resources);
  }, []);

  const handleAdd = () => {
    router.push(`/expert/resources/add`);
  };
  
  const handleView = (item) => {
    setCurrResource(item);
    setModal(true);
  };

  const handleEdit = (id) => {
    // dispatch(setResourceIdvl(id));
    router.push(`/expert/resources/${id}`);
  };

  const handleDelete = (item) => {
    // if(res.data.success)
    setDeleteModal(true);
    setCurrResource(item);
  };

  return (
    <div>
      <div className="flex justify-between pr-8 pt-4 mt-9 md:mt-2 ml-4 mb-4">
      <p className="font-bold text-3xl">Resources</p>
        <button
          className="bg-blue-800 text-white text-xl px-4 py-2 rounded-lg"
          onClick={handleAdd}
        >
          + Add
        </button>
      </div>
      <Divider />
      <div className="pt-2">
        {resources?.map((item) => {
          return (
            <div className="p-4 sm:flex items-center justify-between">
              <div className="">
                <label
                  htmlFor="name"
                  className="text-[12px] sm:text-md lg:text-xl"
                >
                  Name :{" "}
                </label>
                <label
                  htmlFor="item-name"
                  className="text-[12px] sm:text-md lg:text-xl"
                >
                  {item.name}
                </label>
                <br />
                <label
                  htmlFor="link"
                  className="text-[12px] sm:text-md lg:text-xl"
                >
                  Link :{" "}
                </label>
                <label
                  htmlFor="item-link"
                  className="text-[12px] sm:text-md lg:text-xl"
                >
                  {item.link}
                </label>
              </div>
              <div className="pr-4">
                <button
                  className="bg-primary-500 text-white py-1 px-3 text-lg rounded-lg mr-2"
                  onClick={() => handleView(item)}
                >
                  View
                </button>
                <button
                  className="bg-primary-500 text-white py-1 px-3 text-lg rounded-lg mr-2"
                  onClick={() => handleEdit(item.id)}
                >
                  {" "}
                  Edit{" "}
                </button>
                <button
                  className="bg-red-700 text-white py-1 px-3 text-lg rounded-lg"
                  onClick={() => handleDelete(item)}
                >
                  {" "}
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {modal ? <Modal item={currResource} setModal={setModal} /> : <></>}
      {deleteModal ? (
        <DeleteModal item={currResource} setModal={setDeleteModal} />
      ) : (
        <></>
      )}
    </div>
  );
};

export default Resources;
