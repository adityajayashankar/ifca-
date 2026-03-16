import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCommunityForDiscount,
  communityDataFormOnChange,
  removeCommunityForDiscount,
  removeSlot,
  slotDataFormOnChange,
} from "../../store/features/createSessionSlice";
import {
  selectCommunity,
  setCommunityById,
} from "@/store/features/communitySlice";
import { selectAllExperts } from "@/store/features/expert";

function SlotForm({ slot, index, comId, allCommunities }) {
  const dispatch = useDispatch();
  const [isCustomLink, setCustomLinkBool] = useState(true);

  const handleRemoveSlot = (e) => {
    e.preventDefault();
    dispatch(removeSlot(index));
  };

  const community = useSelector(selectCommunity);
  useEffect(() => {
    if (slot.isOnline && slot.location) {
      setCustomLinkBool(false);
    }
    // dispatch(setCommunityById(comId));
    console.log(allCommunities);
  }, []);

  const handleSlotDataOnChange = (e) => {
    const { type } = e.target;
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
  // xtime:[startTime, endTime]
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
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now
      .getDate()
      .toString()
      .padStart(2, "0");
    const hours = now
      .getHours()
      .toString()
      .padStart(2, "0");
    const minutes = now
      .getMinutes()
      .toString()
      .padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const allExperts = useSelector(selectAllExperts);

  // Add loading state check
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (allExperts !== undefined) {
      setIsLoading(false);
    }
  }, [allExperts]);

  return (
    <div className="">
      <div className="flex justify-between items-center py-2 border-b mb-4">
        <p>Slot {index + 1}</p>
        <button
          className="text-xs border px-2 py-1 rounded-md"
          onClick={handleRemoveSlot}
        >
          Remove Slot
        </button>
      </div>
      <div className="flex flex-col gap-6">
        <label htmlFor={`slot-startTime-${slot.index}`} className="label">
          <span className="label__text">
            Start Time
            <span className="text-red-500">*</span>
          </span>
          <input
            type="datetime-local"
            id={`slot-startTime-${slot.index}`}
            name="startTime"
            className="input"
            defaultValue={handleDateDefaultValue(slot.startTime)}
            onChange={handleSlotDataOnChange}
            min={getCurrentDateTime()}
            required
          />
        </label>
        <label htmlFor={`slot-endTime-${slot.index}`} className="label">
          <span className="label__text">
            End Time
            <span className="text-red-500">*</span>
          </span>
          <input
            type="datetime-local"
            id={`slot-endTime-${slot.index}`}
            name="endTime"
            className="input"
            defaultValue={handleDateDefaultValue(slot.endTime)}
            onChange={handleSlotDataOnChange}
            min={getCurrentDateTime()}
            required
          />
        </label>
        <label htmlFor={`slot-endTime-${slot.index}`} className="label">
          <span className="label__text">
            Slot name
            <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            id={`slot-topicName-${slot.index}`}
            name="topicName"
            className="input"
            defaultValue={slot.topicName}
            onChange={handleSlotDataOnChange}
            required
          />
        </label>
        <label htmlFor={`slot-price-${slot.index}`} className="label">
          <span className="label__text">
            Slot Price
            <span className="text-red-500">*</span>
          </span>
          <input
            type="number"
            id={`slot-price-${slot.index}`}
            name="price"
            className="input"
            defaultValue={slot.price}
            onChange={handleSlotDataOnChange}
            min={0}
            required
          />
        </label>
        {/* <label htmlFor={`slot-credits-${slot.index}`} className="label">
          <span className="label__text">Slot Credits</span>
          <span className="text-xs text-gray-400">
            Cost in terms of credits for communities to buy in bulk.
          </span>
          <input
            type="number"
            id={`slot-credits-${slot.index}`}
            name="credits"
            className="input"
            onChange={handleSlotDataOnChange}
            defaultValue={slot.credits}
            min={0}
            required
          />
        </label> */}
        <label
          htmlFor={`slot-participantLimit-${slot.index}`}
          className="label"
        >
          <span className="label__text">
            Participant Limit
            <span className="text-red-500">*</span>
          </span>
          <input
            type="number"
            id={`slot-participantLimit-${slot.index}`}
            name="participantLimit"
            className="input"
            defaultValue={slot.participantLimit}
            onChange={handleSlotDataOnChange}
            min={0}
            required
          />
        </label>

        <label
          className="label-checkbox"
          htmlFor={`slot-isOnline-${slot.index}`}
        >
          <input
            type="checkbox"
            id={`slot-isOnline-${slot.index}`}
            name="isOnline"
            checked={slot.isOnline}
            onChange={handleSlotDataOnChange}
          />
          <span className="label__text">Is the session online?</span>
          <span className="text-xs text-gray-400">
            Room ID will be generated
          </span>
        </label>
        {/* a set of radios which only redenr is session is online */}
        {slot.isOnline && (
          <>
            <label
              className="label-checkbox"
              htmlFor={`slot-isOnline-${slot.index}`}
            >
              <input
                type="checkbox"
                id={`slot-isOnline-${slot.index}`}
                name="isRecorded"
                checked={slot.isRecorded}
                onChange={handleSlotDataOnChange}
              />
              <span className="label__text">Is the session Prerecorded?</span>
            </label>
            {/* a string input field which takes in video url input is is recorded is clicked */}
            {slot.isRecorded && (
              <>
                <label
                  htmlFor={`slot-videoUrl-${slot.index}`}
                  className="label"
                >
                  <span className="label__text">
                    Video Link
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    id={`slot-videoUrl-${slot.index}`}
                    name="videoUrl"
                    className="input"
                    defaultValue={slot.videoUrl}
                    onChange={handleSlotDataOnChange}
                    required
                  />
                </label>
              </>
            )}

            <label
              className="label-checkbox"
              htmlFor={`slot-isOnline-${slot.index}`}
            >
              <input
                type="checkbox"
                id={`slot-isOnline-${slot.index}`}
                name="isLive"
                checked={slot.isLive}
                onChange={handleSlotDataOnChange}
              />
              <span className="label__text">Is the session Live?</span>
            </label>
          </>
        )}

        {slot.isOnline ? (
          <>
            {/* <label
              className="label-checkbox"
              htmlFor={`slot-isOnline-${slot.index}`}
            >
              <input
                type="checkbox"
                id={`slot-isOnline-${slot.index}`}
                name="isOnline"
                checked={slot.isOnline}
                onChange={handleSlotDataOnChange}
              />
              <span className="label__text">Is the session online?</span>
            </label> */}
            {/* <label
              className="label-checkbox"
              htmlFor={`slot-isCustomLink-${slot.index}`}
            >
              <input
                type="checkbox"
                id={`slot-isOnline-${slot.index}`}
                name="isCustomLink"
                checked={isCustomLink}
                onChange={() => handleCustomLink(index)}
              />
              <span className="label__text">
                Enable Automatic Link Generation?
              </span>
              <span className="text-xs text-gray-400">
                Room ID will be generated
              </span>
            </label>
            {!isCustomLink && (
              <label htmlFor={`slot-location-${slot.index}`} className="label">
                <span className="label__text">Gmeet/Zoom Link</span>
                <input
                  type="text"
                  id={`slot-location-${slot.index}`}
                  name="location"
                  defaultValue={slot.location}
                  className="input"
                  onChange={handleSlotDataOnChange}
                  required
                />
              </label>
            )} */}
          </>
        ) : (
          <>
            <label
              className="label-checkbox"
              htmlFor={`slot-isOnline-${slot.index}`}
            >
              {/* <input
                type="checkbox"
                id={`slot-isOnline-${slot.index}`}
                name="isOnline"
                checked={slot.isOnline}
                onChange={handleSlotDataOnChange}
              />
              <span className="label__text">Is the session online?</span>
              <span className="text-xs text-gray-400">
                If the session is online, link would be automatically generated
              </span> */}
            </label>
            <label htmlFor={`slot-location-${slot.index}`} className="label">
              <span className="label__text">
                Location
                <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                id={`slot-location-${slot.index}`}
                name="location"
                defaultValue={slot.location}
                className="input"
                onChange={handleSlotDataOnChange}
                required
              />
            </label>
          </>
        )}

        <label htmlFor={`slot-speakers-${slot.index}`} className="label">
          <span className="label__text">Speakers</span>
          <p>Startup Mahakumbh OC</p>
          <select
            className="input"
            name="speakerId"
            id={`slot-speakers-${slot.index}`}
            value={slot.speakerId}
            onChange={handleSlotDataOnChange}
            disabled={isLoading}
          >
            <option value={null}>
              {isLoading ? "Loading experts..." : "Select Speaker"}
            </option>
            {(() => {
              // Debug logging
              console.log('allExperts:', allExperts);
              console.log('allExperts type:', typeof allExperts);
              console.log('isArray:', Array.isArray(allExperts));
              console.log('isLoading:', isLoading);
              
              // Safe filtering and mapping
              if (!isLoading && allExperts && Array.isArray(allExperts)) {
                const filteredExperts = allExperts.filter((item) => 
                  item && item.name && item.name.trim() !== ""
                );
                console.log('filteredExperts:', filteredExperts);
                return filteredExperts.map((item, index) => (
              <option value={item.id} key={`speaker-${index + 1}`}>
                {item.name}
              </option>
                ));
              }
              return null;
            })()}
          </select>
        </label>
      </div>
    </div>
  );
}

export default SlotForm;
