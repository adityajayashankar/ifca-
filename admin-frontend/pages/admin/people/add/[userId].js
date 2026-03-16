import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useDispatch, useSelector } from "react-redux";
import { selectAllUsers, setAllUsers } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";

const Form = () => {
  const router = useRouter();
 // ...existing code...
const allUsers = useSelector(selectAllUsers);
const id = router.query["userId"];
const usersArray = [
  ...(allUsers?.activeUsers || []),
  ...(allUsers?.disabledUsers || [])
];
const user = usersArray.find((item) => String(item.id) === String(id));
// ...existing code...
  const dispatch = useDispatch();
  let loadingRef = useRef(false);

  useEffect(() => {
    setData({
      name: user?.name,
      email: user?.email,
      desc: user?.desc,
      phone: user?.phone,
      location: user?.location,
      state: user?.state,
      pincode: user?.pincode,
    });
  }, [user]);

  useEffect(() => {
    loadingRef.current = false;
    if (!loadingRef.current) {
      dispatch(setAllUsers());
      loadingRef.current = true;
    }
  }, []);

  const [data, setData] = useState({
    name: user?.name,
    email: user?.email,
    desc: user?.desc,
    phone: user?.phone,
    location: user?.location,
    state: user?.state,
    pincode: user?.pincode,
  });

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    let user = data;
    api.patch(`/user/${id}`, user).then((res) => {
      if (res.status == 200) {
        toast(`User Successfully Edited`, { type: "success" });
        router.push("/admin/people");
      } else {
        toast(`Oops! Something went wrong`, { type: "warning" });
      }
    });
  };

  return (
    <>
      <Head>
        <title>Edit User</title>
      </Head>
      <div className="w-full">
        <h1 className="mt-12 mb-10 text-center text-2xl md:text-5xl">
          Edit User
        </h1>
        <div className="createsessionform__container mx-2 md:mx-auto mb-6">
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
                disabled
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
              <span className="label__text">Location</span>
              <textarea
                id="location"
                name="location"
                className="input"
                onChange={handleChange}
                value={data.location}
                required
              />
            </label>
          </div>
          <div className="my-3">
            <label htmlFor="address" className="label">
              <span className="label__text">State</span>
              <textarea
                id="state"
                name="state"
                className="input"
                onChange={handleChange}
                value={data.state}
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
              onClick={handleSubmit}
              className="button button-blue flex-1"
            >
              Edit User
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const EditUser = () => {
  const router = useRouter();
  const id = router.query["expertId"];

  return (
    <div className="page flex flex-col gap-6 items-center">
      <Form />
    </div>
  );
};

export default EditUser;
