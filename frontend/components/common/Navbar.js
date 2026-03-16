import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MdCancel, MdSegment } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import data from "@/utils/data";
import { logoutUser, selectUser } from "store/features/userSlice";
import NavSearch from "./NavSearch";
const NavLink = ({ navlink }) => {
  const router = useRouter();
  return (
    <Link href={navlink.path}>
      <a
        className={
          router.pathname === navlink.path
            ? "navbar__item__active"
            : "navbar__item"
        }
      >
        {navlink.name}
      </a>
    </Link>
  );
};

const Navbar = () => {
  const [open, setOpen] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const handleSignout = (e) => {
    e.preventDefault();
    dispatch(logoutUser());
    localStorage.removeItem("senior-central-access-token");
    router.replace("/");
    toast("Logged out!", { type: "success" });
    // if(localStorage.getItem('persist:rootStore')===null){
  };
  const paths = [
    { path: "/", name: "Home" },
    { path: "/pre_auth/session", name: "Session" },
    { path: "/pre_auth/expert", name: "Experts" },
    { path: "/pre_auth/community", name: "Communities" },
    // { path: '/pricing', name: 'Pricing' },
    { path: "/about", name: "About us" },
    // { path: '/auth', name: 'Shop' },
  ];

  const signedInPaths = [
    { path: "/home", name: "Home" },
    { path: "/session", name: "Sessions" },
    { path: "/community", name: "Community" },
    { path: "/expert", name: "Experts" },
    { path: "/profile", name: "My profile" },
  ];
  const user = useSelector(selectUser);

  const handleResize = (e) => {
    if (window.innerWidth > 768 && !open) {
      setOpen(true);
    } else if (window.innerWidth < 768) {
      setOpen(false);
    }
  };
  useEffect(() => {
    handleResize();
  }, []);
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);
  if (router?.pathname === "/chat") return null;

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="h-full w-32 cursor-pointer">
          <Link href="/">
            <a>
              <Image
                src={data.logo}
                alt="logo"
                width={454}
                height={139}
                layout="responsive"
                objectFit="cover"
                className=""
              />
            </a>
          </Link>
        </div>

        <div
          className={`navbar__items ${
            open ? "navbar__items__visible" : "navbar__items__hidden"
          }`}
        >
          <NavSearch />
          {!user &&
            paths.map((navlink, index) => (
              <NavLink navlink={navlink} key={"navlink" + index} />
            ))}

          {user &&
            signedInPaths.map((navlink, index) => (
              <NavLink navlink={navlink} key={"navlink" + index} />
            ))}

          {user ? (
            <button className="btn btn-pink" onClick={handleSignout}>
              Logout
            </button>
          ) : (
            <Link href="/auth">
              <a>
                <button className="btn btn-pink">Login</button>
              </a>
            </Link>
          )}
        </div>
        <button
          className="absolute visible md:hidden top-0 right-0 text-2xl p-2 rounded-full"
          onClick={() => {
            setOpen((prev) => !prev);
          }}
        >
          {open ? <MdCancel /> : <MdSegment />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
