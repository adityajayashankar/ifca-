import api from "@/utils/apiSetup";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: undefined,
  loading: false,
  uploading: false,
  err: null,
  passer: null,
  allUsers: [],
  tags: [],
  communities: [],
  attendance: [],
  userDetails : [],
  sessions: []
};

export const setUserDetails = createAsyncThunk(
  "user/setUserDetails",
  async (userId,thunkAPI)=>{
    const res = await api.get(`/questions/answer/${userId}`)
    return res.data.details
  }
)

export const setAllUsers = createAsyncThunk(
  "user/setAllUsers",
  async (thunkAPI) => {
    const res = await api.get(`/user`);
    return res.data
  }
);

export const setUserCommunities = createAsyncThunk(
  "user/setUserCommunities",
  async (uid, thunkAPI) => {
    try {
      const res = await api.get(`/user/${uid}/community`);
      let communities = res.data.communities;
      let hasWeeklyPass = communities?.find((item) => item.id === 1);
      let stampedCommunities = communities?.map((item) => ({
        ...item,
        bought: true,
      }));
      return [stampedCommunities, !!hasWeeklyPass, res.data.memberships];
    } catch (err) {
      console.log(`Error while fetching communities of user:${uid}`);
      console.log(err);
      return [];
    }
  }
);

export const setAllTags = createAsyncThunk(
  "user/setAllTags",
  async (thunkAPI) => {
    const res = await api.get(`/tag`);
    let tags = res.data.tags;

    return {
      tags: tags?.map((item) => ({
        id: `${item.name}-${item.id}`,
        text: item.name,
      })),
    };
  }
);

export const setUserSessions = createAsyncThunk(
  "user/setUserSessions",
  async (userId,thunkAPI)=>{
    const res = await api.get(`/user/${userId}/sessions`)
    return res.data.session
  }
)

export const setUserMemberships = createAsyncThunk(
  "user/setUserMemberships",
  async (userId,thunkAPI)=>{
    const res = await api.get(`/user/${userId}/community`)
    return res.data.communities
  }
)

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      console.log('setUser reducer called with payload:', action.payload);
      state.user = action.payload;
      console.log('User state updated:', state.user);
    },
    logoutUser: (state) => {
      state.user = undefined;
      // Clear unified tokens from localStorage
      localStorage.removeItem('ifca-jwt');
      localStorage.removeItem('ifca-userType');
      localStorage.removeItem('ifca-unifiedUser');
      localStorage.removeItem('ifca-user');
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUploading: (state, action) => {
      state.uploading = action.payload;
    },
    setError: (state, action) => {
      state.err = action.payload;
    },
    setPasser: (state, action) => {
      state.passer = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setAllUsers.fulfilled, (state, action) => {
      state.allUsers = action.payload;
    });

    builder.addCase(setAllTags.fulfilled, (state, action) => {
      state.tags = action.payload.tags;
    });

    builder.addCase(setUserDetails.fulfilled, (state, action) => {
      state.userDetails = action.payload;
      // console.log(action.payload);
    });
    builder.addCase(setUserSessions.fulfilled,(state,action)=>{
      state.sessions = action.payload
    });
    builder.addCase(setUserMemberships.fulfilled,(state,action)=>{
      state.communities = action.payload
    });
  },
});

export default userSlice;
export const selectLoading = (state) => state.user.loading;
export const selectUser = (state) => state.user.user;
export const selectUploading = (state) => state.user.uploading;
export const selectError = (state) => state.user.err;
export const selectPasser = (state) => state.user.passer;
export const selectAllUsers = (state) => state.user.allUsers;
export const selectGlobalTags = (state) => state.user.tags;
export const selectUserCommunities = (state) => state.user.communities;
export const selectUserAttendance = (state) => state.user.attendance;
export const selectUserDetails = (state)=> state.user.userDetails
export const selectUserSessions = (state)=>state.user.sessions

export const {
  setUser,
  logoutUser,
  setLoading,
  setUploading,
  setError,
  setPasser,
} = userSlice.actions;
