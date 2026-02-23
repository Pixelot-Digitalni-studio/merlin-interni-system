"use client";
import React, { useEffect } from 'react';
import InvoicePDFPreview from './InvoicePDFPreview';

const InvoicePreviewModal = ({ isOpen, onClose, invoiceData }) => {
    // Close on escape key
    useEffect(() => {
        if (!isOpen || !onClose) return;
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Prevent scrolling of body when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen || !invoiceData) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content preview-modal-content"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: '1000px',
                    width: '95%',
                    height: '90vh',
                    padding: '0',
                    backgroundColor: 'var(--color-ui-dark)',
                    display: 'flex',
                    flexDirection: 'column',
                    border: 'none',
                    boxShadow: 'none'
                }}
            >
                <div className="modal-header" style={{ padding: '20px 24px', margin: 0 }}>
                    <h2>{invoiceData.type === 'calendar' ? 'Náhled platebního kalendáře' : 'Náhled faktury'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M182.9 137.4L160.3 114.7L115 160L137.6 182.6L275 320L137.6 457.4L115 480L160.3 525.3L320.3 365.3L457.6 502.6L480.3 525.3L525.5 480L502.9 457.4L365.5 320L502.9 182.6L525.5 160L480.3 114.7L457.6 137.4L320.3 274.7L182.9 137.4z" />
                        </svg>
                    </button>
                </div>

                <div className="preview-area" style={{ flex: 1, overflowY: 'auto', padding: '40px', backgroundColor: '#0f0a15', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <InvoicePDFPreview
                        invoiceData={invoiceData}
                        scale={0.8}
                        marginBottom="-200px"
                        showBorders={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default InvoicePreviewModal;


