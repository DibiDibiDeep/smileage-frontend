import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import styles from './Main.module.css';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import '../App.css'

const emotionTranslations = {
    "happy": "행복",
    "sad": "슬픔",
    "angry": "화남",
    "surprise": "놀람",
    "neutral": "평온",
    "fear":"두려움"
};

const translateEmotion = (emotion) => {
    return emotionTranslations[emotion] || emotion;
};

function Main() {
    const videoRef = useRef(null);
    const [predictions, setPredictions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [capturedImage, setCapturedImage] = useState(null);
    const [displayedProbability, setDisplayedProbability] = useState(0);

    const navigate = useNavigate();

    const getUserCamera = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                let video = videoRef.current;
                video.srcObject = stream;
                video.play();
            })
            .catch((error) => {
                console.log(error);
            });
    };

    useEffect(() => {
        getUserCamera();
    }, [videoRef]);

    const captureImage = () => {
        setCountdown(3);
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev === 1) {
                    clearInterval(countdownInterval);
                    takePicture();
                }
                return prev - 1;
            });
        }, 1000);
    };

    const takePicture = () => {
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            const file = new File([blob], 'test.jpg', { type: 'image/jpg' });
            setCapturedImage(URL.createObjectURL(blob));
            sendToServer(file);
        }, 'image/jpg');
    };

    const sendToServer = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8000/predict', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setPredictions(response.data.predictions);
            animateProbability(0, Math.round(response.data.predictions[0].probability * 100));
            setShowModal(true);
        } catch (error) {
            console.error('Error sending image to server:', error.response ? error.response.data : error.message);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setDisplayedProbability(0);
        setCountdown(0);
    };

    const handleSave = () => {
        const modalContent = document.querySelector(`.${styles.modalContent}`);
        html2canvas(modalContent).then((canvas) => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'modal-image.png';
            link.click();
        });
    };

    const animateProbability = (start, end) => {
        let emotionProbability = start;
        const increment = (end - start) / 100;
        const interval = setInterval(() => {
            emotionProbability += increment;
            if (emotionProbability >= end) {
                emotionProbability = end;
                clearInterval(interval);
            }
            setDisplayedProbability(emotionProbability.toFixed(2));
        }, 30);
    };

    const handleClick = () => {
        navigate('/'); // 버튼 클릭 시 '/'으로 이동
      };

    return (
        <>
            <div className={styles.apps}>
            <img src='./img/back.png' className={styles.back}/>
                <header>
                    <div className={styles.logo} onClick={handleClick} style={{display: 'flex', left: '10%'}}>Smileage</div>
                    <img src='./img/Sun.png' className={styles.sun}/>
                </header>

                <div className={styles.container}>
                    <div className={styles.containerBox}>
                        <div className={styles.camBox}>
                        <div className={styles.mainText}>
                            <div className={styles.text}>
                                <p>Training Your Face!</p>
                            </div>
                        </div>
                            <div className={styles.videoWrapper}>
                                <video className={styles.video} ref={videoRef}></video>
                                {countdown > 0 && (
                                    <div className={styles.countdownOverlay}>
                                        {countdown}
                                    </div>
                                )}
                                <div className={styles.btnBox}>
                                    <button onClick={captureImage} className={styles.btn1}>CAPTURE
                                    <span className={styles.arrow}>▶</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Modal show={showModal} onHide={handleClose} className={styles.modalBox}>
                        <Modal.Body className={styles.modalContent}>
                            {capturedImage && (
                                <div className={styles.imagePreview}>
                                    <img src={capturedImage} alt="Captured" className={styles.capturedImage} />
                                </div>
                            )}
                            <div className={styles.emotionResult}>
                                {predictions.length > 0 && (
                                    <>
                                        <div className={styles.progressCircle}>
                                            <svg>
                                                <circle cx="70" cy="70" r="60"></circle>
                                                <circle
                                                    cx="70"
                                                    cy="70"
                                                    r="60"
                                                    style={{
                                                        strokeDashoffset: `calc(377 - (377 * ${displayedProbability}) / 100)`
                                                    }}
                                                ></circle>
                                            </svg>
                                            <div className={styles.percentage}>{translateEmotion(predictions[0].class)}: {Math.round(predictions[0].probability * 100)}%</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Modal.Body>
                        <Modal.Footer className={styles.buttonContainer}>
                            <Button variant="secondary" onClick={handleClose} className={styles.closeBtn}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={handleSave} className={styles.saveBtn}>
                                Save
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            </div>
        </>
    );
}

export default Main;
