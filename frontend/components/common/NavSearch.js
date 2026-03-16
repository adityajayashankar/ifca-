import React from "react";
import { useState } from "react";
import { MdSearch } from "react-icons/md";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { Dropdown } from "flowbite-react";
import { useRouter } from "next/router";
const SearchComponent = ({}) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [resultItems, setResultItems] = useState([
    {
      type: "community",
      id: 1,
      name: "discord replacement",
    },
    {
      type: "post",
      id: 2,
      name: "Paparazzi",
    },
  ]);
  const [searchValue, setSearchValue] = useState("");
  const handleSearch = (e) => {
    // }
    setSearchValue(e.target.value);
  };
  const router = useRouter();
  const handleRedirection = () => {
    setSearchExpanded(false);
    setSearchValue("");
    router.push({ pathname: "/search", query: { tag: searchValue } });
  };
  const handleCloseExpanded = (e) => {
    e.preventDefault();
    setSearchExpanded(false);
    setSearchValue("");
  };
  const handleEnterKey = (e) => {
    e.preventDefault();
    if (e.key === "Enter") {
      handleRedirection();
    }
  };
  return (
    <div>
      {searchExpanded ? (
        <div className="relative w-72">
          <div className="flex items-center text-gray-900 border border-gray-300 rounded-lg ">
            <input
              type="search"
              className="p-4 text-sm border-none focus:border-transparent outline-none focus:ring-0"
              placeholder="Search Community"
              value={searchValue}
              onChange={handleSearch}
              onKeyUp={(e) => {
                if (e.code === "Enter" && e.shiftKey === false) {
                  e.preventDefault();
                  handleRedirection();
                }
              }}
              // onKeyDown={handleEnterKey}
            />
            <button className="text-white bg-red-800 hover:bg-blue-800 font-medium rounded-lg text-sm px-2 py-2 mr-3 h-8">
              <MdSearch onClick={() => handleRedirection()} />
            </button>
            <button
              className="text-white bg-gray-400 font-medium rounded-lg text-sm px-2 py-2 mr-2 h-8"
              onClick={handleCloseExpanded}
            >
              <AiOutlineCloseCircle />
            </button>
          </div>
          {/* <div className="flex items-center justify-around">
                <button className="text-white bg-red-800 hover:bg-blue-800 font-medium rounded-lg text-sm px-2 py-2 mr-3">
                  <MdSearch />
                </button>
                <button
                  className="text-white bg-gray-400 font-medium rounded-lg text-sm px-2 py-2 mr-2"
                  onClick={() => setSearchExpanded(false)}
                >
                  <AiOutlineCloseCircle />
                </button>
              </div> */}
          {searchValue?.length >= 3 && (
            <div className="absolute top-12 w-full">
              {/* {resultItems?.map((item, index) => (
              <Dropdown.Item
                className="z-3 bg-slate-200 rounded-md m-2"
                onClick={() => handleRedirection(item)}
              >
                {item.name}
              </Dropdown.Item>
            ))} */}
              <Dropdown.Item
                className="z-3 bg-slate-200 rounded-md m-2"
                onClick={() => handleRedirection()}
              >
                {`Search for ${searchValue}`}
              </Dropdown.Item>
            </div>
          )}
        </div>
      ) : (
        <button
          className="text-black hover:text-white hover:bg-red-800 font-medium rounded-lg text-sm px-4 py-2"
          onClick={() => setSearchExpanded(true)}
        >
          <MdSearch />
        </button>
      )}
      {/* <div className="w-64">
        <label
          for="default-search"
          className="mb-2 text-sm font-medium text-gray-900 sr-only "
        >
          Search
        </label>
        <div className="relative">
          <div>
            <input
              type="search"
              id="default-search"
              className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50"
              placeholder="Search Community"
              onChange={handleSearch}
            />

            <button className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-4 py-2">
              <MdSearch />
            </button>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default SearchComponent;
