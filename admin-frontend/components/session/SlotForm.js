import { selectAllExperts } from "@/store/features/expert";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCommunityForDiscount,
  communityDataFormOnChange,
  removeCommunityForDiscount,
  removeSlot,
  slotDataFormOnChange,
} from "../../store/features/createSessionSlice";
import { selectCommunity, setCommunityById } from "@/store/features/communitySlice";
import { MdSchedule, MdLocationOn, MdPerson, MdAttachMoney, MdGroup, MdVideoCall, MdRecordVoiceOver, MdLiveTv, MdDelete } from "react-icons/md";
import { Select, MenuItem, Avatar, ListItemText, ListItemAvatar, FormControl, InputLabel } from "@mui/material";

function SlotForm({ slot, index, comId, allCommunities }) {
  const dispatch = useDispatch();
  const [isCustomLink, setCustomLinkBool] = useState(true);

  const handleRemoveSlot = (e) => {
    e.preventDefault();
    dispatch(removeSlot(index));
  };

  const community = useSelector(selectCommunity)
  useEffect(() => {
    if (slot.isOnline && slot.location) {
      setCustomLinkBool(false);
    }
    console.log(allCommunities);
  }, []);

  const handleSlotDataOnChange = (e) => {
    const { type } = e.target;
    
    // Handle mutual exclusivity for isRecorded and isLive
    if (type === "checkbox" && (e.target.name === "isRecorded" || e.target.name === "isLive")) {
      const isRecorded = e.target.name === "isRecorded" ? e.target.checked : slot.isRecorded;
      const isLive = e.target.name === "isLive" ? e.target.checked : slot.isLive;
      
      // If both are being checked, uncheck the other one
      if (e.target.checked && isRecorded && isLive) {
        // Uncheck the other option
        const otherName = e.target.name === "isRecorded" ? "isLive" : "isRecorded";
        dispatch(
          slotDataFormOnChange({
            name: otherName,
            value: false,
            slotId: index,
          })
        );
      }
      
      // Update the current field
      dispatch(
        slotDataFormOnChange({
          name: e.target.name,
          value: e.target.checked,
          slotId: index,
        })
      );
      return;
    }
    
    switch (type) {
      case "checkbox":
        dispatch(
          slotDataFormOnChange({
            name: e.target.name,
            value: e.target.checked,
            slotId: index,
          })
        );
        break;
      case "select-one":
        dispatch(
          slotDataFormOnChange({
            name: e.target.name,
            value: Number(e.target.value),
            slotId: index,
          })
        );
        break;
      case "number":
        dispatch(
          slotDataFormOnChange({
            name: e.target.name,
            value: Number(e.target.value),
            slotId: index,
          })
        );
        break;
      default:
        dispatch(
          slotDataFormOnChange({
            name: e.target.name,
            value: e.target.value,
            slotId: index,
          })
        );
    }
  };

  const handleCustomLink = (index) => {
    if (!isCustomLink) {
      dispatch(
        slotDataFormOnChange({
          name: "location",
          value: "",
          slotId: index,
        })
      );
    }
    setCustomLinkBool((prev) => !prev);
  };

  const handleDateDefaultValue = (xtime) => {
    if (xtime[xtime.length - 1] !== "Z") {
      return xtime;
    }
    let dxtime = new Date(xtime);
    const retVal = new Date(
      dxtime.getTime() - dxtime.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, -1);
    return retVal;
  };

  function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
  
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }  

  const allExperts = useSelector(selectAllExperts);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Slot Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <MdSchedule className="text-white text-sm" />
            </div>
            <div>
              <h3 className="text-16px font-bold text-gray-900">Slot {index + 1}</h3>
              <p className="text-12px text-gray-600">Configure session details and timing</p>
            </div>
          </div>
          <button
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center gap-2 text-12px font-medium shadow-sm"
            onClick={handleRemoveSlot}
          >
            <MdDelete className="text-12px" />
            Remove
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slot Name */}
          <div className="form-group">
            <label htmlFor={`slot-topicName-${slot.index}`} className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Slot Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={`slot-topicName-${slot.index}`}
              name="topicName"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
              defaultValue={slot.topicName}
              onChange={handleSlotDataOnChange}
              placeholder="Enter slot name..."
              required
            />
          </div>

          {/* Speaker Selection */}
          <div className="form-group">
            <label htmlFor={`slot-speakers-${slot.index}`} className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MdPerson className="text-14px text-orange-500" />
              Speaker
            </label>
            <FormControl fullWidth size="small">
              <InputLabel id={`slot-speakers-label-${slot.index}`}>Select Speaker</InputLabel>
              <Select
                labelId={`slot-speakers-label-${slot.index}`}
                id={`slot-speakers-${slot.index}`}
                name="speakerId"
                value={slot.speakerId || ""}
                label="Select Speaker"
                onChange={handleSlotDataOnChange}
                renderValue={selected => {
                  const expert = allExperts?.find(item => item.unifiedUserId.id === selected);
                  if (!expert) return "Select Speaker";
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar src={expert.photoURL} alt={expert.name} sx={{ width: 28, height: 28, fontSize: 14 }}>
                        {expert.name ? expert.name[0] : '?'}
                      </Avatar>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{expert.name}</span>
                        <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{expert.email}</span>
                      </div>
                    </div>
                  );
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 320,
                    },
                  },
                }}
                sx={{
                  background: 'white',
                  borderRadius: 2,
                  fontSize: '14px',
                  boxShadow: 'none',
                  '.MuiSelect-select': { py: 1.5, px: 2 },
                }}
              >
                <MenuItem value="">
                  <em>Select Speaker</em>
                </MenuItem>
                {allExperts
                  ?.filter((item) => item.name && item.name.trim() !== "")
                  ?.map((item, idx) => (
                    <MenuItem value={item.unifiedUserId.id} key={`speaker-${idx + 1}`}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <ListItemAvatar>
                        <Avatar src={item.photoURL} alt={item.name} sx={{ width: 28, height: 28, fontSize: 14 }}>
                          {item.name ? item.name[0] : '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<span style={{ fontWeight: 500, fontSize: 14 }}>{item.name}</span>}
                        secondary={<span style={{ fontSize: 12, color: '#888' }}>{item.email}</span>}
                      />
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Time and Date Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Time */}
          <div className="form-group">
            <label htmlFor={`slot-startTime-${slot.index}`} className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MdSchedule className="text-14px text-orange-500" />
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id={`slot-startTime-${slot.index}`}
              name="startTime"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
              defaultValue={handleDateDefaultValue(slot.startTime)}
              onChange={handleSlotDataOnChange}
              min={getCurrentDateTime()}
              required
            />
          </div>

          {/* End Time */}
          <div className="form-group">
            <label htmlFor={`slot-endTime-${slot.index}`} className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MdSchedule className="text-14px text-orange-500" />
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id={`slot-endTime-${slot.index}`}
              name="endTime"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
              defaultValue={handleDateDefaultValue(slot.endTime)}
              onChange={handleSlotDataOnChange}
              min={getCurrentDateTime()}
              required
            />
          </div>
        </div>

        {/* Pricing and Capacity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price */}
          <div className="form-group">
            <label htmlFor={`slot-price-${slot.index}`} className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MdAttachMoney className="text-14px text-orange-500" />
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-14px">$</span>
              <input
                type="number"
                id={`slot-price-${slot.index}`}
                name="price"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
                defaultValue={slot.price}
                onChange={handleSlotDataOnChange}
                min={0}
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Participant Limit */}
          <div className="form-group">
            <label htmlFor={`slot-participantLimit-${slot.index}`} className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MdGroup className="text-14px text-orange-500" />
              Participant Limit <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id={`slot-participantLimit-${slot.index}`}
              name="participantLimit"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
              defaultValue={slot.participantLimit}
              onChange={handleSlotDataOnChange}
              min={1}
              placeholder="Enter limit..."
              required
            />
          </div>
        </div>

        {/* Session Type Toggle */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <MdLocationOn className="text-16px text-orange-500" />
            <h4 className="text-14px font-semibold text-gray-800">Session Type</h4>
          </div>
          
          <div className="flex w-full rounded-lg bg-white border border-gray-200 overflow-hidden shadow-sm">
            <button
              type="button"
              className={`flex-1 py-3 text-14px font-semibold transition-all duration-200 focus:outline-none ${slot.isOnline ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-orange-50'}`}
              onClick={() => handleSlotDataOnChange({ target: { name: 'isOnline', type: 'checkbox', checked: true } })}
            >
              <MdVideoCall className="inline-block mr-2 text-16px" />
              Online
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-14px font-semibold transition-all duration-200 focus:outline-none ${!slot.isOnline ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-orange-50'}`}
              onClick={() => handleSlotDataOnChange({ target: { name: 'isOnline', type: 'checkbox', checked: false } })}
            >
              <MdLocationOn className="inline-block mr-2 text-16px" />
              In-Person
            </button>
          </div>
        </div>

        {/* Online Session Options */}
        {slot.isOnline && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-14px font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <MdVideoCall className="text-16px text-blue-600" />
              Online Session Options
            </h4>
            
            <div className="mb-3 p-2 bg-blue-100 rounded-lg border border-blue-300">
              <p className="text-12px text-blue-700 font-medium">
                ⚠️ Choose one option: Either Live Session OR Prerecorded Session
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Prerecorded Option */}
              <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-blue-100 transition-colors">
                <input
                  type="checkbox"
                  id={`slot-isRecorded-${slot.index}`}
                  name="isRecorded"
                  checked={slot.isRecorded}
                  onChange={handleSlotDataOnChange}
                  className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-md checked:border-blue-500 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <span className="w-4 h-4 flex items-center justify-center border-2 border-gray-300 rounded-md bg-white peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all">
                  <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                <div className="flex items-center gap-2">
                  <MdRecordVoiceOver className="text-16px text-blue-600" />
                  <span className="text-14px font-medium text-blue-800 group-hover:text-blue-900 transition-colors">Prerecorded Session</span>
                </div>
              </label>

              {/* Video URL for Prerecorded */}
              {slot.isRecorded && (
                <div className="ml-8">
                  <label htmlFor={`slot-videoUrl-${slot.index}`} className="block text-14px font-medium text-blue-700 mb-2">
                    Video Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id={`slot-videoUrl-${slot.index}`}
                    name="videoUrl"
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-14px shadow-sm"
                    defaultValue={slot.videoUrl}
                    onChange={handleSlotDataOnChange}
                    placeholder="Enter video URL..."
                    required
                  />
                </div>
              )}

              {/* Live Option */}
              <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-blue-100 transition-colors">
                <input
                  type="checkbox"
                  id={`slot-isLive-${slot.index}`}
                  name="isLive"
                  checked={slot.isLive}
                  onChange={handleSlotDataOnChange}
                  className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-md checked:border-blue-500 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <span className="w-4 h-4 flex items-center justify-center border-2 border-gray-300 rounded-md bg-white peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all">
                  <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                <div className="flex items-center gap-2">
                  <MdLiveTv className="text-16px text-blue-600" />
                  <span className="text-14px font-medium text-blue-800 group-hover:text-blue-900 transition-colors">Live Session</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Location for In-Person Sessions */}
        {!slot.isOnline && (
          <div className="form-group">
            <label htmlFor={`slot-location-${slot.index}`} className="block text-14px font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MdLocationOn className="text-14px text-orange-500" />
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={`slot-location-${slot.index}`}
              name="location"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-14px shadow-sm hover:border-orange-300"
              defaultValue={slot.location}
              onChange={handleSlotDataOnChange}
              placeholder="Enter venue address..."
              required
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SlotForm;
