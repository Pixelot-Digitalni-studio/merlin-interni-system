"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import CustomerService from '../services/CustomerService';
import CustomerModal from './CustomerModal';
import EditIcon from './icons/EditIcon';
import ConfirmationModal from './ConfirmationModal';

import { normalizeString } from '../utils/stringUtils';

const CustomerAddressBook = () => {
    const [customers, setCustomers] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('active'); // 'active' or 'trash'
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        type: 'default', // 'delete', 'merge', 'import', 'info', 'hard_delete', 'empty_trash'
        index: null,
        data: null
    });
    const fileInputRef = useRef(null);

    const loadCustomers = React.useCallback(() => {
        if (viewMode === 'active') {
            setCustomers(CustomerService.getAll());
        } else {
            setCustomers(CustomerService.getDeleted());
        }
    }, [viewMode]);


    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const filteredCustomers = customers
        .filter(cust => {
            if (!searchTerm) return true;
            const query = normalizeString(searchTerm);

            if (normalizeString(cust.name).includes(query)) return true;
            if (normalizeString(cust.address).includes(query)) return true;
            if (String(cust.ico || '').includes(searchTerm)) return true;
            if (String(cust.dic || '').includes(searchTerm)) return true;
            if (normalizeString(cust.email).includes(query)) return true;
            // Search through contractDomains
            if (cust.contractDomains && cust.contractDomains.some(cd =>
                normalizeString(cd.domain || '').includes(query) ||
                normalizeString(cd.contractNumber || '').includes(query)
            )) return true;
            // Backward compat: old domains string
            if (normalizeString(cust.domains || '').includes(query)) return true;

            const phoneStr = String(cust.phone || '').replace(/\s/g, '');
            const searchPhone = searchTerm.replace(/\s/g, '');
            if (phoneStr.includes(searchPhone)) return true;


            return false;
        })
        .sort((a, b) => {
            if (viewMode === 'trash' && a.deletedDate && b.deletedDate) {
                return new Date(b.deletedDate) - new Date(a.deletedDate);
            }
            return (a.name || '').localeCompare(b.name || '', 'cs', { sensitivity: 'base' });
        });

    const handleDelete = (customer, e) => {
        if (e) e.stopPropagation();
        const index = customers.indexOf(customer);
        if (index === -1) return;

        setConfirmationModal({
            isOpen: true,
            type: viewMode === 'trash' ? 'hard_delete' : 'delete',
            index: index,
            data: customer
        });
    };

    const handleRestore = (customer, e) => {
        if (e) e.stopPropagation();
        const index = customers.indexOf(customer);
        if (index === -1) return;

        const updated = CustomerService.restore(index);
        setCustomers(updated);
    };

    const handleEmptyTrash = () => {
        setConfirmationModal({
            isOpen: true,
            type: 'empty_trash',
            index: null,
            data: null
        });
    };

    const confirmAction = () => {
        if (confirmationModal.type === 'delete') {
            const updated = CustomerService.moveToTrash(confirmationModal.index);
            setCustomers(updated);
        } else if (confirmationModal.type === 'hard_delete') {
            const updated = CustomerService.hardDelete(confirmationModal.index);
            setCustomers(updated);
        } else if (confirmationModal.type === 'empty_trash') {
            const updated = CustomerService.emptyTrash();
            setCustomers(updated);
        } else if (confirmationModal.type === 'import') {
            const updated = CustomerService.importData(confirmationModal.data);
            if (updated) {
                if (viewMode === 'active') setCustomers(updated);
                else setViewMode('active');
                setConfirmationModal({
                    isOpen: true,
                    type: 'info',
                    index: null,
                    data: null,
                    title: 'Import dokončen',
                    message: 'Kontakty byly úspěšně importovány.'
                });
            } else {
                setConfirmationModal({
                    isOpen: true,
                    type: 'info',
                    index: null,
                    data: null,
                    title: 'Chyba importu',
                    message: 'Import se nezdařil. Zkontrolujte formát souboru.'
                });
            }
        } else if (confirmationModal.type === 'merge') {
            const result = CustomerService.mergeDuplicates();
            if (result.error) {
                setConfirmationModal({
                    isOpen: true,
                    type: 'info',
                    index: null,
                    data: null,
                    title: 'Chyba slučování',
                    message: 'Sloučení se nezdařilo.'
                });
                return;
            } else {
                if (viewMode === 'active') setCustomers(CustomerService.getAll());
                setConfirmationModal({
                    isOpen: true,
                    type: 'info',
                    index: null,
                    data: null,
                    title: 'Hotovo',
                    message: `Sloučení dokončeno. Bylo sloučeno ${result.merged} kontaktů.`
                });
                return;
            }
        }
        setConfirmationModal({ ...confirmationModal, isOpen: false });
    };

    const handleEdit = (customer, e) => {
        if (e) e.stopPropagation();
        const index = customers.indexOf(customer);
        if (index === -1) return;

        setEditingCustomer(customer);
        setEditingIndex(index);
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleViewDetail = (customer) => {
        const index = customers.indexOf(customer);
        if (index === -1) return;

        setEditingCustomer(customer);
        setEditingIndex(index);
        setModalMode('view');
        setModalOpen(true);
    };

    const handleUpdate = (updatedCustomer) => {
        const updated = CustomerService.update(editingIndex, updatedCustomer);
        setCustomers(updated);
        setModalOpen(false);
    };

    const openAddModal = () => {
        setModalMode('add');
        setEditingCustomer(null);
        setModalOpen(true);
    };

    const handleExport = () => {
        try {
            const dataToExport = CustomerService.getAll();
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', 'zakaznici_zaloha.json');
            linkElement.click();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                setConfirmationModal({
                    isOpen: true,
                    type: 'import',
                    index: null,
                    data: importedData
                });
            } catch (error) {
                console.error('Import failed:', error);
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleMergeCheck = () => {
        const duplicates = CustomerService.findDuplicates();
        if (duplicates.length === 0) {
            setConfirmationModal({
                isOpen: true,
                type: 'info',
                index: null,
                data: null,
                title: 'Žádné duplicity',
                message: 'Nebyly nalezeny žádné duplicitní kontakty (podle IČO).'
            });
            return;
        }

        let totalDuplicatesData = 0;
        duplicates.forEach(group => {
            totalDuplicatesData += (group.length - 1);
        });

        setConfirmationModal({
            isOpen: true,
            type: 'merge',
            index: null,
            data: { groups: duplicates.length, toMerge: totalDuplicatesData }
        });
    };

    return (
        <div style={{ color: 'white', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            <div style={{ width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* View Mode & Actions Row */}
                <div className="status-tabs">
                    <button
                        className={`status-tab ${viewMode === 'active' ? 'active' : ''}`}
                        onClick={() => setViewMode('active')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M96 64L512 64L512 576L96 576L96 64zM192 448L416 448L384 352L224 352L192 448zM248 256C248 286.9 273.1 312 304 312C334.9 312 360 286.9 360 256C360 225.1 334.9 200 304 200C273.1 200 248 225.1 248 256z" /><path d="M576 128L544 128L544 224L576 224L576 128zM576 256L544 256L544 352L576 352L576 256zM576 400L576 384L544 384L544 480L576 480L576 400zM384 352L224 352L192 448L416 448L384 352zM304 312C334.9 312 360 286.9 360 256C360 225.1 334.9 200 304 200C273.1 200 248 225.1 248 256C248 286.9 273.1 312 304 312z" /></svg>
                        Adresář
                    </button>
                    <button
                        className={`status-tab trash-tab ${viewMode === 'trash' ? 'active' : ''}`}
                        onClick={() => setViewMode('trash')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M128 160L512 160L488 576L152 576L128 160z" /><path d="M400 48L240 48L224 96L96 96L96 160L544 160L544 96L416 96L400 48z" />
                        </svg>
                        Koš
                    </button>
                </div>

                {/* Search + Actions Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ width: '30%' }}>
                        <input
                            className="search-input"
                            placeholder="Hledat v adresáři..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', marginBottom: 0 }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
                        {viewMode === 'active' && (
                            <>
                                <button className="action-btn-full" onClick={handleMergeCheck} title="Sloučit duplicity">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="18" height="18">
                                        <path opacity=".4" d="M64.1 448L64.1 512L239.5 512L249.1 500L367.5 352L336.7 352C331.4 345.3 322.8 334.7 311.1 320L208.7 448L64.1 448z" /><path d="M224.1 128L239.5 128L249.1 140L367.5 288L448.1 288L448.1 193.5C481.7 222.9 520.7 257 565.2 295.9L592.7 320C561.7 347.1 458.8 437.1 448.1 446.5L448.1 352L336.7 352L327.1 340L208.7 192L64.1 192L64.1 128L224.1 128z" />
                                    </svg>
                                    Sloučit
                                </button>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleImport} />
                                <button className="action-btn-full" onClick={() => fileInputRef.current?.click()} title="Importovat">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="18" height="18">
                                        <path opacity=".4" d="M128 64L128 368L310.1 368C287.1 345 271.1 329 262.1 320L296 286.1C298.1 288.2 327.8 317.9 385 375.1L402 392.1C399.9 394.2 370.2 423.9 313 481.1L296 498.1L262.1 464.2C271.1 455.2 287.1 439.2 310.1 416.2L128 416L128 576L512 576L512 208L368 64L128 64zM336 122.5L453.5 240L336 240L336 122.5z" /><path d="M385 409L402 392C399.9 389.9 370.2 360.2 313 303L296 286L262.1 319.9C271.1 328.9 287.1 344.9 310.1 367.9L64 368L64 416L310.1 416C287.1 439 271.1 455 262.1 464L296 497.9C298.1 495.8 327.8 466.1 385 408.9z" />
                                    </svg>
                                    Import
                                </button>
                                <button className="action-btn-full" onClick={handleExport} title="Exportovat">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="18" height="18">
                                        <path opacity=".4" d="M64.4 64L64.4 576L448.4 576L448.4 416L256.4 416L256.4 368L448.4 368L448.4 208L304.4 64L64.4 64zM272.4 122.5L389.9 240L272.4 240L272.4 122.5z" /><path d="M601.4 409L618.4 392C616.3 389.9 586.6 360.2 529.4 303L512.4 286L478.5 319.9C487.5 328.9 503.5 344.9 526.5 367.9L256.4 367.9L256.4 415.9L526.5 415.9C503.5 438.9 487.5 454.9 478.5 463.9L512.4 497.8C514.5 495.7 544.2 466 601.4 408.8z" />
                                    </svg>
                                    Export
                                </button>
                                <button className="action-btn-full" onClick={openAddModal}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="18" height="18">
                                        <path opacity=".4" d="M48 576L464 576L400 368L112 368L48 576zM136 192C136 258.3 189.7 312 256 312C322.3 312 376 258.3 376 192C376 125.7 322.3 72 256 72C189.7 72 136 125.7 136 192z" />
                                        <path d="M504 312L504 336L552 336L552 264L624 264L624 216L552 216L552 144L504 144L504 216L432 216L432 264L504 264L504 312z" />
                                    </svg>
                                    Nový odběratel
                                </button>
                            </>
                        )}
                        {viewMode === 'trash' && (
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
                                    cursor: filteredCustomers.length > 0 ? 'pointer' : 'not-allowed',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s ease',
                                    fontFamily: 'var(--font-primary)',
                                    opacity: filteredCustomers.length > 0 ? 1 : 0.5
                                }}
                                onMouseOver={(e) => {
                                    if (filteredCustomers.length > 0) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.2)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 77, 79, 0.3)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.1)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                                disabled={filteredCustomers.length === 0}
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

                {/* Table Detail */}
                <div style={{ backgroundColor: 'var(--color-ui-dark)', borderRadius: '12px', padding: '24px' }}>
                    <div className="invoice-table-container">
                        {filteredCustomers.length === 0 ? (
                            <div className="empty-state">
                                Žádné položky nebyly nalezeny.
                            </div>
                        ) : (
                            <table className="invoice-table" style={{ tableLayout: 'auto', width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ whiteSpace: 'nowrap' }}>IČO</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                        <th style={{ whiteSpace: 'nowrap' }}>Doména</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>E-mail</th>
                                        <th style={{ whiteSpace: 'nowrap' }}>Telefon</th>
                                        <th style={{ width: '80px', textAlign: 'right', whiteSpace: 'nowrap' }}>Akce</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map((cust, index) => (
                                        <tr key={index} className={`animate-fade-in stagger-${(index % 5) + 1}`} onClick={() => handleViewDetail(cust)}>
                                            <td>
                                                {cust.ico ? <span className="col-number">{cust.ico}</span> : <span style={{ opacity: 0.3 }}>-</span>}
                                            </td>
                                            <td style={{ fontWeight: '500', color: 'var(--color-fialovy-mramor)', whiteSpace: 'nowrap' }}>
                                                {cust.name}
                                            </td>
                                            <td style={{ maxWidth: '250px' }}>
                                                {cust.contractDomains && cust.contractDomains.length > 0 ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {cust.contractDomains.map((cd, i) => (
                                                            cd.domain ? <span key={i} className="purple-badge">{cd.domain}</span> : null
                                                        ))}
                                                    </div>
                                                ) : cust.domains ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {cust.domains.split(',').map((d, i) => (
                                                            <span key={i} className="purple-badge">{d.trim()}</span>
                                                        ))}
                                                    </div>
                                                ) : <span style={{ opacity: 0.3 }}>-</span>}
                                            </td>
                                            <td style={{ color: 'var(--color-kralovnin-serik)', whiteSpace: 'nowrap' }}>{cust.email}</td>
                                            <td style={{ opacity: cust.phone ? 1 : 0.3, whiteSpace: 'nowrap' }}>{cust.phone || '-'}</td>
                                            <td className="col-actions">
                                                {viewMode === 'active' ? (
                                                    <>
                                                        <button className="edit-btn-simple" onClick={(e) => handleEdit(cust, e)}>
                                                            <EditIcon size={20} />
                                                        </button>
                                                        <button className="delete-btn-simple" onClick={(e) => handleDelete(cust, e)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                                                <path opacity=".4" d="M128 160L512 160L488 576L152 576L128 160z" /><path d="M400 48L240 48L224 96L96 96L96 160L544 160L544 96L416 96L400 48z" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="edit-btn-simple" onClick={(e) => handleRestore(cust, e)} title="Obnovit">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                                                <path opacity=".4" d="M91.2 434.9C133.3 518.5 219.9 576 320 576C390.7 576 454.7 547.3 501 501C523.3 478.7 540.7 453.2 553 426.1C566.9 395.7 574.9 362.1 575.9 326.8C576 324.8 576 322.9 576 320.9C576.2 255.1 551.2 189.2 501 139C451 89 385.4 64 320 64C243.5 64 174.9 97.6 128 150.7L128 192L176.9 192C212.1 152.7 263.2 128 320 128C369.2 128 418.3 146.7 455.8 184.2C493.3 221.7 512 270.8 512 320C512 322.3 512 324.5 511.9 326.8C511.2 345.5 507.9 364.2 501.8 382.1C476 457.7 404.4 512.1 320 512.1C245 512.1 180 469.1 148.4 406.3L91.2 434.9z" /><path d="M128 64L128 192L256 192L256 256L64 256L64 64L128 64z" />
                                                            </svg>
                                                        </button>
                                                        <button className="delete-btn-simple" onClick={(e) => handleDelete(cust, e)} title="Trvale smazat">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                                                <path opacity=".4" d="M182.9 137.4L160.3 114.7L115 160L137.6 182.6L275 320L137.6 457.4L115 480L160.3 525.3L320.3 365.3L457.6 502.6L480.3 525.3L525.5 480L502.9 457.4L365.5 320L502.9 182.6L525.5 160L480.3 114.7L457.6 137.4L320.3 274.7L182.9 137.4z" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <CustomerModal
                    isOpen={modalOpen}
                    mode={modalMode}
                    customerToEdit={editingCustomer}
                    onSave={handleUpdate}
                    onClose={() => {
                        setModalOpen(false);
                        loadCustomers();
                    }}
                />

                <ConfirmationModal
                    isOpen={confirmationModal.isOpen}
                    title={
                        confirmationModal.title || (
                            confirmationModal.type === 'delete' ? 'Odstranit odběratele?' :
                                confirmationModal.type === 'hard_delete' ? 'Trvale smazat odběratele?' :
                                    confirmationModal.type === 'empty_trash' ? 'Vysypat koš?' :
                                        confirmationModal.type === 'import' ? 'Importovat kontakty?' :
                                            'Sloučit duplicity?')
                    }
                    message={
                        confirmationModal.message || (
                            confirmationModal.type === 'delete'
                                ? 'Opravdu chcete přesunout tohoto odběratele do koše?'
                                : confirmationModal.type === 'hard_delete'
                                    ? `Opravdu chcete trvale odstranit tohoto odběratele: ${confirmationModal.data?.name}? Tato akce je nevratná.`
                                    : confirmationModal.type === 'empty_trash'
                                        ? 'Opravdu chcete trvale smazat všechny kontakty v koši? Tato akce je nevratná.'
                                        : confirmationModal.type === 'import'
                                            ? 'Opravdu chcete importovat kontakty? Tímto se přepíše váš aktuální adresář.'
                                            : `Nalezeno ${confirmationModal.data?.groups || 0} skupin duplicit. Celkem bude odstraněno ${confirmationModal.data?.toMerge || 0} nadbytečných záznamů a jejich data budou sloučena. Pokračovat? `)
                    }
                    onConfirm={confirmAction}
                    onCancel={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                    confirmText={
                        confirmationModal.type === 'info' ? 'OK' :
                            confirmationModal.type === 'delete' ? 'Do koše' :
                                confirmationModal.type === 'hard_delete' ? 'Trvale smazat' :
                                    confirmationModal.type === 'empty_trash' ? 'Vysypat koš' :
                                        confirmationModal.type === 'import' ? 'Importovat' :
                                            'Sloučit'
                    }
                    type={['delete', 'merge', 'hard_delete', 'empty_trash'].includes(confirmationModal.type) ? 'danger' : 'default'}
                    confirmButtonClass={['delete', 'merge', 'hard_delete', 'empty_trash'].includes(confirmationModal.type) ? 'delete-btn-force' : ''}
                />
            </div>
        </div>
    );
};

export default CustomerAddressBook;

