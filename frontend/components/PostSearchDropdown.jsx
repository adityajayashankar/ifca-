import React from "react";

const highlightText = (text, searchQuery) => {
  if (!searchQuery || !text) return text;
  const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === searchQuery.toLowerCase()
      ? `<span class="highlight">${part}</span>`
      : part
  ).join('');
};

const PostSearchDropdown = ({ posts, searchQuery, onSelect, onClose }) => {
  return (
    <div className="absolute left-0 right-0 bg-white border border-gray-200 rounded shadow-lg mt-2 z-50 max-h-60 overflow-y-auto">
      {searchQuery && posts.length > 0 ? (
        posts.map((post) => (
          <div
            key={post.id}
            className="px-4 py-2 cursor-pointer hover:bg-orange-50 text-sm truncate overflow-hidden whitespace-nowrap text-ellipsis"
            onClick={() => onSelect(post.id)}
            dangerouslySetInnerHTML={{
              __html: highlightText(
                post.title ? post.title : (post.content || ''),
                searchQuery
              )
            }}
          />
        ))
      ) : searchQuery ? (
        <div className="px-4 py-2 text-gray-400 text-sm">No posts found.</div>
      ) : null}
    </div>
  );
};

export default PostSearchDropdown; 