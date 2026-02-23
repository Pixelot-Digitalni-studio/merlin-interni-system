"use client";
import React, { useState, useEffect } from 'react';
import InvoiceEditor from './InvoiceEditor';
import CalendarEditor from './CalendarEditor';
import Sidebar from './Sidebar';
import CustomerAddressBook from './CustomerAddressBook';
import ProfileView from './ProfileView';
import SettingsView from './SettingsView';
import InvoiceHistory from './InvoiceHistory';
import Dashboard from './Dashboard';
import InvoicePDFPreview from './InvoicePDFPreview';
import InvoiceService from '../services/InvoiceService';
import ProfileService from '../services/ProfileService';
import UpdateNotification from './UpdateNotification';
import ConfirmationModal from './ConfirmationModal';
import CustomerService from '../services/CustomerService';
import CashflowView from './CashflowView';
import SectionHeader from './SectionHeader';
import { getInvoiceFilename } from '../utils/invoiceUtils';

const InvoiceLayout = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editingId, setEditingId] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showSavedNotification, setShowSavedNotification] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const [data, setData] = useState({
        invoiceNumber: '',
        currency: 'CZK',
        type: 'invoice',
        dates: { issue: '', due: '' },
        supplier: {
            name: '', address: '', ico: '', dic: '', phone: '', email: '', note: '', account: '', iban: '', swift: '', method: '', logo: '', accentColor: '#875FDC', secondaryColor: '#181020', backgroundColor: '#F7F3FF', primaryTextColor: '#181020', footerTextColor: '#F7F3FF', fontFamily: 'Saira'
        },
        customer: { name: '', address: '', ico: '', dic: '', phone: '', email: '' },
        items: [],
        invoiceItems: [],
        calendarItems: [],
        payment: { total: 0, variableSymbol: '', method: 'Převodem', account: '', iban: '', swift: '' }
    });

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'default'
    });

    const showAlert = (title, message, type = 'default') => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
            confirmText: 'OK'
        });
    };

    // 1. Initial Sync Effect (Runs ONCE on mount)
    useEffect(() => {
        let ignore = false;

        const initialSync = async () => {
            console.log('InvoiceLayout: Initial sync with Supabase started');

            try {
                await InvoiceService.fetchInvoices();
                await InvoiceService.fetchDeleted();
                await CustomerService.fetchCustomers();
                await CustomerService.fetchDeleted();

                if (ignore) return;

                const profileData = await ProfileService.fetchProfile();
                if (ignore) return;

                if (profileData) {
                    setData(prev => ({
                        ...prev,
                        supplier: { ...prev.supplier, ...profileData },
                        payment: {
                            ...prev.payment,
                            account: profileData.account || prev.payment.account,
                            iban: profileData.iban || prev.payment.iban,
                            swift: profileData.swift || prev.payment.swift
                        }
                    }));
                }

                console.log('InvoiceLayout: Initial sync complete');
                if (!ignore) setIsSynced(true);
            } catch (e) {
                console.error('Initial sync failed', e);
                if (!ignore) setIsSynced(true);
            }
        };

        initialSync();

        // --- APP CLOSE HANDLER ---
        if (window.electronAPI && window.electronAPI.onAppCloseRequest) {
            window.electronAPI.onAppCloseRequest(() => {
                console.log('InvoiceLayout: App close requested.');
                if (window.electronAPI.confirmAppClose) {
                    window.electronAPI.confirmAppClose();
                }
            });
        }

        // --- SILENT RENDER HANDLER (for background sync) ---
        if (window.electronAPI && window.electronAPI.onRenderInvoice) {
            window.electronAPI.onRenderInvoice(async (invoiceData) => {
                console.log('InvoiceLayout: Received silent render request');
                setData(prev => ({
                    ...prev,
                    ...invoiceData,
                    supplier: { ...prev.supplier, ...invoiceData.supplier }
                }));
                const type = invoiceData.type || 'invoice';
                setActiveTab(type);
                setIsPrinting(true);

                // Wait for React to render the preview (A4 format)
                setTimeout(async () => {
                    const filename = getInvoiceFilename(invoiceData);
                    await window.electronAPI.savePDF({
                        filename,
                        issueDate: invoiceData.dates.issue,
                        type,
                        silent: true
                    });
                    setIsPrinting(false);
                }, 800);
            });
        }

        return () => { ignore = true; };
    }, []); // Empty dependency array = run once

    // 2. Logic Effect (Runs on Tab Change or Sync Complete)
    useEffect(() => {
        if (!isSynced || isPrinting) return;

        console.log('InvoiceLayout: Tab logic triggered', activeTab);

        // Handle Invoice/Calendar Numbering and Items
        if (activeTab === 'invoice' || activeTab === 'calendar') {
            if (editingId) {
                const docExists = InvoiceService.getById(editingId);
                if (!docExists) {
                    setEditingId(null);
                } else {
                    return; // Edit mode, do not recalculate
                }
            }

            const type = activeTab === 'calendar' ? 'calendar' : 'invoice';
            const nextNumber = InvoiceService.getNextInvoiceNumber(type);
            const nextVS = nextNumber ? nextNumber.replace(/\D/g, '') : '';

            setData(prev => {
                const itemsToLoad = activeTab === 'calendar' ? prev.calendarItems : prev.invoiceItems;
                return {
                    ...prev,
                    invoiceNumber: nextNumber || prev.invoiceNumber,
                    type: type,
                    items: Array.isArray(itemsToLoad) ? itemsToLoad : [],
                    payment: {
                        ...prev.payment,
                        variableSymbol: nextVS || prev.payment.variableSymbol
                    }
                };
            });
        }
    }, [activeTab, editingId, isSynced, isPrinting]); // Run when these change

    // Separate Effect for Profile Loading
    useEffect(() => {
        if (activeTab === 'profile') {
            const loadProfile = async () => {
                console.log('InvoiceLayout: Loading profile data from disk...');
                // Always sync from disk when entering profile to ensure we have latest data
                const profile = await ProfileService.syncFromDisk();
                let logo = profile.logo;

                if (window.electronAPI) {
                    const electronLogo = await ProfileService.loadLogo();
                    if (electronLogo) logo = electronLogo;
                }

                console.log('InvoiceLayout: Profile loaded', profile);

                setData(prev => ({
                    ...prev,
                    supplier: { ...prev.supplier, ...profile, logo: logo || prev.supplier.logo },
                    payment: {
                        ...prev.payment,
                        account: profile.account || prev.payment.account,
                        iban: profile.iban || prev.payment.iban,
                        swift: profile.swift || prev.payment.swift
                    }
                }));
            };
            loadProfile();
        }
    }, [activeTab]);

    // Helper to switch tabs safely by saving current state first
    const switchTab = (nextTab) => {
        // If clicking the same tab, we might want to "reset" to new if not already in editing mode,
        // or just ensure editingId is null.
        const isSameTab = activeTab === nextTab;

        // If currently in an editor, save the items to their specific storage
        if (activeTab === 'invoice' || activeTab === 'calendar') {
            setData(prev => ({
                ...prev,
                [activeTab === 'calendar' ? 'calendarItems' : 'invoiceItems']: prev.items,
                items: [] // Clear items to avoid pollution in the new tab
            }));
        }

        // Special handling for navigating FROM other tabs TO editor OR clicking active editor tab
        if (nextTab === 'invoice' || nextTab === 'calendar') {
            setEditingId(null);

            // If it's the SAME tab, we also want to clear current items to start fresh
            if (isSameTab) {
                setData(prev => ({
                    ...prev,
                    items: [],
                    [nextTab === 'calendar' ? 'calendarItems' : 'invoiceItems']: [],
                    invoiceNumber: InvoiceService.getNextInvoiceNumber(nextTab),
                    payment: {
                        ...prev.payment,
                        variableSymbol: InvoiceService.getNextInvoiceNumber(nextTab).replace(/\D/g, '')
                    }
                }));
            }
        }

        if (!isSameTab) {
            setActiveTab(nextTab);
        }
    };

    // Helper to parse formatted numbers (e.g. "1 500,50")
    const parseAmount = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseFloat(val.toString().replace(/\s/g, '').replace(',', '.')) || 0;
    };

    // Calculate totals whenever items change
    useEffect(() => {
        if (isPrinting) return;
        // 1. Calculate new total based on current items
        const newTotal = data.items.reduce((sum, item) => sum + (item.qty * parseAmount(item.price)), 0);

        // 2. Prepare items with their specific totals for comparison
        const updatedItems = data.items.map(item => {
            const itemTotal = item.qty * parseAmount(item.price);
            return item.total === itemTotal ? item : { ...item, total: itemTotal };
        });

        // 3. Check if we actually need to update the state to avoid infinite loops
        const isTotalChanged = newTotal !== data.payment.total;
        const isItemsUpdated = updatedItems.some((item, idx) => item !== data.items[idx]);

        // CRITICAL FIX: Prevent crossover of items between tabs during transition
        // If activeTab has changed but data.type hasn't synced yet, DO NOT save current items to the new storage.
        if ((activeTab === 'invoice' && data.type !== 'invoice') ||
            (activeTab === 'calendar' && data.type !== 'calendar')) {
            return;
        }

        if (isTotalChanged || isItemsUpdated) {
            setData(prev => {
                // CRITICAL: Use activeTab here too, because prev.type might be stale/invoice 
                // when CalendarEditor generates items before syncAndLoad completes.
                const isCalendar = activeTab === 'calendar';
                const newState = { ...prev };

                if (isTotalChanged) {
                    newState.payment = { ...prev.payment, total: newTotal };
                }

                if (isItemsUpdated) {
                    newState.items = updatedItems;
                    newState[isCalendar ? 'calendarItems' : 'invoiceItems'] = updatedItems;
                }

                return newState;
            });
        }
    }, [data.items, data.payment.total, data.type, activeTab, isPrinting]);

    const handleDataChange = (section, field, value) => {
        setData(prev => {
            if (section === 'root') {
                const newData = { ...prev, [field]: value };
                if (field === 'items') {
                    // Explicitly update items array and the corresponding type-specific storage
                    // CRITICAL: Use activeTab because prev.type might be stale during tab switching/mounting
                    const isCalendarTab = activeTab === 'calendar';
                    newData.items = value;
                    newData[isCalendarTab ? 'calendarItems' : 'invoiceItems'] = value;
                } else if (field === 'invoiceNumber' && activeTab !== 'calendar') {
                    // Sync Variable Symbol with Invoice Number ONLY if NOT a calendar
                    const digitsOnly = value.replace(/\D/g, '');
                    newData.payment = { ...prev.payment, variableSymbol: digitsOnly };
                }
                return newData;
            }


            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            };
        });
    };

    const handleAddItem = () => {
        setData(prev => {
            const newItems = [...prev.items, { name: "", qty: 1, price: 0, total: 0 }];
            const isCalendar = prev.type === 'calendar';
            return {
                ...prev,
                items: newItems,
                [isCalendar ? 'calendarItems' : 'invoiceItems']: newItems
            };
        });
    };

    const handleRemoveItem = (index) => {
        setData(prev => {
            const newItems = prev.items.filter((_, i) => i !== index);
            const isCalendar = prev.type === 'calendar';
            return {
                ...prev,
                items: newItems,
                [isCalendar ? 'calendarItems' : 'invoiceItems']: newItems
            };
        });
    };

    const handleRemoveAllItems = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Smazat položky?',
            message: 'Opravdu chcete smazat všechny položky z aktuálního dokladu?',
            type: 'danger',
            onConfirm: () => {
                setData(prev => {
                    const isCalendar = prev.type === 'calendar';
                    return {
                        ...prev,
                        items: [],
                        [isCalendar ? 'calendarItems' : 'invoiceItems']: []
                    };
                });
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleItemChange = (index, field, value) => {
        setData(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            const isCalendar = prev.type === 'calendar';
            return {
                ...prev,
                items: newItems,
                [isCalendar ? 'calendarItems' : 'invoiceItems']: newItems
            };
        });
    };

    const handleSave = async () => {
        if (editingId) {
            await InvoiceService.update(editingId, data);
        } else {
            await InvoiceService.save(data);
        }

        // Show notification
        setShowSavedNotification(true);
        setTimeout(() => setShowSavedNotification(false), 3000);

        // Calculate next number and its variable symbol
        const currentType = data.type || (activeTab === 'calendar' ? 'calendar' : 'invoice');
        const nextNumber = InvoiceService.getNextInvoiceNumber(currentType);
        const nextVS = nextNumber.replace(/\D/g, '');

        // Trigger automatic archival/PDF generation if available natively
        await handlePrint();

        // Reset form after successful save
        setEditingId(null);
        setData(prev => {
            const isCalendar = prev.type === 'calendar';
            return {
                ...prev,
                invoiceNumber: nextNumber,
                type: prev.type,
                dates: {
                    issue: new Date().toISOString().split('T')[0],
                    due: ''
                },
                customer: {
                    name: '',
                    address: '',
                    ico: '',
                    dic: '',
                    phone: '',
                    email: '',
                },
                items: [],
                [isCalendar ? 'calendarItems' : 'invoiceItems']: [], // Clear specific storage
                payment: {
                    ...prev.payment,
                    total: 0,
                    variableSymbol: nextVS
                }
            };
        });
    };

    const handlePrint = async (customData = null) => {
        return new Promise((resolve) => {
            const targetData = customData || data;
            const filename = getInvoiceFilename(targetData);
            const originalTitle = document.title;
            const originalData = data;

            if (customData) {
                setData(customData);
            }

            // Wait a bit for React to render the full DOM with current items
            setTimeout(() => {
                document.title = filename;
                window.print();

                // Restore logic after print dialog is closed
                setTimeout(() => {
                    document.title = originalTitle;
                    if (customData) {
                        setData(originalData);
                    }
                    resolve();
                }, 100);
            }, 300); // give enough time for heavy DOM to lay out
        });
    };

    const handleEditFromHistory = (historicalEntry) => {
        setData(historicalEntry.data);
        setEditingId(historicalEntry.id);
        const type = historicalEntry.type || 'invoice';
        setActiveTab(type); // Switch to 'invoice' or 'calendar'
    };

    // Replace handleSidebarTabChange with usage of switchTab directly or wrapper
    const handleSidebarTabChange = (newTab) => {
        switchTab(newTab);
    };

    const handleRenewCalendar = (calendarId) => {
        const oldCalendar = InvoiceService.getById(calendarId);
        if (!oldCalendar) return;

        const nextNumber = InvoiceService.getNextInvoiceNumber('calendar');
        const nextVS = nextNumber.replace(/\D/g, '');

        // Shift dates +1 year
        const shiftDate = (dateStr) => {
            if (!dateStr) return '';
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const d = new Date(dateStr);
                d.setFullYear(d.getFullYear() + 1);
                return d.toISOString().split('T')[0];
            }
            const parts = dateStr.split('.');
            if (parts.length >= 3) {
                const year = parseInt(parts[2].trim()) + 1;
                return `${parts[0].trim()}. ${parts[1].trim()}. ${year}`;
            }
            return dateStr;
        };

        const newIssueDate = shiftDate(oldCalendar.issueDate || oldCalendar.data?.dates?.issue);
        const newDueDate = shiftDate(oldCalendar.data?.dates?.due);

        // Extract prefill values from old calendar items
        const monthNames = [
            'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
            'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
        ];
        let prefillPrice = '';
        let prefillStartMonth = '';
        let prefillStartYear = '';
        let prefillDueDay = '';

        const oldItems = oldCalendar.data?.items;
        if (oldItems && oldItems.length > 0) {
            const firstItem = oldItems[0];
            if (firstItem.price) prefillPrice = firstItem.price;

            // Parse month and year from item name (e.g., "Leden 2026")
            const nameParts = firstItem.name.split(' ');
            if (nameParts.length >= 2) {
                const mIdx = monthNames.indexOf(nameParts[0]);
                if (mIdx !== -1) prefillStartMonth = mIdx;
                const y = parseInt(nameParts[1]);
                if (!isNaN(y)) prefillStartYear = y + 1; // +1 year for renewal
            }

            // Extract due day from splatnost
            if (firstItem._meta && firstItem._meta.splatnost) {
                const splatnost = firstItem._meta.splatnost;
                let day;
                if (splatnost.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    day = parseInt(splatnost.split('-')[2]);
                } else {
                    const sParts = splatnost.split('.');
                    if (sParts.length >= 1) day = parseInt(sParts[0].trim());
                }
                if (day && !isNaN(day)) prefillDueDay = day;
            }
        }

        setEditingId(null);
        setData(prev => ({
            ...prev,
            invoiceNumber: nextNumber,
            type: 'calendar',
            dates: {
                issue: newIssueDate,
                due: newDueDate
            },
            customer: {
                ...oldCalendar.data.customer
            },
            items: [],
            calendarItems: [],
            _prefillPrice: prefillPrice,
            _prefillStartMonth: prefillStartMonth,
            _prefillStartYear: prefillStartYear,
            _prefillDueDay: prefillDueDay,
            payment: {
                ...prev.payment,
                total: 0,
                variableSymbol: nextVS
            }
        }));
        setActiveTab('calendar');
    };

    const getHeaderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return {
                    title: "DASHBOARD",
                    subtitle: "HLAVNÍ PŘEHLED",
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                            <path opacity=".4" d="M96.5 384L96.5 544L160.5 544L160.5 384L96.5 384zM224.5 288L224.5 544L288.5 544L288.5 288L224.5 288zM352.5 352L352.5 544L416.5 544L416.5 352L352.5 352zM480.5 288L480.5 544L544.5 544L544.5 288L480.5 288z" />
                            <path d="M589.5 133L564.5 153L404.5 281L385.1 296.5L365.3 281.6L257.1 200.5L116.5 313L91.5 333L51.5 283L76.5 263L236.5 135L255.9 119.5L275.7 134.4L383.9 215.5L524.5 103L549.5 83L589.5 133z" />
                        </svg>
                    )
                };
            case 'invoice':
                return {
                    title: "FAKTURACE",
                    subtitle: "EDITOR",
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                            <path opacity=".4" d="M128 64L128 576L512 576L512 208L368 64L128 64zM192 128L288 128L288 176L192 176L192 128zM192 224L288 224L288 272L192 272L192 224zM192 352L448 352L448 480L192 480L192 352zM336 122.5L453.5 240L336 240L336 122.5z" />
                            <path d="M216 128L192 128L192 176L288 176L288 128L216 128zM216 224L192 224L192 272L288 272L288 224L216 224zM192 352L192 480L448 480L448 352L192 352z" />
                        </svg>
                    )
                };
            case 'calendar':
                return {
                    title: "KALENDÁŘ",
                    subtitle: "EDITOR",
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                            <path opacity=".4" d="M96 224L544 224L544 544L96 544L96 224zM160 288L160 352L224 352L224 288L160 288zM160 416L160 480L224 480L224 416L160 416zM288 288L288 352L352 352L352 288L288 288zM288 416L288 480L352 480L352 416L288 416zM416 288L416 352L480 352L480 288L416 288zM416 416L416 480L480 480L480 416L416 416z" />
                            <path d="M256 96L256 64L192 64L192 128L96 128L96 224L544 224L544 128L448 128L448 64L384 64L384 128L256 128L256 96z" />
                        </svg>
                    )
                };
            case 'history':
                return {
                    title: "VYSTAVENÉ DOKLADY",
                    subtitle: "FAKTURY A KALENDÁŘE",
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                            <path opacity=".4" d="M96 192L96 544L544 544L544 192L96 192zM224 304L416 304L416 352L224 352L224 304z" />
                            <path d="M64 96L576 96L576 192L64 192z" />
                        </svg>
                    )
                };
            case 'customers':
                return {
                    title: "ODBĚRATELÉ",
                    subtitle: "ADRESÁŘ",
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                            <path opacity=".4" d="M0 544L110.7 544L113.2 533.2L155 352L48 352L0 544zM24 224C24 263.8 56.2 296 96 296C135.8 296 168 263.8 168 224C168 184.2 135.8 152 96 152C56.2 152 24 184.2 24 224zM472 224C472 263.8 504.2 296 544 296C583.8 296 616 263.8 616 224C616 184.2 583.8 152 544 152C504.2 152 472 184.2 472 224zM485 352L526.8 533.2L529.3 544L640 544L592 352L485 352z" />
                            <path d="M320 288C377.4 288 424 241.4 424 184C424 126.6 377.4 80 320 80C262.6 80 216 126.6 216 184C216 241.4 262.6 288 320 288zM480 544L432 336L208 336L160 544L480 544z" />
                        </svg>
                    )
                };
            case 'cashflow':
                return {
                    title: "PŘÍJMY/VÝDAJE",
                    subtitle: "CASHFLOW",
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                            <path opacity=".4" d="M64.4 269.8L69.5 274.9L120.4 325.8L222.2 224L174.2 176C198.7 176 218.1 176 232.4 176L232.4 128L576.4 128L576.4 370.2L571.3 365.1L520.4 314.2L418.6 416L466.6 464L408.4 464L408.4 512C513.7 512 414.4 512 64.4 512L64.4 269.8zM128.4 384L128.4 448L192.4 448C192.4 412.7 163.7 384 128.4 384zM224.4 320C223.3 354.9 241.2 387.6 271.3 405.4C301.3 423.1 338.6 423.1 368.6 405.4C398.7 387.6 416.6 354.9 415.5 320C416.6 285.1 398.7 252.4 368.6 234.6C338.6 216.9 301.3 216.9 271.3 234.6C241.2 252.4 223.3 285.1 224.4 320zM448.4 192C448.4 227.3 477.1 256 512.4 256L512.4 192L448.4 192z" />
                            <path d="M31.5 135C88.7 77.8 118.3 48.2 120.5 46L154.4 80C145.4 89 129.4 105 106.4 128C187.4 128 229.5 128 232.5 128L232.5 176C229.5 176 187.5 176 106.4 176C129.4 199 145.4 215 154.4 224L120.5 257.9C118.4 255.8 88.7 226.1 31.5 168.9L14.5 151.9L31.5 134.9zM609.4 471L626.4 488C624.3 490.1 594.6 519.8 537.4 577L520.4 594L486.5 560.1C495.5 551.1 511.5 535.1 534.5 512.1L408.4 512.1L408.4 464.1L534.5 464.1L486.5 416.1L520.4 382.2C522.5 384.3 552.2 414 609.4 471.2z" />
                        </svg>
                    )
                };
            case 'profile':
                return {
                    title: "PROFIL",
                    subtitle: "UŽIVATEL",
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                            <path opacity=".4" d="M200 192C200 258.3 253.7 312 320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192z" /><path d="M176 368L464 368L528 576L112 576L176 368z" />
                        </svg>
                    )
                };
            case 'settings':
                return {
                    title: "NASTAVENÍ",
                    subtitle: "SPRÁVA APLIKACE",
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                            <path opacity=".4" d="M272.1 320C272.1 346.5 293.6 368 320.1 368C346.5 368 368 346.5 368 320C368 293.5 346.5 272.1 320.1 272.1C293.6 272.1 272.1 293.5 272.1 320z" />
                            <path d="M264.1 48L376.1 48L395.8 143.5C409.9 149.5 423.1 157.2 435.1 166.3L527.7 135.6L583.7 232.6L510.8 297.4C511.7 304.8 512.1 312.4 512.1 320.1C512.1 327.8 511.6 335.4 510.8 342.8L583.7 407.6L527.7 504.6L435.1 473.9C423 483 409.8 490.6 395.8 496.7L376.1 592.2L264.1 592.2L244.4 496.7C230.3 490.7 217.2 483 205.1 473.9L112.5 504.6L56.5 407.6L129.4 342.8C128.5 335.4 128.1 327.8 128.1 320.1C128.1 312.4 128.6 304.8 129.4 297.4L56.5 232.6L112.5 135.6L205.1 166.3C217.2 157.2 230.4 149.6 244.4 143.5L264.1 48zM320.1 416C373.1 416 416.1 373 416.1 320C416 266.9 373 224 320 224C267 224 224 267 224.1 320.1C224.1 373.1 267.1 416 320.1 416z" />
                        </svg>
                    )
                };
            default:
                return null;
        }
    };

    const headerContent = getHeaderContent();


    return (
        <div className={`layout-wrapper ${['history', 'dashboard', 'cashflow', 'profile', 'settings', 'customers'].includes(activeTab) ? 'full-width' : ''}`}>
            <Sidebar activeTab={activeTab} onTabChange={handleSidebarTabChange} />

            {/* Main Content Area */}
            <div className="main-content-area">
                {!isPrinting && headerContent && (
                    <SectionHeader
                        title={headerContent.title}
                        subtitle={headerContent.subtitle}
                        icon={headerContent.icon}
                    />
                )}

                <div className={`page-content ${(activeTab === 'invoice' || activeTab === 'calendar') && !isPrinting ? 'editor-mode' : ''
                    } ${['profile', 'settings', 'dashboard'].includes(activeTab) ? 'centered-content' : ''
                    }`}>
                    {activeTab === 'invoice' || activeTab === 'calendar' ? (
                        <>
                            <div className="invoice-editor-column">
                                {activeTab === 'invoice' ? (
                                    <InvoiceEditor
                                        data={data}
                                        onChange={handleDataChange}
                                        onAddItem={handleAddItem}
                                        onRemoveItem={handleRemoveItem}
                                        onRemoveAllItems={handleRemoveAllItems}
                                        onItemChange={handleItemChange}
                                        showSavedNotification={showSavedNotification}
                                        showAlert={showAlert}
                                    />
                                ) : (
                                    <CalendarEditor
                                        data={data}
                                        onChange={handleDataChange}
                                        onAddItem={handleAddItem}
                                        onRemoveItem={handleRemoveItem}
                                        onRemoveAllItems={handleRemoveAllItems}
                                        onItemChange={handleItemChange}
                                        showSavedNotification={showSavedNotification}
                                        showAlert={showAlert}
                                        isPrinting={isPrinting}
                                    />
                                )}
                                <div className="controls" style={{ flexDirection: 'column', gap: '10px' }}>
                                    <button onClick={handleSave} className="print-btn">
                                        {activeTab === 'calendar' ? 'Uložit kalendář' : 'Uložit fakturu'}
                                    </button>
                                    {showSavedNotification && (
                                        <div style={{
                                            backgroundColor: 'var(--color-ui-green)',
                                            color: 'var(--color-ui-medium)',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            width: '100%',
                                            animation: 'fadeIn 0.3s ease-out'
                                        }}>
                                            {activeTab === 'calendar' ? 'Kalendář byl uložen!' : 'Faktura byla uložena!'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'customers' ? (
                        <CustomerAddressBook />
                    ) : activeTab === 'settings' ? (
                        <SettingsView
                            profile={data.supplier}
                            onChange={(field, value) => {
                                handleDataChange('supplier', field, value);
                            }}
                            showAlert={showAlert}
                        />
                    ) : activeTab === 'profile' ? (
                        <ProfileView
                            profile={data.supplier}
                            onChange={(field, value) => {
                                handleDataChange('supplier', field, value);
                                if (field === 'account') handleDataChange('payment', 'account', value);
                                if (field === 'iban') handleDataChange('payment', 'iban', value);
                                if (field === 'method') handleDataChange('payment', 'method', value);

                                // Auto-save logo updates to ensure persistence
                                if (field === 'logo') {
                                    ProfileService.save({ ...data.supplier, [field]: value });
                                }
                            }}
                            showAlert={showAlert}
                            onSave={() => {
                                ProfileService.save(data.supplier);
                                showAlert('Profil uložen', 'Změny v profilu byly úspěšně uloženy.', 'success');
                            }}
                        />
                    ) : activeTab === 'dashboard' ? (
                        <Dashboard onNavigate={switchTab} onRenewCalendar={handleRenewCalendar} />
                    ) : activeTab === 'cashflow' ? (
                        <CashflowView
                            profile={data.supplier}
                            onProfileChange={(field, value) => {
                                handleDataChange('supplier', field, value);
                                ProfileService.save({ ...data.supplier, [field]: value });
                            }}
                        />
                    ) : (
                        <InvoiceHistory onDownload={handlePrint} onEdit={handleEditFromHistory} showAlert={showAlert} />
                    )}

                    {/* Preview Section - Only visible if not in history tab */}
                    <ConfirmationModal
                        isOpen={confirmModal.isOpen}
                        title={confirmModal.title}
                        message={confirmModal.message}
                        onConfirm={confirmModal.onConfirm}
                        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                        confirmText={confirmModal.type === 'danger' ? 'Smazat' : 'Potvrdit'}
                        type={confirmModal.type}
                        confirmButtonClass={confirmModal.type === 'danger' ? 'delete-btn-force' : ''}
                    />

                    {!['history', 'dashboard', 'cashflow', 'profile', 'settings', 'customers'].includes(activeTab) && (
                        <div className="preview-area">
                            <InvoicePDFPreview invoiceData={data} />
                        </div>
                    )}
                    <UpdateNotification />
                </div>
            </div>
        </div>
    );
};

export default InvoiceLayout;

