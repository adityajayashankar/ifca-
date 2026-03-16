import ResourceCarousel from "@/components/common/ResourceCarousel";
import {
  selectAllCommunities,
  selectAllSessions,
  selectAllResources,
} from "@/store/features/resourceSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const IvdlResource = () => {
  const form = useRef(null);
  const router = useRouter();
  const { id } = router.query;

  const resource = useSelector(selectAllResources);
  const allCommunities = useSelector(selectAllCommunities);
  const allSessions = useSelector(selectAllSessions);

  const [deleteSession, setDeleteSession] = useState([]);
  const [deleteCommunity, setDeleteCommunity] = useState([]);
  const [selectSession, setSelectSession] = useState([])
  const [currName, setCurrentNameLocal] = useState("");
  const [currLink, setCurrentLinkLocal] = useState("");
  const [communties, setCommunities] = useState([]);

  const handleName = (e) => {
    // setResName(e.target.value)
    setCurrentNameLocal(e.target.value)
  }

  const handleLink = (e) => {
    setCurrentLinkLocal(e.target.value)
  }

  const handleSubmit = async (e) => {
    // router.push(`/resources`)
    e.preventDefault();
    const res = await api.patch(`/resources/${id}`, {
      data: {
        addCommunity: communties,
        removeCommunity: deleteCommunity,
        addSessions: selectSession,
        removeSessions: deleteSession,
        name: currName,
        link: currLink,
      },
    });
    if (res.data.success) {
      toast(`Edit Successful`, { type: "success" });
      router.push(`/expert/resources`);
    }
  };

  const handleClearForm = (e) => {
    e.preventDefault();
    form.current.reset();

    setCurrentNameLocal(resource.name)
    setCurrentLinkLocal(resource.link)
    setSelectCommunity([])
    setSelectSession([])
    setDeleteSession([])
    setDeleteCommunity([])
  };

  useEffect(() => {
    if (Array.isArray(resource) && resource.length > 0) {
      let data = resource?.find((x) => x.id == id);
      setCurrentNameLocal(data?.name)
      setCurrentLinkLocal(data?.link)
      setCommunities(data?.community);
      setSelectSession(data?.session)
      let sess = allSessions.filter((x) => !data?.session?.some((ele) => ele.id === x.id))
      sess = sess.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)
      setDeleteSession(sess)
    }
  }, [id]);

  const handleSelectCommunity = (item) => {
    setCommunities([...communties, item])
    setDeleteCommunity(deleteCommunity.filter((x) => x.id != item.id));
  };

  const handleDeleteCommunity = (item) => {
    setCommunities(communties.filter(x => x.id != item.id))
    setDeleteCommunity([...deleteCommunity, item]);
  };

  const handleSelectSession = (item) => {
    if (!selectSession.some((x) => x.id === item.id)) {
      setSelectSession([...selectSession, item]);
    }
    setDeleteSession(deleteSession.filter((x) => x.id != item.id));
  };

  const handleDeleteSession = (item) => {
    setSelectSession(selectSession.filter(x => x.id != item.id));
    setDeleteSession([...deleteSession, item]);
  };

  return (
    <div className="flex justify-center items-center">
      <div className="createsessionform__container">
        <form
          ref={form}
          onSubmit={handleSubmit}
          method="POST"
          className="createsessionform__form"
        >
          <div className="input__group">
            <div className="input__group__header">
              <p className="">Resource Information</p>
            </div>
            <label htmlFor="title" className="label">
              <span className="label__text">Name</span>
              <input
                type="text"
                id="name"
                name="name"
                className="input"
                required
                value={currName}
                onChange={handleName}
              />
            </label>
            <label htmlFor="title" className="label">
              <span className="label__text">Link</span>
              <input
                type="text"
                id="link"
                name="link"
                className="input"
                required
                value={currLink}
                onChange={handleLink}
              />
            </label>
            <span className="label__text pt-4 text-xl">
              {communties?.filter(x => !deleteCommunity.some(i => i.id === x.id)).length > 0 ? (
                <>Communities having this resource </>
              ) : (
                <>Currently not in any community</>
              )}
            </span>
            <ResourceCarousel
              arr={communties}
              isCommunity={true}
              isDelete={true}
              fun={handleDeleteCommunity}
              baseURL={"expert"}
            />
            <span className="label__text pt-4 text-xl">
              {allCommunities?.filter(
                (x) => !resource?.community?.filter(ele => !communties.some(val => val.id === ele.id))?.some((i) => i.id === x.id)
              ).length > 0 ? (
                <>Available Communities </>
              ) : (
                <>No Communities Available</>
              )}
            </span>
            <ResourceCarousel
              arr={allCommunities?.filter((community) => !communties?.some((c) => c.id === community.id))}
              isCommunity={true}
              isDelete={false}
              fun={handleSelectCommunity}
              baseURL={"expert"}
            />
            <span className="label__text pt-4 text-xl">
              {selectSession?.length > 0 ? (
                <>Sessions having this resource </>
              ) : (
                <>Not part of any session</>
              )}
            </span>
            <ResourceCarousel
              arr={selectSession}
              isCommunity={false}
              isDelete={true}
              fun={handleDeleteSession}
              baseURL={"expert"}
            />

            <span className="label__text pt-4 text-xl">
              {deleteSession?.length > 0 ? (
                <>Available Sessions</>
              ) : (
                <>Sessions not available</>
              )}
            </span>
            <ResourceCarousel
              arr={deleteSession}
              isCommunity={false}
              isDelete={false}
              fun={handleSelectSession}
              baseURL={"expert"}
            />
          </div>
          <div className="flex flex-row flex-wrap gap-2" type="submit">
            <button className="button button-blue flex-1">Edit Resource</button>

            <button
              className="button button-blue flex-1"
              onClick={handleClearForm}
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IvdlResource;
