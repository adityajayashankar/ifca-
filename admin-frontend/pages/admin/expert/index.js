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
import { selectActiveExperts, selectDisabledExperts, setAllExperts } from "@/store/features/expert"
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
import BlockIcon from "@mui/icons-material/Block"
import { motion } from "framer-motion"
import api from "@/utils/apiSetup"
import * as XLSX from 'xlsx'

const Expert = () => {
  const router = useRouter()
  const loadingRef = useRef(false)
  const dispatch = useDispatch()
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("az")
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [activeTab, setActiveTab] = useState(0) 
  const [enableDialog, setEnableDialog] = useState({ open: false, expertId: null, expertName: "" })
  const [disableDialog, setDisableDialog] = useState({ open: false, expertId: null, expertName: "" })
  const [enablingExpert, setEnablingExpert] = useState(null)
  const [disablingExpert, setDisablingExpert] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false)

  useEffect(() => {
    loadingRef.current = false
    if (!loadingRef.current) {
      dispatch(setAllExperts())
      loadingRef.current = true
    }
  }, [router])

  // Force update when filtering changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1)
  }, [search, sort, activeTab, showIncompleteOnly])

  // Debug logging for filtering
  useEffect(() => {
    console.log('Filter state changed:', { search, sort, activeTab, showIncompleteOnly });
    console.log('Current experts count:', currentExperts?.length || 0);
    console.log('Filtered experts count:', filtered?.length || 0);
  }, [search, sort, activeTab, showIncompleteOnly, currentExperts?.length, filtered?.length]);

  // Debug: print filtered incomplete experts
  useEffect(() => {
    if (showIncompleteOnly) {
      console.log('Filtered incomplete experts:', filtered);
    }
  }, [showIncompleteOnly, filtered]);

  const activeExperts = useSelector(selectActiveExperts)
  const disabledExperts = useSelector(selectDisabledExperts) 
  const currentExperts = activeTab === 0 ? activeExperts : disabledExperts

  // Check if data is loaded (both arrays exist, even if empty)
  const isDataLoaded = activeExperts !== undefined && disabledExperts !== undefined

  // Helper to check if a field is missing
  const isMissing = (val) => !val || !String(val).trim();
  // Helper to check if expert profile is incomplete
  const isIncomplete = (e) => isMissing(e.name) || isMissing(e.email) || isMissing(e.phone) || isMissing(e.address);

  // Calculate incomplete count for current experts (active or disabled tab only)
  const incompleteCount = (currentExperts || []).filter(isIncomplete).length;

  const filtered = (currentExperts || [])
    .filter((e) => {
      // First filter by search
      const matchesSearch = e.name?.toLowerCase().includes(search.toLowerCase());
      
      // Then filter by incomplete profiles if enabled
      if (showIncompleteOnly) {
        return matchesSearch && isIncomplete(e);
      }
      
      return matchesSearch;
    })
    .sort((a, b) => {
      console.log('Sorting experts:', { sort, a: a.name, b: b.name });
      
      const nameA = a.name?.toLowerCase().trim() || ""
      const nameB = b.name?.toLowerCase().trim() || ""

      if (sort === "az") return nameA.localeCompare(nameB)
      if (sort === "za") return nameB.localeCompare(nameA)
      if (sort === "sessions") return (b.statistics?.sessions?.total || b.SessionSlots?.length || 0) - (a.statistics?.sessions?.total || a.SessionSlots?.length || 0)
      if (sort === "recent") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sort === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      if (sort === "active") {
        // Get the most recent session slot for each expert
        const aLastActivity = a.SessionSlots?.length > 0 
          ? Math.max(...a.SessionSlots.map(slot => new Date(slot.createdAt || slot.session?.createdAt || 0).getTime()))
          : 0
        const bLastActivity = b.SessionSlots?.length > 0 
          ? Math.max(...b.SessionSlots.map(slot => new Date(slot.createdAt || slot.session?.createdAt || 0).getTime()))
          : 0
        console.log('Active sorting:', { a: a.name, aLastActivity, b: b.name, bLastActivity });
        return bLastActivity - aLastActivity
      }
      return 0
    })

  const handleAddExpert = () => {
    setLoadingAdd(true)
    setTimeout(() => {
      setLoadingAdd(false)
      router.push("/admin/expert/add")
    }, 400)
  }

  const handleSectionChange = (section) => {
    console.log('Section changed to:', section);
    setActiveTab(section === "active" ? 0 : 1)
  }

  const handleEnableClick = (expertId, expertName) => {
    setEnableDialog({ open: true, expertId, expertName })
  }

  const handleDisableClick = (expertId, expertName) => {
    setDisableDialog({ open: true, expertId, expertName })
  }

  const handleEnableConfirm = async () => {
    const { expertId } = enableDialog
    setEnablingExpert(expertId)

    try {
      
      const res = await api.patch(`/expert/${expertId}/enable`)

      if (res.status === 200 || res.status === 204) {
       
        dispatch(setAllExperts())
      } else {
        console.error("Failed to enable expert")
      }
    } catch (error) {
      console.error("Error enabling expert:", error)
    } finally {
      setEnablingExpert(null)
      setEnableDialog({ open: false, expertId: null, expertName: "" })
    }
  }

  const handleDisableConfirm = async () => {
    const { expertId } = disableDialog
    setDisablingExpert(expertId)

    try {
      
      const res = await api.delete(`/expert/${expertId}`)

      if (res.status === 200 || res.status === 204) {
       
        dispatch(setAllExperts())
      } else {
        console.error("Failed to disable expert")
      }
    } catch (error) {
      console.error("Error disabling expert:", error)
    } finally {
      setDisablingExpert(null)
      setDisableDialog({ open: false, expertId: null, expertName: "" })
    }
  }

  const handleEnableCancel = () => {
    setEnableDialog({ open: false, expertId: null, expertName: "" })
  }

  const handleDisableCancel = () => {
    setDisableDialog({ open: false, expertId: null, expertName: "" })
  }

  const exportToExcel = () => {
    setExporting(true);
    try {
      console.log('Starting Excel export...');
      console.log('Current experts:', currentExperts);
      
      // Filter for export: if showIncompleteOnly, only export incomplete for current tab
      const validExperts = (showIncompleteOnly
        ? currentExperts.filter(isIncomplete)
        : currentExperts.filter(expert => expert.name && expert.name.trim() !== '' && expert.name !== 'N/A')
      );
      
      console.log('Valid experts for export:', validExperts.length);
      
      // Prepare data for export
      const exportData = validExperts.map((expert, index) => {
        const createdAt = new Date(expert.createdAt);
        const updatedAt = new Date(expert.updatedAt);
        
        // Get the most recent session slot for last activity
        const lastSession = expert.SessionSlots?.length > 0 
          ? expert.SessionSlots.reduce((latest, current) => {
              const currentTime = new Date(current.createdAt || current.session?.createdAt || 0).getTime();
              const latestTime = new Date(latest.createdAt || latest.session?.createdAt || 0).getTime();
              return currentTime > latestTime ? current : latest;
            })
          : null;
        
        return {
          'SL No': index + 1,
          'Expert Name': expert.name || 'N/A',
          'Email': expert.email || 'N/A',
          'Phone': expert.phone || 'N/A',
          'Address': expert.address || 'N/A',
          'Status': expert.isActive ? 'Active' : 'Inactive',
          'Description': expert.desc || 'N/A',
          'Joined Date': createdAt.toLocaleDateString(),
          'Joined Time': createdAt.toLocaleTimeString(),
          'Last Updated Date': updatedAt.toLocaleDateString(),
          'Last Updated Time': updatedAt.toLocaleTimeString(),
          'Total Sessions': expert.statistics?.sessions?.total || expert.SessionSlots?.length || 0,
          'Upcoming Sessions': expert.statistics?.sessions?.upcoming || 0,
          'Completed Sessions': expert.statistics?.sessions?.completed || 0,
          'Total Communities': expert.statistics?.communities?.total || 0,
          'Active Communities': expert.statistics?.communities?.active || 0,
          'Expired Communities': expert.statistics?.communities?.expired || 0,
          'Last Activity': lastSession ? new Date(lastSession.createdAt || lastSession.session?.createdAt || 0).toLocaleDateString() : 'N/A',
          'Last Session Title': lastSession?.session?.title || 'N/A',
        };
      });

      console.log('Export data prepared:', exportData);

      // Check if XLSX is available
      if (typeof XLSX === 'undefined') {
        throw new Error('XLSX library is not available');
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 8 },   // SL No
        { wch: 25 },  // Expert Name
        { wch: 30 },  // Email
        { wch: 15 },  // Phone
        { wch: 30 },  // Address
        { wch: 10 },  // Status
        { wch: 40 },  // Description
        { wch: 12 },  // Joined Date
        { wch: 12 },  // Joined Time
        { wch: 12 },  // Last Updated Date
        { wch: 12 },  // Last Updated Time
        { wch: 15 },  // Total Sessions
        { wch: 18 },  // Upcoming Sessions
        { wch: 18 },  // Completed Sessions
        { wch: 18 },  // Total Communities
        { wch: 18 },  // Active Communities
        { wch: 18 },  // Expired Communities
        { wch: 15 },  // Last Activity
        { wch: 30 },  // Last Session Title
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, `${activeTab === 0 ? 'Active' : 'Disabled'} Experts`);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `experts_${activeTab === 0 ? 'active' : 'disabled'}_${timestamp}.xlsx`;

      console.log('Saving file:', filename);

      // Save file
      XLSX.writeFile(workbook, filename);

      // Show success message with count of exported experts
      const excludedCount = currentExperts.length - validExperts.length;
      let message = `Successfully exported ${exportData.length} experts to ${filename}`;
      if (excludedCount > 0) {
        message += ` (${excludedCount} experts with missing names excluded)`;
      }
      
      console.log(message);
      alert(message);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(`Export failed: ${error.message}`);
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
      headerName: "Expert Profile",
      width: 280,
      renderCell: (params) => {
        const expert = params.row;
        const hasCompleteProfile = !isIncomplete(expert);
        
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              src={expert.photoURL}
              alt={expert.name || "Unknown"}
              sx={{
                width: 36,
                height: 36,
                bgcolor: expert.isActive ? "green.100" : "red.100",
                color: expert.isActive ? "green.700" : "red.700",
                border: hasCompleteProfile ? "none" : "2px solid #f59e0b",
              }}
            >
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                noWrap 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: "14px", 
                  color: hasCompleteProfile ? "text.primary" : "orange.700",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5
                }}
              >
                {expert.name || "N/A"}
                {!hasCompleteProfile && (
                  <Tooltip title="Incomplete Profile">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "orange.500",
                        ml: 0.5,
                      }}
                    />
                  </Tooltip>
                )}
              </Typography>
              <Typography 
                noWrap 
                sx={{ 
                  fontSize: "12px", 
                  color: expert.email ? "text.secondary" : "orange.600",
                  fontStyle: expert.email ? "normal" : "italic"
                }}
              >
                {expert.email || "N/A"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: expert.isActive ? "green.500" : "red.500",
                  }}
                />
                <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
                  {expert.isActive ? "Active" : "Inactive"}
                </Typography>
                {!hasCompleteProfile && (
                  <Typography sx={{ fontSize: "10px", color: "orange.600", ml: 1 }}>
                    • Incomplete
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 130,
      renderCell: (params) => (
        <Typography 
          sx={{ 
            fontSize: "12px", 
            color: params.row.phone ? "text.secondary" : "orange.600",
            fontStyle: params.row.phone ? "normal" : "italic"
          }}
        >
          {params.row.phone || "N/A"}
        </Typography>
      ),
    },
    {
      field: "address",
      headerName: "Location",
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography 
            sx={{ 
              fontSize: "12px", 
              color: params.row.address ? "text.primary" : "orange.600",
              fontWeight: 500,
              fontStyle: params.row.address ? "normal" : "italic"
            }}
          >
            {params.row.address || "N/A"}
          </Typography>
          <Typography 
            sx={{ 
              fontSize: "11px", 
              color: params.row.pincode ? "text.secondary" : "orange.500",
              fontStyle: params.row.pincode ? "normal" : "italic"
            }}
          >
            PIN: {params.row.pincode || "N/A"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "desc",
      headerName: "Description",
      width: 100,
      renderCell: (params) => (
        <Typography 
          sx={{ 
            fontSize: "12px", 
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: params.row.desc ? "text.secondary" : "orange.600",
            fontStyle: params.row.desc ? "normal" : "italic"
          }}
        >
          {params.row.desc || "No description"}
        </Typography>
      ),
    },
    {
      field: "sessions",
      headerName: "Sessions",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "text.primary" }}>
            {params.row.statistics?.sessions?.total || params.row.SessionSlots?.length || 0}
          </Typography>
          <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
            {params.row.statistics?.sessions?.upcoming || 0} upcoming
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
          <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "text.primary" }}>
            {params.row.statistics?.communities?.total || 0}
          </Typography>
          <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
            {params.row.statistics?.communities?.active || 0} active
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
      width: activeTab === 1 ? 200 : 180, 
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => router.push(`/admin/expert/${params.row.expertId}`)}
              sx={{
                color: "blue.700",
                "&:hover": {
                  bgcolor: "blue.50",
                },
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Expert">
            <IconButton
              size="small"
              onClick={() => router.push(`/admin/expert/add/${params.row.expertId}`)}
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
          {activeTab === 0 && (
            <Tooltip title="Disable Expert">
              <IconButton
                size="small"
                onClick={() => handleDisableClick(params.row.expertId, params.row.name)}
                disabled={disablingExpert === params.row.expertId}
                sx={{
                  color: "red.700",
                  "&:hover": {
                    bgcolor: "red.50",
                  },
                  "&:disabled": {
                    color: "gray.400",
                  },
                }}
              >
                {disablingExpert === params.row.expertId ? (
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
                  <BlockIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          {activeTab === 1 && (
            <Tooltip title="Enable Expert">
              <IconButton
                size="small"
                onClick={() => handleEnableClick(params.row.expertId, params.row.name)}
                disabled={enablingExpert === params.row.expertId}
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
                {enablingExpert === params.row.expertId ? (
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
    filtered?.map((expert, index) => ({
      id: expert.id || expert.expertId || index + 1, // fallback to index if no id
      expertId: expert.id || expert.expertId || index + 1,
      ...expert,
    })) || []

  // Debug logging for rows
  useEffect(() => {
    console.log('Rows for DataGrid:', rows);
    console.log('Rows length:', rows.length);
    console.log('First row:', rows[0]);
  }, [rows]);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center space-x-2 text-sm">
          <button onClick={() => router.push("/admin")} className="flex items-center text-gray-500 hover:text-gray-700">
            <HomeIcon className="w-4 h-4" />
          </button>
          <NavigateNextIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium" style={{ fontSize: "14px" }}>Experts</span>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 overflow-x-auto">
       
        <div className="bg-white rounded-xl shadow-sm px-6 py-6 mt-4">
          <div className="flex flex-col xl:flex-row flex-wrap gap-6 items-start xl:items-center justify-between w-full">
         
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center flex-1">
             
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleSectionChange("active")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 0 ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{ fontSize: "12px" }}
                >
                  Active Experts ({activeExperts.length})
                </button>
                <button
                  onClick={() => handleSectionChange("disabled")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 1 ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{ fontSize: "12px" }}
                >
                  Disabled Experts ({disabledExperts.length})
                </button>
              </div>

              {/* Experts Title */}
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 whitespace-nowrap" style={{ fontSize: "14px" }}>
                <PersonIcon className="text-orange-500 text-2xl" />
                Experts
              </h2>

              {/* Search Bar */}
              <TextField
                size="small"
                placeholder="Search by expert name..."
                value={search}
                onChange={(e) => {
                  console.log('Search changed to:', e.target.value);
                  setSearch(e.target.value);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon className="text-gray-400" />
                    </InputAdornment>
                  ),
                  style: { fontSize: "12px" }
                }}
                sx={{
                  width: { xs: "100%", md: 280 },
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "orange.500",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "orange.500",
                    },
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "12px",
                  },
                }}
              />

              {/* Incomplete Profiles Filter - Only show if there are incomplete profiles */}
              {incompleteCount > 0 && (
                <Button
                  variant={showIncompleteOnly ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
                  startIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9V14M12 18H12.01M21 12C21 16.9706 16.9706 21 12 21C3 16.9706 3 7.02944 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  sx={{
                    fontSize: "12px",
                    px: 3,
                    py: 1.5,
                    borderColor: showIncompleteOnly ? "#2563eb" : "#2563eb",
                    bgcolor: showIncompleteOnly ? "#2563eb" : "transparent",
                    color: showIncompleteOnly ? "white" : "#2563eb",
                    '&:hover': {
                      bgcolor: showIncompleteOnly ? "#1d4ed8" : "#eff6ff",
                      borderColor: "#2563eb",
                    },
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderRadius: 2,
                    fontWeight: 500,
                    transition: 'all 0.2s ease-in-out',
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                  }}
                >
                  INCOMPLETE ONLY ({incompleteCount})
                </Button>
              )}

              {/* Sort Dropdown */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SortIcon className="text-gray-400" />
                <Select
                  size="small"
                  value={sort}
                  onChange={(e) => {
                    console.log('Sort changed to:', e.target.value);
                    setSort(e.target.value);
                  }}
                  sx={{
                    minWidth: 120,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "gray.300",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "orange.500",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "orange.500",
                    },
                    "& .MuiSelect-select": {
                      fontSize: "12px",
                    },
                  }}
                >
                  <MenuItem value="az" sx={{ fontSize: "12px" }}>A-Z</MenuItem>
                  <MenuItem value="za" sx={{ fontSize: "12px" }}>Z-A</MenuItem>
                  <MenuItem value="sessions" sx={{ fontSize: "12px" }}>Most Sessions</MenuItem>
                  <MenuItem value="recent" sx={{ fontSize: "12px" }}>Recently Joined</MenuItem>
                  <MenuItem value="oldest" sx={{ fontSize: "12px" }}>Oldest First</MenuItem>
                  <MenuItem value="active" sx={{ fontSize: "12px" }}>Most Active</MenuItem>
                </Select>
              </Box>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Tooltip title={exporting ? "Exporting..." : "Export to Excel"}>
                <IconButton
                  size="small"
                  onClick={exportToExcel}
                  disabled={exporting}
                  sx={{
                    color: exporting ? "gray.400" : "green.700",
                    "&:hover": {
                      bgcolor: exporting ? "transparent" : "green.50",
                    },
                    "&:disabled": {
                      color: "gray.400",
                    },
                  }}
                >
                  {exporting ? (
                    <svg
                      className="animate-spin h-5 w-5"
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6A2 2 0 0 0 4 4V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Refresh Data">
                <IconButton
                  size="small"
                  onClick={() => dispatch(setAllExperts())}
                  sx={{
                    color: "blue.700",
                    "&:hover": {
                      bgcolor: "blue.50",
                    },
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </IconButton>
              </Tooltip>
            </div>
            
            <div className="flex">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors w-full sm:w-auto whitespace-nowrap ${loadingAdd ? "cursor-not-allowed bg-orange-400" : "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600"}`}
                disabled={loadingAdd}
                onClick={handleAddExpert}
                type="button"
                style={{ fontSize: "12px" }}
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
                      <span>Add Expert</span>
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontSize: "12px", color: "text.secondary", mb: 1 }}>
                  Total Experts
                </Typography>
                <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "primary.main" }}>
                  {activeExperts.length + disabledExperts.length}
                </Typography>
              </Box>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                bgcolor: "primary.50", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                <PersonIcon sx={{ color: "primary.main", fontSize: 24 }} />
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontSize: "12px", color: "text.secondary", mb: 1 }}>
                  Active Experts
                </Typography>
                <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "green.600" }}>
                  {activeExperts.length}
                </Typography>
                <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
                  {activeExperts.length > 0 ? Math.round((activeExperts.length / (activeExperts.length + disabledExperts.length)) * 100) : 0}% of total
                </Typography>
              </Box>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                bgcolor: "green.50", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                <CheckCircleIcon sx={{ color: "green.600", fontSize: 24 }} />
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontSize: "12px", color: "text.secondary", mb: 1 }}>
                  Incomplete Profiles
                </Typography>
                <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "orange.600" }}>
                  {incompleteCount}
                </Typography>
                <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
                  Need attention
                </Typography>
              </Box>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                bgcolor: "orange.50", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V14M12 18H12.01M21 12C21 16.9706 16.9706 21 12 21C3 16.9706 3 7.02944 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontSize: "12px", color: "text.secondary", mb: 1 }}>
                  Total Sessions
                </Typography>
                <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "purple.600" }}>
                  {activeExperts.reduce((total, expert) => 
                    total + (expert.statistics?.sessions?.total || expert.SessionSlots?.length || 0), 0
                  )}
                </Typography>
                <Typography sx={{ fontSize: "10px", color: "text.secondary" }}>
                  {activeExperts.reduce((total, expert) => 
                    total + (expert.statistics?.sessions?.upcoming || 0), 0
                  )} upcoming
                </Typography>
              </Box>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                bgcolor: "purple.50", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 7H11A2 2 0 0 1 13 9V15A2 2 0 0 1 11 17H9A2 2 0 0 1 7 15V9A2 2 0 0 1 9 7Z" fill="#9333ea"/>
                  <path d="M15 7H17A2 2 0 0 1 19 9V15A2 2 0 0 1 17 17H15A2 2 0 0 1 13 15V9A2 2 0 0 1 15 7Z" fill="#9333ea"/>
                </svg>
              </Box>
            </Box>
          </Paper>
        </div>

        {/* Experts Table */}
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
          {/* Fallback HTML table for incomplete experts */}
          {showIncompleteOnly && incompleteCount > 0 && rows.length === 0 && (
            <Box sx={{ mt: 2, width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: 8, border: '1px solid #eee' }}>SL</th>
                    <th style={{ padding: 8, border: '1px solid #eee' }}>Name</th>
                    <th style={{ padding: 8, border: '1px solid #eee' }}>Email</th>
                    <th style={{ padding: 8, border: '1px solid #eee' }}>Phone</th>
                    <th style={{ padding: 8, border: '1px solid #eee' }}>Address</th>
                    <th style={{ padding: 8, border: '1px solid #eee' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentExperts.filter(isIncomplete)).map((expert, idx) => {
                    const isActive = expert.isActive !== false; // treat undefined as active
                    return (
                      <tr key={expert.id || expert.expertId || idx}>
                        <td style={{ padding: 8, border: '1px solid #eee', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: 8, border: '1px solid #eee' }}>{expert.name || 'N/A'}</td>
                        <td style={{ padding: 8, border: '1px solid #eee' }}>{expert.email || 'N/A'}</td>
                        <td style={{ padding: 8, border: '1px solid #eee' }}>{expert.phone || 'N/A'}</td>
                        <td style={{ padding: 8, border: '1px solid #eee' }}>{expert.address || 'N/A'}</td>
                        <td style={{ padding: 8, border: '1px solid #eee', display: 'flex', gap: 8 }}>
                          <button
                            style={{
                              background: '#f59e0b',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '4px 12px',
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                            onClick={() => {
                              const id = expert.id || expert.expertId || '';
                              if (id) {
                                window.location.href = `/admin/expert/add/${id}`;
                              } else {
                                alert('No ID available for this expert.');
                              }
                            }}
                          >
                            Edit
                          </button>
                          {isActive ? (
                            <button
                              style={{
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '4px 12px',
                                cursor: 'pointer',
                                fontSize: 12,
                              }}
                              onClick={() => {
                                const id = expert.id || expert.expertId || '';
                                if (id) {
                                  handleDisableClick(id, expert.name || '');
                                } else {
                                  alert('No ID available for this expert.');
                                }
                              }}
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              style={{
                                background: '#22c55e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '4px 12px',
                                cursor: 'pointer',
                                fontSize: 12,
                              }}
                              onClick={() => {
                                const id = expert.id || expert.expertId || '';
                                if (id) {
                                  handleEnableClick(id, expert.name || '');
                                } else {
                                  alert('No ID available for this expert.');
                                }
                              }}
                            >
                              Enable
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          )}

          {/* Only show DataGrid if not in fallback mode */}
          {!(showIncompleteOnly && incompleteCount > 0 && rows.length === 0) && (
            <DataGrid
              key={`${activeTab}-${search}-${sort}-${showIncompleteOnly}-${rows.length}-${filtered.length}-${forceUpdate}`}
              rows={rows}
              columns={columns}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 20, 50]}
              disableSelectionOnClick
              loading={!isDataLoaded}
              disableColumnSorting={true}
              getRowId={(row) => `${row.expertId}-${activeTab}-${search}-${sort}-${showIncompleteOnly}`}
              sx={{
                border: "none",
                height: "100%",
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: "orange.50",
                  borderRadius: 0,
                },
                "& .MuiDataGrid-cell": {
                  borderColor: "divider",
                  fontSize: "12px",
                },
                "& .MuiDataGrid-row:hover": {
                  bgcolor: "orange.50",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 600,
                  color: "orange.900",
                  fontSize: "12px",
                },
                "& .MuiDataGrid-virtualScroller": {
                  height: "auto !important",
                },
                "& .MuiDataGrid-footerContainer": {
                  fontSize: "12px",
                },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: "12px",
                },
              }}
            />
          )}
          {(!currentExperts || currentExperts.length === 0) && (
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
                  fontSize: "14px",
                }}
              >
                {activeTab === 0 ? "No Active Experts Yet" : "No Disabled Experts"}
              </Typography>
            </Box>
          )}
          {/* Show message if incomplete count > 0 but no rows are shown */}
          {showIncompleteOnly && incompleteCount > 0 && rows.length === 0 && (
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
                  color: "orange.700",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {`There are ${incompleteCount} incomplete experts, but none can be displayed in the main table. Showing fallback table below.`}
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
              fontSize: "14px",
              fontWeight: 700,
              color: "orange.700",
              pb: 1,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 40, color: "orange.500", mb: 1 }} />
            <br />
            Enable Expert
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center", py: 2 }}>
            <DialogContentText
              id="enable-dialog-description"
              sx={{
                fontSize: "12px",
                color: "text.primary",
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to enable expert{" "}
              <strong style={{ color: "#f97316" }}>"{enableDialog.expertName}"</strong>?
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
                fontSize: "12px",
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
                disabled={enablingExpert}
                sx={{
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "12px",
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
                  enablingExpert ? (
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
                {enablingExpert ? "Enabling..." : "Enable Expert"}
              </Button>
            </motion.div>
          </DialogActions>
        </Dialog>

        {/* Disable Expert Dialog */}
        <Dialog
          open={disableDialog.open}
          onClose={handleDisableCancel}
          aria-labelledby="disable-dialog-title"
          aria-describedby="disable-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 3,
              padding: 2,
              minWidth: 400,
            },
          }}
        >
          <DialogTitle
            id="disable-dialog-title"
            sx={{
              textAlign: "center",
              fontSize: "14px",
              fontWeight: 700,
              color: "red.700",
              pb: 1,
            }}
          >
            <BlockIcon sx={{ fontSize: 40, color: "red.500", mb: 1 }} />
            <br />
            Disable Expert
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center", py: 2 }}>
            <DialogContentText
              id="disable-dialog-description"
              sx={{
                fontSize: "12px",
                color: "text.primary",
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to disable expert{" "}
              <strong style={{ color: "#dc2626" }}>"{disableDialog.expertName}"</strong>?
              <br />
              <span style={{ color: "#6b7280" }}>This will revoke their access to the system.</span>
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
            <Button
              onClick={handleDisableCancel}
              variant="outlined"
              sx={{
                borderColor: "gray.300",
                color: "gray.600",
                fontSize: "12px",
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
                onClick={handleDisableConfirm}
                variant="contained"
                disabled={disablingExpert}
                sx={{
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "12px",
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)",
                    boxShadow: "0 6px 16px rgba(220, 38, 38, 0.4)",
                  },
                  "&:disabled": {
                    background: "gray.300",
                    color: "gray.500",
                  },
                }}
                startIcon={
                  disablingExpert ? (
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
                    <BlockIcon />
                  )
                }
              >
                {disablingExpert ? "Disabling..." : "Disable Expert"}
              </Button>
            </motion.div>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  )
}

export default Expert

