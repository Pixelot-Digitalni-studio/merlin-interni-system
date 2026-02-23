"use client";
import React, { useState, useEffect } from 'react';
import CustomerService from '../services/CustomerService';
import ConfirmationModal from './ConfirmationModal';
import { normalizeString } from '../utils/stringUtils';

const CustomerModal = ({ isOpen, onClose, mode, onSelect, customerToEdit, onSave }) => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        address: '',
        ico: '',
        dic: '',
        phone: '',
        email: '',
        contractDomains: []
    });
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        index: null
    });
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
                setNewCustomer(prev => ({
                    ...prev,
                    name: result.name || prev.name,
                    address: result.address || prev.address,
                    dic: result.dic || prev.dic,
                    ico: icoValue
                }));
            } else if (result.error) {
                setAresError(result.message);
                // Clear error after 5s
                setTimeout(() => setAresError(''), 5000);
            }
        } catch (err) {
            console.error('[ARES] Frontend Error:', err);
        } finally {
            setIsAresLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadCustomers();
            setSearchTerm(''); // Reset search when opening
            if ((mode === 'edit' || mode === 'view') && customerToEdit) {
                // Migrate old domains string to contractDomains if needed
                const migrated = { ...customerToEdit };
                if (migrated.domains && !migrated.contractDomains) {
                    migrated.contractDomains = migrated.domains.split(',').map(d => ({
                        contractNumber: '', domain: d.trim()
                    })).filter(d => d.domain);
                }
                if (!migrated.contractDomains) migrated.contractDomains = [];
                setNewCustomer(migrated);
            } else if (mode === 'add') {
                setNewCustomer({
                    name: '', address: '', ico: '', dic: '', phone: '', email: '', contractDomains: []
                });
            }
        }
    }, [isOpen, mode, customerToEdit]);

    const loadCustomers = () => {
        setCustomers(CustomerService.getAll());
    };

    const filteredCustomers = customers.filter(cust => {
        const query = normalizeString(searchTerm);
        return normalizeString(cust.name).includes(query) ||
            normalizeString(cust.address).includes(query) ||
            cust.ico.includes(searchTerm);
    });

    const handleSave = () => {
        if (!newCustomer.name) {
            alert('Vyplňte alespoň jméno.');
            return;
        }

        if (mode === 'edit') {
            onSave(newCustomer);
        } else {
            CustomerService.add(newCustomer);
            loadCustomers();
            if (onSelect) {
                onSelect(newCustomer);
            }
        }
        onClose();
    };

    const handleDelete = (index, e) => {
        e.stopPropagation();
        setConfirmationModal({
            isOpen: true,
            index: index
        });
    };

    const confirmDelete = () => {
        if (confirmationModal.index !== null) {
            const updated = CustomerService.moveToTrash(confirmationModal.index);
            setCustomers(updated);
        }
        setConfirmationModal({ isOpen: false, index: null });
    };

    const sectionStyle = {
        backgroundColor: 'var(--color-ui-dark)',
        padding: '24px',
        borderRadius: '8px',
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

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', backgroundColor: 'var(--color-ui-medium)', borderRadius: '16px' }}>
                <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--color-fialovy-mramor)', margin: '0px' }}>
                        {mode === 'add' ? 'Přidat odběratele' :
                            mode === 'edit' ? 'Upravit odběratele' :
                                mode === 'view' ? 'Detail odběratele' :
                                    'Vybrat odběratele'}
                    </h2>
                    <button className="close-btn" onClick={onClose} title="Zavřít">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                            <path opacity=".4" d="M182.9 137.4L160.3 114.7L115 160L137.6 182.6L275 320L137.6 457.4L115 480L160.3 525.3L320.3 365.3L457.6 502.6L480.3 525.3L525.5 480L502.9 457.4L365.5 320L502.9 182.6L525.5 160L480.3 114.7L457.6 137.4L320.3 274.7L182.9 137.4z" /><path d="" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: 0 }}>
                    {mode === 'select' ? (
                        <>
                            <div className="search-container" style={{ marginBottom: '20px' }}>
                                <input
                                    className="search-input"
                                    placeholder="Hledat odběratele..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ borderRadius: '12px' }}
                                />
                            </div>
                            <div className="customer-list" style={{ gap: '12px' }}>
                                {filteredCustomers.length === 0 ? (
                                    <p className="no-data">
                                        {searchTerm ? 'Žádný uložení odběratel neodpovídá vyhledávání.' : 'Žádní uložení odběratelé.'}
                                    </p>
                                ) : (
                                    filteredCustomers.map((cust, index) => (
                                        <div
                                            key={index}
                                            className={`customer-item animate-fade-in stagger-${(index % 5) + 1}`}
                                            style={{ animationFillMode: 'both' }}
                                            onClick={() => { onSelect(cust); onClose(); }}
                                        >
                                            <div className="item-details">
                                                <h3 style={{ color: 'var(--color-kralovnin-serik)', fontSize: '1.1rem', margin: '0 0 4px 0' }}>{cust.name}</h3>
                                                <p style={{ color: 'var(--color-mlzna-luna)', opacity: 0.8, fontSize: '0.95rem', margin: '0 0 12px 0' }}>{cust.address}</p>
                                                <div className="item-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                                    <span>IČO: {cust.ico}</span>
                                                    {cust.dic && <span>DIČ: {cust.dic}</span>}
                                                    {cust.phone && <span>Tel: {cust.phone}</span>}
                                                    {cust.email && <span>E-mail: {cust.email}</span>}
                                                </div>
                                            </div>
                                            <button
                                                className="delete-icon-btn"
                                                onClick={(e) => handleDelete(index, e)}
                                                title="Smazat"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                                    <path opacity=".4" d="M128 160L512 160L488 576L152 576L128 160z" /><path d="M400 48L240 48L224 96L96 96L96 160L544 160L544 96L416 96L400 48z" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="customer-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
                            <div style={sectionStyle}>
                                <h3 style={sectionTitleStyle}>Hlavní údaje</h3>
                                <input
                                    className="modal-input"
                                    placeholder="Jméno / Firma"
                                    value={newCustomer.name}
                                    disabled={mode === 'view'}
                                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                />
                                <div style={rowStyle}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <input
                                            className="modal-input"
                                            placeholder="IČO"
                                            value={newCustomer.ico}
                                            disabled={mode === 'view'}
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                setNewCustomer({ ...newCustomer, ico: val });
                                                if (val.length === 8 && mode !== 'view') {
                                                    handleAresLookup(val);
                                                }
                                            }}
                                            onBlur={() => {
                                                if (newCustomer.ico.length === 8 && mode !== 'view') {
                                                    handleAresLookup(newCustomer.ico);
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
                                    <div style={{ flex: 1 }}>
                                        <input
                                            className="modal-input"
                                            placeholder="DIČ"
                                            value={newCustomer.dic}
                                            disabled={mode === 'view'}
                                            onChange={e => setNewCustomer({ ...newCustomer, dic: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={rowStyle}>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            className="modal-input"
                                            placeholder="Telefon"
                                            value={newCustomer.phone}
                                            disabled={mode === 'view'}
                                            onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            className="modal-input"
                                            placeholder="E-mail"
                                            value={newCustomer.email}
                                            disabled={mode === 'view'}
                                            onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={sectionStyle}>
                                <h3 style={sectionTitleStyle}>Adresa</h3>
                                <input
                                    className="modal-input"
                                    placeholder="Ulice, č.p., Město, PSČ"
                                    value={newCustomer.address}
                                    disabled={mode === 'view'}
                                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                />
                            </div>

                            <div style={sectionStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ ...sectionTitleStyle, marginBottom: 0, paddingBottom: 0 }}>Smlouvy a domény</h3>
                                    {mode !== 'view' && (
                                        <button
                                            className="action-btn-full"
                                            onClick={() => setNewCustomer({
                                                ...newCustomer,
                                                contractDomains: [...(newCustomer.contractDomains || []), { contractNumber: '', domain: '' }]
                                            })}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="16" height="16">
                                                <path opacity=".4" d="M352 128L352 96L288 96L288 288L96 288L96 352L288 352L288 544L352 544L352 352L544 352L544 288L352 288L352 128z" />
                                            </svg>
                                            Přidat smlouvu
                                        </button>
                                    )}
                                </div>
                                {(newCustomer.contractDomains || []).map((cd, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '16px', marginBottom: '8px', alignItems: 'center' }}>
                                        <input
                                            className="modal-input"
                                            style={{ flex: 1, marginBottom: 0 }}
                                            placeholder="Číslo smlouvy"
                                            value={cd.contractNumber || ''}
                                            disabled={mode === 'view'}
                                            onChange={e => {
                                                const updated = [...newCustomer.contractDomains];
                                                updated[idx] = { ...updated[idx], contractNumber: e.target.value };
                                                setNewCustomer({ ...newCustomer, contractDomains: updated });
                                            }}
                                        />
                                        <input
                                            className="modal-input"
                                            style={{ flex: 1, marginBottom: 0 }}
                                            placeholder="Doména"
                                            value={cd.domain || ''}
                                            disabled={mode === 'view'}
                                            onChange={e => {
                                                const updated = [...newCustomer.contractDomains];
                                                updated[idx] = { ...updated[idx], domain: e.target.value };
                                                setNewCustomer({ ...newCustomer, contractDomains: updated });
                                            }}
                                        />
                                        {mode !== 'view' && (
                                            <button
                                                className="delete-btn-simple"
                                                onClick={() => {
                                                    const updated = newCustomer.contractDomains.filter((_, i) => i !== idx);
                                                    setNewCustomer({ ...newCustomer, contractDomains: updated });
                                                }}
                                                title="Odebrat"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                                    <path opacity=".4" d="M128 160L512 160L488 576L152 576L128 160z" /><path d="M400 48L240 48L224 96L96 96L96 160L544 160L544 96L416 96L400 48z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {mode !== 'view' && (
                                <button className="save-btn" onClick={handleSave} style={{ width: '100%', marginTop: '8px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                        <path opacity=".4" d="M48 576L464 576L400 368L112 368L48 576zM136 192C136 258.3 189.7 312 256 312C322.3 312 376 258.3 376 192C376 125.7 322.3 72 256 72C189.7 72 136 125.7 136 192z" /><path d="M504 312L504 336L552 336L552 264L624 264L624 216L552 216L552 144L504 144L504 216L432 216L432 264L504 264L504 312z" />
                                    </svg>
                                    {mode === 'edit' ? 'Uložit změny' : 'Uložit odběratele'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                title="Odstranit odběratele?"
                message="Opravdu chcete přesunout tohoto odběratele do koše?"
                onConfirm={confirmDelete}
                onCancel={() => setConfirmationModal({ isOpen: false, index: null })}
                confirmText="Smazat"
                type="danger"
                confirmButtonClass="delete-btn-force"
            />
        </div >
    );
};

export default CustomerModal;

