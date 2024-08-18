import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import styles from './Main.module.css';
import html2canvas from 'html2canvas';

const emotionTranslations = {
    "happy": "행복",
    "sad": "슬픔",
    "angry": "화남",
    "surprise": "놀람",
    "neutral": "평온"
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

    return (
        <>
            <div className={styles.apps}>
                <header>
                    <div className={styles.logo}>Smileage</div>
                    <div className={styles.navBox}>
                        <nav className={styles.nav}>
                            <a href="#home">HOME</a>
                            <a href="#apps">APPS</a>
                            <a href="#stories">STORIES</a>
                            <a href="#about">ABOUT</a>
                        </nav>
                    </div>
                    <button className={styles.signIn}>SIGN IN</button>
                </header>

                <div className={styles.container}>
                    <div className={styles.containerBox}>
                        {/* 왼쪽 텍스트 영역 */}
                        <div className={styles.mainText}>
                            <div className={styles.text}>
                                <img src='./img/Sun.png' className={styles.sun}/>
                                <img src='./img/Ball.png' className={styles.ball}/>
                                <p>TRAINING<br />YOUR<br />FACE!</p>
                                <div className={styles.btnBox}>
                                    <button onClick={captureImage} className={styles.btn1}>CAPTURE
                                    <span className={styles.arrow}>▶</span>
                                    </button>
                                </div>
                            </div>
                            <hr className={styles.line1} />
                        </div>

                        {/* 오른쪽 비디오 영역 */}
                        <div className={styles.camBox}>
                            <div className={styles.videoWrapper}>
                                <video className={styles.video} ref={videoRef}></video>
                                {countdown > 0 && (
                                    <div className={styles.countdownOverlay}>
                                        {countdown}
                                    </div>
                                )}
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
                                <div>
                                    Smileage #1
                                </div>
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
