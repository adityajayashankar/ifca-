import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import api from '@/utils/apiSetup';
import {
  Edit as EditIcon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  Save as SaveIcon,
  AttachMoney as MoneyIcon,
  Percent as PercentIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import { motion } from 'framer-motion';
import UploadImage from '@/components/UploadImage';

const EditCourse = () => {
  const router = useRouter();
  const { id } = router.query;
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState({
    name: '',
    description: '',
    price: 0,
    discount: 0,
    status: 'active'
  });

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/course/courses/${id}`);
      setCourse(response.data);
    } catch (error) {
      console.error('Failed to fetch course:', error);
      alert('Failed to fetch course details');
      router.push('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...course,
        creatorId: user?.unifiedUser?.id
      };
      
      await api.put(`/course/courses/${id}`, payload);
      router.push(`/admin/courses/${id}`);
    } catch (error) {
      console.error('Failed to update course:', error);
      alert('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 py-3 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <HomeIcon className="w-4 h-4" />
          </button>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          <span className="hover:text-orange-600 cursor-pointer" onClick={() => router.push('/admin/courses')}>Courses</span>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">Edit Course</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center w-full px-4 py-8 overflow-auto">
        <div className="mb-10 flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight flex items-center gap-3">
            <EditIcon className="text-orange-500 text-5xl" />
            Edit Course
          </h1>
          <p className="text-lg text-gray-500 font-medium">Update the course details below</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-0 w-full max-w-xl overflow-auto">
          <form onSubmit={handleSubmit} className="space-y-6 p-8">
            {/* Course Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Course Name</label>
              <input
                type="text"
                value={course.name}
                onChange={(e) => setCourse(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter course name"
                required
              />
            </div>

            {/* Course Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={course.description}
                onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px]"
                placeholder="Enter course description"
                required
              />
            </div>

            {/* Price and Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MoneyIcon className="text-orange-500" /> Price
                </label>
                <input
                  type="number"
                  value={course.price}
                  onChange={(e) => setCourse(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter course price"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <PercentIcon className="text-orange-500" /> Discount
                </label>
                <input
                  type="number"
                  value={course.discount}
                  onChange={(e) => setCourse(prev => ({ ...prev, discount: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter discount percentage"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={course.status}
                onChange={(e) => setCourse(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                  saving ? 'bg-orange-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600'
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    Update Course
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCourse; 