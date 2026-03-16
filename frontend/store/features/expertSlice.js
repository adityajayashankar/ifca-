import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/apiSetup";
const initialState = {
  experts: [],
  selectedExpert: null,
  expertSessions: [],
  expertCommunities: [],
  searchExperts : []
};

export const setExperts = createAsyncThunk(
  "expert/setExperts",
  async (thunkAPI) => {
    const res = await api.get(`/expert`);
    return res.data.experts;
  }
);

export const setExpertSession = createAsyncThunk(
  "expert/setExpertSession",
  async (expertId, thunkAPI) => {
    const res = await api.get(`/expert/${expertId}/sessions`);
    return res.data.sessions;
  }
);
export const setExpertCommunities = createAsyncThunk(
  "expert/setExpertCommunities",
  async (expertId, thunkAPI) => {
    const res = await api.get(`/expert/${expertId}/community`);
    return res.data.communities;
  }
);

export const setSearchExperts = createAsyncThunk(
  "expert/setSearchExperts",
  async(search,thunkAPI) => {
    const res = await api.get(`/expert/search/${search}`)
    return res.data.experts
  }  
)
const expertSlice = createSlice({
  name: "expert",
  initialState,
  reducers: {
    setSelectedExpert: (state, action) => {
      state.selectedExpert = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setExpertSession.fulfilled, (state, action) => {
      state.expertSessions = action.payload;
    });
    builder.addCase(setExpertCommunities.fulfilled, (state, action) => {
      state.expertCommunities = action.payload;
    });
    builder.addCase(setExperts.fulfilled, (state, action) => {
      state.experts = action.payload;
    });
  },
});

export default expertSlice;
export const selectOneExpert = (state) => state.expert.selectedExpert
export const selectAllExpert = (state) => state.expert.allExperts;
export const selectExpertSessions = (state) => state.expert.expertSessions;
export const selectExpertCommunities = (state) =>
  state.expert.expertCommunities;
export const selectAllExperts = (state) => state.expert.experts;
export const { setSelectedExpert } = expertSlice.actions;
