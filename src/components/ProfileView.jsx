"use client";
import React, { useRef, useState } from 'react';
import { calculateIBAN, getSwiftCode } from '../utils/payment';


const ProfileView = ({ profile, onChange, onSave, showAlert }) => {
    const fileInputRef = useRef(null);
    const [isAresLoading, setIsAresLoading] = useState(false);

    const handleAresLookup = async (icoValue) => {
        if (!icoValue || icoValue.length !== 8) return;
        if (!window.electronAPI || !window.electronAPI.getCompanyDetails) return;

        setIsAresLoading(true);

        try {
            const result = await window.electronAPI.getCompanyDetails(icoValue);
            if (result && result.success) {
                const data = result.data;
                // Assuming onChange can handle individual field updates or a full profile object update
                // For consistency with existing onChange calls, we'll call it for each field.
                // If onChange was designed to take a full object, the provided snippet would be correct.
                // Given the existing `onChange('name', value)` pattern, we'll adapt.
                if (data.obchodniJmeno) onChange('name', data.obchodniJmeno);
                if (data.sidlo?.textovaAdresa) onChange('address', data.sidlo.textovaAdresa);
                if (data.dic) onChange('dic', data.dic);
            } else if (result && result.error) {
                // If there's an error, and showAlert is available, use it.
                // The original code had undefined setAresError calls.
                showAlert('Chyba ARES', result.message, 'error');
            }
        } catch (error) {
            console.error('ARES lookup failed:', error);
            showAlert('Chyba ARES', 'Nepodařilo se získat data z ARES.', 'error');
        } finally {
            setIsAresLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showAlert('Logo je příliš velké', 'Maximální velikost je 2MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange('logo', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const sectionBoxStyle = {
        backgroundColor: 'var(--color-ui-dark)',
        padding: '24px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    };


    const innerTitleStyle = {
        fontSize: '1.8rem',
        fontWeight: '700',
        color: 'var(--color-fialovy-mramor)',
        margin: '0'
    };

    const innerSubtitleStyle = {
        fontSize: '0.9rem',
        fontWeight: '500',
        color: 'var(--color-kralovnin-serik)',
        textTransform: 'uppercase',
        letterSpacing: '0.2rem',
    };

    return (
        <div style={{ color: 'var(--color-fialovy-mramor)', display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
            <div style={{ color: 'var(--color-fialovy-mramor)', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1200px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', flex: 1, alignItems: 'start' }}>
                    <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={sectionBoxStyle}>
                            <div>
                                <h3 style={innerTitleStyle}>Základní údaje</h3>
                                <p style={innerSubtitleStyle}>NÁZEV, IČO, ADRESA</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="input-field" style={{ position: 'relative' }}>
                                        <input
                                            className="profile-input"
                                            name="ico"
                                            value={profile.ico}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                onChange('ico', val);
                                                if (val.length === 8) handleAresLookup(val);
                                            }}
                                            placeholder="IČO"
                                            style={{ width: '100%', marginBottom: 0 }}
                                        />
                                        {isAresLoading && (
                                            <div style={{ position: 'absolute', right: '12px', bottom: '12px' }}>
                                                <div className="ares-loader"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="input-field">
                                        <input
                                            className="profile-input"
                                            name="dic"
                                            value={profile.dic}
                                            onChange={handleChange}
                                            placeholder="DIČ"
                                            style={{ width: '100%', marginBottom: 0 }}
                                        />
                                    </div>
                                </div>

                                <div className="input-field">
                                    <input
                                        className="profile-input"
                                        name="name"
                                        value={profile.name}
                                        onChange={handleChange}
                                        placeholder="Jméno/Firma"
                                        style={{ width: '100%', marginBottom: 0 }}
                                    />
                                </div>

                                <div className="input-field">
                                    <input
                                        className="profile-input"
                                        name="address"
                                        value={profile.address}
                                        onChange={handleChange}
                                        placeholder="Adresa"
                                        style={{ width: '100%', marginBottom: 0 }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="input-field">
                                        <input
                                            className="profile-input"
                                            name="phone"
                                            value={profile.phone}
                                            onChange={handleChange}
                                            placeholder="Telefon"
                                            style={{ width: '100%', marginBottom: 0 }}
                                        />
                                    </div>
                                    <div className="input-field">
                                        <input
                                            className="profile-input"
                                            name="email"
                                            value={profile.email}
                                            onChange={handleChange}
                                            placeholder="E-mail"
                                            style={{ width: '100%', marginBottom: 0 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div >

                        {/* Platební údaje Section */}
                        < div style={sectionBoxStyle} >
                            <div>
                                <h3 style={innerTitleStyle}>Platební údaje</h3>
                                <p style={innerSubtitleStyle}>ČÍSLO ÚČTU</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                                    <div className="input-field">
                                        <input
                                            className="profile-input"
                                            name="account"
                                            value={profile.account}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                onChange('account', val);
                                                const iban = calculateIBAN(val);
                                                const swift = getSwiftCode(val);
                                                if (iban) onChange('iban', iban);
                                                if (swift) onChange('swift', swift);
                                            }}
                                            placeholder="Číslo účtu"
                                            style={{ width: '100%', marginBottom: 0 }}
                                        />
                                    </div>
                                    <div className="input-field">
                                        <input
                                            className="profile-input"
                                            name="swift"
                                            value={profile.swift}
                                            onChange={handleChange}
                                            placeholder="SWIFT"
                                            style={{ width: '100%', marginBottom: 0 }}
                                        />
                                    </div>
                                </div>

                                <div className="input-field">
                                    <input
                                        className="profile-input"
                                        name="iban"
                                        value={profile.iban}
                                        onChange={handleChange}
                                        placeholder="IBAN"
                                        style={{ width: '100%', marginBottom: 0 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Logo Section (col-span-4) */}
                    <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Nahrané logo Section */}
                        < div style={sectionBoxStyle} >
                            <div>
                                <h3 style={innerTitleStyle}>Nahrané logo</h3>
                                <p style={innerSubtitleStyle}>LOGO/BRAND</p>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: '100%',
                                    height: '160px',
                                    backgroundColor: 'rgba(135, 95, 220, 0.05)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed rgba(135, 95, 220, 0.2)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    padding: '40px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-kralovnin-serik)';
                                    e.currentTarget.style.backgroundColor = 'rgba(135, 95, 220, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(135, 95, 220, 0.2)';
                                    e.currentTarget.style.backgroundColor = 'rgba(135, 95, 220, 0.05)';
                                }}
                            >
                                {profile.logo ? (
                                    <img src={profile.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ color: 'var(--color-mlzna-luna)', opacity: 0.3, fontSize: '0.9rem' }}>
                                        Žádné logo
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'var(--color-mlzna-luna)', margin: '-10px 0 0 0', textAlign: 'left' }}>
                                Podporované formáty: PNG, JPG, SVG (Max. 2MB).
                            </p>

                            <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                                <button
                                    className="action-btn-full"
                                    style={{ flex: 1, justifyContent: 'center', gap: '8px' }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <svg width="18" height="18" viewBox="0 0 25 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.4" d="M3.75 15H11.25V17.5H13.75V15H21.25V21.25H3.75V15ZM17.1875 18.125C17.1875 18.3736 17.2863 18.6121 17.4621 18.7879C17.6379 18.9637 17.8764 19.0625 18.125 19.0625C18.3736 19.0625 18.6121 18.9637 18.7879 18.7879C18.9637 18.6121 19.0625 18.3736 19.0625 18.125C19.0625 17.8764 18.9637 17.6379 18.7879 17.4621C18.6121 17.2863 18.3736 17.1875 18.125 17.1875C17.8764 17.1875 17.6379 17.2863 17.4621 17.4621C17.2863 17.6379 17.1875 17.8764 17.1875 18.125Z" />
                                        <path d="M13.75 17.5V6.76953C14.9492 7.96875 15.7812 8.80078 16.25 9.26953L18.0195 7.5C17.9062 7.38672 16.3633 5.84375 13.3867 2.86719L12.5 1.98047C12.3867 2.09375 10.8437 3.63672 7.86719 6.61328L6.98438 7.49609L8.75391 9.26562L11.2539 6.76562V17.4961H13.7539L13.75 17.5Z" />
                                    </svg>
                                    Nahrát logo
                                </button>
                                <button
                                    className="delete-all-btn"
                                    onClick={() => onChange('logo', '')}
                                    style={{ flex: 1, justifyContent: 'center', gap: '8px' }}
                                    disabled={!profile.logo}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="18" height="18">
                                        <path opacity=".4" d="M128 160L512 160L488 576L152 576L128 160z" />
                                        <path d="M400 48L240 48L224 96L96 96L96 160L544 160L544 96L416 96L400 48z" />
                                    </svg>
                                    Smazat
                                </button>
                            </div>
                        </div >

                        {/* Akce Section */}
                        < div style={sectionBoxStyle} >
                            <div>
                                <h3 style={innerTitleStyle}>Akce</h3>
                                <p style={innerSubtitleStyle}>SPRÁVA PROFILU</p>
                            </div>
                            <button
                                className="action-btn-full"
                                style={{ width: '100%', justifyContent: 'center', gap: '12px', padding: '16px' }}
                                onClick={onSave}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="20" height="20">
                                    <path opacity=".4" d="M96 96L96 544L544 544L544 210.7L438.6 105.3L429.2 95.9L95.9 95.9zM192 160L416 160L416 288L192 288L192 160zM384 416C384 451.3 355.3 480 320 480C284.7 480 256 451.3 256 416C256 380.7 284.7 352 320 352C355.3 352 384 380.7 384 416z" />
                                    <path d="M256 416C256 380.7 284.7 352 320 352C355.3 352 384 380.7 384 416C384 451.3 355.3 480 320 480C284.7 480 256 451.3 256 416z" />
                                </svg>
                                Uložit profil
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;

