import React from 'react';
import { Snackbar, Alert, Box } from '@mui/material';
import { keyframes } from '@mui/system';

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100px);
  }
`;

export default function Toast({
  open = false,
  onClose,
  message,
  type = 'info',
  duration = 4000,
  position = 'top-center',
}) {
  const getAnchorOrigin = () => {
    const [vertical, horizontal] = position.split('-');
    return {
      vertical: vertical === 'top' ? 'top' : 'bottom',
      horizontal: horizontal === 'center' ? 'center' : horizontal,
    };
  };

  const isBottomPosition = position.includes('bottom');

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={getAnchorOrigin()}
      TransitionProps={{
        timeout: {
          enter: 500,
          exit: 500,
        },
      }}
      sx={{
        ...(position === 'top-center' && {
          top: '60px !important',
          left: '50% !important',
          transform: 'translateX(-50%)',
        }),
        ...(isBottomPosition && {
          bottom: '200px !important',
          left: '50% !important',
          transform: 'translateX(-50%)',
        }),
        '& .MuiSnackbar-root': {
          ...(position === 'top-center' && {
            top: '60px !important',
          }),
        },
      }}
    >
      <Alert
        onClose={onClose}
        severity={type}
        variant="filled"
        sx={{
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          fontSize: '1rem',
          padding: '16px 24px',
          borderRadius: '12px',
          animation: open ? `${slideDown} 0.5s ease-out` : `${slideUp} 0.5s ease-in`,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          lineHeight: '1.5',
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
