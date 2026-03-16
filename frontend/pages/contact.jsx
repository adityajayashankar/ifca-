import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "react-toastify";

const Contact = () => {
  const router = useRouter();

  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: "",
  });
  const validate = () => {
    const nameRegex = new RegExp("[a-zA-Z]$");
    const emailRegex = new RegExp(
      "[a-zA-Z0-9#%^&*.,><?|{}/]+@[a-zA-Z]+.[a-z]{2,3}$"
    );
    if (
      contact.name == "" ||
      contact.name === " " ||
      !nameRegex.test(contact.name)
    )
      return { status: false, message: "Name not in correct format" };
    if (
      contact.email == "" ||
      contact.email === " " ||
      !emailRegex.test(contact.email)
    )
      return { status: false, message: "Email not in correct format" };
    if (contact.message === "" || contact.message === " ")
      return { status: false, message: "Message field cannot be empty" };
    return { status: true, message: "Validation Successful" };
  };
  const handleChange = (e) => {
    setContact({ ...contact, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (!err.status) {
      toast(err.message, { type: "error" });
    } else {
      toast("Message Sent", { type: "success" });
      router.push("/home/feed");
    }
  };

  return (
    <>
      <Head>
        <title>Login/Register</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <header>
          <Topbar />
        </header>
        <main>
          <div className="bg-[url('/Login_Background.png')] bg-cover mt-20 flex items-center justify-start flex-1">
            <div className="bg-white rounded-3xl py-5 px-10 lg:py-7 lg:px-12 mx-10 lg:mx-24 w-full lg:w-[40%] my-10 flex flex-col items-center">
              <h2 className="lg:text-5xl md:text-4xl text-3xl mb-5 font-bold text-center text-[#444]">
                Get in Touch
              </h2>
              <p className="text-[#b2b2b3] font-medium text-xl text-center mb-10">
                Welcome to IFCA
              </p>
              <form
                onSubmit={handleSubmit}
                className="bg-white pb-5 w-full rounded-xl px-5 flex flex-col gap-5"
              >
                <label className="text-gray-400 text-xl font-medium">
                  Full Name
                </label>
                <input
                  name="name"
                  value={contact.name}
                  onChange={handleChange}
                  type="text"
                  className="outline-none border-b-2 border-b-gray-200 py-2 mt-2 mb-10"
                  placeholder="Enter Full Name"
                />
                <label className="text-gray-400 text-xl font-medium">
                  Email
                </label>
                <input
                  name="email"
                  value={contact.email}
                  onChange={handleChange}
                  type="text"
                  className="outline-none border-b-2 border-b-gray-200 py-2 mt-2 mb-10"
                  placeholder="Enter Email"
                />
                <label className="text-gray-400 text-xl font-medium">
                  Message
                </label>
                <textarea
                  rows={5}
                  value={contact.message}
                  onChange={handleChange}
                  name="message"
                  type="text"
                  className="outline rounded-xl outline-gray-300  px-4 py-4 "
                  placeholder="Message"
                />
                <p className="text-red-400 text-center"></p>
                <button
                  type="submit"
                  className="gradient_background text-white p-3 rounded-lg my-5 self-center w-full font-semibold"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Contact;
