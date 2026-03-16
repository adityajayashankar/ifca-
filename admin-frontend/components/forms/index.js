import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

const PartnerFormResponses = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = useSelector(selectUser);
  const creatorId = user?.unifiedUser?.id;
  const router = useRouter();
  const { communityId } = router.query;

  const formDeleteHandler = async (formId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this form?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/forms/${formId}`);
      toast.success("Form Deleted Successfully");
      setData((prevData) => prevData.filter((form) => form.formId !== formId));
    } catch (error) {
      console.error("Error deleting form:", error);
    }
  };

  useEffect(() => {
    const fetchFormResponses = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/forms/community/${communityId}`);
        setData(response?.data?.forms);
      } catch (error) {
        console.error("Error fetching responses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (creatorId) {
      fetchFormResponses();
    }
  }, [creatorId]);

  const handleCreateForm = () => {
    router.push({
  pathname: '/partner/forms/create',
  query: { communityId },
});
  };

  const handleViewResponses = (formId) => {
    router.push(`/partner/forms/viewResponses/${formId}`);
  };

  const handleFormView = (formId) => {
    router.push(`/partner/forms/create/${formId}`);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <p className="text-3xl font-bold">Forms</p>
        <button
          onClick={handleCreateForm}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mr-4 mt-4"
        >
          Create New Form
        </button>
      </div>
      <hr className="border-gray-300" />

      {loading ? (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data && data.length > 0 ? (
            data.map((item) => (
              <div
                key={item.formId}
                className="flex flex-row items-center justify-between rounded-lg border border-gray-300 bg-white p-3 shadow-sm"
              >
                <p className="text-lg font-semibold">{item.formName}</p>

                <div className="flex flex-row items-center gap-3 ml-auto">
                  <a
                    onClick={() => handleViewResponses(item.formId)}
                    className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 cursor-pointer mr-4"
                  >
                    View Responses <LaunchOutlinedIcon className="text-xs text-blue-600" />
                  </a>

                  <button
                    onClick={() => handleFormView(item.formId)}
                    className="bg-primary-500 rounded px-3 py-1 text-sm font-semibold text-white hover:bg-blue-600 transition"
                  >
                    View
                  </button>

                  <button
                    onClick={() => formDeleteHandler(item.formId)}
                    className="cursor-pointer bg-red-500 rounded px-3 py-1 text-sm font-semibold text-white hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No forms available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PartnerFormResponses;
