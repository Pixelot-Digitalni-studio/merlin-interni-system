"use client";
import React, { useState, useEffect } from 'react';
import EditIcon from './icons/EditIcon';
import ViewIcon from './icons/ViewIcon';
import InvoicePreviewModal from './InvoicePreviewModal';
import ConfirmationModal from './ConfirmationModal';
import SyncProgressModal from './SyncProgressModal';
import InvoiceService from '../services/InvoiceService';
import CustomerService from '../services/CustomerService';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import { normalizeString } from '../utils/stringUtils';
import { getInvoiceFilename } from '../utils/invoiceUtils';


const InvoiceHistory = ({ onDownload, onEdit }) => {
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState('all'); // all, paid, unpaid
    const [activeType, setActiveType] = useState('invoice'); // invoice, calendar
    const [sortType, setSortType] = useState('number'); // number, name
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');

    const [activeYear, setActiveYear] = useState(currentYear);
    const [activeMonth, setActiveMonth] = useState(currentMonth);
    const [previewModal, setPreviewModal] = useState({
        isOpen: false,
        invoiceData: null
    });
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        invoiceId: null,
        targetStatus: null, // 'paid' or 'unpaid'
        invoiceNumber: ''
    });
    const [syncSuccessModal, setSyncSuccessModal] = useState({
        isOpen: false,
        count: 0
    });
    const [syncProgress, setSyncProgress] = useState({
        isSyncing: false,
        current: 0,
        total: 0,
        filename: ''
    });
    const [deactivationDate, setDeactivationDate] = useState('');
    const [paymentDate, setPaymentDate] = useState('');

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        if (dateString.match(/^\d{1,2}\.\s\d{1,2}\.\s\d{4}$/)) return dateString;
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return `${parseInt(day)}. ${parseInt(month)}. ${year}`;
        }
        return dateString;
    };

    const getYearMonth = (dateString) => {
        if (!dateString) return { year: null, month: null };
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [y, m] = dateString.split('-');
            return { year: y, month: m };
        }
        if (dateString.match(/^\d{1,2}\.\s\d{1,2}\.\s\d{4}$/)) {
            const parts = dateString.split('.');
            if (parts.length < 3) return { year: null, month: null };
            const y = parts[2].trim();
            const m = parts[1].trim().padStart(2, '0');
            return { year: y, month: m };
        }
        return { year: null, month: null };
    };

    const loadData = React.useCallback(() => {
        if (activeType === 'trash') {
            setInvoices(InvoiceService.getDeleted());
            if (InvoiceService.syncDeletedFromDisk) {
                InvoiceService.syncDeletedFromDisk().then(updated => {
                    if (activeType === 'trash') setInvoices(updated);
                });
            }
        } else {
            InvoiceService.checkExpiredCalendars();
            setInvoices(InvoiceService.getAll());
        }
    }, [activeType]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const contractToDomainMap = React.useMemo(() => {
        const map = {};
        const customers = CustomerService.getAll();
        customers.forEach(c => {
            if (c.contractDomains) {
                c.contractDomains.forEach(cd => {
                    if (cd.contractNumber && cd.domain) {
                        map[cd.contractNumber] = cd.domain;
                    }
                });
            }
        });
        return map;
    }, []); // Rebuild when invoices change (which might indicate data updates, though customers are separate, it's a safe enough trigger)

    // Register sync progress listener once
    useEffect(() => {
        if (window.electronAPI && window.electronAPI.onSyncProgress) {
            const handler = (data) => {
                setSyncProgress(prev => ({
                    ...prev,
                    current: data.current,
                    total: data.total,
                    filename: data.filename
                }));
            };
            window.electronAPI.onSyncProgress(handler);
        }
    }, []);

    const handleDelete = (inv) => {
        setConfirmationModal({
            isOpen: true,
            invoiceId: inv.id,
            type: activeType === 'trash' ? 'hard_delete' : 'delete',
            invoiceNumber: inv.invoiceNumber
        });
    };

    const confirmDelete = async () => {
        if (confirmationModal.invoiceId) {
            const invoiceToDelete = invoices.find(inv => inv.id === confirmationModal.invoiceId);
            if (invoiceToDelete && window.electronAPI) {
                const filename = getInvoiceFilename(invoiceToDelete);
                await window.electronAPI.deletePDF({
                    filename,
                    issueDate: invoiceToDelete.issueDate,
                    type: invoiceToDelete.type || 'invoice'
                });
            }

            let updated;
            if (activeType === 'trash') {
                updated = InvoiceService.hardDelete(confirmationModal.invoiceId);
            } else {
                updated = InvoiceService.moveToTrash(confirmationModal.invoiceId);
            }
            // If we are in 'all' or specific type, we just reload valid invoices
            // If we are in 'trash', updated is the trash list
            if (activeType === 'trash') {
                setInvoices(updated);
            } else {
                // If we moved to trash, we need to refresh the current list (without the moved item)
                // moveToTrash returns the UPDATED active list
                setInvoices(updated);
            }
        } else if (confirmationModal.type === 'empty_trash') {
            // Delete all PDFs in trash
            if (window.electronAPI) {
                for (const inv of invoices) {
                    const filename = getInvoiceFilename(inv);
                    await window.electronAPI.deletePDF({
                        filename,
                        issueDate: inv.issueDate,
                        type: inv.type || 'invoice'
                    });
                }
            }
            const updated = InvoiceService.emptyTrash();
            setInvoices(updated);
        }
        setConfirmationModal({ ...confirmationModal, isOpen: false });
    };

    const handleRestore = (inv) => {
        const updatedTrash = InvoiceService.restore(inv.id);
        setInvoices(updatedTrash);
    };

    const handleEmptyTrash = () => {
        setConfirmationModal({
            isOpen: true,
            type: 'empty_trash',
            invoiceId: null,
            targetStatus: null,
            invoiceNumber: ''
        });
    };

    const handleSyncPDFs = async () => {
        if (syncProgress.isSyncing) return;

        setSyncProgress({ isSyncing: true, current: 0, total: 0, filename: 'Inicializace...' });

        try {
            if (window.electronAPI && window.electronAPI.synchronizeAll) {
                const result = await window.electronAPI.synchronizeAll();
                console.log('Sync result:', result);

                if (result && result.success) {
                    setSyncSuccessModal({
                        isOpen: true,
                        count: result.missingCount
                    });
                }
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setSyncProgress({ isSyncing: false, current: 0, total: 0, filename: '' });
            loadData();
        }
    };

    const handleTogglePaid = (inv) => {
        const nextStatus = inv.status === 'paid' ? 'unpaid' : 'paid';
        setPaymentDate(new Date().toISOString().split('T')[0]); // Default to today
        setConfirmationModal({
            isOpen: true,
            invoiceId: inv.id,
            targetStatus: nextStatus,
            invoiceNumber: inv.invoiceNumber
        });
    };

    const confirmTogglePaid = () => {
        if (confirmationModal.invoiceId) {
            let updated;
            if (confirmationModal.toggleType === 'calendarActive') {
                updated = InvoiceService.toggleCalendarActive(
                    confirmationModal.invoiceId,
                    confirmationModal.targetStatus === 'inactive' ? deactivationDate : null
                );
            } else {
                updated = InvoiceService.togglePaid(confirmationModal.invoiceId, paymentDate);
            }
            if (updated) {
                setInvoices(updated);
            }
        }
        setDeactivationDate('');
        setPaymentDate('');
        setConfirmationModal({ ...confirmationModal, isOpen: false });
    };

    const filteredInvoices = invoices.filter(inv => {
        const query = normalizeString(searchTerm);
        const number = normalizeString(inv.invoiceNumber || '');
        const customer = normalizeString(inv.customerName || '');
        const dateStr = inv.issueDate || '';
        const dateNorm = normalizeString(dateStr);

        const matchesSearch = number.includes(query) ||
            customer.includes(query) ||
            dateNorm.includes(query);

        const { year, month } = getYearMonth(dateStr);

        const matchesStatus = activeStatus === 'all' || inv.status === activeStatus;
        // If in trash, we show all types. Otherwise check type match.
        const matchesType = activeType === 'all' || activeType === 'trash' || (inv.type || 'invoice') === activeType;
        const matchesYear = activeYear === 'all' || year === activeYear;
        const matchesMonth = activeMonth === 'all' || month === activeMonth;

        return matchesSearch && matchesStatus && matchesType && matchesYear && matchesMonth;
    }).sort((a, b) => {
        if (sortType === 'name') {
            return (a.customerName || '').localeCompare(b.customerName || '', 'cs');
        } else {
            // Default: number (numerical descending)
            const numA = parseInt((a.invoiceNumber || '').replace(/\D/g, ''), 10) || 0;
            const numB = parseInt((b.invoiceNumber || '').replace(/\D/g, ''), 10) || 0;
            return numB - numA;
        }
    });

    const years = [...new Set(invoices.map(inv => getYearMonth(inv.issueDate).year).filter(Boolean))].sort((a, b) => b - a);
    const months = [
        { val: '01', label: 'Leden' }, { val: '02', label: 'Únor' }, { val: '03', label: 'Březen' },
        { val: '04', label: 'Duben' }, { val: '05', label: 'Květen' }, { val: '06', label: 'Červen' },
        { val: '07', label: 'Červenec' }, { val: '08', label: 'Srpen' }, { val: '09', label: 'Září' },
        { val: '10', label: 'Říjen' }, { val: '11', label: 'Listopad' }, { val: '12', label: 'Prosinec' }
    ];



    return (
        <div style={{ color: 'white', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Main Type Tabs */}
                <div className="status-tabs">
                    <button
                        className={`status-tab ${activeType === 'invoice' ? 'active' : ''}`}
                        onClick={() => setActiveType('invoice')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M128 64L128 576L512 576L512 208L368 64L128 64zM192 128L288 128L288 176L192 176L192 128zM192 224L288 224L288 272L192 272L192 224zM192 352L448 352L448 480L192 480L192 352zM336 122.5L453.5 240L336 240L336 122.5z" />
                            <path d="M216 128L192 128L192 176L288 176L288 128L216 128zM216 224L192 224L192 272L288 272L288 224L216 224zM192 352L192 480L448 480L448 352L192 352z" />
                        </svg>
                        Faktury
                    </button>
                    <button
                        className={`status-tab ${activeType === 'calendar' ? 'active' : ''}`}
                        onClick={() => { setActiveType('calendar'); setActiveStatus('all'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M96 224L544 224L544 544L96 544L96 224zM160 288L160 352L224 352L224 288L160 288zM160 416L160 480L224 480L224 416L160 416zM288 288L288 352L352 352L352 288L288 288zM288 416L288 480L352 480L352 416L288 416zM416 288L416 352L480 352L480 288L416 288zM416 416L416 480L480 480L480 416L416 416z" />
                            <path d="M256 96L256 64L192 64L192 128L96 128L96 224L544 224L544 128L448 128L448 64L384 64L384 128L256 128L256 96z" />
                        </svg>
                        Kalendáře
                    </button>
                    <button
                        className={`status-tab trash-tab ${activeType === 'trash' ? 'active' : ''}`}
                        onClick={() => { setActiveType('trash'); setActiveStatus('all'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M128 160L512 160L488 576L152 576L128 160z" /><path d="M400 48L240 48L224 96L96 96L96 160L544 160L544 96L416 96L400 48z" />
                        </svg>
                        Koš
                    </button>
                </div>

                {/* Filters and Actions Row */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ width: '30%' }}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Hledat doklad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', marginBottom: 0 }}
                        />
                    </div>

                    {/* Sort Type filter */}
                    <div style={{ minWidth: '160px' }}>
                        <CustomSelect
                            value={sortType}
                            onChange={setSortType}
                            options={[
                                { value: 'number', label: 'Podle čísla' },
                                { value: 'name', label: 'Podle názvu' }
                            ]}
                            placeholder="Seřadit podle"
                            bgColor="var(--color-ui-dark)"
                        />
                    </div>

                    {/* Status filter (only for Invoices) */}
                    {activeType === 'invoice' && (
                        <div style={{ minWidth: '160px' }}>
                            <CustomSelect
                                value={activeStatus}
                                onChange={setActiveStatus}
                                options={[
                                    { value: 'all', label: 'Všechny stavy' },
                                    { value: 'paid', label: 'Uhrazené' },
                                    { value: 'unpaid', label: 'Neuhrazené' }
                                ]}
                                placeholder="Stav"
                                bgColor="var(--color-ui-dark)"
                            />
                        </div>
                    )}

                    {/* Date Filters (Year and Month) */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ minWidth: '150px' }}>
                            <CustomSelect
                                value={activeYear}
                                onChange={setActiveYear}
                                options={[
                                    { value: 'all', label: 'Všechny roky' },
                                    ...years.map(y => ({ value: y, label: y.toString() }))
                                ]}
                                placeholder="Všechny roky"
                                bgColor="var(--color-ui-dark)"
                            />
                        </div>

                        <div style={{ minWidth: '170px' }}>
                            <CustomSelect
                                value={activeMonth}
                                onChange={setActiveMonth}
                                options={[
                                    { value: 'all', label: 'Všechny měsíce' },
                                    ...months.map(m => ({ value: m.val, label: m.label }))
                                ]}
                                placeholder="Měsíc"
                                bgColor="var(--color-ui-dark)"
                            />
                        </div>
                    </div>

                    {/* Global Actions */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
                        {activeType !== 'trash' && (
                            <button
                                onClick={handleSyncPDFs}
                                disabled={syncProgress.isSyncing || filteredInvoices.length === 0}
                                className={`action-btn-full ${syncProgress.isSyncing ? 'syncing' : ''}`}
                                title="Synchronizovat všechny PDF do Dokumentů"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="18" height="18">
                                    <path opacity=".4" d="M96 384L288 384L288 448L352 448L352 384L544 384L544 544L96 544L96 384zM440 464C440 477.3 450.7 488 464 488C477.3 488 488 477.3 488 464C488 450.7 477.3 440 464 440C450.7 440 440 450.7 440 464z" /><path d="M352 448L352 173.3C382.7 204 404 225.3 416 237.3L461.3 192C458.4 189.1 418.9 149.6 342.7 73.4L320 50.7C317.1 53.6 277.6 93.1 201.4 169.3L178.8 191.9L224.1 237.2L288.1 173.2L288.1 447.9L352.1 447.9z" />
                                </svg>
                                {syncProgress.isSyncing
                                    ? 'Synchronizace...'
                                    : 'Synchronizovat PDF'
                                }
                            </button>
                        )}

                        {activeType === 'trash' && (
                            <button
                                onClick={handleEmptyTrash}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    height: '45px',
                                    backgroundColor: 'rgba(255, 77, 79, 0.1)',
                                    color: 'var(--color-ui-red)',
                                    border: '2px solid transparent',
                                    cursor: filteredInvoices.length > 0 ? 'pointer' : 'not-allowed',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s ease',
                                    fontFamily: 'var(--font-primary)',
                                    opacity: filteredInvoices.length > 0 ? 1 : 0.5
                                }}
                                onMouseOver={(e) => {
                                    if (filteredInvoices.length > 0) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.2)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 77, 79, 0.3)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.1)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                                disabled={filteredInvoices.length === 0}
                                title="Vysypat celý koš"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="18" height="18">
                                    <path opacity=".4" d="M128 160L512 160L488 576L152 576L128 160z" /><path d="M400 48L240 48L224 96L96 96L96 160L544 160L544 96L416 96L400 48z" />
                                </svg>
                                Vysypat koš
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-ui-dark)', borderRadius: '12px', padding: '24px' }}>
                    <div className="invoice-table-container">
                        {filteredInvoices.length === 0 ? (
                            <div className="empty-state">
                                Žádné faktury nebyly nalezeny.
                            </div>
                        ) : (
                            <table className="invoice-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '120px' }}>Číslo</th>
                                        <th style={{ width: '100px' }}>TYP</th>
                                        <th style={{ width: '120px', textAlign: 'center' }}>Stav</th>
                                        <th>Odběratel</th>
                                        {activeType === 'calendar' && <th>Doména</th>}
                                        <th style={{ width: '140px' }}>Vystaveno</th>
                                        {activeType === 'calendar' && <th style={{ width: '140px' }}>AKTIVNÍ OD</th>}
                                        <th style={{ width: '140px' }}>{activeType === 'calendar' ? 'AKTIVNÍ DO' : 'Splatnost'}</th>
                                        {activeType !== 'calendar' && <th style={{ width: '120px', textAlign: 'center' }}>Zaplaceno</th>}
                                        <th style={{ width: '150px', textAlign: 'right' }}>Cena</th>
                                        <th style={{ width: '150px', textAlign: 'right' }}>Akce</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((inv, index) => {

                                        return (
                                            <tr key={inv.id} className={`animate-fade-in stagger-${(index % 5) + 1}`} style={{ animationFillMode: 'both' }}>
                                                <td className="col-number" onClick={() => onEdit(inv)}>
                                                    <span style={{ fontWeight: '500' }}>{inv.invoiceNumber}</span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '0.9rem',
                                                        backgroundColor: 'rgba(135, 95, 220, 0.1)',
                                                        color: 'var(--color-kralovnin-serik)',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        fontWeight: '500'
                                                    }}>
                                                        {(inv.type === 'calendar') ? 'Kalendář' : 'Faktura'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {inv.type === 'calendar' ? (
                                                        <span
                                                            className={`status-tag ${inv.calendarActive !== false ? 'active' : 'pending'}`}
                                                            onClick={() => {
                                                                const nextActive = inv.calendarActive === false ? true : false;
                                                                setConfirmationModal({
                                                                    isOpen: true,
                                                                    invoiceId: inv.id,
                                                                    targetStatus: nextActive ? 'active' : 'inactive',
                                                                    toggleType: 'calendarActive',
                                                                    invoiceNumber: inv.invoiceNumber
                                                                });
                                                            }}
                                                            style={{ cursor: 'pointer', minWidth: '100px', textAlign: 'center', justifyContent: 'center' }}
                                                            title="Kliknutím změníte stav"
                                                        >
                                                            {inv.calendarActive !== false ? 'Aktivní' : 'Neaktivní'}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`status-tag ${inv.status === 'paid' ? 'active' : 'pending'}`}
                                                            onClick={() => handleTogglePaid(inv)}
                                                            style={{ cursor: 'pointer', minWidth: '100px', textAlign: 'center', justifyContent: 'center' }}
                                                            title="Kliknutím změníte stav"
                                                        >
                                                            {inv.status === 'paid' ? 'Zaplaceno' : 'Nezaplaceno'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{inv.customerName}</td>
                                                {activeType === 'calendar' && (
                                                    <td>
                                                        {(() => {
                                                            const contractNum = inv.data?.contractNumber || inv.invoiceNumber;
                                                            const domain = contractToDomainMap[contractNum];
                                                            if (domain) {
                                                                return (
                                                                    <span style={{
                                                                        fontSize: '0.9rem',
                                                                        backgroundColor: 'rgba(135, 95, 220, 0.1)',
                                                                        color: 'var(--color-kralovnin-serik)',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '4px',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        {domain}
                                                                    </span>
                                                                );
                                                            }
                                                            return <span style={{ opacity: 0.3 }}>-</span>;
                                                        })()}
                                                    </td>
                                                )}
                                                <td>{formatDate(inv.issueDate)}</td>
                                                {inv.type === 'calendar' && (
                                                    <td>
                                                        {(() => {
                                                            if (inv.data.items && inv.data.items.length > 0) {
                                                                const firstItem = inv.data.items[0];
                                                                const dateStr = firstItem._meta?.splatnost;
                                                                if (!dateStr) return '-';

                                                                let year, month;
                                                                if (dateStr.includes('-')) {
                                                                    const parts = dateStr.split('-');
                                                                    year = parts[0];
                                                                    month = parts[1];
                                                                } else {
                                                                    const parts = dateStr.split('.');
                                                                    if (parts.length >= 3) {
                                                                        year = parts[2].trim();
                                                                        month = parts[1].trim();
                                                                    }
                                                                }
                                                                if (year && month) return `1. ${parseInt(month)}. ${year}`;
                                                            }
                                                            return '-';
                                                        })()}
                                                    </td>
                                                )}
                                                <td>
                                                    {inv.type === 'calendar'
                                                        ? (() => {
                                                            // 1. If manually deactivated or has explicit cutoff
                                                            if (inv.calendarInactiveDate) return formatDate(inv.calendarInactiveDate);

                                                            // 2. Default logic: Last day of the month of the last item
                                                            if (inv.data.items && inv.data.items.length > 0) {
                                                                const lastItem = inv.data.items[inv.data.items.length - 1];
                                                                const dateStr = lastItem._meta?.splatnost;
                                                                if (!dateStr) return '-';

                                                                let year, month;
                                                                if (dateStr.includes('-')) {
                                                                    const parts = dateStr.split('-');
                                                                    year = parseInt(parts[0]);
                                                                    month = parseInt(parts[1]);
                                                                } else {
                                                                    const parts = dateStr.split('.');
                                                                    if (parts.length >= 3) {
                                                                        year = parseInt(parts[2].trim());
                                                                        month = parseInt(parts[1].trim());
                                                                    }
                                                                }

                                                                if (year && month) {
                                                                    const lastDay = new Date(year, month, 0).getDate();
                                                                    return `${lastDay}. ${month}. ${year}`;
                                                                }
                                                            }
                                                            return '-';
                                                        })()
                                                        : (inv.data.dates.due ? formatDate(inv.data.dates.due) : '-')}
                                                </td>
                                                {activeType !== 'calendar' && (
                                                    <td style={{ textAlign: 'center' }}>
                                                        {inv.status === 'paid' && inv.paidDate ? (
                                                            <span style={{ color: 'var(--color-ui-green)', fontWeight: '500' }}>
                                                                {formatDate(inv.paidDate)}
                                                            </span>
                                                        ) : (
                                                            <span style={{ opacity: 0.3 }}>-</span>
                                                        )}
                                                    </td>
                                                )}
                                                <td className="col-price">
                                                    {inv.type === 'calendar' ? (
                                                        `12 × ${inv.data.items && inv.data.items[0] ? inv.data.items[0].price.toLocaleString() : (inv.total / 12).toLocaleString()} ${inv.currency === 'EUR' ? '€' : 'Kč'}`
                                                    ) : (
                                                        `${inv.total.toLocaleString()} ${inv.currency === 'EUR' ? '€' : 'Kč'}`
                                                    )}
                                                </td>
                                                <td className="col-actions">
                                                    {activeType === 'trash' ? (
                                                        <>
                                                            <button
                                                                className="edit-btn-simple"
                                                                onClick={() => handleRestore(inv)}
                                                                title="Obnovit doklad"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                                                    <path opacity=".4" d="M91.2 434.9C133.3 518.5 219.9 576 320 576C390.7 576 454.7 547.3 501 501C523.3 478.7 540.7 453.2 553 426.1C566.9 395.7 574.9 362.1 575.9 326.8C576 324.8 576 322.9 576 320.9C576.2 255.1 551.2 189.2 501 139C451 89 385.4 64 320 64C243.5 64 174.9 97.6 128 150.7L128 192L176.9 192C212.1 152.7 263.2 128 320 128C369.2 128 418.3 146.7 455.8 184.2C493.3 221.7 512 270.8 512 320C512 322.3 512 324.5 511.9 326.8C511.2 345.5 507.9 364.2 501.8 382.1C476 457.7 404.4 512.1 320 512.1C245 512.1 180 469.1 148.4 406.3L91.2 434.9z" /><path d="M128 64L128 192L256 192L256 256L64 256L64 64L128 64z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="delete-btn-simple"
                                                                onClick={() => handleDelete(inv)}
                                                                title="Trvale smazat"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                                                    <path opacity=".4" d="M182.9 137.4L160.3 114.7L115 160L137.6 182.6L275 320L137.6 457.4L115 480L160.3 525.3L320.3 365.3L457.6 502.6L480.3 525.3L525.5 480L502.9 457.4L365.5 320L502.9 182.6L525.5 160L480.3 114.7L457.6 137.4L320.3 274.7L182.9 137.4z" /><path d="" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="edit-btn-simple"
                                                                onClick={() => onEdit(inv)}
                                                                title="Upravit fakturu"
                                                            >
                                                                <EditIcon size={20} />
                                                            </button>
                                                            <button
                                                                className="edit-btn-simple"
                                                                onClick={() => setPreviewModal({ isOpen: true, invoiceData: inv.data })}
                                                                title="Zobrazit náhled"
                                                            >
                                                                <ViewIcon size={20} />
                                                            </button>
                                                            <button
                                                                className="edit-btn-simple"
                                                                onClick={() => onDownload(inv.data)}
                                                                title="Stáhnout fakturu"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                                                    <path opacity=".4" d="M96 384L242.7 384C284.4 425.7 310.2 451.5 320 461.3L397.3 384L544 384L544 544L96 544L96 384zM440 464C440 477.3 450.7 488 464 488C477.3 488 488 477.3 488 464C488 450.7 477.3 440 464 440C450.7 440 440 450.7 440 464z" /><path d="M352 64L352 338.7C382.7 308 404 286.7 416 274.7L461.3 320L320 461.3C317.1 458.4 277.6 418.9 201.4 342.7L178.7 320L224 274.7C236 286.7 257.3 308 288 338.7L288 64L352 64z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="delete-btn-simple"
                                                                onClick={() => handleDelete(inv)}
                                                                title="Smazat fakturu"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                                                    <path opacity=".4" d="M128 160L512 160L488 576L152 576L128 160z" /><path d="M400 48L240 48L224 96L96 96L96 160L544 160L544 96L416 96L400 48z" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <ConfirmationModal
                    isOpen={confirmationModal.isOpen}
                    title={
                        confirmationModal.type === 'delete' ? 'Přesunout do koše?' :
                            confirmationModal.type === 'hard_delete' ? 'Trvale smazat doklad?' :
                                confirmationModal.type === 'empty_trash' ? 'Vysypat koš?' :
                                    confirmationModal.toggleType === 'calendarActive'
                                        ? (confirmationModal.targetStatus === 'active' ? 'Aktivovat kalendář?' : 'Deaktivovat kalendář?')
                                        : confirmationModal.targetStatus === 'paid' ? 'Označit jako uhrazené?' :
                                            'Zrušit úhradu?'
                    }
                    message={
                        confirmationModal.type === 'delete'
                            ? `Doklad č. ${confirmationModal.invoiceNumber} bude přesunut do koše.`
                            : confirmationModal.type === 'hard_delete'
                                ? `Opravdu chcete TRVALE SMAZAT doklad č. ${confirmationModal.invoiceNumber}? Tuto akci nelze vrátit zpět!`
                                : confirmationModal.type === 'empty_trash'
                                    ? 'Opravdu chcete smazat všechny položky v koši? Tuto akci nelze vrátit zpět!'
                                    : confirmationModal.toggleType === 'calendarActive'
                                        ? (confirmationModal.targetStatus === 'active'
                                            ? `Opravdu chcete aktivovat kalendář č. ${confirmationModal.invoiceNumber}?`
                                            : `Od kdy je kalendář č. ${confirmationModal.invoiceNumber} neaktivní?`)
                                        : confirmationModal.targetStatus === 'paid'
                                            ? `K jakému dni byla faktura č. ${confirmationModal.invoiceNumber} uhrazena?`
                                            : `Opravdu chcete zrušit označení úhrady u faktury č. ${confirmationModal.invoiceNumber}?`
                    }
                    onConfirm={['delete', 'hard_delete', 'empty_trash'].includes(confirmationModal.type) ? confirmDelete : confirmTogglePaid}
                    onCancel={() => { setDeactivationDate(''); setConfirmationModal({ ...confirmationModal, isOpen: false }); }}
                    confirmText={
                        confirmationModal.type === 'delete' ? 'Do koše' :
                            confirmationModal.type === 'hard_delete' ? 'Trvale smazat' :
                                confirmationModal.type === 'empty_trash' ? 'Vysypat koš' :
                                    confirmationModal.toggleType === 'calendarActive'
                                        ? (confirmationModal.targetStatus === 'active' ? 'Ano, aktivovat' : 'Ano, deaktivovat')
                                        : confirmationModal.targetStatus === 'paid' ? 'Ano, uhrazeno' :
                                            'Ano, zrušit úhradu'
                    }
                    type={['delete', 'hard_delete', 'empty_trash', 'unpaid'].includes(confirmationModal.type) || confirmationModal.targetStatus === 'unpaid' || confirmationModal.targetStatus === 'inactive' ? 'danger' : 'default'}
                    confirmButtonClass={['delete', 'hard_delete', 'empty_trash'].includes(confirmationModal.type) ? 'delete-btn-force' : ''}
                >
                    {confirmationModal.toggleType === 'calendarActive' && confirmationModal.targetStatus === 'inactive' && (
                        <div style={{ position: 'relative', zIndex: 10 }}>
                            <CustomDatePicker
                                label="Neaktivní od"
                                value={deactivationDate}
                                onChange={(isoDate) => setDeactivationDate(isoDate)}
                                placeholder="Vyberte datum"
                            />
                        </div>
                    )}
                    {confirmationModal.targetStatus === 'paid' && !confirmationModal.toggleType && (
                        <div style={{ position: 'relative', zIndex: 10 }}>
                            <CustomDatePicker
                                label="Datum úhrady"
                                value={paymentDate}
                                onChange={(isoDate) => setPaymentDate(isoDate)}
                                placeholder="Vyberte datum"
                            />
                        </div>
                    )}
                </ConfirmationModal>

                <InvoicePreviewModal
                    isOpen={previewModal.isOpen}
                    onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
                    invoiceData={previewModal.invoiceData}
                />

                <SyncProgressModal
                    isSyncing={syncProgress.isSyncing}
                    current={syncProgress.current}
                    total={syncProgress.total}
                    filename={syncProgress.filename}
                />

                <ConfirmationModal
                    isOpen={syncSuccessModal.isOpen}
                    title="Synchronizace dokončena"
                    message={syncSuccessModal.count > 0
                        ? `Úspěšně se synchronizovalo ${syncSuccessModal.count} PDF.`
                        : "Všechny PDF jsou aktuální."
                    }
                    confirmText="Rozumím"
                    onConfirm={() => setSyncSuccessModal({ isOpen: false, count: 0 })}
                    type="info"
                />

            </div>
        </div>
    );
};

export default InvoiceHistory;

