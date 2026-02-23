"use client";
import React from 'react';

const ItemsTable = ({
    items,
    currency = 'CZK',
    accentColor = '#875FDC',
    secondaryColor = '#181020',
    backgroundColor = '#F3F0FA',
    primaryTextColor = '#181020',
    type = 'invoice'
}) => {
    // Use props items, fallback to empty array if undefined
    const tableItems = items || [];
    // Ensure numeric values for calculations
    const cleanItems = tableItems.map(item => ({
        ...item,
        price: typeof item.price === 'string' ? parseFloat(item.price.replace(/\s/g, '').replace(',', '.')) || 0 : item.price,
        total: typeof item.total === 'string' ? parseFloat(item.total.replace(/\s/g, '').replace(',', '.')) || 0 : item.total
    }));

    const symbol = currency === 'EUR' ? '€' : 'Kč';
    const isCalendar = type === 'calendar';

    return (
        <div style={styles.container}>
            {/* Header - Only if there are items */}
            {tableItems.length > 0 && (
                <div style={{
                    ...styles.rowHeader,
                    backgroundColor: secondaryColor,
                    color: accentColor,
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    alignItems: 'center'
                }}>
                    {isCalendar ? (
                        <>
                            <div style={{ ...styles.cell, ...styles.cellName }}>Zdanitelné období</div>
                            <div style={{ ...styles.cell, ...styles.cellQty }}>Splatnost</div>
                            <div style={{ ...styles.cell, ...styles.cellPrice, textAlign: 'right' }}>Částka</div>
                            <div style={{ ...styles.cell, ...styles.cellTotal, textAlign: 'right' }}></div>
                        </>
                    ) : (
                        <>
                            <div style={{ ...styles.cell, ...styles.cellName }}>Název produktu</div>
                            <div style={{ ...styles.cell, ...styles.cellQty }}>Množství</div>
                            <div style={{ ...styles.cell, ...styles.cellPrice }}>Za kus</div>
                            <div style={{ ...styles.cell, ...styles.cellTotal }}>Celkem</div>
                        </>
                    )}
                </div>
            )}

            {/* Rows */}
            {cleanItems.map((item, index) => (
                <div key={index} style={{
                    ...(index % 2 === 0 ? { ...styles.rowEven, backgroundColor } : styles.rowOdd),
                    color: primaryTextColor
                }}>
                    {isCalendar ? (
                        <>
                            <div style={{ ...styles.cell, ...styles.cellName }}>{item._meta ? item._meta.month : item.name}</div>
                            <div style={{ ...styles.cell, ...styles.cellQty }}>{item._meta ? item._meta.splatnost : item.dueDate}</div>
                            <div style={{ ...styles.cell, ...styles.cellPrice, textAlign: 'right' }}>
                                {typeof item.price === 'number' ? `${item.price.toLocaleString('cs-CZ')} ${symbol}` : `${item.price} ${symbol}`}
                            </div>
                            <div style={{ ...styles.cell, ...styles.cellTotal, textAlign: 'right', color: accentColor }}>k zaplacení</div>
                        </>
                    ) : (
                        <>
                            <div style={{ ...styles.cell, ...styles.cellName }}>{item.name}</div>
                            <div style={{ ...styles.cell, ...styles.cellQty }}>{item.qty}</div>
                            <div style={{ ...styles.cell, ...styles.cellPrice }}>
                                {typeof item.price === 'number' ? `${item.price.toLocaleString('cs-CZ')} ${symbol}` : `${item.price} ${symbol}`}
                            </div>
                            <div style={{ ...styles.cell, ...styles.cellTotal }}>
                                {typeof item.total === 'number' ? `${item.total.toLocaleString('cs-CZ')} ${symbol}` : `${item.total} ${symbol}`}
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

const styles = {
    container: {
        flex: 1,
    },
    rowHeader: {
        display: 'flex',
        backgroundColor: 'var(--color-nocni-fiala)',
        color: 'var(--color-kralovnin-serik)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        fontWeight: '500',
        letterSpacing: '1px',
        fontSize: '0.9rem',
    },
    rowEven: {
        display: 'flex',
        backgroundColor: 'var(--color-fialovy-mramor)',
        color: 'var(--color-nocni-fiala)',
        padding: 'var(--spacing-sm) var(--spacing-lg)',
        alignItems: 'center',
    },
    rowOdd: {
        display: 'flex',
        backgroundColor: 'white',
        color: 'var(--color-nocni-fiala)',
        padding: 'var(--spacing-sm) var(--spacing-lg)',
        alignItems: 'center',
    },
    cell: {
        fontSize: '0.9rem',
    },
    cellName: {
        flex: '0 0 50%',
    },
    cellQty: {
        flex: 1,
        textAlign: 'left',
    },
    cellPrice: {
        flex: 1,
        textAlign: 'right',
    },
    cellTotal: {
        flex: 1,
        textAlign: 'right',
    }
};

export default ItemsTable;

