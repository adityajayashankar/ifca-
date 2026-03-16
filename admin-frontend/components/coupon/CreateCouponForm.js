import { selectPartner } from "@/store/features/partnerSlice";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const CreateCouponForm = ({
  isEdit,
  sessionId,
  communityId,
  name,
  cb,
  preObj,
}) => {
  const formRef = useRef();
  const router = useRouter();
  const initObj = {
    code: "",
    discountRate: 0,
  };
  const [couponForm, setCouponForm] = useState(preObj || initObj);

  useEffect(() => {
    if (sessionId) {
      setCouponForm((prev) => ({ ...prev, sessionId: parseInt(sessionId) }));
    }

    if (communityId) {
      setCouponForm((prev) => ({
        ...prev,
        communityId: parseInt(communityId),
      }));
    }
  }, []);
  const handleChange = (e) => {
    setCouponForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleClearForm = (e) => {
    e?.preventDefault();
    formRef.current.reset();
    setCouponForm(initObj);
  };
  const handleDiscardChanges = (e) => {
    e?.preventDefault();
    if (sessionId) {
      router.replace(`/admin/session/${sessionId}`);
    }
    if (communityId) {
      router.replace(`/admin/community/${sessionId}`);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEdit) {
      api.post(`/coupon`, couponForm).then((res) => {
        toast(`Coupon Created..`);
        handleClearForm();
        handleDiscardChanges();
        cb();
      });
    }
  };

  return (
    <div className="createsessionform__container">
      <form
        className="createsessionform__form"
        method="POST"
        ref={formRef}
        onSubmit={handleSubmit}
      >
        <div className="input__group">
          <div className="input__group__header">
            <p>{`Create Coupon For name`}</p>
          </div>

          <label htmlFor="code" className="label">
            <span className="label__text">Coupon Code</span>
            <span className="label__text text-sm text-gray-400">
              Create a short one for ease of use
            </span>
            <input
              type="text"
              id="code"
              name="code"
              className="input"
              required
              defaultValue={couponForm.code}
              readOnly={isEdit}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="asset" className="label">
            <span className="label__text">
              {sessionId ? "Session" : "Community"}
            </span>
            <input
              type="text"
              id="asset"
              name="asset"
              className="input"
              readOnly
              defaultValue={name}
            />
          </label>
          <label htmlFor="discountRate" className="label">
            <span className="label__text">Discount Rate</span>
            <input
              type="number"
              id="discountRate"
              name="discountRate"
              min={0}
              className="input"
              required
              readOnly={isEdit}
              defaultValue={couponForm.discountRate}
              onChange={handleChange}
            />
          </label>
        </div>
        {isEdit && (
          <div className="flex flex-row flex-wrap gap-2" type="submit">
            <button className="button button-blue flex-1">Edit Coupon</button>

            <button
              className="button button-blue flex-1"
              onClick={handleDiscardChanges}
            >
              Discard Changes
            </button>
          </div>
        )}
        {!isEdit && (
          <div className="flex flex-row flex-wrap gap-2" type="submit">
            <button className="button button-blue flex-1">Create Coupon</button>

            <button
              className="button button-blue flex-1"
              onClick={handleClearForm}
            >
              Reset Form
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateCouponForm;
