import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';
import CustomModal from './CustomModal'; // 모달 컴포넌트 임포트

function LandingPage() {

const [isModalOpen, setIsModalOpen] = useState(false);
const navigate = useNavigate();

  const handleClick = () => {
  setIsModalOpen(true); // 버튼 클릭 시 모달 열기
};

  const handleCloseModal = () => {
  setIsModalOpen(false); // 모달 닫기
};

const handleProceed = () => {
  // onProceed 로직: 예를 들어, 닉네임을 저장하거나 다음 페이지로 이동하는 코드
  console.log('Next button clicked! Proceed to the next step.');
  navigate('/main');
  // handleCloseModal(); // 모달을 닫는 예시
};

  return (
    <div className={styles.smileagePage}>
      <main>
        <h1 className={styles.title1}>Welcome to <br />Smileage</h1>
        <p>Earn mileages with every smile!</p>
        <div className={styles.buttons}>
          <button className={styles.primary} onClick={handleClick}>Start Training</button>
        </div>
      </main>
      {/* <div className={styles.flag}></div> */}
      <img src='./img/3dimg2.png' className={styles.flag} />

      <CustomModal 
        open={isModalOpen} 
        onClose={handleCloseModal}
        onProceed={handleProceed}
      />
    </div>
  );
}

export default LandingPage;
