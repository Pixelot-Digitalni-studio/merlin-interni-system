"use client";
import React from 'react';

const SectionHeader = ({ title, subtitle, icon }) => {
    return (
        <div className="page-header">
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px'
            }}>
                {/* Ikona v boxu */}
                {icon && (
                    <div style={{
                        backgroundImage: 'linear-gradient(45deg, #8E5BE308, #875FDC32)',
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }} className="header-icon-container">
                        {React.cloneElement(icon, { size: 36, width: 36, height: 36 })}
                    </div>
                )}

                {/* Nadpisy */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0px',
                    textAlign: 'left'
                }}>
                    <h1>
                        {title}
                    </h1>
                    {subtitle && (
                        <p>
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div >
    );
};

export default SectionHeader;

