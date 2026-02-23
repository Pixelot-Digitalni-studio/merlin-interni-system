"use client";
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateSpaydString } from '../utils/payment';

const Footer = ({
    payment,
    currency = 'CZK',
    accentColor = '#875FDC',
    secondaryColor = '#181020',
    footerTextColor = '#F3F0FA',
    type = 'invoice',
    monthlyAmount = 0
}) => {
    const spaydString = generateSpaydString(payment);
    const symbol = currency === 'EUR' ? '€' : 'Kč';
    const isCalendar = type === 'calendar';

    return (
        <footer style={{ ...styles.footer, backgroundColor: secondaryColor, color: footerTextColor }}>
            {/* Left Section: QR Code (Invoice) or Bank Info (Calendar) */}
            <div style={styles.leftSection}>
                {!isCalendar ? (
                    <>
                        <h4 style={{ ...styles.qrTitle, color: accentColor }}>QR platba:</h4>
                        <div style={{ ...styles.qrPlaceholder, backgroundColor: `${accentColor}1F` }}>
                            {spaydString ? (
                                <QRCodeSVG
                                    value={spaydString}
                                    size={110}
                                    fgColor={accentColor}
                                    bgColor="transparent"
                                    level="M"
                                    includeMargin={false}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, fontSize: '0.8rem', textAlign: 'center' }}>
                                    Chybí IBAN
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ ...styles.bankInfo, maxWidth: 'none', width: 'fit-content' }}>
                        <div style={styles.bankRow}>
                            <span style={{ ...styles.bankLabel, color: accentColor }}>Variabilní symbol:</span>
                            <span style={{ ...styles.bankValue, color: footerTextColor, marginLeft: '24px' }}>{payment.variableSymbol}</span>
                        </div>
                        <div style={styles.bankRow}>
                            <span style={{ ...styles.bankLabel, color: accentColor }}>Forma úhrady:</span>
                            <span style={{ ...styles.bankValue, color: footerTextColor, marginLeft: '24px' }}>{payment.method}</span>
                        </div>
                        <div style={styles.bankRow}>
                            <span style={{ ...styles.bankLabel, color: accentColor }}>Bankovní účet:</span>
                            <span style={{ ...styles.bankValue, color: footerTextColor, marginLeft: '24px' }}>{payment.account}</span>
                        </div>
                        {currency === 'EUR' && (
                            <>
                                {payment.iban && (
                                    <div style={styles.bankRow}>
                                        <span style={{ ...styles.bankLabel, color: accentColor }}>IBAN:</span>
                                        <span style={{ ...styles.bankValue, color: footerTextColor, marginLeft: '24px' }}>{payment.iban}</span>
                                    </div>
                                )}
                                {payment.swift && (
                                    <div style={styles.bankRow}>
                                        <span style={{ ...styles.bankLabel, color: accentColor }}>SWIFT:</span>
                                        <span style={{ ...styles.bankValue, color: footerTextColor, marginLeft: '24px' }}>{payment.swift}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Right Section: Totals and Bank Info (Invoice only) */}
            <div style={styles.rightSection}>
                <div style={styles.totalRow}>
                    <span style={{ ...styles.totalLabel, color: accentColor }}>
                        {isCalendar ? 'Měsíční odměna:' : 'Celkem k úhradě:'}
                    </span>
                    <span style={{ ...styles.totalValue, color: footerTextColor }}>
                        {isCalendar ? monthlyAmount.toLocaleString() : payment.total.toLocaleString()} {symbol}
                    </span>
                </div>

                {!isCalendar && (
                    <div style={styles.bankInfo}>
                        <div style={styles.bankRow}>
                            <span style={{ ...styles.bankLabel, color: accentColor }}>Variabilní symbol:</span>
                            <span style={{ ...styles.bankValue, color: footerTextColor }}>{payment.variableSymbol}</span>
                        </div>
                        <div style={styles.bankRow}>
                            <span style={{ ...styles.bankLabel, color: accentColor }}>Forma úhrady:</span>
                            <span style={{ ...styles.bankValue, color: footerTextColor }}>{payment.method}</span>
                        </div>
                        <div style={styles.bankRow}>
                            <span style={{ ...styles.bankLabel, color: accentColor }}>Bankovní účet:</span>
                            <span style={{ ...styles.bankValue, color: footerTextColor }}>{payment.account}</span>
                        </div>
                        {currency === 'EUR' && (
                            <>
                                {payment.iban && (
                                    <div style={styles.bankRow}>
                                        <span style={{ ...styles.bankLabel, color: accentColor }}>IBAN:</span>
                                        <span style={{ ...styles.bankValue, color: footerTextColor }}>{payment.iban}</span>
                                    </div>
                                )}
                                {payment.swift && (
                                    <div style={styles.bankRow}>
                                        <span style={{ ...styles.bankLabel, color: accentColor }}>SWIFT:</span>
                                        <span style={{ ...styles.bankValue, color: footerTextColor }}>{payment.swift}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </footer>
    );
};

const styles = {
    footer: {
        backgroundColor: 'var(--color-nocni-fiala)',
        color: 'var(--color-fialovy-mramor)',
        padding: '16px var(--spacing-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '140px',
    },
    leftSection: {
        flex: 1,
    },
    qrTitle: {
        color: 'var(--color-kralovnin-serik)',
        marginBottom: 'var(--spacing-md)',
        letterSpacing: '1px',
        fontSize: '0.9rem',
        fontWeight: '500',

    },
    qrPlaceholder: {
        width: '136px', // Adjusted for padding/border if needed, but QRCode is 120
        height: '136px',
        backgroundColor: 'var(--color-pruhledna-fiala)', // QR code with transparent bg on dark bg
        borderRadius: '8px',
        padding: '8px', // Check padding
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightSection: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    totalRow: {
        marginBottom: '1.4rem',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
    },
    totalLabel: {
        color: 'var(--color-kralovnin-serik)',
        fontSize: '0.9rem',
        letterSpacing: '1px',
        fontWeight: '500',

    },
    totalValue: {
        fontSize: '1.5rem',
        fontWeight: '700',
    },
    bankInfo: {
        width: '100%',
        maxWidth: '320px',
    },
    bankRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.4rem',
    },
    bankLabel: {
        color: 'var(--color-kralovnin-serik)',
        fontSize: '0.9rem',
        letterSpacing: '1px',
        fontWeight: '500',
    },
    bankValue: {
        fontWeight: '400',
        color: 'var(--color-mlzna-luna)',
        fontSize: '0.9rem',

    }
};

export default Footer;

