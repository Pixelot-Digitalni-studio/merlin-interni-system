"use client";
import React, { useState, useEffect, useMemo } from 'react';
import InvoiceService from '../services/InvoiceService';
import CustomerService from '../services/CustomerService';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import ConfirmationModal from './ConfirmationModal';
import SectionHeader from './SectionHeader';

const monthNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

const CashflowView = ({ profile, onProfileChange }) => {
    const [activeTab, setActiveTab] = useState('income'); // 'income' or 'expenses'
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        id: null,
        monthKey: null,
        targetStatus: null,
        label: '',
        type: 'invoice' // 'invoice' or 'calendar'
    });
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        setInvoices(InvoiceService.getAll());
    }, []);

    const currentMonthKey = `${selectedYear}-${selectedMonth}`;

    // Aggregation Logic
    const { visualInvoices, financialTotal, yearlyData } = useMemo(() => {
        let visualList = [];
        let finTotal = 0;

        // Build contract number -> domain lookup from all customers
        const allCustomers = CustomerService.getAll();
        const contractToDomainMap = {};
        allCustomers.forEach(c => {
            if (c.contractDomains) {
                c.contractDomains.forEach(cd => {
                    if (cd.contractNumber && cd.domain) {
                        contractToDomainMap[cd.contractNumber] = cd.domain;
                    }
                });
            }
        });

        // Initialize 12 months for the selected year
        const yearly = Array.from({ length: 12 }, (_, i) => ({
            month: (i + 1).toString().padStart(2, '0'),
            name: monthNames[i],
            income: 0
        }));

        invoices.forEach(inv => {
            // 1. Handle Invoices
            if (inv.type === 'invoice' || !inv.type) {
                const issueStr = inv.data?.dates?.issue || inv.issueDate;
                if (!issueStr) return;

                const [y, m] = issueStr.split('-');
                const invMonthKey = `${y}-${m}`;

                // Aggregate yearly income if it's paid and in the selected year
                if (inv.status === 'paid' && inv.paidDate) {
                    const [pY, pM] = inv.paidDate.split('-');
                    if (pY === selectedYear) {
                        const mIdx = parseInt(pM) - 1;
                        if (yearly[mIdx]) yearly[mIdx].income += (inv.total || 0);

                        // Current month financial total
                        if (pM === selectedMonth) {
                            finTotal += (inv.total || 0);
                        }
                    }
                }

                // Add to visual list if it belongs to selected month (by ISSUE date)
                if (invMonthKey === currentMonthKey) {
                    visualList.push({
                        ...inv,
                        visualDate: issueStr,
                        sourceType: 'invoice',
                        label: inv.invoiceNumber
                    });
                }
            }
            // 2. Handle Calendars
            else if (inv.type === 'calendar') {
                const monthlyAmount = (inv.total || 0) / 12;

                // Extract months this calendar actually covers from its items
                const items = inv.data?.items || [];
                const plannedMonths = items.map(item => {
                    const splatnost = item._meta?.splatnost;
                    if (!splatnost) return null;
                    if (splatnost.includes('-')) return splatnost.substring(0, 7); // YYYY-MM
                    const parts = splatnost.split('.');
                    if (parts.length >= 3) return `${parts[2].trim()}-${parts[1].trim().padStart(2, '0')}`;
                    return null;
                }).filter(Boolean);

                const startMonthKey = plannedMonths.length > 0 ? plannedMonths[0] : null;
                let endMonthKey = null;

                if (inv.calendarInactiveDate) {
                    if (inv.calendarInactiveDate.includes('-')) {
                        endMonthKey = inv.calendarInactiveDate.substring(0, 7);
                    } else {
                        const parts = inv.calendarInactiveDate.split('.');
                        if (parts.length >= 3) {
                            endMonthKey = `${parts[2].trim()}-${parts[1].trim().padStart(2, '0')}`;
                        }
                    }
                } else if (plannedMonths.length > 0) {
                    endMonthKey = plannedMonths[plannedMonths.length - 1];
                }

                // 1. Add paid months to historical income, but ONLY IF within active range
                if (inv.payments && startMonthKey && endMonthKey) {
                    Object.entries(inv.payments).forEach(([mKey, pay]) => {
                        // Check if the payment month falls within the active range
                        if (mKey >= startMonthKey && mKey <= endMonthKey) {
                            if (pay.status === 'paid' && pay.paidDate) {
                                const [pY, pM] = pay.paidDate.split('-');
                                if (pY === selectedYear) {
                                    const mIdx = parseInt(pM) - 1;
                                    if (yearly[mIdx]) yearly[mIdx].income += monthlyAmount;

                                    if (pM === selectedMonth) {
                                        finTotal += monthlyAmount;
                                    }
                                }
                            }
                        }
                    });
                }

                const isPaidForCurrentMonth = inv.payments?.[currentMonthKey]?.status === 'paid';

                // Decide if it should be visible in visual list for current selected month
                // Must be within Active From/To range
                let shouldBeVisible = false;
                if (startMonthKey && endMonthKey) {
                    if (currentMonthKey >= startMonthKey && currentMonthKey <= endMonthKey) {
                        shouldBeVisible = true;
                    }
                }

                // Extra fallback: Show if it was already marked as paid for this month (financial integrity)
                if (isPaidForCurrentMonth) {
                    shouldBeVisible = true;
                }

                if (shouldBeVisible) {
                    // Add to visual list if it belongs to selected month
                    const paymentInfo = inv.payments?.[currentMonthKey] || { status: 'unpaid' };

                    let contractNum = inv.data?.contractNumber || inv.invoiceNumber;
                    let domain = contractToDomainMap[contractNum] || '-';

                    visualList.push({
                        id: inv.id,
                        parentId: inv.id,
                        customerName: inv.customerName,
                        total: monthlyAmount,
                        status: paymentInfo.status,
                        paidDate: paymentInfo.paidDate,
                        visualDate: `${currentMonthKey}-01`,
                        sourceType: 'calendar',
                        label: contractNum,
                        domain: domain
                    });
                }
            }
        });

        // Filter by search term
        const filtered = visualList.filter(inv => {
            const search = searchTerm.toLowerCase();
            const nameMatch = inv.customerName?.toLowerCase().includes(search);
            const domainMatch = inv.domain?.toLowerCase().includes(search);
            const labelMatch = inv.label?.toLowerCase().includes(search);
            return nameMatch || domainMatch || labelMatch;
        });

        // Sort by customer name (Alphabetical A-Z)
        filtered.sort((a, b) => {
            const nameA = (a.customerName || '').trim();
            const nameB = (b.customerName || '').trim();
            return nameA.localeCompare(nameB, 'cs', { sensitivity: 'accent' });
        });

        return {
            visualInvoices: filtered,
            financialTotal: finTotal,
            yearlyData: yearly
        };
    }, [invoices, searchTerm, selectedYear, selectedMonth, currentMonthKey]);

    const expectedTotal = useMemo(() => {
        return visualInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    }, [visualInvoices]);

    const yearlyIncomeTotal = useMemo(() => {
        return yearlyData.reduce((sum, m) => sum + m.income, 0);
    }, [yearlyData]);

    const yearlySetAsideTotal = useMemo(() => {
        return yearlyData.reduce((sum, m) => {
            const social = profile?.insuranceSettings?.[selectedYear]?.social ?? 3350;
            const health = profile?.insuranceSettings?.[selectedYear]?.health ?? 1408;
            const tax = Math.round(m.income * 0.4 * 0.15);
            return sum + social + health + tax;
        }, 0);
    }, [yearlyData, profile, selectedYear]);

    const handleToggleStatus = (item) => {
        const nextStatus = item.status === 'paid' ? 'unpaid' : 'paid';
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setConfirmationModal({
            isOpen: true,
            id: item.sourceType === 'calendar' ? item.parentId : item.id,
            monthKey: item.sourceType === 'calendar' ? currentMonthKey : null,
            targetStatus: nextStatus,
            label: `${item.customerName} (${item.label})`,
            type: item.sourceType
        });
    };

    const confirmToggle = () => {
        let updated;
        if (confirmationModal.type === 'calendar') {
            updated = InvoiceService.toggleCalendarMonthPaid(
                confirmationModal.id,
                confirmationModal.monthKey,
                paymentDate,
                confirmationModal.targetStatus
            );
        } else {
            updated = InvoiceService.togglePaid(confirmationModal.id, paymentDate);
        }

        if (updated) {
            setInvoices(updated);
        }
        setConfirmationModal({ ...confirmationModal, isOpen: false });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('cs-CZ');
    };

    const InsuranceInput = ({ label, value, onChange, year }) => {
        const [displayValue, setDisplayValue] = useState(value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "));

        useEffect(() => {
            setDisplayValue(value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "));
        }, [value]);

        const handleChange = (e) => {
            const raw = e.target.value.replace(/\s/g, '');
            if (/^\d*$/.test(raw)) {
                setDisplayValue(raw.replace(/\B(?=(\d{3})+(?!\d))/g, " "));
                onChange(parseInt(raw) || 0);
            }
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>
                    {label} ({year})
                </label>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--color-ui-dark)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    transition: 'all 0.2s ease',
                    width: '140px',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                }} className="insurance-input-wrapper">
                    <input
                        type="text"
                        value={displayValue}
                        onChange={handleChange}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--color-mlzna-luna)',
                            fontFamily: 'var(--font-primary)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            width: '100%',
                            outline: 'none',
                            textAlign: 'right',
                            padding: 0
                        }}
                    />
                    <span style={{ marginLeft: '8px', fontSize: '0.9rem', opacity: 0.5, fontWeight: '500', color: 'var(--color-mlzna-luna)' }}>Kč</span>
                </div>
            </div>
        );
    };

    return (
        <div className="cashflow-view" style={{ color: 'var(--color-mlzna-luna)' }}>

            {/* Filter and Search Section */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                {/* Tab Switcher */}
                <div className="status-tabs">
                    <button
                        className={`status-tab ${activeTab === 'income' ? 'active' : ''}`}
                        onClick={() => setActiveTab('income')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M80 490.6L80 576L560 576L560 490.6C560 402.8 521 319.4 453.5 263.2L406.4 224L233.6 224L186.5 263.2C119 319.5 80 402.8 80 490.6zM192 64L248 176L392 176L448 64L192 64zM252 364.5C252 335.7 275.2 312.3 304 312L304 288L344 288L344 312L372 312L372 352L304.5 352C297.6 352 292 357.6 292 364.5C292 370.6 296.4 375.8 302.4 376.8L344.1 383.8C369.4 388 388 409.9 388 435.6C388 435.6C388 461.7 369 483.3 344 487.4L344 512.1L304 512.1L304 488.1L260 488.1L260 448.1L335.5 448.1C342.4 448.1 348 442.5 348 435.6C348 429.5 343.6 424.3 337.6 423.3L295.9 416.3C270.5 412 252 390.1 252 364.5z" /><path d="M432 176L208 176L208 224L432 224L432 176zM344 288L304 288L304 312C275.2 312.3 252 335.7 252 364.5C252 390.2 270.5 412.1 295.9 416.3L337.6 423.3C343.6 424.3 348 429.5 348 435.6C348 442.5 342.4 448.1 335.5 448.1L260 448.1L260 488.1L304 488.1L304 512.1L344 512.1L344 487.4C369 483.3 388 461.7 388 435.6C388 409.9 369.5 388 344.1 383.8L302.4 376.8C296.4 375.8 292 370.6 292 364.5C292 357.6 297.6 352 304.5 352L372 352L372 312L344 312L344 288z" />
                        </svg>
                        Příjmy
                    </button>
                    <button
                        className={`status-tab ${activeTab === 'expenses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expenses')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="16" height="16">
                            <path opacity=".4" d="M32 448L32 576L428.4 576L438.6 569C539.8 499.4 593.4 462.6 599.6 458.3L554.3 392.4C542.6 400.5 500.1 429.7 426.8 480L288 480L288 432L416 432L416 368L178.7 368L169.3 377.4L98.7 448L32 448z" /><path d="M296 48L344 48L344 84L388 84L388 140L294.2 140C288.5 140 284 144.6 284 150.2C284 155.4 287.8 159.7 293 160.4L354 168C387.1 172.1 412 200.3 412 233.7C412 270.3 382.3 299.9 345.8 299.9L344 299.9L344 335.9L296 335.9L296 299.9L244 299.9L244 243.9L345.8 243.9C351.5 243.9 356 239.3 356 233.7C356 228.5 352.2 224.2 347 223.5L286 216C252.9 211.9 228 183.7 228 150.3C228 113.7 257.7 84.1 294.2 84.1L296 84.1L296 48.1z" />
                        </svg>
                        Výdaje
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search (only for Income) */}
                    {activeTab === 'income' && (
                        <div style={{ width: '30%' }}>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Hledat..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', marginBottom: 0 }}
                            />
                        </div>
                    )}

                    <div style={{ width: '120px' }}>
                        <CustomSelect
                            options={Array.from({ length: 5 }, (_, i) => ({ value: (2024 + i).toString(), label: (2024 + i).toString() }))}
                            value={selectedYear}
                            onChange={setSelectedYear}
                            bgColor="var(--color-ui-dark)"
                        />
                    </div>
                    <div style={{ width: '160px' }}>
                        <CustomSelect
                            options={monthNames.map((name, i) => ({ value: (i + 1).toString().padStart(2, '0'), label: name }))}
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            bgColor="var(--color-ui-dark)"
                        />
                    </div>

                    {activeTab === 'expenses' && (
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: 'auto' }}>
                            <InsuranceInput
                                label="Sociální"
                                year={selectedYear}
                                value={profile?.insuranceSettings?.[selectedYear]?.social ?? 3350}
                                onChange={(val) => {
                                    const settings = { ...(profile.insuranceSettings || {}) };
                                    settings[selectedYear] = { ...(settings[selectedYear] || { health: 1408 }), social: val };
                                    onProfileChange('insuranceSettings', settings);
                                }}
                            />
                            <InsuranceInput
                                label="Zdravotní"
                                year={selectedYear}
                                value={profile?.insuranceSettings?.[selectedYear]?.health ?? 1408}
                                onChange={(val) => {
                                    const settings = { ...(profile.insuranceSettings || {}) };
                                    settings[selectedYear] = { ...(settings[selectedYear] || { social: 3350 }), health: val };
                                    onProfileChange('insuranceSettings', settings);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                {activeTab === 'income' ? (
                    /* INCOME SECTION */
                    <div style={{ flex: 1, backgroundColor: 'var(--color-ui-dark)', padding: '24px', borderRadius: '12px' }}>
                        <h2 style={{ color: 'var(--color-fialovy-mramor)', marginBottom: '24px', fontSize: '1.8rem', letterSpacing: '2px' }}>
                            Příjmy <span className="purple-badge">{monthNames[parseInt(selectedMonth) - 1]} {selectedYear}</span>
                        </h2>

                        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                            {/* LEFT HALF: TABLE (2/3) */}
                            <div style={{ flex: 3, minWidth: 0 }}>
                                <div className="invoice-table-container animate-fade-in" style={{ backgroundColor: 'var(--color-ui-medium)', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table className="invoice-table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left' }}>
                                                <th style={{ width: '120px' }}>Číslo</th>
                                                <th>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        Odběratel
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            backgroundColor: 'var(--color-kralovnin-serik)',
                                                            color: 'var(--color-nocni-fiala)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontWeight: '700',
                                                            opacity: 0.8
                                                        }}>A-Z ↑</span>
                                                    </div>
                                                </th>
                                                <th style={{ width: '150px' }}>Vystaveno/Doména</th>
                                                <th style={{ textAlign: 'center', width: '120px' }}>Zaplaceno</th>
                                                <th style={{ textAlign: 'right', width: '120px' }}>Částka</th>
                                                <th style={{ textAlign: 'center', width: '110px' }}>Stav</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visualInvoices.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', opacity: 0.3 }}>Žádné příjmy.</td>
                                                </tr>
                                            ) : (
                                                visualInvoices.map((inv) => (
                                                    <tr key={inv.id}>
                                                        <td className="col-number">
                                                            {inv.label}
                                                        </td>
                                                        <td style={{ fontWeight: '500', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {inv.customerName}
                                                        </td>
                                                        <td style={{ fontSize: '0.9rem' }}>
                                                            {inv.sourceType === 'calendar' ? (
                                                                inv.domain && inv.domain !== '-' ? (
                                                                    <span className="purple-badge">{inv.domain}</span>
                                                                ) : <span style={{ opacity: 0.3 }}>-</span>
                                                            ) : formatDate(inv.visualDate)}
                                                        </td>
                                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                            {inv.status === 'paid' && inv.paidDate ? (
                                                                <span style={{ color: 'var(--color-ui-green)', fontWeight: '500', fontSize: '0.9rem' }}>
                                                                    {formatDate(inv.paidDate)}
                                                                </span>
                                                            ) : (
                                                                <span style={{ opacity: 0.2 }}>-</span>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-fialovy-mramor)' }}>
                                                            {inv.total.toLocaleString()} Kč
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <span
                                                                className={`status-tag ${inv.status === 'paid' ? 'active' : 'pending'}`}
                                                                onClick={() => handleToggleStatus(inv)}
                                                                style={{ cursor: 'pointer', display: 'inline-block', minWidth: '100px', textAlign: 'center', justifyContent: 'center' }}
                                                            >
                                                                {inv.status === 'paid' ? 'Zaplaceno' : 'Nezaplaceno'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* RIGHT HALF: SUMMARY TILES (1/3) */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{
                                    backgroundColor: 'var(--color-ui-medium)',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Očekávaný příjem</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--color-fialovy-mramor)' }}>
                                        {expectedTotal.toLocaleString()} <span style={{ fontSize: '1.1rem', fontWeight: '400' }}>Kč</span>
                                    </span>
                                </div>
                                <div style={{
                                    backgroundColor: 'transparent',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    border: '2px solid var(--color-kralovnin-serik)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    boxShadow: '0 0 15px rgba(135, 95, 220, 0.05)'
                                }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-mlzna-luna)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Skutečný příjem</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--color-kralovnin-serik)' }}>
                                        {financialTotal.toLocaleString()} <span style={{ fontSize: '1.1rem', fontWeight: '400', color: 'var(--color-mlzna-luna)', opacity: 0.5 }}>Kč</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* EXPENSES SECTION */
                    <div style={{ flex: 1, minWidth: 0, backgroundColor: 'var(--color-ui-dark)', padding: '24px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ color: 'var(--color-fialovy-mramor)', margin: 0, fontSize: '1.6rem', letterSpacing: '2px' }}>
                                Výdaje <span className="purple-badge">{selectedYear}</span>
                            </h2>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                            {/* LEFT HALF: TABLE (3/4) */}
                            <div style={{ flex: 3, minWidth: 0 }}>
                                <div className="invoice-table-container animate-fade-in" style={{ backgroundColor: 'var(--color-ui-medium)', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table className="invoice-table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left' }}>
                                                <th>Měsíc</th>
                                                <th style={{ textAlign: 'right' }}>Příjem</th>
                                                <th style={{ textAlign: 'right' }}>Sociální</th>
                                                <th style={{ textAlign: 'right' }}>Zdravotní</th>
                                                <th style={{ textAlign: 'right' }}>Daně</th>
                                                <th style={{ textAlign: 'right' }}>Stranou</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {yearlyData.map((m) => {
                                                const social = profile?.insuranceSettings?.[selectedYear]?.social ?? 3350;
                                                const health = profile?.insuranceSettings?.[selectedYear]?.health ?? 1408;
                                                const tax = Math.round(m.income * 0.4 * 0.15);
                                                const setAside = social + health + tax;
                                                const isSelected = m.month === selectedMonth;

                                                return (
                                                    <tr key={m.month} style={{
                                                        backgroundColor: isSelected ? 'rgba(135, 95, 220, 0.1)' : 'transparent',
                                                        fontWeight: isSelected ? '600' : 'normal'
                                                    }}>
                                                        <td style={{ color: isSelected ? 'var(--color-kralovnin-serik)' : 'inherit' }}>{m.name}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: '700', color: m.income > 0 ? 'var(--color-fialovy-mramor)' : 'inherit' }}>
                                                            {m.income > 0 ? <>{m.income.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.5 }}>Kč</span></> : '-'}
                                                        </td>
                                                        <td style={{ textAlign: 'right', opacity: 0.7 }}>{social.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.5 }}>Kč</span></td>
                                                        <td style={{ textAlign: 'right', opacity: 0.7 }}>{health.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.5 }}>Kč</span></td>
                                                        <td style={{ textAlign: 'right', opacity: 0.7 }}>{tax.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.5 }}>Kč</span></td>
                                                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--color-mlzna-luna)' }}>
                                                            {setAside.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.5 }}>Kč</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* RIGHT HALF: SUMMARY TILES (1/4) */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{
                                    backgroundColor: 'var(--color-ui-medium)',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Roční příjem</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--color-fialovy-mramor)' }}>
                                        {yearlyIncomeTotal.toLocaleString()} <span style={{ fontSize: '1.1rem', fontWeight: '400' }}>Kč</span>
                                    </span>
                                </div>
                                <div style={{
                                    backgroundColor: 'transparent',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    border: '2px solid var(--color-kralovnin-serik)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    boxShadow: '0 0 15px rgba(135, 95, 220, 0.05)'
                                }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-mlzna-luna)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Stranou</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--color-kralovnin-serik)' }}>
                                        {yearlySetAsideTotal.toLocaleString()} <span style={{ fontSize: '1.1rem', fontWeight: '400', color: 'var(--color-mlzna-luna)', opacity: 0.5 }}>Kč</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                title={confirmationModal.targetStatus === 'paid' ? "Označit jako uhrazené?" : "Zrušit úhradu?"}
                message={confirmationModal.targetStatus === 'paid'
                    ? `K jakému dni byla položka "${confirmationModal.label}" uhrazena?`
                    : `Opravdu chcete zrušit označení úhrady u položky "${confirmationModal.label}"?`}
                onConfirm={confirmToggle}
                onCancel={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                confirmText={confirmationModal.targetStatus === 'paid' ? "Ano, uhrazeno" : "Ano, zrušit"}
            >
                {confirmationModal.targetStatus === 'paid' && (
                    <div style={{ marginTop: '20px' }}>
                        <CustomDatePicker
                            label="Datum úhrady"
                            value={paymentDate}
                            onChange={setPaymentDate}
                        />
                    </div>
                )}
            </ConfirmationModal>
        </div>
    );
};

export default CashflowView;

