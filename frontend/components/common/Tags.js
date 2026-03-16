import { WithContext as ReactTags } from "react-tag-input";

import React from "react";

const TagsInput = ({ tags, setTags, suggestions }) => {
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

  // const suggestions = [{ id: "Hey", text: "Hey" }];
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
    />
  );
};

export default TagsInput;
