"use client";
import React, { useState, useEffect, useRef } from 'react';

const CustomDatePicker = ({ value, onChange, placeholder, label, align = 'left' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date()); // Date currently being viewed (month/year)
    const [localValue, setLocalValue] = useState(''); // Raw text for input
    const containerRef = useRef(null);

    // Initialize viewDate and localValue from value prop
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setViewDate(date);
                setLocalValue(formatDateDisplay(value));
            }
        } else {
            setLocalValue('');
        }
    }, [value]);

    // Update view date when opening dropdown
    useEffect(() => {
        if (isOpen && value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setViewDate(date);
            }
        }
    }, [isOpen, value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const monthNames = [
        'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
        'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
    ];

    const daysShort = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust to Monday start (0=Mon, 6=Sun)
    };

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const newDate = new Date(Date.UTC(viewDate.getFullYear(), viewDate.getMonth(), day));
        const isoDate = newDate.toISOString().split('T')[0];
        onChange(isoDate);
        setIsOpen(false);
    };

    const formatDateDisplay = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        if (isNaN(date.getTime())) return isoDate;
        return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
    };

    const parseCzechDate = (str) => {
        if (!str) return null;

        // Try Czech formats: DD.MM.YYYY, DD. MM. YYYY, D.M.YYYY
        const czRegex = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/;
        const czMatch = str.match(czRegex);
        if (czMatch) {
            const day = parseInt(czMatch[1], 10);
            const month = parseInt(czMatch[2], 10) - 1;
            const year = parseInt(czMatch[3], 10);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date;
        }

        // Try ISO format: YYYY-MM-DD
        const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
        const isoMatch = str.match(isoRegex);
        if (isoMatch) {
            const year = parseInt(isoMatch[1], 10);
            const month = parseInt(isoMatch[2], 10) - 1;
            const day = parseInt(isoMatch[3], 10);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date;
        }

        return null;
    };

    const handleInputChange = (e) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = () => {
        const parsed = parseCzechDate(localValue);
        if (parsed) {
            // Fix timezone shift: Extract local components instead of using toISOString()
            const y = parsed.getFullYear();
            const m = (parsed.getMonth() + 1).toString().padStart(2, '0');
            const d = parsed.getDate().toString().padStart(2, '0');
            const iso = `${y}-${m}-${d}`;
            onChange(iso);
            setLocalValue(formatDateDisplay(iso));
        } else {
            // Revert if invalid
            setLocalValue(value ? formatDateDisplay(value) : '');
        }
    };

    // Styles
    const inputContainerStyle = {
        width: '100%',
        backgroundColor: 'var(--color-ui-medium)',
        border: '2px solid transparent',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'stretch', // Ensure items fill height
        transition: 'all 0.2s',
        position: 'relative',
        boxSizing: 'border-box'
    };

    const inputStyle = {
        flex: 1,
        minWidth: 0, // Vital for flex behavior
        padding: '14px 16px',
        backgroundColor: 'transparent',
        color: 'var(--color-mlzna-luna)',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        fontFamily: 'var(--font-primary)',
        fontSize: '1rem',
        borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
        boxSizing: 'border-box'
    };

    const iconBtnStyle = {
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--color-kralovnin-serik)',
        transition: 'opacity 0.2s',
        opacity: isOpen ? 1 : 0.7,
        flexShrink: 0 // Don't let the button shrink
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        marginTop: '12px',
        fontWeight: '500',
        color: 'var(--color-fialovy-mramor)',
        fontSize: '0.9rem',
    };

    const dropdownStyle = {
        position: 'absolute',
        top: '100%',
        left: align === 'right' ? 'auto' : 0,
        right: align === 'right' ? 0 : 'auto',
        width: '320px',
        backgroundColor: 'var(--color-ui-dark)',
        border: '2px solid var(--color-kralovnin-serik)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        zIndex: 1000,
        marginTop: '8px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        animation: 'slideDown 0.2s ease-out'
    };

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        color: 'var(--color-kralovnin-serik)',
        fontWeight: 'bold',
        fontSize: '1.1rem'
    };

    const navBtnStyle = {
        background: 'transparent',
        border: 'none',
        color: 'var(--color-mlzna-luna)',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'all 0.2s'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        textAlign: 'center'
    };

    const dayNameStyle = {
        color: 'rgba(209, 195, 239, 0.5)',
        fontSize: '0.8rem',
        marginBottom: '8px',
        fontWeight: '500'
    };

    const dayBtnStyle = (isSelected, isToday) => ({
        padding: '8px 0',
        borderRadius: '4px',
        cursor: 'pointer',
        border: isToday ? '1px solid var(--color-kralovnin-serik)' : '1px solid transparent',
        backgroundColor: isSelected ? 'var(--color-kralovnin-serik)' : 'transparent',
        color: isSelected ? 'white' : 'var(--color-mlzna-luna)',
        fontSize: '0.95rem',
        fontWeight: isSelected || isToday ? '600' : '400',
        transition: 'all 0.2s'
    });

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
        const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const currentDayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
            const isSelected = value && new Date(value).toDateString() === currentDayDate.toDateString();
            const isToday = new Date().toDateString() === currentDayDate.toDateString();

            days.push(
                <div
                    key={d}
                    style={dayBtnStyle(isSelected, isToday)}
                    onClick={() => handleDateClick(d)}
                    onMouseEnter={(e) => {
                        if (!isSelected) {
                            e.target.style.backgroundColor = 'rgba(135, 95, 220, 0.1)';
                            e.target.style.color = 'var(--color-kralovnin-serik)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isSelected) {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--color-mlzna-luna)';
                        }
                    }}
                >
                    {d}
                </div>
            );
        }
        return days;
    };

    return (
        <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
            {label && <label style={labelStyle}>{label}</label>}

            <div
                className="custom-input-wrapper"
                style={inputContainerStyle}
            >
                <input
                    className="custom-date-picker-input"
                    style={inputStyle}
                    type="text"
                    value={localValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={placeholder || 'D. M. YYYY'}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleBlur();
                    }}
                />
                <button
                    style={iconBtnStyle}
                    onClick={() => setIsOpen(!isOpen)}
                    title="Otevřít kalendář"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 640 640" fill="currentColor">
                        <path opacity=".4" d="M96 224L544 224L544 544L96 544L96 224z" />
                        <path d="M256 96L256 64L192 64L192 128L96 128L96 224L544 224L544 128L448 128L448 64L384 64L384 128L256 128L256 96z" />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div style={dropdownStyle}>
                    <div style={headerStyle}>
                        <button style={navBtnStyle} onClick={handlePrevMonth} type="button">&lt;</button>
                        <span>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                        <button style={navBtnStyle} onClick={handleNextMonth} type="button">&gt;</button>
                    </div>

                    <div style={gridStyle}>
                        {daysShort.map(day => (
                            <div key={day} style={dayNameStyle}>{day}</div>
                        ))}
                        {renderCalendar()}
                    </div>

                    <button
                        style={{
                            marginTop: '16px',
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(135, 95, 220, 0.15)',
                            border: '1px solid rgba(135, 95, 220, 0.2)',
                            borderRadius: '8px',
                            color: 'var(--color-kralovnin-serik)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                        type="button"
                        onClick={() => {
                            const today = new Date();
                            const iso = today.toISOString().split('T')[0];
                            onChange(iso);
                            setIsOpen(false);
                        }}
                        onMouseOver={(e) => e.target.style.background = 'rgba(135, 95, 220, 0.25)'}
                        onMouseOut={(e) => e.target.style.background = 'rgba(135, 95, 220, 0.15)'}
                    >
                        Dnes
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;

