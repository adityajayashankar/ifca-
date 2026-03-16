import api from '@/utils/apiSetup';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
    allPartners:[],
    partner:null,
    partnerCommunities:[],
    numPartnerCommunities:0,
    // Partner session state
    partnerSessions: [],
    completedPartnerSessions: [],
    selectedPartnerSession: null,
    partnerSessionStats: {
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        totalSlots: 0,
        totalAttendees: 0
    }
};

// export const setAllPartners=createAsyncThunk(
// 'partner/setAllPartners',async(adminId,thunkAPI)=>{
//     const res=await api.get('/partner');
//     let adminPartners=res.data?.filter((item)=>item.adminId===parseInt(adminId))
//     return adminPartners;
// })


export const setAllPartners = createAsyncThunk("partner/setAllPartners", async (adminId, thunkAPI) => {
  const res = await api.get(`/partner`)
  return res.data
})

// Partner session async thunks
export const setPartnerSessions = createAsyncThunk(
  "partner/setPartnerSessions",
  async (thunkAPI) => {
    const res = await api.get('/partner/sessions');
    return res.data;
  }
);

export const setPartnerSessionById = createAsyncThunk(
  "partner/setPartnerSessionById",
  async (sessionId, thunkAPI) => {
    if (sessionId) {
      const res = await api.get(`/partner/sessions/${sessionId}`);
      return res.data;
    }
  }
);

export const setPartnerCommunities=createAsyncThunk('partner/setPartnerCommunities',async(partnerId,thunkAPI)=>{
    if(partnerId){
        const res=await api.get(`/partner/${partnerId}/communities`);
        return res.data
    }
})

export const setPartner = createAsyncThunk(
    'partner/setPartner',
    async (partnerId) => {
      const response = await api.get(`/partner/${partnerId}`);
      return response.data;
    }
  );

const partnerSlice = createSlice({
    name: 'partner',
    initialState,
    reducers: {
        clearPartnerSession: (state) => {
            state.selectedPartnerSession = null;
        },
        clearPartnerSessions: (state) => {
            state.partnerSessions = [];
            state.completedPartnerSessions = [];
            state.partnerSessionStats = {
                totalSessions: 0,
                activeSessions: 0,
                completedSessions: 0,
                totalSlots: 0,
                totalAttendees: 0
            };
        }
    },
    extraReducers:(builder)=>{
        builder.addCase(setAllPartners.fulfilled,(state,action)=>{
            state.allPartners=action.payload;
        })

        builder.addCase(setPartnerCommunities.fulfilled,(state,action)=>{
            state.partnerCommunities=action.payload.communities
            state.numPartnerCommunities=action.payload.total
        })

        builder.addCase(setPartner.fulfilled, (state, action) => {
            state.partner = action.payload;
          });

        // Partner session cases
        builder.addCase(setPartnerSessions.fulfilled, (state, action) => {
            state.partnerSessions = action.payload.data?.sessions || [];
            state.completedPartnerSessions = action.payload.data?.completedSessions || [];
            state.partnerSessionStats = action.payload.data?.statistics || {
                totalSessions: 0,
                activeSessions: 0,
                completedSessions: 0,
                totalSlots: 0,
                totalAttendees: 0
            };
        });

        builder.addCase(setPartnerSessionById.fulfilled, (state, action) => {
            state.selectedPartnerSession = action.payload.data?.session || null;
        });
    }
});

export default partnerSlice;

export const selectPartner=(state)=>state.partner.partner;
export const selectAllPartners=(state)=>state.partner.allPartners;
export const selectNumPartnerCommunity=(state)=>state.partner.numPartnerCommunities;

// Partner session selectors - similar to session slice
export const allPartnerSessions = (state) => state.partner.partnerSessions;
export const selectCompletedPartnerSessions = (state) => state.partner.completedPartnerSessions;
export const selectPartnerSessionStats = (state) => state.partner.partnerSessionStats;
export const selectTotalPartnerSessions = (state) => state.partner.partnerSessionStats.totalSessions;

// Legacy selectors for backward compatibility
export const selectPartnerSessions = (state) => state.partner.partnerSessions;
export const selectSelectedPartnerSession = (state) => state.partner.selectedPartnerSession;

export const { clearPartnerSession, clearPartnerSessions } = partnerSlice.actions;

// export const { setPartner} = partnerSlice.actions;
