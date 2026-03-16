import api from "@/utils/apiSetup";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  allBlogs: [],
  expertBlogs: [],
  selectedBlog: null,
  communityBlogs: [],
};

export const setAllBlogs = createAsyncThunk(
  "blog/setAllBlogs",
  async (thunkAPI) => {
    const res = await api.get(`/blog`);
    return res.data.blogs;
  }
);
export const setSelectedBlog = createAsyncThunk(
  "blog/setSelectedBlog",
  async (blogId, thunkAPI) => {
    const res = await api.get(`/blog/${blogId}`);
    return res.data.blog;
  }
);
export const setCommunityBlogs = createAsyncThunk(
  "blog/setCommunityBlogs",
  async (communityId, thunkAPI) => {
    const res = await api.get(`/blog/community/${communityId}`);
    return res.data.blogs;
  }
);
export const setExpertBlogs = createAsyncThunk(
  "blog/setExpertBlogs",
  async (userId, thunkAPI) => {
    const res = await api.get(`/blog/user/${userId}`);
    return res.data.blogs;
  }
);
const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(setAllBlogs.fulfilled, (state, action) => {
      state.allBlogs = action.payload;
    });
    builder.addCase(setExpertBlogs.fulfilled, (state, action) => {
      state.expertBlogs = action.payload;
    });
    builder.addCase(setSelectedBlog.fulfilled, (state, action) => {
      state.selectedBlog = action.payload;
    });
    builder.addCase(setCommunityBlogs.fulfilled, (state, action) => {
      state.communityBlogs = action.payload;
    });
  },
});

export default blogSlice;

export const selectAllBlogs = (state) => state.blog.allBlogs;
export const selectExpertBlogs = (state) => state.blog.expertBlogs;
export const selectCommunityBlogs = (state) => state.blog.communityBlogs;
export const selectOneBlog = (state) => state.blog.selectedBlog;
