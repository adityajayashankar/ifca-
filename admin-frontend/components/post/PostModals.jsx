import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { MdHelpOutline, MdPoll, MdWavingHand, MdImage, MdVideocam, MdArrowDropDown, MdClose, MdBarChart } from "react-icons/md";
import { AiFillFilePdf } from "react-icons/ai";
import { toast } from 'react-toastify';
import api from '@/utils/apiSetup';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { setCommunityPosts } from '@/store/features/postsSlice';


function PostSettingsModal({ open, onClose, user, userCommunities, selected, setSelected }) {
    const [localSelected, setLocalSelected] = useState(selected || { type: "anyone" });
    const [showCommunityList, setShowCommunityList] = useState(false);
    useEffect(() => { setLocalSelected(selected); }, [selected]);
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-0 relative animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="font-semibold text-lg">Post settings</div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold px-2 py-0">×</button>
          </div>
          {/* User Info */}
          <div className="flex items-center gap-3 px-6 py-4 border-b">
            <Image
              src={user?.photoURL || "/notImg.svg"}
              alt="Profile"
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
            <div className="font-semibold text-base leading-tight">{user?.name}</div>
          </div>
          {/* Visibility Options */}
          <div className="px-6 py-4">
            <div className="font-semibold mb-2">Who can see your post?</div>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-not-allowed opacity-50 transition`}>
                <input type="radio" name="visibility" className="accent-orange-500" checked={localSelected?.type === "anyone"} disabled />
                <span className="text-lg">🌐</span>
                <div>
                  <div className="font-semibold">Anyone</div>
                  <div className="text-xs text-gray-500">Anyone on or off Aluminaries</div>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-not-allowed opacity-50 transition`}>
                <input type="radio" name="visibility" className="accent-orange-500" checked={localSelected?.type === "connections"} disabled />
                <span className="text-lg">👥</span>
                <div>
                  <div className="font-semibold">Connections only</div>
                  <div className="text-xs text-gray-500">Only your connections</div>
                </div>
              </label>
              <div>
                <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${localSelected?.type === "community" ? "bg-[#f3f6f9] border border-orange-500" : "hover:bg-gray-100"}`} onClick={() => { setShowCommunityList(true); }}>
                  <input type="radio" name="visibility" className="accent-orange-500" checked={localSelected?.type === "community"} readOnly />
                  <span className="text-lg">🏛️</span>
                  <div>
                    <div className="font-semibold">Your Community</div>
                    <div className="text-xs text-gray-500">{localSelected?.type === "community" && localSelected?.community ? localSelected.community.title : "Choose a community"}</div>
                  </div>
                  <span className="ml-auto text-gray-400">›</span>
                </label>
                {/* Community List Modal */}
                {showCommunityList && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-0 relative animate-fadeIn">
                      <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div className="font-semibold text-lg">Select a community</div>
                        <button onClick={() => setShowCommunityList(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold px-2 py-0">×</button>
                      </div>
                      <div className="px-6 py-4 space-y-2 max-h-80 overflow-y-auto">
                        {userCommunities && userCommunities.length > 0 ? userCommunities.map((com, idx) => (
                          <div key={com.id} className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition border ${localSelected?.community?.id === com.id ? "bg-[#e6f7f2] border-orange-500 shadow" : "border-transparent hover:bg-gray-100"}`} onClick={() => { setLocalSelected({ type: "community", community: com }); setShowCommunityList(false); }}>
                            <Image src={com.bannerImg || "/College_alumnis.png"} alt={com.title} width={40} height={40} className="rounded-lg object-contain border-[1px] border-gray-700" />
                            <div className="flex-1">
                              <div className="font-semibold text-base">{com.title}</div>
                              <div className="text-xs text-gray-500 line-clamp-1">{com.desc || "Community"}</div>
                            </div>
                            {localSelected?.community?.id === com.id && (
                              <span className="text-orange-500 text-xl font-bold ml-2">✔</span>
                            )}
                          </div>
                        )) : <div className="text-gray-500 text-sm">You have not joined any communities yet.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t">
            <button className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold" onClick={onClose}>Back</button>
            <button className={`px-6 py-2 rounded-full text-white font-semibold transition ${localSelected ? 'bg-orange-500 hover:bg-[#117a6a]' : 'bg-gray-300 cursor-not-allowed'}`} disabled={!localSelected} onClick={() => { setSelected(localSelected); onClose(); }}>Done</button>
          </div>
        </div>
      </div>
    );
  }
  
  function PollModal({ open, onClose, onSave, initialPoll, handleCreatePost }) {
    const [question, setQuestion] = useState(initialPoll?.question || '');
    const [options, setOptions] = useState(initialPoll?.options || ['', '']);
    const [expiresAt, setExpiresAt] = useState(initialPoll?.expiresAt || '');
  
    const handleOptionChange = (index, value) => {
      const newOptions = [...options];
      newOptions[index] = value;
      setOptions(newOptions);
    };
  
    const addOption = () => {
      if (options.length < 4) {
        setOptions([...options, '']);
      }
    };
  
    const removeOption = (index) => {
      if (options.length > 2) {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
      }
    };
  
    const handlePost = () => {
      if (question.trim() && options.every(opt => opt.trim()) && expiresAt) {
        const pollData = {
          question,
          options: options.map((opt, index) => ({ option: opt, optionId: index })),
          expiresAt,
        };
        onSave(pollData); // setPoll in parent
        handleCreatePost(pollData); // immediately call handleCreatePost with poll
        onClose();
      }
    };
  
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Create a poll</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <MdClose className="w-6 h-6" />
            </button>
          </div>
  
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <MdClose className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 4 && (
                <button
                  onClick={addOption}
                  className="text-orange-500 hover:text-[#117a6a] text-sm font-medium"
                >
                  + Add option
                </button>
              )}
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poll end date</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-orange-500 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                min={new Date().toISOString().slice(0, 16)}
              />
              <div className="text-xs text-mint-800 mt-1" style={{ color: '#14A08C' }}>
                Choose when the poll should end
              </div>
            </div>
          </div>
  
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={!question.trim() || options.some(opt => !opt.trim()) || !expiresAt}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-[#117a6a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default function PostModal({ open, onClose, user, userCommunities, refreshFeed, editingPost, setEditingPost, fixedCommunity, postType: incomingPostType }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [text, setText] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [visibility, setVisibility] = useState(null);
  const [postType, setPostType] = useState("");
  const [poll, setPoll] = useState(null);
  const [attachments, setAttachments] = useState({ image: null, video: null, pdf: null });
  const [childMenuOpen, setChildMenuOpen] = useState(null);
  const childMenuRefs = useRef({});
  const [tags, setTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [title, setTitle] = useState("");
  

  
    useEffect(() => {
      if (fixedCommunity) {
        setVisibility({ type: "community", community: fixedCommunity });
      } else if (userCommunities && userCommunities.length > 0) {
        setVisibility({ type: "community", community: userCommunities[0] });
      } else {
        setVisibility({ type: "anyone" });
      }
    }, [fixedCommunity, userCommunities, open]);
  
    // Reset post type when modal opens/closes
    useEffect(() => {
      if (!open) {
        setPostType("");
        setPoll(null);
        setText("");
        setTitle("");
        setTags([]);
        setTagInput("");
        setAttachments({ image: null, video: null, pdf: null });
      }
    }, [open]);
  
    // Set post type from prop when modal opens or postType prop changes
    useEffect(() => {
      if (open && incomingPostType) {
        setPostType(incomingPostType);
      }
    }, [open, incomingPostType]);
  
    // Click outside to close child menus
    useEffect(() => {
      function handleClickOutside(event) {
        if (childMenuOpen !== null) {
          const ref = childMenuRefs.current[childMenuOpen];
          if (ref && !ref.contains(event.target)) {
            setChildMenuOpen(null);
          }
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [childMenuOpen]);
  
    // Fetch tags on modal open
    useEffect(() => {
      if (open) {
        api.get('/tag').then(res => setAllTags(res.data.tags || []));
      }
    }, [open]);
  
      // Pre-fill fields if editing
  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setText(editingPost.content || "");
          // Optionally pre-fill tags, attachments, etc.
  } else {
    setTitle("");
    setText("");
  }
  }, [editingPost, open]);


  
    if (!open) return null;
    if (!visibility) return null; // Don't render until visibility is set
  
    const handleClose = () => {
      setPostType("");
      setPoll(null);
      setText("");
      setTitle("");
      setTags([]);
      setTagInput("");
      setAttachments({ image: null, video: null, pdf: null });
      setEditingPost(null);
      onClose();
    };
  
    // Only render PostSettingsModal if open
    if (showSettingsModal) {
      return (
        <PostSettingsModal
          open={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          user={user}
          userCommunities={userCommunities}
          selected={visibility}
          setSelected={(val) => { setVisibility(val); setShowSettingsModal(false); }}
        />
      );
    }
  
    // File input handlers
    const handleFileChange = (type, e) => {
      if (e.target.files && e.target.files[0]) {
        setAttachments((prev) => ({ ...prev, [type]: e.target.files[0] }));
      }
    };
  
    // Remove attachment handler
    const removeAttachment = (type) => {
      setAttachments((prev) => ({ ...prev, [type]: null }));
    };
  
    // Upload files to server and get URLs
    const uploadFiles = async () => {
      const assetsData = [];
      let index = 0;

      // Upload image
      if (attachments.image) {
        try {
          // Step 1: Get a presigned URL from the backend
          const response = await api.post("/images/generate-presigned-url", {
            fileName: attachments.image.name,
            fileType: attachments.image.type,
            folder: "post-assets",
          });

          const { uploadUrl, fileUrl } = response.data;

          // Step 2: Upload file to S3
          await fetch(uploadUrl, {
            method: 'PUT',
            body: attachments.image,
            headers: {
              'Content-Type': attachments.image.type,
            },
          });

          assetsData.push({
            type: attachments.image.type,
            url: fileUrl,
            index: index++
          });
        } catch (error) {
          console.error('Error uploading image:', error);
          toast('Error uploading image', { type: 'error' });
        }
      }

      // Upload video
      if (attachments.video) {
        try {
          // Step 1: Get a presigned URL from the backend
          const response = await api.post("/images/generate-presigned-url", {
            fileName: attachments.video.name,
            fileType: attachments.video.type,
            folder: "post-assets",
          });

          const { uploadUrl, fileUrl } = response.data;

          // Step 2: Upload file to S3
          await fetch(uploadUrl, {
            method: 'PUT',
            body: attachments.video,
            headers: {
              'Content-Type': attachments.video.type,
            },
          });

          assetsData.push({
            type: attachments.video.type,
            url: fileUrl,
            index: index++
          });
        } catch (error) {
          console.error('Error uploading video:', error);
          toast('Error uploading video', { type: 'error' });
        }
      }

      // Upload PDF
      if (attachments.pdf) {
        try {
          // Step 1: Get a presigned URL from the backend
          const response = await api.post("/images/generate-presigned-url", {
            fileName: attachments.pdf.name,
            fileType: attachments.pdf.type,
            folder: "post-assets",
          });

          const { uploadUrl, fileUrl } = response.data;

          // Step 2: Upload file to S3
          await fetch(uploadUrl, {
            method: 'PUT',
            body: attachments.pdf,
            headers: {
              'Content-Type': attachments.pdf.type,
            },
          });

          assetsData.push({
            type: attachments.pdf.type,
            url: fileUrl,
            index: index++
          });
        } catch (error) {
          console.error('Error uploading PDF:', error);
          toast('Error uploading PDF', { type: 'error' });
        }
      }

      return assetsData;
    };
  
    const handleCreatePost = async (pollData = null) => {
      if (editingPost) {
        // Update post logic
        try {
          await api.patch(`/thread/${editingPost.id}`, {
            title,
            content: text,
          });
          toast("Post updated!", { type: "success" });
          handleClose();
          setEditingPost(null);
          if (refreshFeed) refreshFeed();
        } catch (error) {
          toast("Error updating post", { type: "error" });
        }
        return;
      }

      // Upload files first
      const assetsData = await uploadFiles();
      
      let obj;
      if (pollData) {
        // Poll logic (already implemented)
        obj = {
          content: "",
          title: pollData.question,
          assetsData: assetsData,
          tagsData: tags.map(tag => ({ name: tag.text })),
          creatorId: user?.unifiedUser?.id,
          communityId: visibility.community?.id,
          isPoll: true,
          isAsk: false,
          isGreeting: false,
          optionsData: pollData.options.map(opt => ({ option: opt.option })),
          pollExpiresAt: new Date(pollData.expiresAt).toISOString(),
        };
      } else if (postType === "ask") {
        obj = {
          content: text,
          title: title,
          assetsData: assetsData,
          tagsData: tags.map(tag => ({ name: tag.text })),
          creatorId: user?.unifiedUser?.id,
          communityId: visibility.community?.id,
          isAsk: true,
          isGreeting: false,
          isPoll: false,
        };
      } else if (postType === "greeting") {
        obj = {
          content: text,
          title: title,
          assetsData: assetsData,
          tagsData: tags.map(tag => ({ name: tag.text })),
          creatorId: user?.unifiedUser?.id,
          communityId: visibility.community?.id,
          isAsk: false,
          isGreeting: true,
          isPoll: false,
        };
      } else {
        // Regular post logic
        obj = {
          content: text,
          title: title,
          assetsData: assetsData,
          tagsData: tags.map(tag => ({ name: tag.text })),
          creatorId: user?.unifiedUser?.id,
          communityId: visibility.community?.id,
          isAsk: false,
          isGreeting: false,
          isPoll: false,
        };
      }

      try {
        const response = await api.post("/thread", obj);
        toast("Post created!", { type: "success" });
        handleClose();
        
        // Update community posts state with the new post
        if (visibility?.community?.id) {
          dispatch(setCommunityPosts(visibility.community.id));
        }
        
        // Navigate to the appropriate thread route based on post type
        if (pollData || postType === "poll") {
          router.push(`/comThreads/polls/${visibility.community.id}`);
        } else if (postType === "ask") {
          router.push(`/comThreads/asks/${visibility.community.id}`);
        } else if (postType === "greeting") {
          router.push(`/comThreads/greetings/${visibility.community.id}`);
        } else {
          router.push(`/comThreads/${visibility.community.id}`);
        }
        
        if (refreshFeed) refreshFeed();
      } catch (error) {
        toast("Error creating post", { type: "error" });
      }
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Image
                src={user?.photoURL || "/notImg.svg"}
                alt="Profile"
                width={40}
                height={40}
                className="object-cover"
              />
              <div>
                <div className="font-semibold">{user?.name}</div>
                <button
                  onClick={() => !fixedCommunity && setShowSettingsModal(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  disabled={!!fixedCommunity}
                >
                  {visibility?.type === "community" && visibility?.community ? (
                    <>
                      <img
                        src={
                          visibility.community.bannerImg
                            ? visibility.community.bannerImg
                            : "/College_alumnis.png"
                        }
                        alt={visibility.community.title}
                        className="w-6 h-6 rounded object-contain border border-gray-300 mr-1"
                      />
                      <span>{visibility.community.title}</span>
                      {!fixedCommunity && <MdArrowDropDown />}
                    </>
                  ) : (
                    <>
                      {visibility?.type === "connections" ? "Connections only" : "Anyone"} {!fixedCommunity && <MdArrowDropDown />}
                    </>
                  )}
                </button>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              <MdClose className="w-6 h-6" />
            </button>
          </div>
          {/* Body */}
          <div className="px-6 py-4">
            {!postType.includes('poll') && (
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
              />
            )}
            <textarea
              className="w-full min-h-[100px] text-lg border-none focus:outline-orange-500 focus:outline-2 focus:outline resize-none placeholder-gray-400"
              placeholder="What do you want to talk about?"
              value={text}
              onChange={e => setText(e.target.value)}
              autoFocus
            />
            {/* LinkedIn-style Tag Input UI below textarea */}
            <div className="relative mt-2 mb-2 min-h-[40px]">
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center bg-[#e6f7f2] text-orange-500 px-3 py-1 rounded-full text-sm font-medium mr-1"
                  >
                    #{tag.text}
                    <button
                      onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                      className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                      aria-label="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => {
                    setTagInput(e.target.value);
                    setShowTagDropdown(e.target.value.trim().length > 0);
                  }}
                  onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                  placeholder={tags.length === 0 ? "Add hashtags (type #)" : ""}
                  className="flex-1 min-w-[120px] border-none focus:ring-0 bg-transparent text-sm outline-none"
                  style={{ outline: "none" }}
                />
              </div>
              {showTagDropdown && (
                <div className="absolute bg-white border border-gray-200 rounded shadow-lg mt-1 z-10 max-h-40 overflow-y-auto w-full">
                  {allTags
                    .filter(tag => tag.name && tag.name.toLowerCase().includes(tagInput.replace('#', '').toLowerCase()))
                    .filter(tag => !tags.some(t => t.text.toLowerCase() === tag.name.toLowerCase()))
                    .map((tag, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 hover:bg-[#e6f7f2] cursor-pointer"
                        onMouseDown={() => {
                          if (!tags.some(t => t.text.toLowerCase() === tag.name.toLowerCase())) {
                            setTags([...tags, { text: tag.name }]);
                          }
                          setTagInput('');
                          setShowTagDropdown(false);
                        }}
                      >
                        #{tag.name}
                      </div>
                    ))}
                  {!allTags.some(tag => tag.name && tag.name.toLowerCase() === tagInput.replace('#', '').toLowerCase()) &&
                    tagInput.replace('#', '').trim().length > 0 &&
                    !tags.some(t => t.text.toLowerCase() === tagInput.replace('#', '').toLowerCase()) && (
                    <div
                      className="px-3 py-2 hover:bg-[#e6f7f2] cursor-pointer"
                      onMouseDown={() => {
                        const newTag = tagInput.replace('#', '').trim();
                        if (newTag.length > 0 && !tags.some(t => t.text.toLowerCase() === newTag.toLowerCase())) {
                          setTags([...tags, { text: newTag }]);
                        }
                        setTagInput('');
                        setShowTagDropdown(false);
                      }}
                    >
                      Add new tag: #{tagInput.replace('#', '')}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Attachment preview/filename with remove */}
            <div className="mt-2 space-y-2">
              {attachments.image && (
                <div className="relative flex flex-col items-start">
                  <div className="w-48 aspect-[3/2] bg-gray-100 rounded flex items-center justify-center overflow-hidden relative">
                    <img src={URL.createObjectURL(attachments.image)} alt="attachment" className="w-full h-full object-contain" />
                    <button
                      className="absolute top-1 right-1 bg-white rounded-full shadow p-1 text-gray-500 hover:text-red-500"
                      onClick={() => removeAttachment('image')}
                      title="Remove image"
                      type="button"
                    >
                      <MdClose size={16} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-600 mt-1 break-all">{attachments.image.name}</span>
                </div>
              )}
              {attachments.video && (
                <div className="relative flex flex-col items-start">
                  <div className="w-48 aspect-[3/2] bg-gray-100 rounded flex items-center justify-center overflow-hidden relative">
                    <video src={URL.createObjectURL(attachments.video)} controls className="w-full h-full object-contain" />
                    <button
                      className="absolute top-1 right-1 bg-white rounded-full shadow p-1 text-gray-500 hover:text-red-500"
                      onClick={() => removeAttachment('video')}
                      title="Remove video"
                      type="button"
                    >
                      <MdClose size={16} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-600 mt-1 break-all">{attachments.video.name}</span>
                </div>
              )}
              {attachments.pdf && (
                <div className="relative flex items-center gap-2">
                  <AiFillFilePdf className="text-red-500 text-2xl" />
                  <span className="text-xs text-gray-600">{attachments.pdf.name}</span>
                  <button
                    className="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 text-gray-500 hover:text-red-500"
                    onClick={() => removeAttachment('pdf')}
                    title="Remove PDF"
                    type="button"
                  >
                    <MdClose size={16} />
                  </button>
                </div>
              )}
            </div>
            {poll && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MdBarChart className="w-4 h-4" />
                  <span>Poll</span>
                </div>
                <p className="font-medium mb-2">{poll.question}</p>
                <div className="space-y-2">
                  {poll.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-lime-600"></div>
                      <span>{option.option}</span>
                    </div>
                  ))}
                </div>
                <div className="text-gray-500 text-sm mt-2">
                  {poll.totalVotes} votes{poll.timeLeft && ` • ${poll.timeLeft}`}
                </div>
              </div>
            )}
            

          </div>
          {/* All icons in bottom bar */}
          <div className="flex items-center justify-between px-6 py-3 border-t">
            <div className="flex gap-4 text-2xl">
              <button
                className={`hover:text-orange-500 ${postType === 'ask' ? 'text-orange-500' : 'text-gray-500'}`}
                title="Ask"
                onClick={() => setPostType(postType === 'ask' ? '' : 'ask')}
                type="button"
              >
                <MdHelpOutline />
              </button>
              {!editingPost && (
                <button
                  className={`hover:text-orange-500 ${postType === 'poll' ? 'text-orange-500' : 'text-gray-500'}`}
                  title="Poll"
                  onClick={() => { setPostType(postType === 'poll' ? '' : 'poll'); setShowPollModal(true); }}
                  type="button"
                >
                  <MdPoll />
                </button>
              )}
              <button
                className={`hover:text-orange-500 ${postType === 'greeting' ? 'text-orange-500' : 'text-gray-500'}`}
                title="Greeting"
                onClick={() => setPostType(postType === 'greeting' ? '' : 'greeting')}
                type="button"
              >
                <MdWavingHand />
              </button>
              <label className="hover:text-orange-500 text-gray-500 cursor-pointer" title="Image">
                <MdImage />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange('image', e)} />
              </label>
              <label className="hover:text-orange-500 text-gray-500 cursor-pointer" title="Video">
                <MdVideocam />
                <input type="file" accept="video/*" className="hidden" onChange={e => handleFileChange('video', e)} />
              </label>
              <label className="hover:text-orange-500 text-gray-500 cursor-pointer" title="PDF">
                <AiFillFilePdf />
                <input type="file" accept="application/pdf" className="hidden" onChange={e => handleFileChange('pdf', e)} />
              </label>
            </div>
            <button
              className={`px-6 py-2 rounded-full text-white font-semibold transition ${text ? 'bg-orange-500 hover:bg-[#117a6a]' : 'bg-gray-300 cursor-not-allowed'}`}
              disabled={!text}
              onClick={() => handleCreatePost(poll)}
            >
              {editingPost ? 'Update' : 'Post'}
            </button>
          </div>
        </div>
        <PollModal
          open={showPollModal}
          onClose={() => {
            setShowPollModal(false);
            setPoll(null);
            setPostType("");
          }}
          onSave={setPoll}
          initialPoll={poll}
          handleCreatePost={handleCreatePost}
        />
      </div>
    );
  }