import React from 'react';
import { Modal as MuiModal, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from './ResultModal.module.css';

const ResultModal = ({ isOpen, onClose, title, children }) => {
  return (
    <MuiModal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      className={styles.modalOverlay}
    >
      <Box className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <Box className={styles.modalHeader}>
          <Typography id={styles.modalTitle} className={styles.modalTitle}>
            {title}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            className={styles.modalClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ mt: 2 }}>
          {children}
        </Box>
      </Box>
    </MuiModal>
  );
};

export default ResultModal;