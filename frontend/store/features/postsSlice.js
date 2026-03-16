import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/apiSetup";
const initialState = {
  allPosts: [],
  selectedPost: null,
  voteMap: {},
  communityPosts: [],
  likeMap: {},
  tags: [],
};

export const setCommunityPosts = createAsyncThunk(
  "post/setCommunityPosts",
  async (communityId, thunkAPI) => {
    console.log(communityId);
    const posts = await api.get(`/thread/community/${communityId}`);
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
  },
});

export default postSlice;
export const selectCommunityPosts = (state) => state.post.communityPosts;
export const selectLikeMap = (state) => state.post.likeMap;
export const selectTags = (state) => state.post.tags;
export const selectVoteMap = (state) => state.post.voteMap;
// export const selectOneExpert=(state)=>state.expert.selectedExpert;
// export const selectExpertSessions=(state)=>state.expert.expertSessions;
// export const selectExpertCommunities=(state)=>state.expert.expertCommunities;

export const { setSelectedPost } = postSlice.actions;
