import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Modal } from '@mui/material';
import styles from './CustomModal.module.css';
import { ThemeProvider } from "@mui/material/styles";
import theme from "../styles/theme";

function CustomModal({ open, onClose, onProceed }) {
  const [userType, setUserType] = useState(null); // State to track if the user is new or existing
  const videoRef = useRef(null);

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

    if (open && userType !== null) {
      startWebcam();
    }

    // Cleanup function to stop the webcam when the component unmounts or modal closes
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open, userType]);

  // Reset userType when the modal closes
  useEffect(() => {
    if (!open) {
      setUserType(null);
    }
  }, [open]);

  const handleUserTypeSelection = (type) => {
    setUserType(type); // Set user type to "new" or "existing"
  };

  const handleProceed = () => {
    onProceed(userType);
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
          ) : userType === 'new' ? (
            // Content for new user
            <>
              <p className={styles.userType}>신규 사용자 모달</p>
              <video
                ref={videoRef}
                className={styles.webcam}
                autoPlay
                playsInline
                muted
              />
              <input
                type="text"
                placeholder="닉네임을 입력해주세요"
                className={styles.nicknameInput}
              />
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleProceed}
                className={styles.nextButton}
              >
                Next
              </Button>
            </>
          ) : (
            // Content for existing user
            <>
              <p className={styles.userType}>기존 사용자 모달</p>
              <video
                ref={videoRef}
                className={styles.webcam}
                autoPlay
                playsInline
                muted
              />
              <input
                type="text"
                placeholder="닉네임을 입력해주세요"
                className={styles.nicknameInput}
              />
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleProceed}
                className={styles.nextButton}
              >
                Next
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default CustomModal;
