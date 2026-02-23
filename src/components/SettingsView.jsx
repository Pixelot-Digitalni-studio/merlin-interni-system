"use client";
import React, { useState, useEffect } from 'react';
import BackupService from '../services/BackupService';
import ConfirmationModal from './ConfirmationModal';

const SettingsView = ({ showAlert }) => {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [appInfo, setAppInfo] = useState({ version: '1.3.6', publishedAt: null });

    useEffect(() => {
        if (!window.electronAPI) return;
        // Load real app version and last update date
        window.electronAPI.getAppInfo().then(info => {
            if (info) setAppInfo({ version: info.version || '1.3.6', publishedAt: info.publishedAt || null });
        }).catch(() => { });
    }, []);

    const handleExportBackup = async () => {
        try {
            const result = await BackupService.exportBackup();
            if (result && result.success) {
                showAlert('Záloha vytvořena', `Systémová záloha byla úspěšně uložena do: ${result.filePath}`, 'default');
            } else if (result && result.error) {
                showAlert('Chyba exportu', result.error, 'error');
            }
        } catch (error) {
            console.error('Export failed:', error);
            showAlert('Chyba exportu', 'Nepodařilo se vytvořit zálohu dat.', 'error');
        }
    };

    const confirmImport = async () => {
        try {
            const result = await BackupService.importBackup();
            if (result && result.success) {
                showAlert('Obnova dokončena', 'Data byla úspěšně obnovena. Aplikace se nyní restartuje.', 'default');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else if (result && result.error) {
                showAlert('Chyba obnovy', result.message || 'Nepodařilo se obnovit data ze zálohy.', 'error');
            }
        } catch (error) {
            console.error('Import failed:', error);
            showAlert('Chyba obnovy', 'Došlo k chybě při obnově dat.', 'error');
        }
        setIsImportModalOpen(false);
    };

    // Shared styles to match image_1.png exactly
    const outerBoxStyle = {
        backgroundColor: 'var(--color-ui-dark)',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid rgba(135, 95, 220, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    };

    const innerCardStyle = {
        backgroundColor: 'var(--color-ui-medium)',
        padding: '24px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start', // STRIKTNĚ DOLEVA
        textAlign: 'left',       // STRIKTNĚ DOLEVA
        gap: '16px',
        flex: 1,
    };

    const iconBoxStyle = {
        backgroundImage: 'linear-gradient(45deg, #8E5BE308, #875FDC32)',
        width: '56px',
        height: '56px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-kralovnin-serik)',
    };

    const sideBoxStyle = {
        backgroundColor: 'var(--color-ui-dark)',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid rgba(135, 95, 220, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    };

    const infoCardStyle = {
        backgroundColor: 'var(--color-ui-medium)',
        padding: '12px 24px',
        borderRadius: ' 0 8px 8px 0px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        borderLeft: '4px solid var(--color-kralovnin-serik)',
        textAlign: 'left' // STRIKTNĚ DOLEVA
    };

    return (
        <div style={{ color: 'var(--color-fialovy-mramor)', display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>

            <div style={{ color: 'var(--color-fialovy-mramor)', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1200px' }}>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', alignItems: 'start' }}>

                    {/* Levý panel - Správa aplikace (col-span-8) */}
                    <div style={{ gridColumn: 'span 8' }}>
                        <div style={outerBoxStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', textAlign: 'left' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>
                                    Správa aplikace
                                </h2>
                                <div style={{ color: 'var(--color-kralovnin-serik)', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '0.3rem' }}>
                                    ZÁLOHOVÁNÍ A OBNOVA
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                {/* Karta Export dat */}
                                <div style={innerCardStyle}>
                                    <div style={iconBoxStyle}>
                                        <svg viewBox="0 0 25 25" fill="currentColor" width="32" height="32">
                                            <path opacity="0.4" d="M3.75 15H9.48047C11.1094 16.6289 12.1172 17.6367 12.5 18.0195L15.5195 15H21.25V21.25H3.75V15ZM17.1875 18.125C17.1875 18.3736 17.2863 18.6121 17.4621 18.7879C17.6379 18.9637 17.8764 19.0625 18.125 19.0625C18.3736 19.0625 18.6121 18.9637 18.7879 18.7879C18.9637 18.6121 19.0625 18.3736 19.0625 18.125C19.0625 17.8764 18.9637 17.6379 18.7879 17.4621C18.6121 17.2863 18.3736 17.1875 18.125 17.1875C17.8764 17.1875 17.6379 17.2863 17.4621 17.4621C17.2863 17.6379 17.1875 17.8764 17.1875 18.125Z" />
                                            <path d="M13.75 2.5V13.2305C14.9492 12.0313 15.7813 11.1992 16.25 10.7305L18.0195 12.5L12.5 18.0195C12.3867 17.9062 10.8438 16.3633 7.86719 13.3867L6.98047 12.5L8.75 10.7305C9.21875 11.1992 10.0508 12.0313 11.25 13.2305V2.5H13.75Z" />
                                        </svg>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>Export dat</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-mlzna-luna)', opacity: 0.6, lineHeight: '1.5', margin: 0 }}>
                                            Vytvoří kompletní kopii všech dat aplikace pro případ selhání počítače.
                                        </p>
                                    </div>
                                    <button
                                        className="action-btn-full"
                                        onClick={handleExportBackup}
                                        style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                                    >
                                        <svg viewBox="0 0 25 25" fill="currentColor" width="16" height="16">
                                            <path opacity="0.4" d="M3.75 15H9.48047C11.1094 16.6289 12.1172 17.6367 12.5 18.0195L15.5195 15H21.25V21.25H3.75V15ZM17.1875 18.125C17.1875 18.3736 17.2863 18.6121 17.4621 18.7879C17.6379 18.9637 17.8764 19.0625 18.125 19.0625C18.3736 19.0625 18.6121 18.9637 18.7879 18.7879C18.9637 18.6121 19.0625 18.3736 19.0625 18.125C19.0625 17.8764 18.9637 17.6379 18.7879 17.4621C18.6121 17.2863 18.3736 17.1875 18.125 17.1875C17.8764 17.1875 17.6379 17.2863 17.4621 17.4621C17.2863 17.6379 17.1875 17.8764 17.1875 18.125Z" />
                                            <path d="M13.75 2.5V13.2305C14.9492 12.0313 15.7813 11.1992 16.25 10.7305L18.0195 12.5L12.5 18.0195C12.3867 17.9062 10.8438 16.3633 7.86719 13.3867L6.98047 12.5L8.75 10.7305C9.21875 11.1992 10.0508 12.0313 11.25 13.2305V2.5H13.75Z" />
                                        </svg>
                                        Stáhnout zálohu
                                    </button>
                                </div>

                                {/* Karta Obnova dat */}
                                <div style={innerCardStyle}>
                                    <div style={iconBoxStyle}>
                                        <svg viewBox="0 0 25 25" fill="currentColor" width="32" height="32">
                                            <path opacity="0.4" d="M3.75 15H11.25V17.5H13.75V15H21.25V21.25H3.75V15ZM17.1875 18.125C17.1875 18.3736 17.2863 18.6121 17.4621 18.7879C17.6379 18.9637 17.8764 19.0625 18.125 19.0625C18.3736 19.0625 18.6121 18.9637 18.7879 18.7879C18.9637 18.6121 19.0625 18.3736 19.0625 18.125C19.0625 17.8764 18.9637 17.6379 18.7879 17.4621C18.6121 17.2863 18.3736 17.1875 18.125 17.1875C17.8764 17.1875 17.6379 17.2863 17.4621 17.4621C17.2863 17.6379 17.1875 17.8764 17.1875 18.125Z" />
                                            <path d="M13.75 17.5V6.76953C14.9492 7.96875 15.7812 8.80078 16.25 9.26953L18.0195 7.5C17.9062 7.38672 16.3633 5.84375 13.3867 2.86719L12.5 1.98047C12.3867 2.09375 10.8437 3.63672 7.86719 6.61328L6.98438 7.49609L8.75391 9.26562L11.2539 6.76562V17.4961H13.7539L13.75 17.5Z" />
                                        </svg>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>Obnova dat</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-mlzna-luna)', opacity: 0.6, lineHeight: '1.5', margin: 0 }}>
                                            Nahradí aktuální data daty ze souboru. Pozor, tato akce smaže stávající data!
                                        </p>
                                    </div>
                                    <button
                                        className="action-btn-full"
                                        onClick={() => setIsImportModalOpen(true)}
                                        style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                                    >
                                        <svg viewBox="0 0 25 25" fill="currentColor" width="16" height="16">
                                            <path opacity="0.4" d="M3.75 15H11.25V17.5H13.75V15H21.25V21.25H3.75V15ZM17.1875 18.125C17.1875 18.3736 17.2863 18.6121 17.4621 18.7879C17.6379 18.9637 17.8764 19.0625 18.125 19.0625C18.3736 19.0625 18.6121 18.9637 18.7879 18.7879C18.9637 18.6121 19.0625 18.3736 19.0625 18.125C19.0625 17.8764 18.9637 17.6379 18.7879 17.4621C18.6121 17.2863 18.3736 17.1875 18.125 17.1875C17.8764 17.1875 17.6379 17.2863 17.4621 17.4621C17.2863 17.6379 17.1875 17.8764 17.1875 18.125Z" />
                                            <path d="M13.75 17.5V6.76953C14.9492 7.96875 15.7812 8.80078 16.25 9.26953L18.0195 7.5C17.9062 7.38672 16.3633 5.84375 13.3867 2.86719L12.5 1.98047C12.3867 2.09375 10.8437 3.63672 7.86719 6.61328L6.98438 7.49609L8.75391 9.26562L11.2539 6.76562V17.4961H13.7539L13.75 17.5Z" />
                                        </svg>
                                        Nahrát ze souboru
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pravý panel - Informace (col-span-4) */}
                    <div style={{ gridColumn: 'span 4', gridRow: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Sekce O VÝVOJÁŘI - MERLIN LOGO */}
                        <div style={{ ...sideBoxStyle, alignItems: 'center', textAlign: 'center', gap: '24px' }}>
                            <svg width="200" height="68" viewBox="0 0 396 134" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M256.121 115.47H267.352L256.121 133.45L238.066 117.748V47.2223L256.121 38.1111V115.47ZM297.381 115.535H308.612L297.381 133.45L279.326 117.813V62.2953H297.381V115.535ZM165.97 90.9083L133.157 104.076V115.473H160.291L147.67 133.45L114.986 121.802V78.7528L132.778 62.2926H165.97V90.9083ZM149.184 76.2213H133.157V92.6814H149.184V76.2213ZM91.7491 115.47H102.98L91.7491 133.447L73.7017 117.751V76.0944H54.8983V129.396H36.8508V76.0944H18.0555V129.391H0V67.3556L18.0555 58.2417V73.8058L33.9483 58.2417L54.8983 73.8139L70.6754 58.2417L91.7491 73.8139V115.47ZM375.513 115.47H386.747L375.513 133.447L357.466 117.751V76.0944H338.67V129.391H338.662V129.396H320.618V67.3556L338.67 58.2417V73.8058L354.563 58.2417L375.513 73.8139V115.47ZM227.074 81.538H199.445V129.396H181.389V67.3583L199.445 58.2471V77.8568L214.832 58.239L227.074 81.538ZM382.042 58.2417V45.155H384.525L388.955 55.0705H389.176L393.52 45.155H396.003V58.2417H394.099V48.4287H393.924L389.649 58.2417H388.353L384.078 48.4692H383.903V58.2417H382.042ZM373.544 58.2417V46.9821H369.391V45.155H379.758V46.9821H375.543V58.2417H373.544Z" fill="#F7F3FF" />
                                <path d="M292.946 23.6146H285.102V31.4844H292.946V23.6146Z" fill="#875FDC" />
                                <g opacity="0.4">
                                    <path d="M300.793 31.4846H292.949V39.3544H300.793V31.4846Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.72">
                                    <path d="M292.946 15.7421H285.102V23.6119H292.946V15.7421Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.72">
                                    <path d="M300.793 23.6146H292.949V31.4844H300.793V23.6146Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.72">
                                    <path d="M285.102 23.6146H277.258V31.4844H285.102V23.6146Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.72">
                                    <path d="M292.946 31.4846H285.102V39.3544H292.946V31.4846Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M285.102 31.4846H277.258V39.3544H285.102V31.4846Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M285.102 15.7421H277.258V23.6119H285.102V15.7421Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M300.793 15.7421H292.949V23.6119H300.793V15.7421Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M292.946 7.87238H285.102V15.7422H292.946V7.87238Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M292.946 39.3543H285.102V47.2241H292.946V39.3543Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M324.328 39.3543H316.484V47.2241H324.328V39.3543Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M316.484 7.87238H308.64V15.7422H316.484V7.87238Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M332.172 7.87238H324.328V15.7422H332.172V7.87238Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M308.637 23.6146H300.793V31.4844H308.637V23.6146Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M277.258 23.6146H269.414V31.4844H277.258V23.6146Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M324.328 15.7421H316.484V23.6119H324.328V15.7421Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.4">
                                    <path d="M324.328 0H316.484V7.86975H324.328V0Z" fill="#875FDC" />
                                </g>
                                <g opacity="0.72">
                                    <path d="M324.328 7.89941H316.484V15.7692H324.328V7.89941Z" fill="#875FDC" />
                                </g>
                            </svg>

                            <div style={{ fontSize: '0.9rem', color: 'var(--color-mlzna-luna)', opacity: 0.8, letterSpacing: '0.05rem' }}>
                                Vývoj aplikace: <span style={{ color: 'var(--color-kralovnin-serik)', fontWeight: '600' }}>pixelot.cz</span>
                            </div>
                        </div>

                        {/* Sekce AKTUALIZACE */}
                        <div style={sideBoxStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-kralovnin-serik)' }}>
                                <div style={{ backgroundImage: 'linear-gradient(45deg, #8E5BE308, #875FDC32)', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 15 15" fill="currentColor" width="24" height="24">
                                        <path opacity="0.4" d="M1.50039 9V13.5H3.00039V11.5617L3.1293 11.6906C4.28945 12.8484 5.86211 13.5 7.50039 13.5C10.8145 13.5 13.5004 10.8141 13.5004 7.5H12.0004C12.0004 9.98438 9.98477 12 7.50039 12C6.2582 12 5.06758 11.5055 4.18867 10.6289L4.05977 10.5H5.99805V9H1.49805H1.50039Z" />
                                        <path d="M3 7.5C3 5.01562 5.01562 3 7.5 3C8.74219 3 9.93281 3.49219 10.8117 4.37109L10.9406 4.5H9.00234V6H13.5023V1.5H12.0023V3.43828L11.8734 3.30937C10.7109 2.15156 9.14062 1.5 7.5 1.5C4.18594 1.5 1.5 4.18594 1.5 7.5H3Z" />
                                    </svg>
                                </div>
                                <span style={{ fontSize: '0.9rem', fontWeight: '500', letterSpacing: '0.2rem' }}>AKTUALIZACE</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={infoCardStyle}>
                                    <div style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--color-fialovy-mramor)', gap: '0px' }}>Verze systému</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-kralovnin-serik)' }}>{appInfo.version}</div>
                                </div>
                                <div style={infoCardStyle}>
                                    <div style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--color-fialovy-mramor)' }}>Poslední aktualizace</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-kralovnin-serik)' }}>
                                        {appInfo.publishedAt
                                            ? new Date(appInfo.publishedAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
                                            : '—'}
                                    </div>
                                </div>
                            </div>


                        </div>


                    </div>

                    {/* Sekce DŮLEŽITÉ INFO */}
                    <div style={{ gridColumn: 'span 8' }}>
                        <div style={outerBoxStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-kralovnin-serik)' }}>
                                <div style={{ backgroundImage: 'linear-gradient(45deg, #8E5BE308, #875FDC32)', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 15 15" fill="currentColor" width="24" height="24">
                                        <path opacity="0.4" d="M1.125 12.75L7.5 1.125L13.875 12.75H1.125ZM6.75 5.25L7.05 9H7.95L8.25 5.25H6.75ZM6.84375 9.84375V11.1562H8.15625V9.84375H6.84375Z" />
                                        <path d="M8.15625 11.1562H6.84375V9.84375H8.15625V11.1562ZM7.95 9H7.05L6.75 5.25H8.25L7.95 9Z" />
                                    </svg>
                                </div>
                                <span style={{ fontSize: '0.9rem', fontWeight: '500', letterSpacing: '0.2rem' }}>DŮLEŽITÉ INFO</span>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'var(--color-mlzna-luna)', lineHeight: '1.6', margin: 0, backgroundColor: 'var(--color-ui-medium)', padding: '16px', borderRadius: '8px' }}>
                                Pravidelné zálohování je klíčové pro bezpečnost vašich dat. Doporučujeme exportovat data alespoň jednou měsíčně.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isImportModalOpen}
                title="Obnovit data ze zálohy?"
                message="Tato akce nevratně přepíše všechna vaše aktuální data v aplikaci Merlin (faktury, odběratele, nastavení). Přejete si pokračovat?"
                confirmText="Obnovit data"
                onConfirm={confirmImport}
                onCancel={() => setIsImportModalOpen(false)}
                type="danger"
            />


        </div>
    );
};

export default SettingsView;
