"use client";
import React, { useState } from 'react';
import CustomerModal from './CustomerModal';
import CustomerService from '../services/CustomerService';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

const InvoiceEditor = ({ data, onChange, onAddItem, onRemoveItem, onRemoveAllItems, onItemChange, showAlert }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('select'); // 'select' or 'add'
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [duplicateError, setDuplicateError] = useState(false);
    const [isAresLoading, setIsAresLoading] = useState(false);
    const [aresError, setAresError] = useState('');

    const handleAresLookup = async (icoValue) => {
        if (!icoValue || icoValue.length !== 8) return;
        if (!window.electronAPI || !window.electronAPI.getCompanyDetails) return;

        setIsAresLoading(true);
        setAresError('');

        try {
            const result = await window.electronAPI.getCompanyDetails(icoValue);
            if (result.success) {
                // Update specific customer fields
                onChange('customer', 'name', result.name || data.customer.name);
                onChange('customer', 'address', result.address || data.customer.address);
                onChange('customer', 'dic', result.dic || data.customer.dic);
            } else if (result.error) {
                setAresError(result.message);
                setTimeout(() => setAresError(''), 5000);
            }
        } catch (err) {
            console.error('[ARES] Frontend Error:', err);
        } finally {
            setIsAresLoading(false);
        }
    };

    const handleSaveCurrentCustomer = () => {
        if (!data.customer.name) {
            showAlert('Chybějící jméno', 'Nejdříve vyplňte jméno odběratele.', 'warning');
            return;
        }

        if (CustomerService.exists(data.customer)) {
            setDuplicateError(true);
            setTimeout(() => setDuplicateError(false), 5000);
            return;
        }

        CustomerService.add(data.customer);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };


    const inputStyle = {
        width: '100%',
        padding: '14px 16px',
        marginBottom: '16px', // Space between input and next field
        backgroundColor: 'var(--color-ui-medium)',
        color: 'var(--color-mlzna-luna)',
        border: '2px solid transparent', // Default no visible border, but reserve space for focus
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-primary)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s',
    };


    const sectionStyle = {
        backgroundColor: 'var(--color-ui-dark)', // Opacity 0.1 as requested
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '24px',
    };

    // Add these helper styles:
    const sectionTitleStyle = {
        color: 'var(--color-fialovy-mramor)',
        marginBottom: '16px',
        fontSize: '1.2rem',
        fontWeight: '700',
        paddingBottom: '8px'
    };

    const rowStyle = {
        display: 'flex',
        gap: '16px',
        width: '100%',
    };

    const colStyle = {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
    };


    // Helper for formatting price input
    const formatNumber = (val) => {
        if (val === '' || val === null || val === undefined) return '';
        const raw = val.toString().replace(/\s/g, ''); // Remove existing spaces

        // Handle comma or dot for decimal
        if (raw.includes(',')) {
            const parts = raw.split(',');
            return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ',' + parts.slice(1).join('');
        }
        if (raw.includes('.')) {
            const parts = raw.split('.');
            return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ") + '.' + parts.slice(1).join('');
        }

        // Ensure only digits are processed if no separator
        const digits = raw.replace(/[^0-9]/g, '');
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };


    const paymentOptions = [
        { value: 'Převodem', label: 'Převodem' },
        { value: 'Hotově', label: 'Hotově' }
    ];

    return (
        <div className="invoice-editor" style={{ width: '100%', maxWidth: '800px', color: 'white' }}>


            <div style={{ ...sectionStyle, position: 'relative', zIndex: 20 }} className="animate-slide-up stagger-1">
                <h3 style={sectionTitleStyle}>Základní údaje</h3>
                <div style={rowStyle}>
                    <div style={{ ...colStyle, flex: 2 }}>
                        <input
                            style={inputStyle}
                            value={data.invoiceNumber}
                            onChange={(e) => onChange('root', 'invoiceNumber', e.target.value)}
                            placeholder="Číslo faktury"
                        />
                    </div>
                    <div style={{ ...colStyle, flex: 1 }}>
                        <div className="currency-selector">
                            <button
                                className={`currency-btn ${data.currency === 'CZK' ? 'active' : ''}`}
                                onClick={() => onChange('root', 'currency', 'CZK')}
                            >
                                CZK
                            </button>
                            <button
                                className={`currency-btn ${data.currency === 'EUR' ? 'active' : ''}`}
                                onClick={() => onChange('root', 'currency', 'EUR')}
                            >
                                EUR
                            </button>
                        </div>
                    </div>
                </div>
                <div style={rowStyle}>
                    <div style={colStyle}>
                        <CustomDatePicker
                            value={data.dates.issue}
                            onChange={(isoDate) => {
                                onChange('dates', 'issue', isoDate);
                                if (isoDate) {
                                    const date = new Date(isoDate);
                                    date.setDate(date.getDate() + 14);
                                    const dueDate = date.toISOString().split('T')[0];
                                    onChange('dates', 'due', dueDate);
                                }
                            }}
                            placeholder="Vystaveno"
                        />
                    </div>
                    <div style={colStyle}>
                        <CustomDatePicker
                            value={data.dates.due}
                            onChange={(isoDate) => onChange('dates', 'due', isoDate)}
                            placeholder="Splatnost do"
                            align="right"
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginBottom: '16px' }} className="animate-slide-up stagger-2">
                <div style={{ ...sectionStyle, ...colStyle, marginBottom: 0 }}>
                    <h3 style={sectionTitleStyle}>Odběratel</h3>

                    <div className="db-buttons" style={{ marginBottom: '16px' }}>
                        <button
                            className="db-btn primary"
                            onClick={() => {
                                setModalMode('select');
                                setModalOpen(true);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                <path opacity=".4" d="M0 544L110.7 544L113.2 533.2L155 352L48 352L0 544zM24 224C24 263.8 56.2 296 96 296C135.8 296 168 263.8 168 224C168 184.2 135.8 152 96 152C56.2 152 24 184.2 24 224zM472 224C472 263.8 504.2 296 544 296C583.8 296 616 263.8 616 224C616 184.2 583.8 152 544 152C504.2 152 472 184.2 472 224zM485 352L526.8 533.2L529.3 544L640 544L592 352L485 352z" /><path d="M320 288C377.4 288 424 241.4 424 184C424 126.6 377.4 80 320 80C262.6 80 216 126.6 216 184C216 241.4 262.6 288 320 288zM480 544L432 336L208 336L160 544L480 544z" />
                            </svg>
                            Vybrat odběratele
                        </button>
                    </div>

                    <input style={inputStyle} value={data.customer.name} onChange={(e) => onChange('customer', 'name', e.target.value)} placeholder="Jméno / Firma" />
                    <input style={inputStyle} value={data.customer.address} onChange={(e) => onChange('customer', 'address', e.target.value)} placeholder="Adresa" />
                    <div style={rowStyle}>
                        <div style={{ ...colStyle, position: 'relative' }}>
                            <input
                                style={inputStyle}
                                value={data.customer.ico}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    onChange('customer', 'ico', val);
                                    if (val.length === 8) {
                                        handleAresLookup(val);
                                    }
                                }}
                                onBlur={() => {
                                    if (data.customer.ico.length === 8) {
                                        handleAresLookup(data.customer.ico);
                                    }
                                }}
                                placeholder="IČO"
                            />
                            {isAresLoading && (
                                <div style={{ position: 'absolute', right: '12px', top: '14px' }}>
                                    <div className="ares-loader"></div>
                                </div>
                            )}
                            {aresError && (
                                <div style={{ position: 'absolute', left: '0', top: '100%', color: 'var(--color-ui-red)', fontSize: '0.8rem', marginTop: '-12px', paddingLeft: '4px' }}>
                                    {aresError}
                                </div>
                            )}
                        </div>
                        <div style={colStyle}>
                            <input style={inputStyle} value={data.customer.dic} onChange={(e) => onChange('customer', 'dic', e.target.value)} placeholder="DIČ" />
                        </div>
                    </div>
                    <div style={rowStyle}>
                        <div style={colStyle}>
                            <input style={inputStyle} value={data.customer.phone} onChange={(e) => onChange('customer', 'phone', e.target.value)} placeholder="Telefon" />
                        </div>
                        <div style={colStyle}>
                            <input style={inputStyle} value={data.customer.email} onChange={(e) => onChange('customer', 'email', e.target.value)} placeholder="E-mail" />
                        </div>
                    </div>

                    <div className="db-buttons" style={{ marginTop: '4px', width: '100%', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                        <button
                            className="db-btn"
                            onClick={handleSaveCurrentCustomer}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                <path opacity=".4" d="M48 576L464 576L400 368L112 368L48 576zM136 192C136 258.3 189.7 312 256 312C322.3 312 376 258.3 376 192C376 125.7 322.3 72 256 72C189.7 72 136 125.7 136 192z" /><path d="M504 312L504 336L552 336L552 264L624 264L624 216L552 216L552 144L504 144L504 216L432 216L432 264L504 264L504 312z" />
                            </svg>
                            Přidat mezi odběratele
                        </button>
                        {saveSuccess && (
                            <span style={{ color: '#52c41a', display: 'flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: '500' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="20" height="20" style={{ marginRight: '4px' }}>
                                    <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z" />
                                </svg>
                                Uloženo!
                            </span>
                        )}
                        {duplicateError && (
                            <span style={{ color: 'var(--color-ui-red, #ff4d4f)', display: 'flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: '500' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="16" height="16" style={{ marginRight: '4px' }}>
                                    <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zm32 224a32 32 0 1 1 -64 0 32 32 0 1 1 64 0z" />
                                </svg>
                                Tento odběratel je již v seznamu
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div style={sectionStyle} className="animate-slide-up stagger-3">
                <h3 style={sectionTitleStyle}>Položky</h3>
                {data.items.map((item, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginBottom: '24px',
                        backgroundColor: 'transparent',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {/* Row 1: Name and Delete */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    style={{ ...inputStyle, marginBottom: 0 }}
                                    placeholder="Název položky / Služby"
                                    value={item.name}
                                    onChange={(e) => onItemChange(index, 'name', e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => onRemoveItem(index)}
                                className="delete-btn"
                                style={{
                                    width: '40px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 'var(--radius-md)',
                                    marginTop: 0
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                    <path opacity=".4" d="M128 160L512 160L488 576L152 576L128 160z" /><path d="M400 48L240 48L224 96L96 96L96 160L544 160L544 96L416 96L400 48z" />
                                </svg>
                            </button>
                        </div>

                        {/* Row 2: Qty and Price */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    style={{ ...inputStyle, marginBottom: 0, textAlign: 'center' }}
                                    type="number"
                                    placeholder="Ks"
                                    value={item.qty}
                                    onChange={(e) => onItemChange(index, 'qty', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div style={{ flex: 3 }}>
                                <input
                                    style={{ ...inputStyle, marginBottom: 0, textAlign: 'right' }}
                                    type="text"
                                    placeholder="Cena/ks"
                                    value={typeof item.price === 'number' ? formatNumber(item.price) : item.price}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^[0-9\s.,]*$/.test(val)) {
                                            onItemChange(index, 'price', formatNumber(val));
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}


                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                    <button
                        onClick={onAddItem}
                        className="add-item-btn"
                        style={{ marginTop: 0 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M352 128L352 96L288 96L288 288L96 288L96 352L288 352L288 544L352 544L352 352L544 352L544 288L352 288L352 128z" />
                        </svg>
                        Přidat položku
                    </button>
                    <button
                        onClick={onRemoveAllItems}
                        className="delete-all-btn"
                        style={{ marginTop: 0 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M128 160L512 160L488 576L152 576L128 160z" /><path d="M400 48L240 48L224 96L96 96L96 160L544 160L544 96L416 96L400 48z" />
                        </svg>
                        Smazat vše
                    </button>
                </div>
            </div>

            <div style={{ ...sectionStyle, position: 'relative', zIndex: 10 }} className="animate-slide-up stagger-4">
                <h3 style={sectionTitleStyle}>Platba</h3>
                <div style={rowStyle}>
                    <div style={colStyle}>
                        <CustomSelect
                            value={data.payment.method}
                            onChange={(val) => onChange('payment', 'method', val)}
                            options={paymentOptions}
                            placeholder="Forma úhrady"
                        />
                    </div>
                </div>
            </div>

            {/* Modal for Customer Database */}
            <CustomerModal
                isOpen={modalOpen}
                mode={modalMode}
                onClose={() => setModalOpen(false)}
                showContractNumber={false}
                onSelect={(customer) => {
                    onChange('customer', 'name', customer.name);
                    onChange('customer', 'address', customer.address);
                    onChange('customer', 'ico', customer.ico);
                    onChange('customer', 'dic', customer.dic || '');
                    onChange('customer', 'phone', customer.phone || '');
                    onChange('customer', 'email', customer.email || '');
                }}
            />

        </div>
    );
};

export default InvoiceEditor;

