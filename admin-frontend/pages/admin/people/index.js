import {
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Paper,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material"
import { DataGrid } from "@mui/x-data-grid"
import { selectAllUsers, setAllUsers } from "@/store/features/userSlice"
import { selectUser } from "@/store/features/userSlice"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import AddIcon from "@mui/icons-material/Add"
import PersonIcon from "@mui/icons-material/Person"
import EditIcon from "@mui/icons-material/Edit"
import VisibilityIcon from "@mui/icons-material/Visibility"
import SearchIcon from "@mui/icons-material/Search"
import SortIcon from "@mui/icons-material/Sort"
import HomeIcon from "@mui/icons-material/Home"
import NavigateNextIcon from "@mui/icons-material/NavigateNext"

import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import FileDownloadIcon from "@mui/icons-material/FileDownload"
import { motion } from "framer-motion"
import api from "@/utils/apiSetup"
import * as XLSX from 'xlsx'
import { toast } from "react-toastify" 

const PeoplePage = () => {
  const router = useRouter()
  const users = useSelector(selectAllUsers)
  const loadingRef = useRef(false)
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("az")
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [activeTab, setActiveTab] = useState(0) 
  const [enableDialog, setEnableDialog] = useState({ open: false, userId: null, userName: "" })
  const [enablingUser, setEnablingUser] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [isUserLoaded, setIsUserLoaded] = useState(false)

  useEffect(() => {
    // Check if user is loaded and has the correct structure
    if (user && (user.id || user.unifiedUser?.id)) {
      const userId = user.id || user.unifiedUser?.id;
      if (!loadingRef.current) {
        dispatch(setAllUsers(userId))
        loadingRef.current = true
      }
      setIsUserLoaded(true)
    }
  }, [router, user, dispatch])

  
  // Show loading if user is not loaded yet
  if (!isUserLoaded || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-170px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    )
  }

  const activeUsers = users?.activeUsers || []
  const disabledUsers = users?.disabledUsers || []
  const currentUsers = activeTab === 0 ? activeUsers : disabledUsers

  const filtered = currentUsers
    .filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const nameA = a.name?.toLowerCase().trim() || ""
      const nameB = b.name?.toLowerCase().trim() || ""

      if (sort === "az") return nameA.localeCompare(nameB)
      if (sort === "za") return nameB.localeCompare(nameA)
      if (sort === "recent") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sort === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      return 0
    })

  const handleAddUser = () => {
    setLoadingAdd(true)
    setTimeout(() => {
      setLoadingAdd(false)
      router.push("/admin/people/add")
    }, 400)
  }

  const handleSectionChange = (section) => {
    setActiveTab(section === "active" ? 0 : 1)
  }

  const handleEnableClick = (userId, userName) => {
    setEnableDialog({ open: true, userId, userName })
  }

  const handleEnableConfirm = async () => {
    const { userId } = enableDialog
    setEnablingUser(userId)

    try {
      
      const res = await api.patch(`/user/${userId}/enable`)

      if (res.status === 200 || res.status === 204) {
        const userId = user?.id || user?.unifiedUser?.id;
        if (userId) {
          dispatch(setAllUsers(userId))
        }
      } else {
        console.error("Failed to enable user")
      }
    } catch (error) {
      console.error("Error enabling user:", error)
    } finally {
      setEnablingUser(null)
      setEnableDialog({ open: false, userId: null, userName: "" })
    }
  }

  const handleEnableCancel = () => {
    setEnableDialog({ open: false, userId: null, userName: "" })
  }

  const exportToExcel = () => {
    setExporting(true);
    try {
      const exportData = currentUsers.map((user, index) => {
        const createdAt = new Date(user.createdAt);
        const updatedAt = new Date(user.updatedAt);
        const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
        return {
          'SL No': index + 1,
          'User Name': user.name || 'N/A',
          'Email': user.email || 'N/A',
          'Phone': user.phone || 'N/A',
          'Address': user.location || user.address || 'N/A',
          'City': user.city || 'N/A',
          'State': user.state || 'N/A',
          'Pincode': user.pincode || 'N/A',
          'Role': user.role || 'user',
          'Status': user.isActive ? 'Active' : 'Inactive',
          'Gender': user.gender || 'N/A',
          'Age': user.age || 'N/A',
          'Occupation': user.occupation || 'N/A',
          'Education': user.education || 'N/A',
          'Communities': user.statistics?.communities?.total || 0,
          'Sessions': user.statistics?.sessions?.total || 0,
          'Last Login Date': lastLogin ? lastLogin.toLocaleDateString() : 'Never',
          'Last Login Time': lastLogin ? lastLogin.toLocaleTimeString() : 'N/A',
          'Joined Date': createdAt.toLocaleDateString(),
          'Joined Time': createdAt.toLocaleTimeString(),
          'Last Updated Date': updatedAt.toLocaleDateString(),
          'Last Updated Time': updatedAt.toLocaleTimeString(),
          'Profile Completion': user.profileCompletion || 'N/A',
          'Login Count': user.loginCount || 0,
        };
      });
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 8 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, `${activeTab === 0 ? 'Active' : 'Inactive'} Users`);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `users_${activeTab === 0 ? 'active' : 'inactive'}_${timestamp}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success('Users data exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  }

  const columns = [
    {
      field: "id",
      headerName: "SL",
      width: 60,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "name",
      headerName: "User Profile",
      width: 280,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            src={params.row.photo}
            alt={params.row.name}
            sx={{
              width: 36,
              height: 36,
              bgcolor: params.row.isActive ? "green.100" : "red.100",
              color: params.row.isActive ? "green.700" : "red.700",
            }}
          >
            <PersonIcon fontSize="small" />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontWeight: 600, fontSize: "14px", color: "text.primary" }}>
              {params.row.name || "No Name"}
            </Typography>
            <Typography noWrap sx={{ fontSize: "12px", color: "text.secondary" }}>
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 130,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
          {params.row.phone || "N/A"}
        </Typography>
      ),
    },
    {
      field: "address",
      headerName: "Location",
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography sx={{ fontSize: "12px", color: "text.primary", fontWeight: 500 }}>
            {params.row.address || "N/A"}
          </Typography>
          <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>
            {params.row.city && params.row.state ? `${params.row.city}, ${params.row.state}` : "N/A"}
          </Typography>
          <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
            PIN: {params.row.pincode || "N/A"}
          </Typography>
        </Box>
      ),
    },

    {
      field: "communities",
      headerName: "Communities",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "orange.700" }}>
            {params.row.statistics?.communities?.total || 0}
          </Typography>
          <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
            Total
          </Typography>
        </Box>
      ),
    },
    {
      field: "sessions",
      headerName: "Sessions",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "green.700" }}>
            {params.row.statistics?.sessions?.total || 0}
          </Typography>
          <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
            Total
          </Typography>
        </Box>
      ),
    },

    {
      field: "createdAt",
      headerName: "Joined",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const date = new Date(params.row.createdAt);
        return (
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: "12px", color: "text.primary" }}>
              {date.toLocaleDateString()}
            </Typography>
            <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "updatedAt",
      headerName: "Last Updated",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const date = new Date(params.row.updatedAt);
        return (
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: "12px", color: "text.primary" }}>
              {date.toLocaleDateString()}
            </Typography>
            <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: activeTab === 1 ? 180 : 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => router.push(`/admin/people/${params.row.userId}`)}
              sx={{
                color: "orange.700",
                "&:hover": {
                  bgcolor: "orange.50",
                },
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit User">
            <IconButton
              size="small"
              onClick={() => router.push(`/admin/people/add/${params.row.userId}`)}
              sx={{
                color: "orange.700",
                "&:hover": {
                  bgcolor: "orange.50",
                },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {activeTab === 1 && (
            <Tooltip title="Enable User">
              <IconButton
                size="small"
                onClick={() => handleEnableClick(params.row.userId, params.row.name)}
                disabled={enablingUser === params.row.userId}
                sx={{
                  color: "green.700",
                  "&:hover": {
                    bgcolor: "green.50",
                  },
                  "&:disabled": {
                    color: "gray.400",
                  },
                }}
              >
                {enablingUser === params.row.userId ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <CheckCircleIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ]

 
  const rows =
    filtered?.map((user, index) => ({
      id: index + 1,
      userId: user.id,
      photo: user.photoURL,
      name: user.name,
      phone: user.phone,
      email: user.email,
      address: user.location || user.address || "N/A",
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      role: user.role || "user",
      isActive: user.isActive !== false, // Default to true if not explicitly false
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      statistics: user.statistics || {
        communities: { total: 0, created: 0, subscribed: 0 },
        sessions: { total: 0, attended: 0, hosted: 0 }
      },
      // Additional user details
      gender: user.gender,
      age: user.age,
      occupation: user.occupation,
      education: user.education,
      interests: user.interests,
      bio: user.bio,
      socialLinks: user.socialLinks,
      preferences: user.preferences,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount,
      profileCompletion: user.profileCompletion,
    })) || []

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button onClick={() => router.push("/admin")} className="flex items-center text-gray-500 hover:text-gray-700">
            <HomeIcon className="w-4 h-4" />
          </button>
          <NavigateNextIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">People</span>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 overflow-x-auto">
        
        <div className="bg-white rounded-xl shadow-sm px-6 py-4 mt-4">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center flex-1">
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleSectionChange("active")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 0 ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Active Users ({activeUsers.length})
                </button>
                <button
                  onClick={() => handleSectionChange("disabled")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 1 ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Disabled Users ({disabledUsers.length})
                </button>
              </div>

              {/* People Title */}
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 whitespace-nowrap">
                <PersonIcon className="text-orange-500 text-2xl" />
                People
              </h2>

              {/* Search Bar */}
              <TextField
                size="small"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon className="text-gray-400" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: { xs: "100%", md: 250 },
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "orange.500",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "orange.500",
                    },
                  },
                }}
              />

              {/* Sort Dropdown */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SortIcon className="text-gray-400" />
                <Select
                  size="small"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  sx={{
                    minWidth: 100,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "gray.300",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "orange.500",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "orange.500",
                    },
                  }}
                >
                  <MenuItem value="az">A-Z</MenuItem>
                  <MenuItem value="za">Z-A</MenuItem>
                  <MenuItem value="recent">Recently Joined</MenuItem>
                  <MenuItem value="oldest">Oldest Joined</MenuItem>
                </Select>
              </Box>
            </div>

            {/* Right side - Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-blue-700 font-medium border border-blue-700 hover:bg-blue-50 transition-colors w-full sm:w-auto whitespace-nowrap"
                onClick={exportToExcel}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-700"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileDownloadIcon className="text-lg" />
                    <span>Export Data</span>
                  </>
                )}
              </motion.button>
              {/* View Questions button removed */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors w-full sm:w-auto whitespace-nowrap ${loadingAdd ? "cursor-not-allowed bg-orange-400" : "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600"}`}
                disabled={loadingAdd}
                onClick={handleAddUser}
                type="button"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center">
                  {loadingAdd ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <AddIcon className="text-lg" />
                      <span>Add People</span>
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* People Table */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            height: "calc(100vh - 280px)", 
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: {
                sortModel: [{ field: "id", sort: "asc" }],
              },
            }}
            pageSizeOptions={[10, 20, 50]}
            disableSelectionOnClick
            loading={!users}
            sx={{
              border: "none",
              height: "100%",
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "orange.50",
                borderRadius: 0,
              },
              "& .MuiDataGrid-cell": {
                borderColor: "divider",
              },
              "& .MuiDataGrid-row:hover": {
                bgcolor: "orange.50",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 600,
                color: "orange.900",
              },
              "& .MuiDataGrid-virtualScroller": {
                height: "auto !important",
              },
            }}
          />
          {(!currentUsers || currentUsers.length === 0) && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                }}
              >
                {activeTab === 0 ? "No Active Users Yet" : "No Disabled Users"}
              </Typography>
            </Box>
          )}
        </Paper>

        
        <Dialog
          open={enableDialog.open}
          onClose={handleEnableCancel}
          aria-labelledby="enable-dialog-title"
          aria-describedby="enable-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 3,
              padding: 2,
              minWidth: 400,
            },
          }}
        >
          <DialogTitle
            id="enable-dialog-title"
            sx={{
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "orange.700",
              pb: 1,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 40, color: "orange.500", mb: 1 }} />
            <br />
            Enable User
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center", py: 2 }}>
            <DialogContentText
              id="enable-dialog-description"
              sx={{
                fontSize: "1.1rem",
                color: "text.primary",
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to enable user{" "}
              <strong style={{ color: "#f97316" }}>"{enableDialog.userName}"</strong>?
              <br />
              <span style={{ color: "#6b7280" }}>This will restore their access to the system.</span>
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
            <Button
              onClick={handleEnableCancel}
              variant="outlined"
              sx={{
                borderColor: "gray.300",
                color: "gray.600",
                "&:hover": {
                  borderColor: "gray.400",
                  bgcolor: "gray.50",
                },
                px: 3,
                py: 1,
              }}
            >
              Cancel
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleEnableConfirm}
                variant="contained"
                disabled={enablingUser}
                sx={{
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  color: "white",
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
                    boxShadow: "0 6px 16px rgba(249, 115, 22, 0.4)",
                  },
                  "&:disabled": {
                    background: "gray.300",
                    color: "gray.500",
                  },
                }}
                startIcon={
                  enablingUser ? (
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <CheckCircleIcon />
                  )
                }
              >
                {enablingUser ? "Enabling..." : "Enable User"}
              </Button>
            </motion.div>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  )
}

export default PeoplePage






