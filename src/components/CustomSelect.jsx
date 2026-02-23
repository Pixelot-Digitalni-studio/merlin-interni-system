"use client";
import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({ value, onChange, options, placeholder, bgColor = 'var(--color-ui-medium)', style = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || value || placeholder;

    const wrapperStyle = {
        position: 'relative',
        width: '100%',
        fontFamily: 'var(--font-primary)',
        ...style
    };

    const controlStyle = {
        width: '100%',
        padding: '0 16px',
        backgroundColor: bgColor,
        color: 'var(--color-mlzna-luna)',
        border: `2px solid ${isOpen ? 'var(--color-kralovnin-serik)' : 'transparent'}`,
        borderRadius: 'var(--radius-md)',
        fontSize: '0.9rem',
        height: '48px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.2s ease',
        boxShadow: isOpen ? '0 0 10px rgba(135, 95, 220, 0.2)' : 'none',
        whiteSpace: 'nowrap',
        gap: '12px'
    };

    const arrowStyle = {
        width: '12px',
        height: '12px',
        transition: 'transform 0.3s ease',
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        fill: 'var(--color-kralovnin-serik)'
    };

    const menuStyle = {
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        right: 0,
        backgroundColor: bgColor,
        border: '1px solid var(--color-pruhledna-fiala)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
    };

    const optionStyle = (isSelected) => ({
        padding: '4px 16px',
        cursor: 'pointer',
        color: isSelected ? 'white' : 'var(--color-mlzna-luna)',
        backgroundColor: isSelected ? 'var(--color-kralovnin-serik)' : 'transparent',
        transition: 'background-color 0.2s ease',
        fontSize: '0.9rem'
    });

    return (
        <div style={wrapperStyle} ref={dropdownRef}>
            <div
                className="custom-input"
                style={controlStyle}
                onClick={toggleOpen}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        toggleOpen();
                    }
                }}
            >
                <span>{selectedLabel}</span>
                <svg viewBox="0 0 448 512" style={arrowStyle}>
                    <path d="M201.4 342.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 274.7 86.6 137.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
                </svg>
            </div>

            {isOpen && (
                <div style={menuStyle}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            style={optionStyle(option.value === value)}
                            onClick={() => handleSelect(option.value)}
                            onMouseEnter={(e) => {
                                if (option.value !== value) {
                                    e.target.style.backgroundColor = 'rgba(135, 95, 220, 0.1)';
                                    e.target.style.color = 'var(--color-kralovnin-serik)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (option.value !== value) {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = 'var(--color-mlzna-luna)';
                                }
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;

