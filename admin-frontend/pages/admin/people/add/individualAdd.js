import { useState } from "react";
import Head from "next/head";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

export default function IndividualAdd() {
  const router = useRouter();

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    desc: "",
    phone: "",
    address: "",
    pincode: "",
  });
  const [createdUsers, setCreatedUsers] = useState([]);

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

 const handleSubmit = () => {
  const users = [data];

  api.post(`/admin/create/user`, { users })
    .then((res) => {
      if (res.status === 200 || res.status === 201) {
        toast("User Successfully Added", { type: "success" });
        router.push("/admin/people");
      } else {
        toast("Oops! Something went wrong", { type: "warning" });
      }
    })
    .catch((err) => {
      console.error("Signup error:", err);
      toast("Something went wrong while signing up", { type: "error" });
    });
};


  return (
    <div>
      <Head>
        <title>Individual Add</title>
      </Head>
      <div>
        <h1 className="mt-12 mb-10 text-center text-2xl md:text-5xl">
          Individual Add
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
                required
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
                required
              />
            </label>
          </div>
          <div className="my-3">
            <label htmlFor="password" className="label">
              <span className="label__text">Password</span>
              <input
                type="password"
                id="password"
                name="password"
                className="input"
                onChange={handleChange}
                required
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
                required
              />
            </label>
          </div>
          <div className="my-3">
            <button
              onClick={handleSubmit}
              className="button button-blue flex-1"
            >
              Create User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
