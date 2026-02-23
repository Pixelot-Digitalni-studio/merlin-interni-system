"use client";
import React from 'react';

const InvoiceInfo = ({
    supplier,
    customer,
    accentColor = '#875FDC',
    backgroundColor = '#F3F0FA',
    primaryTextColor = '#181020'
}) => {
    return (
        <section style={{ ...styles.container, backgroundColor }}>
            {/* Supplier Section */}
            <div style={styles.section}>
                <div style={styles.verticalLabelContainer}>
                    <span style={{ ...styles.verticalLabel, color: `${accentColor}33` }}>DODAVATEL</span>
                </div>
                <div style={{ ...styles.details, color: primaryTextColor }}>
                    <h3 style={styles.name}>{supplier.name}</h3>
                    <p><span style={{ opacity: 0.7 }}>Sídlo:</span> <strong>{supplier.address}</strong></p>
                    <p><span style={{ opacity: 0.7 }}>IČO:</span> <strong>{supplier.ico}</strong></p>
                    {supplier.dic && <p><span style={{ opacity: 0.7 }}>DIČ:</span> <strong>{supplier.dic}</strong></p>}
                    <div style={{ height: '1rem' }}></div>
                    <p><span style={{ opacity: 0.7 }}>Telefon:</span> <strong>{supplier.phone}</strong></p>
                    <p><span style={{ opacity: 0.7 }}>E-mail:</span> <strong>{supplier.email}</strong></p>
                    <div style={{ height: '1rem' }}></div>
                    <p>{supplier.note}</p>
                </div>
            </div>

            {/* Customer Section */}
            <div style={styles.section}>
                <div style={styles.verticalLabelContainer}>
                    <span style={{ ...styles.verticalLabel, color: `${accentColor}33` }}>ODBĚRATEL</span>
                </div>
                <div style={{ ...styles.details, color: primaryTextColor }}>
                    <h3 style={styles.name}>{customer.name}</h3>
                    <p><span style={{ opacity: 0.7 }}>Sídlo:</span> <strong>{customer.address}</strong></p>
                    <div style={{ height: '1rem' }}></div>
                    <p><span style={{ opacity: 0.7 }}>IČO:</span> <strong>{customer.ico}</strong></p>
                    <p><span style={{ opacity: 0.7 }}>DIČ:</span> <strong>{customer.dic}</strong></p>
                    {(customer.phone || customer.email) && <div style={{ height: '1rem' }}></div>}
                    {customer.phone && <p><span style={{ opacity: 0.7 }}>Telefon:</span> <strong>{customer.phone}</strong></p>}
                    {customer.email && <p><span style={{ opacity: 0.7 }}>E-mail:</span> <strong>{customer.email}</strong></p>}
                </div>
            </div>
        </section>
    );
};

const styles = {
    container: {
        display: 'flex',
        backgroundColor: 'var(--color-fialovy-mramor)',
        minHeight: '200px',
    },
    section: {
        flex: 1,
        display: 'flex',
        padding: '16px var(--spacing-lg)',
    },
    verticalLabelContainer: {
        width: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verticalLabel: {
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        color: 'var(--color-mlzna-luna)',
        fontWeight: '500',
        fontSize: '1.5rem',
        letterSpacing: '6px',
        whiteSpace: 'nowrap',
    },
    details: {
        paddingLeft: 'var(--spacing-md)',
        color: 'var(--color-nocni-fiala)',
        fontSize: '0.9rem',
        lineHeight: '1.6',
    },
    name: {
        fontWeight: '700',
        fontSize: '0.9rem',
        marginBottom: '0.5rem',
    }
};

export default InvoiceInfo;

