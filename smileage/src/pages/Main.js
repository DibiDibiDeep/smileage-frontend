import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import styles from './Main.module.css';
import html2canvas from 'html2canvas';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Chart.js elements registration
ChartJS.register(ArcElement, Tooltip, Legend);

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
    const [modalTitle, setModalTitle] = useState('결과');
    const [displayedProbability, setDisplayedProbability] = useState(0);
    const [userName, setUserName] = useState('');
    const [mileagePoints, setMileagePoints] = useState(0);
    const [mileageMessage, setMileageMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();


    useEffect(() => {
        if (location.state && location.state.userName) {
            setUserName(location.state.userName);
        }
    }, [location]);

    useEffect(() => {
        const getUserCamera = () => {
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then((stream) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }
                })
                .catch((error) => console.log('Camera access error:', error));
        };
        getUserCamera();
    }, []);

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
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'captured_image.jpg', { type: 'image/jpg' });
                setCapturedImage(URL.createObjectURL(blob));
                sendToServer(file);
            }
        }, 'image/jpg');
    };

    const sendToServer = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userName', userName);

        try {
            const response = await axios.post('http://localhost:8000/predict', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setPredictions(response.data.predictions);

            if (response.data.predictions[0].class === 'happy' && response.data.predictions[0].probability >= 0.9) {
                const mileageResponse = await axios.post('http://localhost:8000/add-mileage', { userName }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                setMileagePoints(mileageResponse.data.mileage);
                setMileageMessage(mileageResponse.data.message);
            }

            animateProbability(0, Math.round(response.data.predictions[0].probability * 100));
            setShowModal(true);
        } catch (error) {
            console.error('Error sending image to server:', error.response ? error.response.data : error.message);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setCapturedImage(null);
        setModalTitle('결과');
        setCountdown(0);
        setDisplayedProbability(0);
    };

    const handleSave = () => {
        const modalContent = document.querySelector(`.${styles.modalContent}`);
        html2canvas(modalContent).then((canvas) => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'smileage.png';
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
    
    // Prepare data for Doughnut chart
    const doughnutData = {
        labels: predictions.map((prediction) => translateEmotion(prediction.class)),
        datasets: [
            {
                data: predictions.map((prediction) => Math.round(prediction.probability * 100)),
                backgroundColor: ['#ffa726', '#ffca28', '#ffee58'], // happy, sad, angry, surprise, neutral, and fear.
                hoverBackgroundColor: ['#ffa726', '#ffca28', '#ffee58'],
            },
        ],
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
                                <p className={styles.userName}>{userName}님 환영합니다!</p>
                                {/* 마일리지 결과 표시 */}
                                <p className={styles.message}>{mileageMessage}</p>
                                <p className={styles.userName}>현재 마일리지: {mileagePoints}점</p>
                                <p className={styles.text1}>TRAINING YOUR FACE!</p>
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
                    <Modal show={showModal} onHide={closeModal} className={styles.modalBox}>
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
                                            {/* Doughnut Chart */}
                                                {predictions.length > 0 && (
                                                    <div className={styles.chartWrapper}>
                                                        <Doughnut data={doughnutData} />
                                                    </div>
                                                )}
                                            <div className={styles.percentage}>{translateEmotion(predictions[0].class)}: {Math.round(predictions[0].probability * 100)}%</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Modal.Body>
                        <Modal.Footer className={styles.buttonContainer}>
                            <Button variant="secondary" onClick={closeModal} className={styles.closeBtn}>
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
