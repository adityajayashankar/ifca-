import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Box, Typography, Button, CircularProgress } from '@mui/material';
import api from '@/utils/apiSetup';

const FormResponsesModal = ({ open, handleClose, formId, userId, communityId }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (formId && userId && communityId && open) {
      const fetchFormResponses = async () => {
        try {
          const response = await api.get('/forms/form/form-responses', {
            params:{
              formId,
              userId,
              communityId,
            }
          });

          setResponses(response.data.responses);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching form responses:', err);
          setError('Failed to fetch form responses');
          setLoading(false);
        }
      };

      fetchFormResponses();
    }
  }, [formId, userId, communityId, open]);

  return (
    <Modal open={open} onClose={handleClose}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'auto',
      minWidth: '50%',
      maxWidth: '600px',
      bgcolor: 'background.paper',
      borderRadius: '12px', 
      boxShadow: 24,
      p: 4,
      maxHeight: '80vh',
      overflowY: 'auto',
      border: '1px solid #ddd',
    }}
  >
    <Typography
      variant="h5"
      component="h2"
      sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center', color: '#1976d2' }}
    >
      📋 Your Responses
    </Typography>

    {loading && (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress />
      </Box>
    )}

    

    {responses.length > 0 && !loading && (
      <ul>
        {responses.map((response) => (
          <li
            key={response.questionId}
            className="mb-4"
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
              marginBottom: '12px',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold', color: '#333' }}
            >
              Question
            </Typography>
            <Typography
              sx={{
                mb: 1,
                fontStyle: 'italic',
                color: '#555',
                background: '#e3f2fd',
                padding: '8px',
                borderRadius: '6px',
              }}
            >
              {response.question.question}
            </Typography>

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold', color: '#333' }}
            >
              📝 Response
            </Typography>
            <Typography
              sx={{
                background: '#e8f5e9',
                padding: '8px',
                borderRadius: '6px',
                color: '#2e7d32',
              }}
            >
              {response.answer}
            </Typography>
          </li>
        ))}
      </ul>
    )}

    {!loading && responses.length === 0 && (
      <Typography
        sx={{
          textAlign: 'center',
          color: '#d32f2f',
          fontWeight: 'bold',
          mt: 2,
        }}
      >
        No responses found for this form.
      </Typography>
    )}

    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleClose}
        sx={{
          borderRadius: '20px',
          textTransform: 'none',
          fontWeight: 'bold',
          px: 3,
          py: 1,
        }}
      >
        Close
      </Button>
    </Box>
  </Box>
</Modal>

  );
};

export default FormResponsesModal;
