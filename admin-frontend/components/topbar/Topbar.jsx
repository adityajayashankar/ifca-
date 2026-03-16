import {
  logoutUser,
  selectUser,
  setUser,
} from "@/store/features/userSlice";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import companyData from "@/utils/data";
import { useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const Topbar = ({ searchBarVal }) => {
  const currentUser = useSelector(selectUser);
  const dispatch = useDispatch();
  const router = useRouter();
  const [val, setVal] = useState(searchBarVal);
  const [show, setShow] = useState(true);

  const handleLogout = () => {
    dispatch(setUser(null))
    router.push("/onBoard");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    val && router.push(`/allSessions?${val}`);
  };

  // const cart = useSelector(selectUserCart);

  return (
    <nav className="flex items-center justify-between md:justify-around bg-white h-[80px] fixed top-0 w-full z-[999]">
      <div className="cursor-pointer hidden md:block">
        <Link href="/">
          <h4 className="text-lg font-semibold">IFCA</h4>
        </Link>
      </div>
      <div className="w-[70%] md:w-[20%] pl-6 md:pl-0">
        <form
          onSubmit={handleSearch}
          className="flex items-center justify-between border-[1px]  rounded-md h-[37px] w-full overflow-hidden"
        >
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            type="text"
            placeholder="What do you want to learn?"
            className="py-[5px] px-[8px] w-full outline-none text-[10px] md:text-[16px] font-semibold"
          />
          <button className="gradient_background text-white rounded-tl-md rounded-bl-md h-full text-center px-[7px] flex items-center justify-center">
            <SearchIcon />
          </button>
        </form>
      </div>
      {/* mobile view side bar */}
      <div
        className="relative  md:hidden text-xl text-gray-400 flex justify-end py-2 w-[20%]"
        onClick={() => setShow(!show)}
      >
        <MoreVertIcon className="" />
      </div>
      <div className="md:hidden">
        <div
          className={`absolute right-0 top-[80px] z-[3px] bg-white w-[60%] md:items-center ${
            show ? "hidden" : "block"
          } h-screen`}
        >
          <ul className="flex flex-col px-[10px] bg-white divide-y-2 divide-x-0">
            {currentUser && (
              <Link href={"/home"}>
                <li
                  className={
                    window.location.pathname.includes("/home")
                      ? "font-bold underline decoration-gradient_background py-[10px] px-[20px]"
                      : "py-[10px] px-[20px] font-semibold cursor-pointer hover:text-red-400"
                  }
                >
                  Home
                </li>
              </Link>
            )}
            <Link href={"/browseClasses"}>
              <li
                className={
                  window.location.pathname.includes("/browseClasses")
                    ? "font-bold underline decoration-gradient_background py-[10px] px-[20px]"
                    : "py-[10px] px-[20px] font-semibold cursor-pointer hover:text-red-400"
                }
              >
                Classes
              </li>
            </Link>
            {currentUser && (
              <Link href={"/mySchedule"}>
                <li
                  className={
                    window.location.pathname.includes("/mySchedule")
                      ? "font-bold underline decoration-gradient_background py-[10px] px-[20px]"
                      : "py-[10px] px-[20px] font-semibold cursor-pointer hover:text-red-400"
                  }
                >
                  My Schedule
                </li>
              </Link>
            )}
            {currentUser && (
              <Link href={"/myCommunities"}>
                <li
                  className={
                    window.location.pathname.includes("/myCommunities")
                      ? "font-bold underline decoration-gradient_background py-[10px] px-[20px]"
                      : "py-[10px] px-[20px] font-semibold cursor-pointer hover:text-red-400"
                  }
                >
                  My Communities
                </li>
              </Link>
            )}
          </ul>
          <div className="mx-4 md:mx-0 my-6 md:mb-0 bg-white md:bg-transparent">
            {!localStorage.getItem(companyData.accessToken) ? (
              <Link href={"/onBoard"}>
                <button className="gradient_background text-white outline-none py-[10px] px-[40px] rounded-md font-semibold text-[16px] cursor-pointer">
                  Log In/ Register
                </button>
              </Link>
            ) : (
              <div></div>
              // <div className="flex flex-col gap-4">
              //   <Link className="cursor-pointer" href="/cart">
              //     <span className="relative cursor-pointer  font-semibold flex items-center gap-2">
              //       <ShoppingCartOutlinedIcon /> Cart
              //       {cart.length > 0 && (
              //         <span className="absolute rounded-full gradient_background text-white flex items-center justify-center h-[20px] w-[20px] top-[-10px] right-[-5px]">
              //           {cart.length}
              //         </span>
              //       )}
              //     </span>
              //   </Link>
              //   <span className="font-bold mr-5 text-red-400">
              //     {currentUser?.name}
              //   </span>
              //   <button
              //     onClick={handleLogout}
              //     className="mr-5 gradient_background text-white outline-none px-4 py-2 rounded-md font-semibold text-[16px] cursor-pointer"
              //   >
              //     Logout
              //   </button>
              // </div>
            )}
          </div>
        </div>
      </div>

      {/* Laptop view */}
      <div className="hidden md:flex md:items-center ">
        <ul className="flex items-center px-[10px] bg-white">
          {currentUser && (
            <Link href={"/home"}>
              <li
                className={
                  window.location.pathname.includes("/home")
                    ? "font-bold underline decoration-gradient_background py-[10px] px-[20px]"
                    : "py-[10px] px-[20px] font-semibold cursor-pointer hover:text-red-400"
                }
              >
                Home
              </li>
            </Link>
          )}
          <Link href={"/browseClasses"}>
            <li
              className={
                window.location.pathname.includes("/browseClasses")
                  ? "font-bold underline decoration-gradient_background py-[10px] px-[20px]"
                  : "py-[10px] px-[20px] font-semibold cursor-pointer hover:text-red-400"
              }
            >
              Classes
            </li>
          </Link>
          {currentUser && (
            <Link href={"/mySchedule"}>
              <li
                className={
                  window.location.pathname.includes("/mySchedule")
                    ? "font-bold underline decoration-gradient_background py-[10px] px-[20px]"
                    : "py-[10px] px-[20px] font-semibold cursor-pointer hover:text-red-400"
                }
              >
                My Schedule
              </li>
            </Link>
          )}
          {currentUser && (
            <Link href={"/myCommunities"}>
              <li
                className={
                  window.location.pathname.includes("/myCommunities")
                    ? "font-bold underline decoration-gradient_background py-[10px] px-[20px]"
                    : "py-[10px] px-[20px] font-semibold cursor-pointer hover:text-red-400"
                }
              >
                My Communities
              </li>
            </Link>
          )}
        </ul>
        <div className="mx-4 md:mx-0 mb-6 md:mb-0 bg-white md:bg-transparent">
          {!currentUser ? (
            <Link href={"/onBoard"}>
              <button className="gradient_background text-white outline-none py-[10px] px-[40px] rounded-md font-semibold text-[16px] cursor-pointer">
                Log In/ Register
              </button>
            </Link>
          ) : (
            <div>
              {/* <span className="font-bold mr-5 text-red-400">
                {currentUser?.name}
              </span> */}
              {/* <button
                onClick={handleLogout}
                className="mr-5 gradient_background text-white outline-none px-4 py-2 rounded-md font-semibold text-[16px] cursor-pointer"
              >
                Logout
              </button> */}
              {/* <Link className="cursor-pointer" href="/cart">
                <span className="relative cursor-pointer">
                  <ShoppingCartOutlinedIcon />
                  {cart.length > 0 && (
                    <span className="absolute rounded-full gradient_background text-white flex items-center justify-center h-[20px] w-[20px] top-[-10px] right-[-5px]">
                      {cart.length}
                    </span>
                  )}
                </span>
              </Link> */}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Topbar;
