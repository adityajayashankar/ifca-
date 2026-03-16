import api from '@/utils/apiSetup';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
    allPartners:[],
    partner:null,
    partnerCommunities:[],
    numPartnerCommunities:0
};

export const setAllPartners=createAsyncThunk(
'partner/setAllPartners',async(adminId,thunkAPI)=>{
    const res=await api.get('/partner/');
    let adminPartners=res.data.partners?.filter((item)=>item.adminId===parseInt(adminId))
    return adminPartners;
})

export const setPartnerCommunities=createAsyncThunk('partner/setPartnerCommunities',async(partnerId,thunkAPI)=>{
    if(partnerId){
        const res=await api.get(`/partner/${partnerId}/communities`);
        return res.data
    }
})
const partnerSlice = createSlice({
    name: 'partner',
    initialState,
    reducers: {
        setPartner:(state,action)=>{
            state.partner=action.payload;
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
    }
});

export default partnerSlice;

export const selectPartner=(state)=>state.partner.partner;
export const selectAllPartners=(state)=>state.partner.allPartners;
export const selectNumPartnerCommunity=(state)=>state.partner.numPartnerCommunities;

export const { setPartner} = partnerSlice.actions;
