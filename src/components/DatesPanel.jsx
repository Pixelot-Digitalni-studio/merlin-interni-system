"use client";
import React from 'react';

const DatesPanel = ({
    issue,
    due,
    accentColor = '#875FDC',
    secondaryColor = '#181020',
    footerTextColor = '#F3F0FA',
    type = 'invoice',
    subject = '',
    invoiceNumber = ''
}) => {
    // Helper to format date to DD. MM. YYYY
    const formatDate = (dateString) => {
        if (!dateString) return '';

        // Check if already in DD. MM. YYYY format
        if (dateString.match(/^\d{1,2}\.\s\d{1,2}\.\s\d{4}$/)) {
            return dateString;
        }

        // Handle YYYY-MM-DD (standard input date format)
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return `${parseInt(day)}. ${parseInt(month)}. ${year}`;
        }

        return dateString;
    };

    const isCalendar = type === 'calendar';

    if (isCalendar) {
        return (
            <div style={{
                ...styles.container,
                backgroundColor: secondaryColor,
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '8px',
                paddingTop: '16px',
                paddingBottom: '16px',
                borderBottom: '2px solid white'
            }} className="dates-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={styles.dateItem}>
                        <span style={{ ...styles.label, color: accentColor }}>Datum vystavení:</span>
                        <span style={{ ...styles.value, color: footerTextColor }}>{formatDate(issue)}</span>
                    </div>
                    <div style={styles.dateItem}>
                        <span style={{ ...styles.label, color: accentColor }}>Evidenční číslo:</span>
                        <span style={{ ...styles.value, color: footerTextColor }}>{invoiceNumber}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={styles.dateItem}>
                        <span style={{ ...styles.label, color: accentColor }}>Předmět plnění:</span>
                        <span style={{ ...styles.value, color: footerTextColor }}>{subject || 'Licenční poplatky'}</span>
                    </div>
                    <div style={styles.dateItem}>
                        <span style={{ ...styles.label, color: accentColor }}>Datum zdanění (DUZP):</span>
                        <span style={{ ...styles.value, color: footerTextColor }}>Den přijetí platby</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            ...styles.container,
            backgroundColor: secondaryColor,
            paddingTop: '16px',
            paddingBottom: '16px',
            borderBottom: '2px solid white'
        }} className="dates-panel">
            <div style={styles.dateItem}>
                <span style={{ ...styles.label, color: accentColor }}>Datum vystavení:</span>
                <span style={{ ...styles.value, color: footerTextColor }}>{formatDate(issue)}</span>
            </div>
            <div style={styles.dateItem}>
                <span style={{ ...styles.label, color: accentColor }}>Datum splatnosti:</span>
                <span style={{ ...styles.value, color: footerTextColor }}>{formatDate(due)}</span>
            </div>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: 'var(--color-nocni-fiala)',
        color: 'white',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        display: 'flex',
        alignItems: 'center',
        marginTop: '0',
    },
    dateItem: {
        fontSize: '0.9rem',
        display: 'flex',
        gap: 'var(--spacing-sm)',
        flex: '0 0 50%',
    },
    label: {
        color: 'var(--color-kralovnin-serik)',
        letterSpacing: '1px',
        fontSize: '0.9rem',
        fontWeight: '500',
    },
    value: {
        color: 'var(--color-mlzna-luna)',
        fontWeight: '400',
    }
};

export default DatesPanel;

