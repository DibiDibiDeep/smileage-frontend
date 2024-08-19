import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Modal, TextField, Typography } from '@mui/material';
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
            setTimeout(() => navigate('/main'), 2000); // 2초 후 자동으로 메인 페이지로 이동
          } else if (message.recognized === false) {
            setIsExistingUser(false);
          }
      } catch (error) {
        // 이미지 데이터 처리
        setImageData(event.data);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // 실시간으로 이미지 캡처 후 WebSocket으로 전송
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

    if (open) {
      const intervalId = setInterval(sendImage, 1000); // 1초마다 이미지 전송
      return () => clearInterval(intervalId);
    }

    return () => {
      socket.close();
    };
  }, [open, navigate]);

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
           {isExistingUser ? (
            <Typography variant="h6">
              환영합니다, {recognizedUserName}님! 곧 메인 페이지로 이동합니다.
            </Typography>
          ) : (
            <>
              <Button onClick={captureImage}>Capture Image</Button>
              <TextField
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="닉네임을 입력해주세요"
                className={styles.nicknameInput}
              />
              <Button
                variant="outlined"
                onClick={handleRegister}
                className={styles.nextButton}
              >
                NEXT
              </Button>
            </>
          )}
          {imageData && (
            <img
              src={`data:image/jpeg;base64,${imageData}`}
              alt="Face Detection Result"
              className={styles.detectedImage}
            />
          )}
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default CustomModal;