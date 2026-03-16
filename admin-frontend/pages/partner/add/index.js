import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Tab,
  Tabs,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Link
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';
import api from '@/utils/apiSetup';
import { useRouter } from 'next/router';

// Styled components for file upload
const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

// Tab Panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AddPartner() {
  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      address: '',
      pincode: '',
    }
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleReset = () => {
    reset();
    setFile(null);
  };

  // Individual add submission
  const onSubmitIndividual = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', { ...data, userType: "partner" });
      if (response.status === 201) {
        toast.success('Partner Successfully Added');
        // router.push("/admin/partner");
      } else {
        toast.warning('Oops! Something went wrong');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding partner');
    } finally {
      setLoading(false);
    }
  };

  // Bulk upload submission
  const handleBulkUpload = async () => {
    if (!file) {
      toast.warning('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userType', 'partner');
    setLoading(true);
    try {
      const response = await api.post("/auth/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`${response.data.message} ${response.data.count} partners created.`);
      setFile(null);
    //   router.push("/admin/partner");
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', p: 2 }} >
          Add Partner
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Individual Add" />
            <Tab label="Bulk Upload" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleSubmit(onSubmitIndividual)}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Parnter Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="phone"
                  control={control}
                  rules={{
                    required: 'Phone is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Invalid phone number'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  rules={{ required: 'Address is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address"
                      multiline
                      rows={3}
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="pincode"
                  control={control}
                  rules={{
                    required: 'Pincode is required',
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: 'Invalid pincode (should be 6 digits)'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Pincode"
                      error={!!errors.pincode}
                      helperText={errors.pincode?.message}
                    />
                  )}
                />
              </Grid>

            
              <Grid item xs={12}>
                <Controller
                  name="password"
                  control={control}
                  rules={{
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="password"
                      label="Password"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                  )}
                />
              </Grid>

              {/* Buttons */}
              <Grid item container xs={12} spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Adding Partner...' : 'Add Partner'}
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    fullWidth
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bulk Upload Partners
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Download the template and fill in the partner details. The CSV file should contain columns for  name, email, phone, address, and pincode.
              </Typography>
              <Link href="/templates/partners-template.csv" download>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{ mb: 2 }}
                >
                  Download Template
                </Button>
              </Link>
            </Box>

            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              Upload CSV File
              <VisuallyHiddenInput
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Button>

            {file && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                Selected file: {file.name}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleBulkUpload}
                disabled={!file || loading}
                fullWidth
              >
                {loading ? 'Uploading...' : 'Upload Partners'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                fullWidth
              >
                Reset
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
} 