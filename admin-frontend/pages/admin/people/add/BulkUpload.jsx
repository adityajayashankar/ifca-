import { useState } from "react";
import axios from "axios";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";

const BulkUpload = () => {
    const [file, setFile] = useState(null);
    const [userType, setUserType] = useState("user");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split("\n");
            const headers = lines[0].split(",").map(header => header.trim().replace(/\r$/, ""));
            console.log(headers);
            const requiredHeaders = ["email", "password", "name", "phone", "address", "pincode", "photoURL"];
            const isValid = requiredHeaders.every(header => headers.includes(header));

            if (!isValid) {
                setMessage("Invalid file format. Required headers: email, password, name, phone, address, pincode, photoURL");
                setFile(null);
            } else {
                setMessage("")
                setFile(file);
            }
        };

        reader.readAsText(file);
        setFile(event.target.files[0]);
    };

    const handleUserTypeChange = (event) => {
        setUserType(event.target.value);
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select a file.");
            return;
        }

        setLoading(true);
        setMessage("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userType", userType);

        try {
            const response = await api.post("/auth/bulk-upload", formData, {
                headers: { 
                    "Content-Type": "multipart/form-data"
                }
            });

            toast.success(`${response.data.message} ${response.data.count} users created.`);
            setFile(null);
        } catch (error) {
            setMessage(error.response?.data?.message || "Error uploading file.");
            console.error('Upload error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center  ">
            <div className="bg-white rounded-lg w-96">
                <h2 className="text-lg font-semibold mb-4">Bulk User Upload</h2>

                {/* User Type Dropdown */}
                <label className="block mb-2 text-sm font-medium text-gray-700">Select User Type:</label>
                <select
                    value={userType}
                    onChange={handleUserTypeChange}
                    className="w-full p-2 border rounded mb-4"
                >
                    <option value="user">User</option>
                    <option value="partner">Partner</option>
                    <option value="admin">Admin</option>
                    <option value="expert">Expert</option>
                </select>

                <input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={handleFileChange}
                    className="w-full p-2 border rounded mb-4"
                />

                {message && <div className="text-red-500 mb-4">{message}</div>}
                {/* Upload Button */}
                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className={`w-full p-2 text-white font-medium rounded ${loading ? "bg-gray-400" : "bg-primary-500 hover:bg-blue-600"}`}
                >
                    {loading ? "Uploading..." : "Upload"}
                </button>

                {/* Response Message */}
                {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}
            </div>
        </div>
    );
};

export default BulkUpload;
