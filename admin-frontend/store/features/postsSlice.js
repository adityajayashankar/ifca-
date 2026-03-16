import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/apiSetup";
const initialState = {
  allPosts: [],
  selectedPost: null,
  communityPosts: [],
  likeMap: {},
  voteMap: {},
  tags: [],
  sessionPosts: [],
};

export const setCommunityPosts = createAsyncThunk(
  "post/setCommunityPosts",
  async (communityId, thunkAPI) => {
    // Get the current state to check if user is admin and wants to see archived posts
    const state = thunkAPI.getState();
    const user = state.user.user;
    const isAdmin = user?.userType === 'admin' || user?.unifiedUser?.adminId;
    
    // Build the API URL with query parameters
    let url = `/thread/community/${communityId}`;
    const params = new URLSearchParams();
    
    // If admin, always include archived posts (frontend will filter them)
    if (isAdmin) {
      params.append('includeArchived', 'true');
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const posts = await api.get(url);
    
    let tags = {};
    posts?.data?.posts.forEach((post) => {
      if (post.tags.length > 0) {
        // add each of posts to the map
        post.tags.forEach((item) => {
          tags[item.tagId] = {
            id: `${item.tag.name}-${item.tag.id}`,
            text: item.tag.name,
          };
        });
      }
    });
    return { postsData: posts.data, tags: Object.values(tags) };
  }
);
export const setSessionPosts = createAsyncThunk(
  "post/setSessionPosts",
  async (sessionId, thunkAPI) => {
    let config = { headers: { noLoad: true } };

    const posts = await api.get(`/thread/session/${sessionId}`, config);
    let tags = {};
    posts?.data?.posts.forEach((post) => {
      if (post.tags.length > 0) {
        // add each of posts to the map
        post.tags.forEach((item) => {
          tags[item.tagId] = {
            id: `${item.tag.name}-${item.tag.id}`,
            text: item.tag.name,
          };
        });
      }
    });
    return { postsData: posts.data, tags: Object.values(tags) };
  }
);
const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    setSelectedPost: (state, action) => {
      state.selectedPost = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setCommunityPosts.fulfilled, (state, action) => {
      state.communityPosts = action.payload.postsData.posts;
      state.likeMap = action.payload.postsData.like_map;
      state.tags = action.payload.tags;
      state.voteMap = action.payload.postsData.vote_map;
    });
    builder.addCase(setSessionPosts.fulfilled, (state, action) => {
      state.sessionPosts = action.payload.postsData.posts;
      state.likeMap = action.payload.postsData.like_map;
      state.tags = action.payload.tags;
      state.voteMap = action.payload.postsData.vote_map;
    });
  },
});

export default postSlice;
export const selectCommunityPosts = (state) => state.post.communityPosts;
export const selectSessionPosts = (state) => state.post.sessionPosts;
export const selectLikeMap = (state) => state.post.likeMap;
export const selectTags = (state) => state.post.tags;
export const selectVoteMap = (state) => state.post.voteMap;

// export const selectOneExpert=(state)=>state.expert.selectedExpert;
// export const selectExpertSessions=(state)=>state.expert.expertSessions;
// export const selectExpertCommunities=(state)=>state.expert.expertCommunities;

export const { setSelectedPost } = postSlice.actions;
