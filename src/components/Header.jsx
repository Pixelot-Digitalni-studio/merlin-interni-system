"use client";
import React from 'react';


const Header = ({
    invoiceNumber,
    logo,
    accentColor = '#875FDC',
    secondaryColor = '#181020',
    footerTextColor = '#F3F0FA',
    type = 'invoice',
}) => {
    const isCalendar = type === 'calendar';
    const titleText = isCalendar ? 'PLATEBNÍ KALENDÁŘ' : 'FAKTURA';
    const subtitleText = isCalendar ? 'ROZPIS PLATEB' : 'DAŇOVÝ DOKLAD';

    return (
        <header style={{ ...styles.header, backgroundColor: secondaryColor, color: footerTextColor }}>
            <div style={{ ...styles.stripe, backgroundColor: accentColor }}></div>
            <div style={styles.content}>
                <div style={styles.logoContainer}>
                    {logo && (
                        <img src={logo} alt="Logo" style={styles.logo} />
                    )}
                </div>

                <div style={styles.titleContainer}>
                    <h1 style={styles.title}>{titleText}</h1>
                    <p style={{ ...styles.subtitle, color: accentColor }}>{subtitleText}</p>
                </div>

                <div style={styles.invoiceNumberContainer}>
                    <span style={{ ...styles.invoiceNumber, color: accentColor }}>
                        {invoiceNumber}
                    </span>
                </div>
            </div>
        </header>
    );
};

const styles = {
    header: {
        backgroundColor: 'var(--color-nocni-fiala)',
        display: 'flex',
        alignItems: 'stretch', // Stretch stripe to full height
        color: 'var(--color-fialovy-mramor)',
        height: 'auto', // Allow growth for larger logo
        padding: 0, // Remove padding from main container
        position: 'relative',
        overflow: 'hidden',
    },
    stripe: {
        width: '6px',
        backgroundColor: 'var(--color-kralovnin-serik)',
        flexShrink: 0,
    },
    content: {
        flex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px', // Reduced from 24px vertical
    },
    logoContainer: {
        flex: 1,
        display: 'flex',
        alignItems: 'center', // Center logo vertically in its container
    },
    logo: {
        maxHeight: '40px', // Reduced from 160px
        maxWidth: '160px',
        width: 'auto',
        objectFit: 'contain',
        display: 'block', // Remove baseline gap
    },
    titleContainer: {
        flex: 1,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: '700',
        lineHeight: '1.2',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap', // Prevent wrapping for long titles
    },
    subtitle: {
        color: 'var(--color-kralovnin-serik)',
        fontSize: '0.9rem',
        letterSpacing: '2px',
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    invoiceNumberContainer: {
        flex: 1,
        textAlign: 'right',
    },
    invoiceNumber: {
        fontSize: '1.5rem',
        color: 'var(--color-kralovnin-serik)',
        fontWeight: '500',
        letterSpacing: '2px',
    }
};


export default Header;

