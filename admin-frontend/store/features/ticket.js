import api from '@/utils/apiSetup';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

const initialState = {
    tickets:[],
    selectedTicket:null
};

export const setAllTickets=createAsyncThunk('ticket/setAllTickets',async(thunkAPI)=>{
    const res=await api.get(`/ticket`);
    return res.data.tickets;
})


const ticketSlice = createSlice({
    name: 'ticket',
    initialState,
    reducers: {
       setSelectedTicket:(state,action)=>{
        state.selectedTicket=action.payload;
       }
    },
    extraReducers:(builder)=>{
        builder.addCase(setAllTickets.fulfilled,(state,action)=>{
            // state.tickets=action.payload;
            let items={0:[],1:[]}
            // place the unresolved items first
            action.payload?.forEach((item)=>{
                items[item.isResolved?1:0].push(item);
            })
            let total=items[0].concat(items[1]);
            state.tickets=total;
        })
    }
});

export default ticketSlice;
export const selectAllTickets=(state)=>state.ticket.tickets;
export const selectOneTicket=(state)=>state.ticket.selectedTicket;

export const { setSelectedTicket } = ticketSlice.actions;
