"use client";
import React, { useState, useEffect } from 'react';

const UpdateNotification = () => {
    const [updateStatus, setUpdateStatus] = useState(null); // null, 'available', 'downloading', 'downloaded', 'error'
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!window.electronAPI) return;

        // Listen for updates
        window.electronAPI.onUpdateAvailable(() => {
            setUpdateStatus('available');
        });

        window.electronAPI.onDownloadProgress((progressObj) => {
            setUpdateStatus('downloading');
            setProgress(Math.round(progressObj.percent));
        });

        window.electronAPI.onUpdateDownloaded(() => {
            setUpdateStatus('downloaded');
        });

        window.electronAPI.onUpdateError((msg) => {
            setUpdateStatus('error');
            setErrorMsg(msg);
            // Hide error after 5 seconds
            setTimeout(() => setUpdateStatus(null), 5000);
        });

    }, []);

    const handleRestart = () => {
        if (window.electronAPI) {
            window.electronAPI.installUpdate();
        }
    };

    const handleClose = () => {
        setUpdateStatus(null);
    };

    if (!updateStatus) return null;

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                {(updateStatus === 'available' || updateStatus === 'downloading') && (
                    <div style={styles.column}>
                        <div style={styles.message}>
                            Nalezena nová aktualizace. Stahuji...
                            {updateStatus === 'available' && <div style={styles.spinner}></div>}
                        </div>
                        <div style={styles.progressRow}>
                            <div style={styles.progressBarBg}>
                                <div style={{ ...styles.progressBarFill, width: `${progress}%` }}></div>
                            </div>
                            <span style={styles.percentage}>{progress}%</span>
                        </div>
                    </div>
                )}

                {updateStatus === 'downloaded' && (
                    <div style={styles.column}>
                        <div style={styles.message}>Aktualizace připravena k instalaci.</div>
                        <button style={styles.restartBtn} className="restart-btn-hover" onClick={handleRestart}>
                            Restartovat a instalovat
                        </button>
                    </div>
                )}

                {updateStatus === 'error' && (
                    <div style={styles.error}>
                        Chyba aktualizace: {errorMsg}
                    </div>
                )}
            </div>

            {updateStatus !== 'downloaded' && (
                <button className="close-btn" onClick={handleClose} style={{ marginLeft: '12px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                        <path opacity=".4" d="M182.9 137.4L160.3 114.7L115 160L137.6 182.6L275 320L137.6 457.4L115 480L160.3 525.3L320.3 365.3L457.6 502.6L480.3 525.3L525.5 480L502.9 457.4L365.5 320L502.9 182.6L525.5 160L480.3 114.7L457.6 137.4L320.3 274.7L182.9 137.4z" />
                    </svg>
                </button>
            )}
        </div>
    );
};

const styles = {
    container: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#1e1b2e', // Dark theme background
        color: '#e2e8f0',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: 9999,
        border: '2px solid var(--color-kralovnin-serik)',
        minWidth: '300px',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'slideIn 0.3s ease-out',
    },
    content: {
        flex: 1,
    },
    column: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    message: {
        fontSize: '0.9rem',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    progressBarBg: {
        flex: 1,
        height: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '3px',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: 'var(--color-kralovnin-serik)',
        transition: 'width 0.2s ease',
    },
    progressRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        marginTop: '4px',
    },
    percentage: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: 'var(--color-kralovnin-serik)',
        minWidth: '40px',
        textAlign: 'right',
    },
    restartBtn: {
        backgroundColor: 'rgba(135, 95, 220, 0.1)',
        color: 'var(--color-kralovnin-serik)',
        border: '2px solid #D1C3EF00',
        padding: '12px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600',
        fontFamily: 'var(--font-primary)',
        marginTop: '12px',
        transition: 'all 0.3s ease',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#888',
        fontSize: '1.3rem',
        cursor: 'pointer',
        padding: '0 4px',
    },
    error: {
        color: '#ff6b6b',
        fontSize: '0.8rem',
    },
    spinner: {
        width: '12px',
        height: '12px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    }
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes slideIn {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.restart-btn-hover:hover {
  background-color: var(--color-kralovnin-serik) !important;
  color: var(--color-nocni-fiala) !important;
  border-color: #D1C3EF66 !important;
  box-shadow: 0 0 2px hsl(259, 58%, 85%),
    0 0 8px #875FDC,
    0 0 16px #875FDC,
    0 0 40px #5e35b1,
    inset 0 0 8px rgba(209, 195, 239, 0.8),
    inset 0 0 16px rgba(135, 95, 220, 0.4),
    inset 0 0 40px rgba(94, 53, 177, 0.1) !important;
}
`;
document.head.appendChild(styleSheet);

export default UpdateNotification;

