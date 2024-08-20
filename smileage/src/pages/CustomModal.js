import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Modal, TextField } from '@mui/material';
import styles from './CustomModal.module.css';
import { ThemeProvider } from "@mui/material/styles";
import theme from "../styles/theme";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CustomModal({ open, onClose, onProceed }) {
  const videoRef = useRef(null);
  const [userName, setUserName] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [recognizedUserName, setRecognizedUserName] = useState('');
  const [userType, setUserType] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let stream;
    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    if (open) {
      startWebcam();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open]);

  useEffect(() => {
    if (userType === 'existing') {
      const socket = new WebSocket('ws://localhost:8000/ws');

      socket.onopen = () => {
        console.log('WebSocket connected');
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.recognized && message.userName) {
            setIsExistingUser(true);
            setRecognizedUserName(message.userName);
            setTimeout(() => navigate('/main'), 2000); // 2 seconds before redirect
          } else if (message.recognized === false) {
            setIsExistingUser(false);
          }
        } catch (error) {
          setImageData(event.data);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
      };

      const sendImage = () => {
        if (videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const context = canvas.getContext('2d');
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64data = reader.result;
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(base64data);
                }
              };
              reader.readAsDataURL(blob);
            }
          }, 'image/jpeg');
        }
      };

      const intervalId = setInterval(sendImage, 1000); // Send image every second
      return () => {
        clearInterval(intervalId);
        socket.close();
      };
    }
  }, [userType, navigate]);

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg'));
  };

  const handleRegister = async () => {
    if (!userName || !capturedImage) {
      alert('닉네임을 입력하고 이미지를 캡처해주세요.');
      return;
    }

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'userFace.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userName', userName);

      const result = await axios.post('http://localhost:8000/register-user', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log(result.data);
      onProceed(userName);
    } catch (error) {
      console.error('Error registering user:', error);
      alert('사용자 등록에 실패했습니다.');
    }
  };

  const handleUserTypeSelection = (type) => {
    setUserType(type); // Set user type to "new" or "existing"
  };

  const handleBack = () => {
    setUserType(null); // Reset to initial state
    setUserName('');
    setCapturedImage(null);
    setIsExistingUser(false);
    setRecognizedUserName('');
  };

  const handleNext = async () => {
    if (userType === 'existing') {
      if (!videoRef.current) {
        alert('Webcam is not available.');
        return;
      }
  
      captureImage();
  
      // Capture image and convert it to base64
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageBlob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg');
      });

      try {
          const file = new File([imageBlob], 'userFace.jpg', { type: 'image/jpeg' });

         const formData = new FormData();
         formData.append('file', file);

        // Send the captured image to the server
        const response = await axios.post('http://localhost:8000/verify-user', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Handle server response
        if (response.data.recognized && response.data.userName) {
          setIsExistingUser(true);
          setRecognizedUserName(response.data.userName);
          setTimeout(() => navigate('/main'), 2000); // Redirect after 2 seconds
        } else {
          setIsExistingUser(false);
          alert('User not recognized. Please check the image and try again.');
        }
      } catch (error) {
        console.error('Error verifying user:', error);
        alert('Error occurred during user verification.');
      }
    } else if (userType === 'new') {
      handleRegister();
    }
  };


  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box className={styles.modalBox}>
        {userType === null ? (
            // Initial screen with options for New User or Existing User
            <div>
              <p className={styles.userType}>사용자 종류를 선택해주세요</p>
              <div className={styles.selectionScreen}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleUserTypeSelection('new')}
                  className={styles.selectionButton}
                >
                  신규 사용자
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleUserTypeSelection('existing')}
                  className={styles.selectionButton}
                >
                  기존 사용자
                </Button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className={styles.webcam}
                autoPlay
                playsInline
                muted
              />
              {userType === 'new' ? (
                <>
                  <Button onClick={captureImage}>Capture Image</Button>
                  <TextField
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="닉네임을 입력해주세요"
                    className={styles.nicknameInput}
                  />
                  <div className={styles.buttonContainerNew}>
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      className={styles.backButton}
                    >
                      BACK
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleRegister}
                      className={styles.nextButton}
                    >
                      NEXT
                    </Button>
                  </div>
                </>
              ) : userType === 'existing' ? (
                <div className={styles.buttonContainerExisting}>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    className={styles.backButton}
                  >
                    BACK
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleNext}
                    className={styles.nextButton}
                  >
                    NEXT
                  </Button>
                </div>
              ) : null}
            {imageData && (
              <img
                src={`data:image/jpeg;base64,${imageData}`}
                alt="Face Detection Result"
                className={styles.detectedImage}
              />
            )}
          </>
        )}
      </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default CustomModal;
