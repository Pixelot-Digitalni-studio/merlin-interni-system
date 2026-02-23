"use client";
import React from 'react';

const ConfirmationModal = ({ isOpen, title, message, children, onConfirm, onCancel, confirmText = "Potvrdit", cancelText = "Zrušit", type = "default", confirmButtonClass = "" }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel} style={{ backdropFilter: 'blur(4px)', zIndex: 1000 }}>
            <div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: '450px',
                    backgroundColor: 'var(--color-ui-dark)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: 'none',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    overflow: 'visible'
                }}
            >
                <h3 style={{
                    color: 'var(--color-fialovy-mramor)',
                    margin: '0 0 16px 0',
                    fontSize: '1.4rem',
                    fontWeight: '600'
                }}>
                    {title}
                </h3>

                <p style={{
                    color: 'var(--color-mlzna-luna)',
                    lineHeight: '1.5',
                    fontSize: '1rem',
                    opacity: 0.9
                }}>
                    {message}
                </p>
                {children}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    {type !== 'info' && (
                        <button
                            onClick={onCancel}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: '2px solid var(--color-ui-light)',
                                background: 'var(--color-ui-medium)',
                                color: 'var(--color-mlzna-luna)',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontFamily: 'var(--font-primary)',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'var(--color-ui-light)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'var(--color-ui-medium)'}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={confirmButtonClass}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: '2px solid #D1C3EF00',
                            background: type === 'danger' ? 'rgba(255, 77, 79, 0.2)' : 'var(--color-kralovnin-serik)',
                            color: type === 'danger' ? 'var(--color-ui-red)' : 'var(--color-nocni-fiala)',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontFamily: 'var(--font-primary)',
                            fontWeight: '600',
                            transition: 'all 0.4s ease',
                            boxShadow: type === 'danger' ? 'none' : '0 4px 15px rgba(135, 95, 220, 0.4)'
                        }}
                        onMouseOver={(e) => {
                            if (type === 'danger') {
                                e.target.style.backgroundColor = 'rgba(255, 77, 79, 0.3)';
                                e.target.style.borderColor = 'rgba(255, 77, 79, 0.3)';
                            } else {
                                e.target.style.border = '2px solid #D1C3EF66';
                                e.target.style.boxShadow = `
                                    0 0 2px hsl(259, 58%, 85%),
                                    0 0 8px #875FDC,
                                    0 0 16px #875FDC,
                                    0 0 40px #5e35b1,
                                    inset 0 0 8px rgba(209, 195, 239, 0.8),
                                    inset 0 0 16px rgba(135, 95, 220, 0.4),
                                    inset 0 0 40px rgba(94, 53, 177, 0.1)
                                `;
                            }
                        }}
                        onMouseOut={(e) => {
                            if (type === 'danger') {
                                e.target.style.backgroundColor = 'rgba(255, 77, 79, 0.2)';
                                e.target.style.borderColor = '#D1C3EF00';
                            } else {
                                e.target.style.border = '2px solid #D1C3EF00';
                                e.target.style.boxShadow = '0 4px 15px rgba(135, 95, 220, 0.4)';
                            }
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;

