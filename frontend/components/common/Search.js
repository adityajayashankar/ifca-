import React from "react";
import { useState } from "react";
import { MdSearch } from "react-icons/md";

const SearchComponent = ({ setSearchValue, cb, searchValue }) => {
  const handleSearch = (e) => {
    e.preventDefault();
    // if (e.target.value) {
    setSearchValue(e.target.value);
    cb();
    // }
  };
  return (
    <div>
      <div className="w-64">
        <label
          for="default-search"
          class="mb-2 text-sm font-medium text-gray-900 sr-only "
        >
          Search
        </label>
        <div class="relative">
          <div>
            <input
              type="search"
              id="default-search"
              class="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50"
              placeholder="Search Community"
              onChange={handleSearch}
            />

            <button class="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-4 py-2">
              <MdSearch />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchComponent;
