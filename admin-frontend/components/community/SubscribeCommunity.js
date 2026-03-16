import React, { useEffect, useRef, useState } from "react";
import { unparse, parse } from "papaparse";
import { useRouter } from "next/router";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";

const SubscriptionForm = ({ baseURL, community, amount }) => {
  const formRef = useRef();
  const router = useRouter();
  let initObj = {
    category: "weekly",
    communityId: community.id,
    startsAt: Date.now(),
    expiresAt: Date.now(),
    transactionId: "aslcacmk",
    paymentId: "acnasj",
    amount,
    users: [],
  };
  const [subscriptionForm, setSubscriptionForm] = useState(initObj);
  const [uploadStatus, setUploadStatus] = useState({
    success: false,
    error: null,
  });

  const handleDiscardChanges = (e) => {
    e.preventDefault();
    router.replace(`/${baseURL}/community`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(subscriptionForm);
    api.post(`/pay/subscription/bulk`, subscriptionForm).then((res) => {
      if (res.data) {
        console.log(res.data);
        toast("Successfully created!", { type: "success" });
        router.replace(`/${baseURL}/community`);
      }
    });
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.name === "startsAt" || e.target.name === "expiresAt") {
      setSubscriptionForm((prev) => ({
        ...prev,
        [e.target.name]: new Date(e.target.value),
      }));
    } else {
      setSubscriptionForm((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    }
  };

  const downloadTemplate = (e) => {
    e.preventDefault();
    let sample = [
      {
        name: "rachel",
        email: "rachel@friends.xl",
        phone: "9766521519",
        role: "expert",
      },
      {
        name: "harvey",
        email: "harvey@suits.2xl",
        phone: "7655678990",
        role: "user",
      },
    ];
    const sample_csv = unparse(sample);
    const sample_csv_blob = new Blob([sample_csv], {
      type: "text/csv;charset=utf-8;",
    });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(sample_csv_blob);
    element.download = `sample_subscription.csv`;
    document.body.appendChild(element);
    element.click();
  };

  const handleUpload = (e) => {
    e.preventDefault();
    setUploadStatus({ success: false, error: null });
    parse(e.target.files[0], {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        let expected_keys = ["name", "email", "phone", "role"];
        let keys = result.meta.fields;
        let successD = true;
        expected_keys.every((item) => {
          if (!keys.find((ele) => ele === item)) {
            setUploadStatus({
              success: false,
              error: "Error uploading;Check file format",
            });
            successD = false;
            return false;
          }
          return true;
        });

        if (successD) {
          setUploadStatus({ success: true, error: null });
        }
        setSubscriptionForm((prev) => ({ ...prev, users: result.data }));
      },
    });
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
            <p className="text-gray-400">
              Upload user details in the format mentioned in the sample file
            </p>
          </div>

          <label htmlFor="title" className="label">
            <span className="label__text">Community Name</span>
            <input
              type="text"
              id="title"
              name="title"
              className="input"
              required
              defaultValue={community.title}
              readOnly={true}
            />
          </label>
          {/* <label htmlFor='category' className='label'>
                        <span className='label__text'>Select Category</span>
                        Get partner communities
                        <select
                        className='select'
                        name='category'
                        onChange={handleChange}>
                        <option value='weekly'>Weekly</option>
                    </select>
                    </label> */}
          <label htmlFor="title" className="label">
            <span className="label__text">{"Amount per user (/mo)"}</span>
            <input
              type="number"
              id="title"
              name="title"
              className="input"
              value={amount}
              readOnly={true}
            />
          </label>

          <label htmlFor="title" className="label">
            <span className="label__text">{"Subscription starts At"}</span>
            <input
              type="datetime-local"
              id="title"
              name="startsAt"
              className="input"
              defaultValue={subscriptionForm.startsAt}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="title" className="label">
            <span className="label__text">{"Subscription expires At"}</span>
            <input
              type="datetime-local"
              id="title"
              name="expiresAt"
              className="input"
              defaultValue={subscriptionForm.expiresAt}
              onChange={handleChange}
            />
          </label>
          <div className="flex w-full items-center justify-evenly my-4">
            {!uploadStatus.success ? (
              <label>
                Upload CSV document
                <input
                  type={"file"}
                  name="users"
                  onChange={handleUpload}
                  accept=".csv"
                />
              </label>
            ) : (
              <button className="btn btn-green">Successfully uploaded</button>
            )}
            <button className="btn btn-pink" onClick={downloadTemplate}>
              Download Sample Doc
            </button>
          </div>
        </div>
        {
          <div className="flex flex-row flex-wrap gap-2" type="submit">
            <button className="button button-blue flex-1">
              Create Subscriptions
            </button>

            <button
              className="button button-blue flex-1"
              onClick={handleDiscardChanges}
            >
              Discard Changes
            </button>
          </div>
        }
      </form>
    </div>
  );
};

export default SubscriptionForm;
