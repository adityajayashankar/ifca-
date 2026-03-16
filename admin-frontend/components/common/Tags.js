import { WithContext as ReactTags } from "react-tag-input";
import React, { useEffect, useState } from "react";
import api from "@/utils/apiSetup";

const TagsInput = ({ tags, setTags }) => {
  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => {
    api.get("tag")
      .then((res) => {
        const data = res.data || res;
        if (Array.isArray(data)) {
          setSuggestions(data.map(tag => ({ id: tag.name, text: tag.name })));
        } else if (Array.isArray(data.tags)) {
          setSuggestions(data.tags.map(tag => ({ id: tag.name, text: tag.name })));
        }
      });
  }, []);

  const KeyCodes = {
    comma: 188,
    enter: 13,
  };
  const delimiters = [KeyCodes.comma, KeyCodes.enter];
  const handleDelete = (i) => {
    setTags(tags.filter((tag, index) => index !== i));
  };

  const handleAddition = (tag) => {
    setTags([...tags, tag]);
  };

  const handleDrag = (tag, currPos, newPos) => {
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    // re-render
    setTags(newTags);
  };

  const handleTagClick = (index) => {
    console.log("The tag at index " + index + " was clicked");
  };

  // const suggestions = [{ id: "Hey", text: "Hey" },{ id: "Music", text: "Music" }];
  return (
    <ReactTags
      tags={tags}
      suggestions={suggestions}
      delimiters={delimiters}
      handleDelete={handleDelete}
      handleAddition={handleAddition}
      handleDrag={handleDrag}
      handleTagClick={handleTagClick}
      inputFieldPosition="bottom"
      autocomplete
      editable
      autofocus={false}
      classNames={{
        tags: "flex flex-wrap items-start gap-2 mt-2 mb-2 min-h-[48px] w-full",
        tag: "bg-orange-500 text-white rounded-full px-4 py-1 flex items-center shadow font-medium text-[10px] mb-1",
        remove: "ml-2 text-white hover:text-orange-200 text-lg font-bold cursor-pointer",
        tagInput: "block w-full focus-within:border-orange-400 border border-orange-200 rounded-lg px-2 py-1 mt-2",
        tagInputField: "block w-full bg-transparent outline-none text-base py-1 px-2 mt-2",
        suggestions: "bg-white border border-orange-200 rounded-lg shadow mt-1 z-10",
        activeSuggestion: "bg-orange-100 text-orange-700",
        suggestion: "px-3 py-2 cursor-pointer hover:bg-orange-50 text-gray-700",
      }}
    />
  );
};

export default TagsInput;
