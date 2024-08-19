import React, { useEffect, useRef } from 'react';
import { Box, Button, Modal } from '@mui/material';
import styles from './CustomModal.module.css';
import { ThemeProvider } from "@mui/material/styles";
import theme from "../styles/theme";

function CustomModal({ open, onClose, onProceed }) {
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

    if (open) {
      startWebcam();
    }

    // Cleanup function to stop the webcam when the component unmounts or modal closes
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open]);

  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box className={styles.modalBox}>
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
            onClick={onProceed}
            className={styles.nextButton}
          >
            Next
          </Button>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default CustomModal;