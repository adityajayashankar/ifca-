import { decipherBaseSlots } from "@/utils/findRecurring";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  title: "",
  desc: "",
  isCourse: false,
  isVideoChannel: false,
  sessionType: "",
  bannerImgs: [],
  infoImgs: [],
  creatorId: 1,
  slots: [],
  tags: [],
  isExclusive: false,
  isRecurring: "none",
  communityId: 0,
};

const createSessionSlice = createSlice({
  name: "createSession",
  initialState,
  reducers: {
    setCreatorId: (state, action) => {
      state.creatorId = action.payload;
    },
    addSlot: (state) => {
      state.slots.push({
        startTime: "",
        endTime: "",
        price: 0,
        credits: 0,
        participantLimit: "",
        speakerId: null,
        isOnline: false,
        isRecorded: false,
        isLive: false,
        videoUrl: "",
        location: "",
      });
    },
    removeSlot: (state, action) => {
      state.slots.splice(action.payload, 1);
    },
    addCommunityForDiscount: (state, action) => {
      const { index, slotId } = action.payload;
      state.slots[index].discountTiers.push({
        communityId: 0,
        discount: 0,
      });
    },
    removeCommunityForDiscount: (state, action) => {
      const { slotIndex, tierIndex } = action.payload;
      state.slots[slotIndex].discountTiers.splice(tierIndex, 1);
    },
    clearForm: (state) => {
      state.title = "";
      state.desc = "";
      state.bannerImgs = [];
      state.infoImgs = [];
      state.slots = [];
      state.tags = [];
      state.communityId = 0;
      state.isExclusive = false;
      state.isRecurring = "none";
      state.isCourse = false;
      state.isVideoChannel = false;
      state.sessionType = "";
    },
    mainDataFormOnChange: (state, action) => {
      const { name, value } = action.payload;
      state[name] = value;
    },
    slotDataFormOnChange: (state, action) => {
      const { name, value, slotId } = action.payload;
      state.slots[slotId][name] = value;
    },
    communityDataFormOnChange: (state, action) => {
      const { slotIndex, tierIndex, name, value } = action.payload;
      state.slots[slotIndex].discountTiers[tierIndex][name] = value;
    },
    initSession: (state, action) => {
      if (action.payload) {
        const {
          title,
          desc,
          bannerImgs,
          isRecurring,
          isVideoChannel,
          isCourse,
          tags,
          sessionType,
          infoImgs,
          creatorId,
          SessionSlot,
          isExclusive,
          communityId,
        } = action.payload;
        state.title = title;
        state.desc = desc;
        state.isCourse = isCourse;
        state.tags = tags;
        state.isVideoChannel = isVideoChannel;
        state.sessionType = sessionType;
        state.isExclusive = isExclusive;
        state.isRecurring = isRecurring;
        state.communityId = communityId;
        state.bannerImgs = bannerImgs;
        state.infoImgs = infoImgs;
        state.creatorId = creatorId;
        state.slots = SessionSlot;
      }
    },
    updateInfoImg: (state, action) => {
      state.infoImgs.push(action.payload);
    },
    updateBannerImg: (state, action) => {
      state.bannerImgs = [action.payload];
    },
  },
});

export const selectSession = (state) => state.createSession;
export const title = (state) => state.title;
export default createSessionSlice;
export const {
  setCreatorId,
  addSlot,
  removeSlot,
  addCommunityForDiscount,
  removeCommunityForDiscount,
  clearForm,
  mainDataFormOnChange,
  slotDataFormOnChange,
  communityDataFormOnChange,
  initSession,
  updateInfoImg,
  updateBannerImg,
} = createSessionSlice.actions;
