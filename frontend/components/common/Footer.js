import { useRouter } from "next/router";
import React from "react";
import { MdOutlineEmail, MdOutlinePhone } from "react-icons/md";
import { SiFacebook, SiInstagram, SiTwitter, SiYoutube } from "react-icons/si";
import { AiOutlineWhatsApp } from "react-icons/ai";
import data from "@/utils/data";
import { IoMdHeart } from "react-icons/io";

const Footer = () => {
  const router = useRouter();

  if (router.pathname === "/chat") return null;
  return (
    <footer className="footer">
      <div className="footer__container">
        <p className="footer__contact__item">
          <AiOutlineWhatsApp />
          <span>{data.phone}</span>
        </p>
        <p className="footer__contact__item">
          <MdOutlineEmail />
          <span>{data.email}</span>
        </p>
        <p className="footer__contact__item">
          <SiFacebook />
          <span>Facebook</span>
        </p>
        <p className="footer__contact__item">
          <SiTwitter />
          <span>Twitter</span>
        </p>
        <p className="footer__contact__item">
          <SiInstagram />
          <span>Instagram</span>
        </p>
        <p className="footer__contact__item">
          <SiYoutube />
          <span>Youtube</span>
        </p>
      </div>
      <div className="flex items-center justify-evenly mr-6">
        Built with <IoMdHeart className="text-red-500 m-1" /> by subspace
      </div>
    </footer>
  );
};

export default Footer;
