import { selectUser, setUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import Close from "@mui/icons-material/Close";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DependentImageUploader from "../common/ParentImageUpload";
import UploadImage from "../UploadImage";

const UserEditModal = (props) => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const urlRef = useRef("");
  console.log("user Image----",urlRef.current)

  const [data, setData] = useState({
    name: user?.name,
    email: user?.email,
    desc: user?.desc,
    phone: user?.phone,
    address: user?.address,
    pincode: user?.pincode,
    photoURL: user?.photoURL,
  });

  useEffect(() => {
    setData({
      name: user?.name,
      email: user?.email,
      desc: user?.desc,
      phone: user?.phone,
      address: user?.address,
      pincode: user?.pincode,
      photoURL: user?.photoURL,
      id: user?.id,
    });
  }, [user]);

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resolvesWhenUploaded = () => {
    return new Promise((resolve, reject) => {
      let tries = 0;
      const inter = setInterval(() => {
        if (uploading === 2 || urlRef.current) {
          resolve({ msg: "Successfully uploaded" });
          clearInterval(inter);
        } else if (error || uploading === -1) {
          console.log(error);
          reject({ msg: "Failed upload" });
          clearInterval(inter);
        }
        if (tries === 7) {
          reject({ msg: "Failed upload" });
          clearInterval(inter);
        }
        if (tries > 5 && uploading === 0) {
          resolve({ msg: "No item to upload" });
          clearInterval(inter);
        }
        tries++;
      }, 1000);
    });
  };

  const handleSubmit = async () => {
    try {
      // await resolvesWhenUploaded();
      const updatedUserData = { ...data, photoURL: urlRef.current === '' ? data?.photoURL : urlRef.current };
      const response = await api.patch(`/user/${data.id}`, updatedUserData);
      if (response.status === 200) {
        dispatch(setUser({ ...user, ...updatedUserData }));
        toast(`Profile Successfully Edited`, { type: "success" });
        props.setEditModal(false);
        setUploading(0);
        urlRef.current = "";
      } else {
        toast(`Oops! Something went wrong`, { type: "warning" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast(`Oops! Something went wrong`, { type: "error" });
    }
  };

  return (
    <div className="fixed top-0 w-screen h-screen backdrop-blur-sm bg-black/10 z-50 left-0 flex items-center justify-center">
      <div className="rounded overflow-hidden overflow-y-scroll h-[90vh] bg-white sm:w-4/5 md:w-1/2 p-5">
        <div className="flex justify-between">
          <h4>Edit Profile</h4>
          <button
            onClick={() => props.setEditModal(false)}
            className="hover:text-red-500"
          >
            <Close />
          </button>
        </div>
        <div className="my-3">
          <label htmlFor="name" className="label">
            <span className="label__text">Name</span>
            <input
              type="text"
              id="name"
              name="name"
              className="input"
              onChange={handleChange}
              value={data.name}
            />
          </label>
        </div>
        <div className="my-3">
          <label htmlFor="email" className="label">
            <span className="label__text">Email</span>
            <input
              type="text"
              id="email"
              name="email"
              className="input"
              onChange={handleChange}
              value={data.email}
              disabled
            />
          </label>
        </div>
        <UploadImage
          folder="user"
          imgUrl={data.photoURL}
          urlRef={urlRef}
        />
        {/* {data.name && (
          <DependentImageUploader
            content={"Click to Upload photoURL"}
            imgUrl={data.photoURL}
            bucket={"subspacetest-0"}
            bucket_name={"community-images-0"}
            name={"photoURL"}
            file_name={data?.name}
            uploading={uploading}
            setUploading={setUploading}
            setError={setError}
            error={error}
            urlRef={urlRef}
          />
        )} */}
        <div className="my-3">
          <label htmlFor="desc" className="label">
            <span className="label__text">Description</span>
            <textarea
              id="desc"
              name="desc"
              className="input"
              onChange={handleChange}
              required
              value={data.desc}
            />
          </label>
        </div>
        <div className="my-3">
          <label htmlFor="phone" className="label">
            <span className="label__text">Phone Number</span>
            <input
              type="text"
              id="phone"
              name="phone"
              className="input"
              onChange={handleChange}
              value={data.phone}
              required
            />
          </label>
        </div>
        <div className="my-3">
          <label htmlFor="address" className="label">
            <span className="label__text">Address</span>
            <textarea
              id="address"
              name="address"
              className="input"
              onChange={handleChange}
              value={data.address}
              required
            />
          </label>
        </div>
        <div className="my-3">
          <label htmlFor="pincode" className="label">
            <span className="label__text">Pincode</span>
            <input
              type="text"
              id="pincode"
              name="pincode"
              className="input"
              onChange={handleChange}
              value={data.pincode}
              required
            />
          </label>
        </div>
        <div className="my-3">
          <button
            onClick={handleSubmit} className="button button-blue flex-1">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
