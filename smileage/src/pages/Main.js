import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import ResultModal from './ResultModal';
import styles from './Main.module.css';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Chart.js elements registration
ChartJS.register(ArcElement, Tooltip, Legend);

const emotionTranslations = {
    happy: '행복',
    sad: '슬픔',
    angry: '화남',
    surprise: '놀람',
    neutral: '평온',
    fear: '두려움',
};

const translateEmotion = (emotion) => emotionTranslations[emotion] || emotion;

function Main() {
    const videoRef = useRef(null);
    const [predictions, setPredictions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [capturedImage, setCapturedImage] = useState(null);
    const [modalTitle, setModalTitle] = useState('결과');
    const [displayedProbability, setDisplayedProbability] = useState(0);
    const navigate = useNavigate();

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

        try {
            const { data } = await axios.post('http://localhost:8000/predict', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setPredictions(data.predictions);
            setModalTitle(translateEmotion(data.predictions[0].class));
            animateProbability(0, Math.round(data.predictions[0].probability * 100));
            setShowModal(true);
        } catch (error) {
            console.error('Error sending image to server:', error.response?.data || error.message);
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
            link.download = 'modal-image.png';
            link.click();
        });
    };

    const animateProbability = (start, end) => {
        const increment = (end - start) / 100;
        let emotionProbability = start;

        const interval = setInterval(() => {
            emotionProbability += increment;
            if (emotionProbability >= end) {
                emotionProbability = end;
                clearInterval(interval);
            }
            setDisplayedProbability(emotionProbability.toFixed(2));
        }, 30);
    };

    const handleClick = () => navigate('/');

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
                <img src='./img/back.png' className={styles.back} />
                <header>
                    <div className={styles.logo} onClick={handleClick} style={{ display: 'flex', left: '10%' }}>
                        Smileage
                    </div>
                    <img src='./img/Sun.png' className={styles.sun} />
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
                                {countdown > 0 && <div className={styles.countdownOverlay}>{countdown}</div>}
                                <div className={styles.btnBox}>
                                    <button onClick={captureImage} className={styles.btn1}>
                                        CAPTURE <span className={styles.arrow}>▶</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ResultModal isOpen={showModal} onClose={closeModal} title={modalTitle}>
                        {capturedImage && <img src={capturedImage} alt='Captured' className={styles.capturedImage} />}
                        <div className={styles.modalContent}>
                            <h5><b>상세 결과</b></h5>
                            <ul>
                                {predictions.map((prediction, index) => (
                                    <li key={index}>
                                        {translateEmotion(prediction.class)}: {Math.round(prediction.probability * 100)}%
                                    </li>
                                ))}
                            </ul>
                            {/* Doughnut Chart */}
                            {predictions.length > 0 && (
                                <div className={styles.chartWrapper}>
                                    <Doughnut data={doughnutData} />
                                </div>
                            )}
                        </div>
                    </ResultModal>
                </div>
            </div>
        </>
    );
}

export default Main;
