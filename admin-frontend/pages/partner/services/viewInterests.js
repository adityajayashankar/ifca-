// import Footer from "@/components/footer";
// import Topbar from "@/components/topbar/Topbar";
// import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/utils/apiSetup";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Modal, Box, Typography, IconButton, CardMedia } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ViewInterests = () => {
  const router = useRouter();
  const user = useSelector(selectUser)
  const [interests, setInterests] = useState([])
  const [openModal, setOpenModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedService, setSelectedService] = useState();
  const [serviceModal, setServiceModal] = useState(false)
  const { communityId } = router.query;

  console.log('communityId---', communityId)
  console.log('interests---', interests)

  const filteredInterests = interests?.filter((interest) => interest.communityId === parseInt(communityId));



  useEffect(() => {
    if (router.isReady && communityId) {
      fetchresponse();
    }
  }, [router.isReady, communityId]);

  const fetchresponse=async()=>{
    await api.get(`/service/getAllResponsesByCommunityId/${communityId}`)
    .then((res)=>{
      console.log('res--', res?.data?.data)
      setInterests(res?.data?.data)
    })
    .catch((err)=>{
      console.log('err', err)
    })
  }

  const handleOpenModal = (users) => {
    setSelectedUsers(users);
    setOpenModal(true);
  };

  const handleServiceOpenModal = (service)=>{
    setSelectedService(service)
    setServiceModal(true)
  }

  const handleServiceCloseModal = () => {
    setServiceModal(false);
    setSelectedService();
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUsers([]);
  };

  // console.log('interests---', interests)
  console.log('filteredInterests---', filteredInterests)
  // console.log('selectedUsers---', selectedUsers)

  return (
    <>
      {/* <Head>
        <title>IFCA- View Interests</title>
      </Head> */}
      <div className="flex flex-col min-h-screen">
        {/* <header>
          <Topbar />
        </header> */}
        <main className="flex-grow overflow-x-hidden flex flex-col gap-y-[75px]">
    <div className="flex flex-col items-start justify-start min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-semibold mb-6">User Interests</h1>

      {filteredInterests?.length === 0 && (
        <p className="text-gray-500">No Responses yet!!</p>
      )}

      {filteredInterests.length > 0 && (
        <TableContainer component={Paper} style={{borderRadius:'10px'}} className="w-full shadow-md rounded-lg">
          <Table >
            <TableHead>
              <TableRow>
                {/* <TableCell><strong>Service Title</strong></TableCell> */}
                {/* <TableCell><strong>Click to View Users</strong></TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {interests.map((service) => (
                <TableRow key={service.serviceId}>
                <TableCell style={{ fontSize: 20 }}>{service.title}</TableCell>
                
                <TableCell colSpan={2} sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button variant="contained" style={{ fontSize: 14, textTransform:'none' }} color="primary" onClick={() => handleOpenModal(service.users)}>
                    View Interested Users
                  </Button>
                  {/* <Button variant="contained" style={{ fontSize: 14, textTransform:'none' }} color="primary" onClick={() => handleServiceOpenModal(service)}>
                    View Service
                  </Button> */}
                </TableCell>
              </TableRow>
              
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 bg-white shadow-lg rounded-md w-[350px]">
          <Typography style={{marginTop:10, marginBottom:10}} variant="h6" className="mb-4">Interested Users</Typography>
          {selectedUsers?.length > 0 ? (
            <ul className="list-none pl-0">
            {selectedUsers.map((user, index) => (
              <li key={index} className="flex items-center space-x-3 mb-10">
                <img
                  src={user.profileImage || "/default-avatar.png"} 
                  alt={'user'}
                  className="w-10 h-10 rounded-full border border-gray-300"
                />
                <span className="text-gray-700 font-medium">{user.name}</span>
              </li>
            ))}
          </ul>
          
          ) : (
            <Typography style={{marginTop:10, marginBottom:40}} variant="body1" className="text-gray-500">No users Yet</Typography>
          )}
          <Button variant="contained" color="primary" className="mt-16 w-full" onClick={handleCloseModal}>
            Close
          </Button>
        </Box>
      </Modal>

      <Modal open={serviceModal} onClose={handleServiceCloseModal} aria-labelledby="media-modal-title">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 3,
          borderRadius: 2,
        }}
      >
        <IconButton
          sx={{ position: "absolute", top: 10, right: 10 }}
          onClick={handleServiceCloseModal}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" fontWeight="bold" id="media-modal-title" textAlign="center" mb={2}>
          {selectedService?.title}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 2 }}>
        {selectedService?.imageUrl && (
            <CardMedia
              component="img"
              image={selectedService?.imageUrl}
              alt="Service Image"
              sx={{ width: "50%", height: 250, borderRadius: 2 }}
            />
          )}
          {(selectedService?.videoUrl &&  selectedService?.videoUrl !== 'null') && (
            <CardMedia
              component="video"
              src={selectedService?.videoUrl}
              controls
              sx={{ width: "50%", height: 250, borderRadius: 2 }}
            />
          )}
        </Box>

        <Typography variant="body1" color="text.secondary" textAlign="center">
          {selectedService?.description}
        </Typography>
      </Box>
    </Modal>
    </div>
        </main>
        {/* <footer>
          <Footer />
        </footer> */}
      </div>
    </>
  );
};

export default ViewInterests;
