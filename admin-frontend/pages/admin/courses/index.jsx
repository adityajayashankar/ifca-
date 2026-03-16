import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '@/utils/apiSetup';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Book as BookIcon,
  People as PeopleIcon,
  AccessTime as TimeIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  Sort as SortIcon,
  Sync as SyncIcon,
  Link as LinkIcon,
  School as SchoolIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectAllCommunities } from '@/store/features/communitySlice';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { selectUser } from '@/store/features/userSlice';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [moodleCourses, setMoodleCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const communities = useSelector(selectAllCommunities);
  const user = useSelector(selectUser);
  const [filter, setFilter] = useState('all');
  const [communityMappings, setCommunityMappings] = useState({});
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [sort, setSort] = useState('az');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'moodle', 'mapped'
  const [syncStatus, setSyncStatus] = useState(null);
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [mappingForm, setMappingForm] = useState({
    price: '',
    discount: '',
    communityId: null
  });
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingError, setMappingError] = useState(null);
  const [mappingSuccess, setMappingSuccess] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [allCoursesMapped, setAllCoursesMapped] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchMoodleCourses();
  }, []);

  useEffect(() => {
    // Check if all Moodle courses are mapped
    const mappedMoodleIds = Array.isArray(courses) ? courses.map(course => course.moodleCourseId) : [];
    const allMapped = Array.isArray(moodleCourses) && moodleCourses.length > 0
      ? moodleCourses.every(course => mappedMoodleIds.includes(course.id))
      : false;
    setAllCoursesMapped(allMapped);
  }, [courses, moodleCourses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/course/courses');
      setCourses(response.data);
    } catch (error) {
      alert('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodleCourses = async () => {
    try {
      const response = await api.get('/course/courses/moodle');
      setMoodleCourses(response.data);
    } catch (error) {
      alert('Failed to fetch Moodle courses');
    }
  };

  const handleSyncCourses = async () => {
    try {
      setLoadingAdd(true);
      const response = await api.get('/course/sync-courses');
      setSyncStatus(response.data);
      await fetchCourses();
      alert('Courses synced successfully');
    } catch (error) {
      alert('Failed to sync courses');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleRemoveAllRegistrations = async (courseId) => {
    if (!window.confirm('Are you sure you want to remove all registrations for this course?')) {
      return;
    }

    try {
      setLoadingAdd(true);
      await api.delete(`/course/courses/${courseId}/registrations`);
      alert('All registrations removed successfully');
      await fetchCourses();
    } catch (error) {
      alert('Failed to remove registrations');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleMapCourse = async () => {
    if (!selectedCourse) {
      setMappingError('Please select a course');
      return;
    }

    // Validate price if provided
    if (mappingForm.price && (isNaN(mappingForm.price) || parseFloat(mappingForm.price) < 0)) {
      setMappingError('Please enter a valid price');
      return;
    }

    // Validate discount if provided
    if (mappingForm.discount && (isNaN(mappingForm.discount) || parseFloat(mappingForm.discount) < 0 || parseFloat(mappingForm.discount) > 100)) {
      setMappingError('Please enter a valid discount percentage (0-100)');
      return;
    }

    try {
      setMappingLoading(true);
      setMappingError(null);
      setMappingSuccess(false);

      const response = await api.post('/course/courses/map', {
        courses: [{
          moodleCourseId: parseInt(selectedCourse.id),
          price: parseFloat(mappingForm.price) || 0,
          discount: parseFloat(mappingForm.discount) || 0,
          creatorId: parseInt(user.unifiedUser.id),
          communityId: mappingForm.communityId ? parseInt(mappingForm.communityId) : null
        }]
      });

      if (response.data.results?.errors?.length > 0) {
        const error = response.data.results.errors[0];
        setMappingError(error.error || 'Failed to map course');
        return;
      }

      // Update the course's mapped status
      setMoodleCourses(prev => prev.map(course => 
        course.id === parseInt(selectedCourse.id) 
          ? { ...course, mapped: true }
          : course
      ));

      setMappingSuccess(true);
      
      // Close modal and reset form after a short delay
      setTimeout(() => {
        setIsModalVisible(false);
        setSelectedCourse(null);
        setMappingForm({
          price: '',
          discount: '',
          communityId: null
        });
        setMappingSuccess(false);
      }, 1500);

      // Refresh courses
      await fetchCourses();
    } catch (error) {
      console.error('Error mapping course:', error);
      setMappingError(error.response?.data?.error || error.message || 'Failed to map course');
    } finally {
      setMappingLoading(false);
    }
  };

  const handleOpenMappingModal = (course) => {
    setSelectedCourse(course);
    setMappingForm({
      price: '',
      discount: '',
      communityId: null
    });
    setMappingError(null);
    setMappingSuccess(false);
    setIsModalVisible(true);
  };

  // Filtering, searching, and sorting logic
  const filterAndSortCourses = (arr, isMoodle = false) => {
    let filtered = Array.isArray(arr) ? arr : [];
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(course => (course.status || '').toLowerCase() === filter);
    }
    // Search by name or description
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(course =>
        (course.name || course.fullname || '').toLowerCase().includes(term) ||
        (course.description || course.summary || '').toLowerCase().includes(term)
      );
    }
    // Sort
    if (sort === 'az') {
      filtered = filtered.sort((a, b) => (a.name || a.fullname || '').localeCompare(b.name || b.fullname || ''));
    } else if (sort === 'za') {
      filtered = filtered.sort((a, b) => (b.name || b.fullname || '').localeCompare(a.name || a.fullname || ''));
    } else if (sort === 'communities') {
      filtered = filtered.sort((a, b) => (b.communities?.length || 0) - (a.communities?.length || 0));
    }
    return filtered;
  };

  const displayedCourses = filterAndSortCourses(courses);
  const displayedMoodleCourses = filterAndSortCourses(moodleCourses, true);
  const displayedMappedCourses = filterAndSortCourses(courses.filter(course => course.moodleCourseId));

  const CourseCard = ({ course, type = 'local' }) => (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="relative">
        {course?.image ? 
        <img src={course.image} alt={course.name} className="w-full h-32 object-cover" />
        :
        <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
          <SchoolIcon className="w-12 h-12 text-white" />
        </div>}
        {type === 'moodle' && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Moodle
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1">
          {course.name || course.fullname}
        </h3>
        
        <div className="text-xs text-gray-600 h-8 line-clamp-2 mb-2" dangerouslySetInnerHTML={{ __html: course.description || course.summary || 'No description available' }}></div>
        
        {/* Price and Discount Information */}
        {course.price !== undefined && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-800">₹{course.price}</span>
            {course.discount > 0 && (
              <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                {course.discount}% off
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <div className="flex items-center gap-1">
            <PeopleIcon className="w-3 h-3" />
            <span>{course.communities?.length || 0} Communities</span>
          </div>
          <div className="flex items-center gap-1">
            <TimeIcon className="w-3 h-3" />
            <span>{new Date(course.updatedAt || course.timemodified).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${course.status === 'active' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
            {course.status || 'Unknown'}
          </span>

          <div className="flex gap-1.5">
            {type === 'moodle' && !course.mapped && (
              <button
                onClick={() => handleOpenMappingModal(course)}
                className="bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 rounded text-xs transition-colors duration-200"
              >
                Map Course
              </button>
            )}
            {type === 'local' && (
              <>
                <button
                  onClick={() => router.push(`/admin/courses/${course.id}`)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-0.5 rounded text-xs transition-colors duration-200"
                >
                  View Details
                </button>
                <button
                  onClick={() => router.push(`/admin/courses/edit/${course.id}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-xs transition-colors duration-200"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <HomeIcon className="w-4 h-4" />
          </button>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">Courses</span>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4">
        {/* Tabs - Only show if not all courses are mapped */}
        {!allCoursesMapped && (
          <div className="flex space-x-4 mb-6 mt-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Courses
            </button>
            <button
              onClick={() => setActiveTab('moodle')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'moodle' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Moodle Courses
            </button>
            <button
              onClick={() => setActiveTab('mapped')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'mapped' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Mapped Courses
            </button>
          </div>
        )}

        {/* Search and Actions Card */}
        <div className="bg-white rounded-xl shadow-sm px-6 py-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 md:items-center flex-1">
              <h2 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
                <SchoolIcon className="text-orange-500 text-3xl" />
                {allCoursesMapped ? 'All Courses' : 
                 activeTab === 'all' ? 'All Courses' : 
                 activeTab === 'moodle' ? 'Moodle Courses' : 'Mapped Courses'}
              </h2>
              
              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="text-gray-400 text-xl" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Sort and Filter */}
              <div className="flex items-center gap-2">
                <SortIcon className="text-xl text-gray-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
                >
                  <option value="az">A-Z</option>
                  <option value="za">Z-A</option>
                  <option value="communities">Most Communities</option>
                </select>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-white font-medium transition-colors ${loadingAdd ? 'cursor-not-allowed bg-orange-400' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600'}`}
                disabled={loadingAdd}
                onClick={() => router.push('/admin/courses/create')}
                type="button"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center">
                  {loadingAdd ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <AddIcon className="text-lg" />
                      <span>Add Course</span>
                    </>
                  )}
                </span>
              </motion.button>

              {/* Only show sync button if not all courses are mapped */}
              {!allCoursesMapped && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-white font-medium transition-colors bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600"
                  onClick={handleSyncCourses}
                  type="button"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                  <span className="relative flex items-center justify-center">
                    <SyncIcon className="text-lg" />
                    <span>Sync Courses</span>
                  </span>
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Sync Status */}
        {syncStatus && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">Sync Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800 font-medium">Added: {syncStatus.results.added}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800 font-medium">Updated: {syncStatus.results.updated}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-800 font-medium">Skipped: {syncStatus.results.skipped}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-red-800 font-medium">Errors: {syncStatus.results.errors.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Course Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {allCoursesMapped ? (
              displayedCourses.map(course => (
                <CourseCard key={course.id} course={course} type="local" />
              ))
            ) : (
              <>
                {activeTab === 'all' && displayedCourses.map(course => (
                  <CourseCard key={course.id} course={course} type="local" />
                ))}
                {activeTab === 'moodle' && displayedMoodleCourses.map(course => (
                  <CourseCard key={course.id} course={course} type="moodle" />
                ))}
                {activeTab === 'mapped' && displayedMappedCourses.map(course => (
                  <CourseCard key={course.id} course={course} type="local" />
                ))}
              </>
            )}
            {((allCoursesMapped && courses.length === 0) ||
              (!allCoursesMapped && (
                (activeTab === 'all' && courses.length === 0) ||
                (activeTab === 'moodle' && moodleCourses.length === 0) ||
                (activeTab === 'mapped' && courses.filter(c => c.moodleCourseId).length === 0)
              ))) && (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4">
                <BookIcon className="text-orange-400 text-5xl mb-2" style={{ fontSize: 48 }} />
                <p className="text-gray-500 text-lg font-semibold">No courses found</p>
                <p className="text-gray-400 mb-2">Try adjusting your search or add a new course.</p>
                <button
                  onClick={() => router.push('/admin/courses/create')}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 mt-2"
                >
                  + Add New Course
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mapping Modal */}
        {isModalVisible && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Map Course</h2>
                <button 
                  onClick={() => {
                    setIsModalVisible(false);
                    setSelectedCourse(null);
                    setMappingForm({
                      price: '',
                      discount: '',
                      communityId: null
                    });
                    setMappingError(null);
                    setMappingSuccess(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CloseIcon />
                </button>
              </div>

              {selectedCourse && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Course Details</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">Name: {selectedCourse.fullname || selectedCourse.name}</p>
                        <p className="text-sm text-gray-600">ID: {selectedCourse.id}</p>
                        {selectedCourse.summary && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{selectedCourse.summary}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Price Settings</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                          <input
                            type="number"
                            value={mappingForm.price}
                            onChange={(e) => {
                              setMappingForm(prev => ({ ...prev, price: e.target.value }));
                              setMappingError(null);
                            }}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Enter price (optional)"
                            min="0"
                          />
                          <p className="mt-1 text-xs text-gray-500">Leave empty for free course</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
                          <input
                            type="number"
                            value={mappingForm.discount}
                            onChange={(e) => {
                              setMappingForm(prev => ({ ...prev, discount: e.target.value }));
                              setMappingError(null);
                            }}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Enter discount percentage (optional)"
                            min="0"
                            max="100"
                          />
                          <p className="mt-1 text-xs text-gray-500">Enter a value between 0 and 100</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {mappingError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                      {mappingError}
                    </div>
                  )}

                  {mappingSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                      Course mapped successfully!
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsModalVisible(false);
                        setSelectedCourse(null);
                        setMappingForm({
                          price: '',
                          discount: '',
                          communityId: null
                        });
                        setMappingError(null);
                        setMappingSuccess(false);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMapCourse}
                      disabled={mappingLoading}
                      className={`px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 ${
                        mappingLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {mappingLoading ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Mapping...
                        </div>
                      ) : (
                        'Map Course'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage; 
