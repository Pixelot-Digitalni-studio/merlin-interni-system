"use client";
import React, { useState, useEffect } from 'react';
import CustomerModal from './CustomerModal';
import CustomerService from '../services/CustomerService';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

const monthNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

const CalendarEditor = ({ data, onChange, showAlert, isPrinting }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
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

    // Generator State
    const [startMonth, setStartMonth] = useState(''); // Empty by default
    const [startYear, setStartYear] = useState('');
    const [price, setPrice] = useState('');
    const [dueDay, setDueDay] = useState(''); // Empty = use auto/date default
    const [availableDomains, setAvailableDomains] = useState([]);

    // Watch for customer changes to load their domains
    useEffect(() => {
        const loadCustomerDomains = () => {
            if (!data.customer.name && !data.customer.ico) {
                setAvailableDomains([]);
                return;
            }

            const allCustomers = CustomerService.getAll();
            const found = allCustomers.find(c =>
                (data.customer.ico && c.ico === data.customer.ico) ||
                (data.customer.name && c.name.toLowerCase() === data.customer.name.toLowerCase())
            );

            if (found && found.contractDomains && found.contractDomains.length > 0) {
                const options = found.contractDomains.map(cd => ({
                    value: cd.contractNumber,
                    label: cd.domain,
                    domain: cd.domain // Store domain for reference
                }));
                setAvailableDomains(options);
            } else {
                setAvailableDomains([]);
            }
        };

        loadCustomerDomains();
    }, [data.customer.name, data.customer.ico]);

    // Initialize state
    useEffect(() => {
        if (data.items && data.items.length > 0) {
            const firstItem = data.items[0];
            if (firstItem.price) setPrice(firstItem.price.toString());
            const parts = firstItem.name.split(' ');
            if (parts.length >= 2) {
                const mIdx = monthNames.indexOf(parts[0]);
                if (mIdx !== -1) setStartMonth(mIdx);
                const y = parseInt(parts[1]);
                if (!isNaN(y)) setStartYear(y);
            }
            // Extract dueDay from first item's _meta.splatnost
            if (firstItem._meta && firstItem._meta.splatnost) {
                const splatnost = firstItem._meta.splatnost;
                let day;
                if (splatnost.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    day = parseInt(splatnost.split('-')[2]);
                } else {
                    const parts = splatnost.split('.');
                    if (parts.length >= 1) day = parseInt(parts[0].trim());
                }
                if (day && !isNaN(day)) setDueDay(day.toString());
            }
        } else if (data._prefillPrice !== undefined) {
            // Prefill from renewal data
            if (data._prefillPrice) setPrice(data._prefillPrice.toString());
            if (data._prefillStartMonth !== undefined) setStartMonth(data._prefillStartMonth);
            if (data._prefillStartYear !== undefined) setStartYear(data._prefillStartYear);
            if (data._prefillDueDay) setDueDay(data._prefillDueDay.toString());
        }
    }, [data.items, data._prefillPrice, data._prefillStartMonth, data._prefillStartYear, data._prefillDueDay]);

    const generateYears = () => {
        const current = new Date().getFullYear();
        const years = [];
        for (let i = -1; i < 6; i++) {
            years.push(current + i);
        }
        return years;
    };

    const formatPrice = (val) => {
        if (!val) return '';
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    // Auto-generator
    useEffect(() => {
        if (isPrinting) return;

        // Skip generation if essential values are missing
        if (startMonth === '' || startYear === '' || price === '') {
            return;
        }

        const items = [];
        // Use Due Date as source for the day of month, OR issue date fallback, OR override with specific dueDay input
        const dueSourceDate = data.dates.due ? new Date(data.dates.due) : (data.dates.issue ? new Date(data.dates.issue) : new Date());
        let targetDay = dueSourceDate.getDate();

        if (dueDay && !isNaN(parseInt(dueDay))) {
            targetDay = parseInt(dueDay);
            if (targetDay < 1) targetDay = 1;
            if (targetDay > 31) targetDay = 31;
        }

        for (let i = 0; i < 12; i++) {
            let targetMonthIndex = startMonth + i;
            let yearOffset = Math.floor(targetMonthIndex / 12);
            let finalMonthIndex = targetMonthIndex % 12;
            let finalYear = startYear + yearOffset;

            const monthName = monthNames[finalMonthIndex];
            // Create date for the specific month/year but using the targetDay
            const dueDateObj = new Date(finalYear, finalMonthIndex, targetDay);
            const splatnost = `${dueDateObj.getDate()}. ${dueDateObj.getMonth() + 1}. ${dueDateObj.getFullYear()}`;

            items.push({
                name: `${monthName} ${finalYear}`,
                qty: 1,
                price: price,
                _meta: {
                    month: monthName,
                    year: finalYear,
                    splatnost: splatnost,
                    status: 'k zaplacení'
                }
            });
        }

        const currentItemsJson = JSON.stringify(data.items.map(i => ({ n: i.name, p: i.price, s: i._meta?.splatnost })));
        const newItemsJson = JSON.stringify(items.map(i => ({ n: i.name, p: i.price, s: i._meta?.splatnost })));

        if (currentItemsJson !== newItemsJson) {
            onChange('root', 'items', items);
        }

    }, [startMonth, startYear, price, data.dates.due, data.dates.issue, data.items, dueDay, isPrinting, onChange]);

    // STYLES matching InvoiceEditor strictly
    const inputStyle = {
        width: '100%',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: 'var(--color-ui-medium)',
        color: 'var(--color-mlzna-luna)',
        border: '2px solid transparent',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-primary)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s',
    };



    const sectionStyle = {
        backgroundColor: 'var(--color-ui-dark)',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '24px',
    };

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




    const handleSaveCustomer = () => {
        if (!data.customer.name) return showAlert('Chybějící jméno', 'Vyplňte jméno odběratele.', 'warning');
        CustomerService.add(data.customer);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    };

    return (
        <div className="invoice-editor" style={{ width: '100%', maxWidth: '800px', color: 'white' }}>

            {/* Section: Základní údaje */}
            <div style={{ ...sectionStyle, position: 'relative', zIndex: 20 }} className="animate-slide-up stagger-1">
                <h3 style={sectionTitleStyle}>Základní údaje kalendáře</h3>

                <div style={rowStyle}>
                    <div style={{ ...colStyle, flex: 2 }}>                        <input
                        style={inputStyle}
                        value={data.invoiceNumber}
                        onChange={(e) => onChange('root', 'invoiceNumber', e.target.value)}
                        placeholder="Evidenční číslo"
                    />
                    </div>
                    {/* Empty spacer or currency could go here if needed, but keeping it simple for now */}
                </div>

                <div style={rowStyle}>
                    <div style={colStyle}>
                        <CustomDatePicker
                            value={data.dates.issue}
                            onChange={(isoDate) => onChange('dates', 'issue', isoDate)}
                            placeholder="Vystaveno"
                        />
                    </div>
                </div>
            </div>

            {/* Section: Odběratel */}
            <div style={sectionStyle} className="animate-slide-up stagger-2">
                <h3 style={sectionTitleStyle}>Odběratel</h3>

                <div className="db-buttons" style={{ marginBottom: '16px' }}>
                    <button
                        className="db-btn primary"
                        onClick={() => setModalOpen(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M0 544L110.7 544L113.2 533.2L155 352L48 352L0 544zM24 224C24 263.8 56.2 296 96 296C135.8 296 168 263.8 168 224C168 184.2 135.8 152 96 152C56.2 152 24 184.2 24 224zM472 224C472 263.8 504.2 296 544 296C583.8 296 616 263.8 616 224C616 184.2 583.8 152 544 152C504.2 152 472 184.2 472 224zM485 352L526.8 533.2L529.3 544L640 544L592 352L485 352z" /><path d="M320 288C377.4 288 424 241.4 424 184C424 126.6 377.4 80 320 80C262.6 80 216 126.6 216 184C216 241.4 262.6 288 320 288zM480 544L432 336L208 336L160 544L480 544z" />
                        </svg>
                        Vybrat odběratele
                    </button>
                </div>

                <input
                    style={inputStyle}
                    placeholder="Jméno / Firma"
                    value={data.customer.name}
                    onChange={(e) => onChange('customer', 'name', e.target.value)}
                />

                <input
                    style={inputStyle}
                    placeholder="Adresa"
                    value={data.customer.address}
                    onChange={(e) => onChange('customer', 'address', e.target.value)}
                />

                <div style={rowStyle}>
                    <div style={{ ...colStyle, position: 'relative' }}>
                        <input
                            style={inputStyle}
                            placeholder="IČO"
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
                        <input
                            style={inputStyle}
                            placeholder="DIČ"
                            value={data.customer.dic}
                            onChange={(e) => onChange('customer', 'dic', e.target.value)}
                        />
                    </div>
                </div>




                <div className="db-buttons" style={{ marginTop: '4px', width: '100%', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                    <button
                        className="db-btn"
                        onClick={handleSaveCustomer}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="16" height="16">
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
                </div>
            </div>

            {/* Section: Doména */}
            {availableDomains.length > 0 && (
                <div style={{ ...sectionStyle, position: 'relative', zIndex: 11 }} className="animate-slide-up stagger-2">
                    <h3 style={sectionTitleStyle}>Doména</h3>
                    <div style={{ marginBottom: '0' }}>
                        <CustomSelect
                            options={availableDomains}
                            value={data.contractNumber}
                            onChange={(val) => {
                                // val is the contractNumber
                                onChange('root', 'contractNumber', val);
                            }}
                            placeholder="Vyberte doménu pro číslo smlouvy"
                            bgColor="var(--color-ui-medium)"
                        />
                    </div>
                </div>
            )}

            {/* Section: Nastavení kalendáře */}
            <div style={{ ...sectionStyle, position: 'relative', zIndex: 10 }} className="animate-slide-up stagger-3">
                <h3 style={sectionTitleStyle}>Nastavení kalendáře</h3>

                <div style={rowStyle}>
                    <div style={colStyle}>
                        <input
                            style={inputStyle}
                            value={price}
                            onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Měsíční odměna"
                        />
                    </div>
                    <div style={colStyle}>
                        <input
                            style={inputStyle}
                            value={dueDay}
                            onChange={(e) => setDueDay(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Den splatnosti"
                            maxLength={2}
                        />
                    </div>
                </div>

                <div style={rowStyle}>
                    <div style={{ ...colStyle, flex: 1 }}>
                        <CustomSelect
                            value={startMonth}
                            onChange={(val) => setStartMonth(parseInt(val))}
                            options={monthNames.map((m, idx) => ({ value: idx, label: m }))}
                            placeholder="Startovací měsíc"
                            bgColor="var(--color-ui-medium)"
                        />
                    </div>
                    <div style={colStyle}>
                        <CustomSelect
                            value={startYear}
                            onChange={(val) => setStartYear(parseInt(val))}
                            options={generateYears().map(y => ({ value: y, label: y.toString() }))}
                            placeholder="Startovací rok"
                            bgColor="var(--color-ui-medium)"
                        />
                    </div>
                </div>
            </div>

            {/* Section: Náhled (Table) */}
            <div style={sectionStyle} className="animate-slide-up stagger-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Náhled kalendáře</h3>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(80px, 1fr) minmax(100px, 1fr)',
                    padding: '0 12px 12px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '0',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'var(--color-kralovnin-serik)',
                    letterSpacing: '0.5px'
                }}>
                    <div>Období</div>
                    <div style={{ textAlign: 'right' }}>Částka</div>
                    <div style={{ textAlign: 'right' }}>Status</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {data.items.map((item, idx) => (
                        <div key={idx} style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(80px, 1fr) minmax(100px, 1fr)',
                            padding: '14px 12px 14px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            fontSize: '0.9rem',
                            alignItems: 'center',
                            transition: 'background-color 0.2s',
                        }}>
                            {/* Období */}
                            <div style={{ color: 'var(--color-mlzna-luna)', fontWeight: '400' }}>
                                {item._meta ? item._meta.month : item.name.split(' ')[0]}
                            </div>

                            {/* Splatnost Removed */}

                            {/* Částka */}
                            <div style={{ textAlign: 'right', color: 'var(--color-mlzna-luna)', fontWeight: '400' }}>
                                {formatPrice(item.price)} Kč
                            </div>

                            {/* Status */}
                            <div style={{ textAlign: 'right', color: 'var(--color-mlzna-luna)', fontSize: '0.8rem', fontWeight: '400' }}>
                                k zaplacení
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <CustomerModal
                isOpen={modalOpen}
                mode="select"
                onClose={() => setModalOpen(false)}
                onSelect={(customer) => {
                    onChange('customer', 'name', customer.name);
                    onChange('customer', 'address', customer.address);
                    onChange('customer', 'ico', customer.ico);
                    onChange('customer', 'dic', customer.dic || '');
                    onChange('customer', 'phone', customer.phone || '');
                    onChange('customer', 'email', customer.email || '');
                }}
            />
        </div >
    );
};

export default CalendarEditor;

