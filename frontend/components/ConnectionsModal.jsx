import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Typography,
  Box,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  ListItemButton,
  ListItemSecondaryAction,
  Switch,
  Collapse,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '@/utils/apiSetup';
import { toast } from 'react-hot-toast';

const modalRoot = typeof window !== 'undefined' ? document.body : null;

const ConnectionsModal = ({ open, onClose, userId, initialTab = 'following', showOnlyPending = false }) => {
  const [tabValue, setTabValue] = useState(initialTab === 'following' ? 0 : 1);
  const [connections, setConnections] = useState({ following: [], followers: [] });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [privacySettings, setPrivacySettings] = useState('all');
  const [showSelectedUsers, setShowSelectedUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(initialTab === 'settings');
  const [showFollowRequests, setShowFollowRequests] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchConnections();
      fetchPendingRequests();
      fetchPrivacySettings();
    }
  }, [open, userId]);

  useEffect(() => {
    if (privacySettings === 'selected' && !showSelectedUsers) {
      fetchSelectedUsers();
    }
  }, [privacySettings]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showSettingsDropdown) return;
    const handleClick = (e) => {
      if (!e.target.closest('.settings-dropdown') && !e.target.closest('.settings-icon-btn')) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSettingsDropdown]);

  const fetchConnections = async () => {
    try {
      const response = await api.get(`connections/${userId}/connections`);
      setConnections(response.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get(`connections/${userId}/pending-requests`);
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Failed to load pending requests');
    }
  };

  const fetchPrivacySettings = async () => {
    try {
      const response = await api.get(`connections/user/${userId}/privacy`);
      setPrivacySettings(response.data.privacyType || 'all');
      // If privacy type is 'selected', fetch selected users immediately
      if (response.data.privacyType === 'selected') {
        fetchSelectedUsers();
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      toast.error('Failed to load privacy settings');
    }
  };

  const fetchSelectedUsers = async () => {
    try {
      const response = await api.get(`connections/selected-viewers/${userId}`);
      // Map all users with their selection status
      const formattedUsers = response.data.map(user => ({
        id: user.id,
        name: user.user?.name || user.admin?.name || user.partner?.name || user.expert?.name,
        photoURL: user.user?.photoURL || user.admin?.photoURL || user.partner?.photoURL || user.expert?.photoURL,
        email: user.email,
        selected: user.selected
      }));
      setSelectedUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching selected users:', error);
      toast.error('Failed to load selected users');
    }
  };

  const handleAcceptConnection = async (connectionId) => {
    try {
      await api.put(`connections/accept/${connectionId}`);
      toast.success('Connection accepted');
      fetchPendingRequests();
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection');
    }
  };

  const handleRejectConnection = async (connectionId) => {
    try {
      await api.delete(`connections/${connectionId}`);
      toast.success('Connection request rejected');
      fetchPendingRequests();
    } catch (error) {
      console.error('Error rejecting connection:', error);
      toast.error('Failed to reject connection');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handlePrivacyChange = async (event) => {
    const value = event.target.value;
    
    // Update the UI state immediately
    setPrivacySettings(value);
    
    try {
      // If switching to 'selected'
      if (value === 'selected') {
        // Fetch selected users immediately
        const response = await api.get(`connections/selected-viewers/${userId}`);
        setSelectedUsers(response.data || []);
        setShowSelectedUsers(true);
        return;
      }

      // For other privacy types
      await api.put(`connections/user/${userId}/privacy`, {
        privacyType: value,
        selectedViewers: []
      });

      setSelectedUsers([]);
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      setPrivacySettings(prevState => prevState);
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings');
    }
  };

  const handleUpdatePrivacyWithSelected = async () => {
    try {
      if (selectedUsers.length === 0) {
        toast.error('Please select at least one user');
        return;
      }

      await api.put(`connections/user/${userId}/privacy`, {
        privacyType: 'selected',
        selectedViewers: selectedUsers.map(user => user.id)
      });

      setShowSelectedUsers(false);
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings');
    }
  };

  const handlePrivacySettingsClick = () => {
    handleSettingsClose();
    setShowPrivacySettings(true);
  };

  // Back navigation logic
  const handleBackClick = () => {
    if (showPrivacySettings) {
      setShowPrivacySettings(false);
    } else if (showSelectedUsers) {
      setShowSelectedUsers(false);
    } else if (showFollowRequests) {
      setShowFollowRequests(false);
    }
  };

  const handleSearchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await api.get(`users/search?q=${query}`);
      // Filter out users that are already in selectedUsers
      const filteredResults = response.data.filter(user => 
        !selectedUsers.some(selected => selected.id === user.id)
      );
      // Map the search results to match the same format
      const formattedResults = filteredResults.map(user => ({
        id: user.id,
        name: user.user?.name || user.admin?.name || user.partner?.name || user.expert?.name,
        photoURL: user.user?.photoURL || user.admin?.photoURL || user.partner?.photoURL || user.expert?.photoURL,
        email: user.email
      }));
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleAddSelectedUser = async (user) => {
    try {
      const updatedUsers = selectedUsers.map(u => 
        u.id === user.id ? { ...u, selected: true } : u
      );
      setSelectedUsers(updatedUsers);
      
      // Update privacy settings with the selected users
      await api.put(`connections/user/${userId}/privacy`, {
        privacyType: 'selected',
        selectedViewers: updatedUsers.filter(u => u.selected).map(u => u.id)
      });
      
      // toast.success('User added to selected viewers');
    } catch (error) {
      console.error('Error adding selected user:', error);
      toast.error('Failed to add user');
    }
  };

  const handleRemoveSelectedUser = async (id) => {
    try {
      // await api.delete(`connections/selected-viewers/${userId}`);
      const updatedUsers = selectedUsers.map(user => 
        user.id === id ? { ...user, selected: false } : user
      );
      const selectedCount = updatedUsers.filter(u => u.selected).length;
      
      // If removing the last selected user, switch to 'all' privacy
      if (selectedCount === 0) {
        await api.put(`connections/user/${userId}/privacy`, {
          privacyType: 'all',
          selectedViewers: []
        });
        setPrivacySettings('all');
        setShowSelectedUsers(false);
        toast.success('Privacy settings updated to Everyone');
      } else {
        // Update privacy settings with the remaining selected users
        await api.put(`connections/user/${userId}/privacy`, {
          privacyType: 'selected',
          selectedViewers: updatedUsers.filter(u => u.selected).map(u => u.id)
        });
        setSelectedUsers(updatedUsers);
      }
      
      toast.success('User removed from selected viewers');
    } catch (error) {
      console.error('Error removing selected user:', error);
      toast.error('Failed to remove user');
    }
  };

  const renderUserInfo = (user) => {
    const userDetails = user?.user || user?.partner || user?.expert || user?.admin;
    return {
      name: userDetails?.name || 'Anonymous',
      photo: userDetails?.photoURL || '/t6.svg'
    };
  };

  const renderSelectedUsersView = () => (
    <>
      <Box sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <IconButton onClick={handleBackClick}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Selected Viewers</Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // handleSearchUsers(e.target.value);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searching && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* All Users List */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
          Users ({selectedUsers.filter(u => u.selected).length} selected)
        </Typography>
        <List>
          {selectedUsers.map((user) => (
            <ListItem
              key={user.id}
              secondaryAction={
                user.selected ? (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveSelectedUser(user.id)}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleAddSelectedUser(user)}
                  >
                    Add
                  </Button>
                )
              }
            >
              <ListItemAvatar>
                <Avatar src={user.photoURL || '/t6.svg'} alt={user.name} />
              </ListItemAvatar>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {user.name}
                    {user.selected && (
                      <CheckCircleIcon color="primary" sx={{ fontSize: 16 }} />
                    )}
                  </Box>
                }
                secondary={user.email}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Update Button */}
      <Box sx={{ 
        position: 'sticky', 
        bottom: 0, 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdatePrivacyWithSelected}
          disabled={!selectedUsers.some(u => u.selected)}
        >
          Update Privacy Settings
        </Button>
      </Box>
    </>
  );

  const renderPrivacySettingsView = () => (
    <>
      <Box sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBackClick}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">Privacy Settings</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'medium' }}>
          Who can see your information?
        </Typography>

        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <RadioGroup
            value={privacySettings}
            onChange={handlePrivacyChange}
          >
            <FormControlLabel
              value="all"
              control={<Radio />}
              label={
                <Box sx={{ py: 1 }}>
                  <Typography variant="body1">Everyone</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Anyone can view your full profile information
                  </Typography>
                </Box>
              }
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              value="followers"
              control={<Radio />}
              label={
                <Box sx={{ py: 1 }}>
                  <Typography variant="body1">Followers Only</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Only your followers can see your detailed information
                  </Typography>
                </Box>
              }
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              value="following"
              control={<Radio />}
              label={
                <Box sx={{ py: 1 }}>
                  <Typography variant="body1">Following Only</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Only people you follow can see your detailed information
                  </Typography>
                </Box>
              }
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              value="selected"
              control={<Radio />}
              label={
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  width: '100%',
                  py: 1
                }}>
                  <Box>
                    <Typography variant="body1">Selected People</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Only specific people can see your detailed information
                      {selectedUsers.length > 0 && ` (${selectedUsers.length} selected)`}
                    </Typography>
                  </Box>
                  {privacySettings === 'selected' && (
                    <Button
                      size="small"
                      onClick={() => setShowSelectedUsers(true)}
                      sx={{ ml: 2, mt: 1 }}
                    >
                      Manage
                    </Button>
                  )}
                </Box>
              }
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              value="none"
              control={<Radio />}
              label={
                <Box sx={{ py: 1 }}>
                  <Typography variant="body1">Private</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Only you can see your detailed information
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Note: Basic information like your name and profile picture will always be visible
          </Typography>
        </Box>
      </Box>
    </>
  );

  const renderFollowRequestsView = () => (
    <>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <IconButton onClick={handleBackClick}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Follow Requests</Typography>
      </Box>

      <List>
        {pendingRequests.map((request) => {
          const { name, photo } = renderUserInfo(request.sender);
          return (
            <ListItem
              key={request.id}
              sx={{ 
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
              secondaryAction={
                <Box>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => handleAcceptConnection(request.id)}
                    sx={{ mr: 1 }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleRejectConnection(request.id)}
                  >
                    Reject
                  </Button>
                </Box>
              }
            >
              <ListItemAvatar>
                <Avatar src={photo} alt={name} sx={{ width: 56, height: 56 }} />
              </ListItemAvatar>
              <ListItemText
                primary={name}
                secondary={request.message || 'Wants to follow you'}
                primaryTypographyProps={{ fontWeight: 'medium' }}
              />
            </ListItem>
          );
        })}
      </List>
    </>
  );

  const renderPendingRequestsPreview = () => {
    if (pendingRequests.length === 0) return null;

    const previewUsers = pendingRequests.slice(0, 2);
    const remainingCount = pendingRequests.length - 2;

    return (
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          cursor: 'pointer'
        }}
        onClick={() => setShowFollowRequests(true)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
            Follow Requests
          </Typography>
          {remainingCount > 0 && (
            <Typography variant="body2" color="primary">
              See All
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {previewUsers.map((request, index) => {
              const { name, photo } = renderUserInfo(request.sender);
              return (
                <Avatar
                  key={request.id}
                  src={photo}
                  alt={name}
                  sx={{
                    width: 32,
                    height: 32,
                    ml: index > 0 ? -1 : 0,
                    border: '2px solid white'
                  }}
                />
              );
            })}
          </Box>
          <Typography variant="body2" sx={{ ml: 2 }}>
            {pendingRequests.length === 1
              ? '1 follow request'
              : `${pendingRequests.length} follow requests`}
          </Typography>
        </Box>
      </Box>
    );
  };

  // --- Modal Content ---
  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
        transition: 'background 0.2s',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px 0 0 12px',
          minWidth: 340,
          maxWidth: 420,
          width: '90%',
          height: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header, Settings, and Close Button */}
        {!showPrivacySettings && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #eee',
            padding: '18px 24px 12px 24px',
            position: 'relative',
          }}>
            <span style={{ fontWeight: 600, fontSize: 18 }}>Connections</span>
            <div style={{ position: 'relative' }}>
              <button
                className="settings-icon-btn"
                onClick={() => setShowSettingsDropdown((v) => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}
              >
                <SettingsIcon />
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <CloseIcon />
              </button>
              {/* Custom Dropdown */}
              {showSettingsDropdown && (
                <div
                  className="settings-dropdown"
                  style={{
                    position: 'absolute',
                    top: 36,
                    right: 36,
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    borderRadius: 8,
                    minWidth: 180,
                    zIndex: 10,
                    padding: '8px 0',
                  }}
                >
                  <div
                    style={{ padding: '10px 20px', cursor: 'pointer', fontSize: 15 }}
                    onClick={() => { setShowPrivacySettings(true); setShowSettingsDropdown(false); }}
                  >
                    Privacy Settings
                  </div>
                  <div
                    style={{ padding: '10px 20px', cursor: 'pointer', fontSize: 15 }}
                    onClick={() => setShowSettingsDropdown(false)}
                  >
                    Connection Preferences
                  </div>
                  <div
                    style={{ padding: '10px 20px', cursor: 'pointer', fontSize: 15 }}
                    onClick={() => setShowSettingsDropdown(false)}
                  >
                    Notification Settings
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      {showSelectedUsers ? (
        renderSelectedUsersView()
      ) : showPrivacySettings ? (
        renderPrivacySettingsView()
      ) : showFollowRequests ? (
        renderFollowRequestsView()
      ) : (
        <>
          {/* Tabs Section */}
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Following (${connections.following?.length || 0})`} />
            <Tab label={`Followers (${connections.followers?.length || 0})`} />
          </Tabs>
          {/* Connections List */}
          {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
          ) : (
              <div style={{ flexGrow: 1, overflow: 'auto', maxHeight: 400 }}>
                <List>
                {tabValue === 0 ? (
                  connections.following?.length > 0 ? (
                    connections.following.map((connection) => {
                      const { name, photo } = renderUserInfo(connection.connectedUser);
                      return (
                        <ListItem key={connection.connectionId} sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar src={photo} alt={name} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={name}
                            secondary={connection.message || 'Connected'}
                          />
                        </ListItem>
                      );
                    })
                  ) : (
                      <div style={{ color: '#888', textAlign: 'center', padding: 24 }}>
                      You are not following anyone yet
                      </div>
                  )
                ) : (
                  connections.followers?.length > 0 ? (
                    connections.followers.map((connection) => {
                      const { name, photo } = renderUserInfo(connection.connectedUser);
                      return (
                        <ListItem key={connection.connectionId} sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar src={photo} alt={name} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={name}
                            secondary={connection.message || 'Connected'}
                          />
                        </ListItem>
                      );
                    })
                  ) : (
                      <div style={{ color: '#888', textAlign: 'center', padding: 24 }}>
                      No followers yet
                      </div>
                  )
                )}
              </List>
              </div>
          )}
        </>
      )}
      </div>
    </div>
  );

  if (!open || !modalRoot) return null;

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ConnectionsModal; 