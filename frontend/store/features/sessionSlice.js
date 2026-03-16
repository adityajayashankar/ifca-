import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/apiSetup";
const initialState = {
  sessions: [],
  completedSessions: [],
  topRated: [],
  selectedSession: null,
  numTotalSessions: 0,
};

export const setSessions = createAsyncThunk(
  "session/setSessions",
  async (_, thunkAPI) => {
    try {
      const res = await api.get(`/session`);
      return res.data;
    } catch (err) {
      console.log(`Error while fetching sessions`);
      console.log(err);
      // Return a consistent fallback structure to avoid crashes
      return {
        sessions: [],
        completedSessions: [],
        total: 0,
      };
    }
  }
);



export const setAllSessions = createAsyncThunk(
  "session/setAllSessions",
  async (userCreatorId,thunkAPI) => {
    const res = await api.get(`/session?userCreatorId=${userCreatorId}`);
    return res.data;
  }
);

export const setTopRated = createAsyncThunk(
  "session/setTopRated",
  async (thunkAPI) => {
    try {
      const res = await api.get(`/session/top-rated`);
      return res.data.sessions;
    } catch (err) {
      console.log(`Error while fetching Top+RATED sessions`);
      console.log(err);
      return [];
    }
  }
);

export const setSelectedSessionById = createAsyncThunk(
  "session/setSelectedSessionById",
  async (sessionId) => {
    try {
      const res = await api.get(`/session/${sessionId}`);
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
    resetSelection: (state) => {
      state.selectedSession = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setSessions.fulfilled, (state, action) => {
      state.sessions = action.payload.sessions;
      state.completedSessions = action.payload.completedSessions;
      state.numTotalSessions = action.payload.total;
    });

    builder.addCase(setAllSessions.fulfilled, (state, action) => {
      state.sessions = action.payload.sessions;
    });

    builder.addCase(setSelectedSessionById.fulfilled, (state, action) => {
      state.selectedSession = action.payload;
    });

    builder.addCase(setTopRated.fulfilled, (state, action) => {
      state.topRated = action.payload;
    });
  },
});


export default sessionSlice;
export const selectAllSessions = (state) => state.session.sessions;
export const selectAllCompletedSessions = (state) => state.session.completedSessions;
export const selectSession = (state) => state.session.selectedSession;
export const selectTotalSession = (state) => state.session.numTotalSessions;
export const selectTopRatedSessions = (state) => state.session.topRated;

export const { setSelectedSession, resetSelection } = sessionSlice.actions;
