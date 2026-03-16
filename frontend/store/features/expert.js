import api from "@/utils/apiSetup";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedExpert: null,
  allExperts: [],
  activeExperts: [],
  disabledExperts: [],
  expertSessions: [],
  expertCompletedSessions: [],
  expertCommunities: [],
};

export const setAllExperts = createAsyncThunk(
  "expert/setAllExperts",
  async (thunkAPI) => {
    try {
      const response = await api.get(`/expert`);
      // Return the entire response data which contains activeExperts and disabledExperts
      return response.data;
    } catch (error) {
      console.error("Error fetching experts:", error);
      return { activeExperts: [], disabledExperts: [] };
    }
  }
);

export const setExpertSessions = createAsyncThunk(
  "expert/setExpertSessions",
  async (expertId, thunkAPI) => {
    if (expertId) {
      const res = await api.get(`/expert/${expertId}/sessions`);
      return res.data;
    }
  }
);
export const setExpertCommunities = createAsyncThunk(
  "expert/setExpertCommunities",
  async (expertId, thunkAPI) => {
    const res = await api.get(`/expert/${expertId}/community`);
    return res.data.communities;
  }
);

const expertSlice = createSlice({
  name: "expert",
  initialState,
  reducers: {
    setExpert: (state, action) => {
      state.selectedExpert = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setAllExperts.fulfilled, (state, action) => {
      // Store both activeExperts and disabledExperts in the state
      state.activeExperts = action.payload.activeExperts || [];
      state.disabledExperts = action.payload.disabledExperts || [];
      // Also maintain backward compatibility with allExperts (defaults to activeExperts)
      state.allExperts = action.payload.activeExperts || [];
    });
    builder.addCase(setExpertSessions.fulfilled, (state, action) => {
      if (action.payload) {
        state.expertSessions = action.payload?.sessions;
        state.expertCompletedSessions = action.payload?.completedSessions;
      } else {
        state.expertSessions = [];
      }
    });
    builder.addCase(setExpertCommunities.fulfilled, (state, action) => {
      state.expertCommunities = action.payload;
    });
  },
});

export default expertSlice;
export const selectExpert = (state) => state.expert.selectedExpert;
export const selectAllExperts = (state) => state.expert.allExperts;
export const selectActiveExperts = (state) => state.expert.activeExperts;
export const selectDisabledExperts = (state) => state.expert.disabledExperts;
export const selectExpertSessions = (state) => state.expert.expertSessions;
export const selectExpertCompletedSessions = (state) =>
  state.expert.expertCompletedSessions;
export const selectExpertCommunities = (state) =>
  state.expert.expertCommunities;
export const { setExpert } = expertSlice.actions;
