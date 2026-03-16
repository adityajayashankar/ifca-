import api from "@/utils/apiSetup";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  sessions: [],
  numTotalSessions: 0,
  completedSessions: [],
  selectedSession: null,
};

export const setAllSessions = createAsyncThunk(
  "session/setAllSessions",
  async (thunkAPI) => {
    const res = await api.get(`/session`);
    return res.data;
  }
);

export const setOneSession = createAsyncThunk(
  "session/setOneSession",
  async (sessionId, thunkAPI) => {
    if (sessionId) {
      const res = await api.get(`/session/${sessionId}`);
      return res.data.session;
    }
  }
);

export const setSelectedSessionById = createAsyncThunk(
  "session/setSelectedSessionById",
  async (sessionId, thunkAPI) => {
    try {
      const res = await api.get(`/session/${sessionId}`);
      console.log(res.data);
      // console.log(res.data.session);
      return res.data.session;
    } catch (err) {
      console.log(`Error while fetching sessions`);
      console.log(err);
      return [];
    }
  }
);

//another function to get the session details with applied speakers onnly for admin
export const setSelectedSessionByIdWithApliedSpeakers = createAsyncThunk(
  "session/setSelectedSessionByIddWithApliedSpeakers",
  async (sessionId, thunkAPI) => {
    try {
      const res = await api.get(`/session/apply/${sessionId}`);
      console.log("res from redux", res.data);
      // console.log(res.data.session);
      return res.data.session;
    } catch (err) {
      console.log(`Error while fetching sessions`);
      console.log(err);
      return [];
    }
  }
);

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSelectedSession: (state, action) => {
      state.selectedSession = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setAllSessions.fulfilled, (state, action) => {
      state.sessions = action.payload.sessions;
      state.completedSessions = action.payload.completedSessions;
      state.numTotalSessions = action.payload.total;
    });
    builder.addCase(setOneSession.fulfilled, (state, action) => {
      state.selectedSession = action.payload;
    });
    builder.addCase(
      setSelectedSessionByIdWithApliedSpeakers.fulfilled,
      (state, action) => {
        state.selectedSession = action.payload;
      }
    );
  },
});

export default sessionSlice;

export const allSessions = (state) => state.session.sessions;
export const selectAllCompletedSessions = (state) => state.session.completedSessions;
export const selectCompletedSessions = (state) =>
  state.session.completedSessions;

export const oneSession = (state) => state.session.selectedSession;
export const oneSessionAdmin = (state) => state.session.selectedSession;
export const selectSession = (state) => state.session.selectedSession;
export const selectTotalSession = (state) => state.session.numTotalSessions;
export const { setSelectedSession } = sessionSlice.actions;
