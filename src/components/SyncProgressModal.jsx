"use client";
import React from 'react';

const SyncProgressModal = ({ isSyncing, current, total, filename }) => {
    if (!isSyncing) return null;

    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={styles.title}>Synchronizace dokumentů</div>
                    <div style={styles.count}>{current} z {total}</div>
                </div>

                <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${percent}%` }}></div>
                </div>

                <div style={styles.footer}>
                    {filename && (
                        <div style={styles.filename} title={filename}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="14" height="14" style={{ opacity: 0.5 }}>
                                <path d="M544 384L544 544L96 544L96 384L242.7 384C284.4 425.7 310.2 451.5 320 461.3L397.3 384L544 384zM464 440C450.7 440 440 450.7 440 464C440 477.3 450.7 488 464 488C477.3 488 488 477.3 488 464C488 450.7 477.3 440 464 440zM352 64L352 338.7C382.7 308 404 286.7 416 274.7L461.3 320L320 461.3C317.1 458.4 277.6 418.9 201.4 342.7L178.7 320L224 274.7C236 286.7 257.3 308 288 338.7L288 64L352 64z" />
                            </svg>
                            {filename}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease-out',
    },
    modal: {
        width: '450px',
        backgroundColor: '#1a1625',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(135, 95, 220, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    title: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: 'var(--color-fialovy-mramor)',
    },
    count: {
        fontSize: '0.9rem',
        color: 'var(--color-kralovnin-serik)',
        fontWeight: '500',
        opacity: 0.8,
    },
    progressBarBg: {
        width: '100%',
        height: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '5px',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#875FDC',
        borderRadius: '5px',
        boxShadow: '0 0 15px rgba(135, 95, 220, 0.5)',
        transition: 'width 0.3s ease-out',
    },
    footer: {
        minHeight: '20px',
    },
    filename: {
        fontSize: '0.8rem',
        color: 'var(--color-mlzna-luna)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: 0.7,
    }
};

// Add styles if not already present
if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes modalSlideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(styleTag);
}

export default SyncProgressModal;

