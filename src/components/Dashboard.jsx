"use client";
import React, { useState, useEffect } from 'react';
import InvoiceService from '../services/InvoiceService';


const Dashboard = ({ onNavigate, onRenewCalendar }) => {
    const [calendarRenewals, setCalendarRenewals] = useState([]);
    const [stats, setStats] = useState({
        totalCZK: 0,
        totalEUR: 0,
        unpaidCZK: 0,
        unpaidEUR: 0,
        count: 0,
        chartData: []
    });
    const [statsPeriod, setStatsPeriod] = useState('month'); // Local toggle for the stats widget

    useEffect(() => {
        const loadData = async () => {
            InvoiceService.checkExpiredCalendars();
            const allInvoices = InvoiceService.getAll();

            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth(); // 0-indexed
            const currentMonthStr = (currentMonth + 1).toString().padStart(2, '0');
            const currentMonthKey = `${currentYear}-${currentMonthStr}`;

            const parseDate = (dateStr) => {
                if (!dateStr) return null;
                if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(dateStr);
                const parts = dateStr.split('.');
                if (parts.length >= 3) {
                    return new Date(`${parts[2].trim()}-${parts[1].trim()}-${parts[0].trim()}`);
                }
                return null;
            };

            const isInPeriod = (date) => {
                if (!date) return false;
                if (statsPeriod === 'month') {
                    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
                } else {
                    return date.getFullYear() === currentYear;
                }
            };

            const getMonthKey = (d) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;

            // 0. Calculate Stats (Balanced like CashflowView)
            const statsAcc = { totalCZK: 0, totalEUR: 0, unpaidCZK: 0, unpaidEUR: 0, count: 0 };

            let chartLabels = [];
            let chartData = [];

            if (statsPeriod === 'year') {
                // Last 5 years
                for (let i = 4; i >= 0; i--) {
                    const y = currentYear - i;
                    chartLabels.push(y.toString());
                    chartData.push({ label: y.toString(), paid: 0, unpaid: 0, year: y });
                }
            } else {
                // 12 months of current year
                const monthNames = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];
                chartLabels = monthNames;
                chartData = monthNames.map((m, idx) => ({ label: m, paid: 0, unpaid: 0, monthIdx: idx }));
            }

            allInvoices.forEach(inv => {
                const isEUR = inv.currency === 'EUR';
                const total = parseFloat(inv.total) || 0;
                const czkValue = isEUR ? total * 25 : total;

                // 1. Handle Invoices
                if (inv.type === 'invoice' || !inv.type) {
                    const issueDate = parseDate(inv.data?.dates?.issue || inv.issueDate);
                    const paidDate = parseDate(inv.paidDate);

                    // Paid income
                    if (inv.status === 'paid' && paidDate) {
                        if (isInPeriod(paidDate)) {
                            if (isEUR) statsAcc.totalEUR += total;
                            else statsAcc.totalCZK += total;
                        }

                        if (statsPeriod === 'year') {
                            const cItem = chartData.find(d => d.year === paidDate.getFullYear());
                            if (cItem) cItem.paid += czkValue;
                        } else if (paidDate.getFullYear() === currentYear) {
                            chartData[paidDate.getMonth()].paid += czkValue;
                        }
                    }

                    // Unpaid
                    if (inv.status !== 'paid' && issueDate) {
                        if (isInPeriod(issueDate)) {
                            if (isEUR) statsAcc.unpaidEUR += total;
                            else statsAcc.unpaidCZK += total;
                            statsAcc.count++;
                        }

                        if (statsPeriod === 'year') {
                            const cItem = chartData.find(d => d.year === issueDate.getFullYear());
                            if (cItem) cItem.unpaid += czkValue;
                        } else if (issueDate.getFullYear() === currentYear) {
                            chartData[issueDate.getMonth()].unpaid += czkValue;
                        }
                    }
                }
                // 2. Handle Calendars
                else if (inv.type === 'calendar') {
                    const monthlyAmount = total / 12;
                    const czkMonthly = isEUR ? monthlyAmount * 25 : monthlyAmount;

                    // Logic similar to CashflowView: check monthly payments and active range
                    const items = inv.data?.items || [];
                    const plannedMonths = items.map(item => {
                        const splatnost = item._meta?.splatnost;
                        if (!splatnost) return null;
                        if (splatnost.includes('-')) return splatnost.substring(0, 7);
                        const parts = splatnost.split('.');
                        if (parts.length >= 3) return `${parts[2].trim()}-${parts[1].trim().padStart(2, '0')}`;
                        return null;
                    }).filter(Boolean);

                    const startMonthKey = plannedMonths.length > 0 ? plannedMonths[0] : null;
                    let endMonthKey = null;
                    if (inv.calendarInactiveDate) {
                        const inactiveDate = parseDate(inv.calendarInactiveDate);
                        if (inactiveDate) endMonthKey = getMonthKey(inactiveDate);
                    } else if (plannedMonths.length > 0) {
                        endMonthKey = plannedMonths[plannedMonths.length - 1];
                    }

                    // Calculate Unpaid and populate chart for planned months
                    if (startMonthKey && endMonthKey) {
                        const checkMonth = (mKey) => {
                            if (mKey < startMonthKey || mKey > endMonthKey) return;

                            const payment = inv.payments ? inv.payments[mKey] : null;
                            const isPaid = payment && payment.status === 'paid';

                            // Stats for current period
                            if (statsPeriod === 'month') {
                                if (mKey === currentMonthKey && !isPaid) {
                                    if (isEUR) statsAcc.unpaidEUR += monthlyAmount;
                                    else statsAcc.unpaidCZK += monthlyAmount;
                                }
                            } else if (mKey.startsWith(currentYear.toString()) && !isPaid) {
                                if (isEUR) statsAcc.unpaidEUR += monthlyAmount;
                                else statsAcc.unpaidCZK += monthlyAmount;
                            }

                            // Chart data
                            const [yPart, mPart] = mKey.split('-').map(Number);
                            if (statsPeriod === 'year') {
                                const cItem = chartData.find(d => d.year === yPart);
                                if (cItem && !isPaid) cItem.unpaid += czkMonthly;
                            } else if (yPart === currentYear) {
                                if (!isPaid) chartData[mPart - 1].unpaid += czkMonthly;
                            }
                        };

                        plannedMonths.forEach(checkMonth);
                    }

                    if (inv.payments) {
                        Object.values(inv.payments).forEach((pay) => {
                            if (pay.status === 'paid' && pay.paidDate) {
                                const pDate = parseDate(pay.paidDate);
                                if (isInPeriod(pDate)) {
                                    if (isEUR) statsAcc.totalEUR += monthlyAmount;
                                    else statsAcc.totalCZK += monthlyAmount;
                                }

                                if (pDate) {
                                    if (statsPeriod === 'year') {
                                        const cItem = chartData.find(d => d.year === pDate.getFullYear());
                                        if (cItem) cItem.paid += czkMonthly;
                                    } else if (pDate.getFullYear() === currentYear) {
                                        chartData[pDate.getMonth()].paid += czkMonthly;
                                    }
                                }
                            }
                        });
                    }
                }
            });

            statsAcc.chartData = chartData;
            setStats(statsAcc);

            // 1. Calendar Renewal Logic
            const allCalendars = allInvoices.filter(inv => inv.type === 'calendar');
            const calendars = allCalendars.filter(inv => inv.calendarActive !== false);
            const renewals = [];
            today.setHours(0, 0, 0, 0);

            const nextMonthDate = new Date(today);
            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
            const nextMonthKey = getMonthKey(nextMonthDate);

            calendars.forEach(cal => {
                let issueDate = null;
                const dateStr = cal.issueDate;

                if (dateStr && (typeof dateStr === 'string')) {
                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        issueDate = new Date(dateStr);
                    } else if (dateStr.match(/^\d{1,2}\.\s\d{1,2}\.\s\d{4}$/)) {
                        const parts = dateStr.split('.');
                        if (parts.length >= 3) {
                            issueDate = new Date(`${parts[2].trim()}-${parts[1].trim()}-${parts[0].trim()}`);
                        }
                    }
                }

                if (issueDate && !isNaN(issueDate.getTime())) {
                    // 1. Calculate next renewal date (Issue Date + 1 Year)
                    const renewalDate = new Date(issueDate);
                    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
                    const renewalYear = renewalDate.getFullYear();
                    const renewalMKey = getMonthKey(renewalDate);

                    // 2. Automatic Match Check: Does another calendar exist for the same customer in the renewal year?
                    let newCalendar = null;
                    const alreadyIssued = allCalendars.some(otherCal => {
                        if (otherCal.id === cal.id) return false;
                        if (otherCal.customerName !== cal.customerName) return false;

                        let otherIssueDate = null;
                        const otherDateStr = otherCal.issueDate;
                        if (otherDateStr && otherDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            otherIssueDate = new Date(otherDateStr);
                        } else if (otherDateStr && otherDateStr.match(/^\d{1,2}\.\s\d{1,2}\.\s\d{4}$/)) {
                            const parts = otherDateStr.split('.');
                            if (parts.length >= 3) {
                                otherIssueDate = new Date(`${parts[2].trim()}-${parts[1].trim()}-${parts[0].trim()}`);
                            }
                        }
                        let coversRenewalYear = false;
                        if (otherCal.data?.items && Array.isArray(otherCal.data.items)) {
                            coversRenewalYear = otherCal.data.items.some(item => {
                                const splat = item._meta?.splatnost;
                                if (!splat) return false;
                                if (splat.includes('-')) return splat.startsWith(renewalYear.toString());
                                const pts = splat.split('.');
                                return pts.length >= 3 && pts[2].trim() === renewalYear.toString();
                            });
                        }
                        const isMatch = coversRenewalYear || (otherIssueDate && otherIssueDate.getFullYear() === renewalYear);
                        if (isMatch) {
                            newCalendar = otherCal;
                            return true;
                        }
                        return false;
                    });


                    // Find first payment month (splatný měsíc) of newly issued calendar
                    let firstSplatnyMesicKey = renewalMKey;
                    if (newCalendar && newCalendar.data?.items?.length > 0) {
                        const splatnost = newCalendar.data.items[0]._meta?.splatnost;
                        if (splatnost) {
                            if (splatnost.includes('-')) {
                                firstSplatnyMesicKey = splatnost.substring(0, 7);
                            } else {
                                const parts = splatnost.split('.');
                                if (parts.length >= 3) {
                                    firstSplatnyMesicKey = `${parts[2].trim()}-${parts[1].trim().padStart(2, '0')}`;
                                }
                            }
                        }
                    }

                    // 3. Visibility Check:
                    // - Show if renewal is in the NEXT calendar month
                    // - Show if renewal is in the CURRENT calendar month
                    // - Show if renewal is OVERDUE and not yet issued
                    const isNextMonthRenewal = (renewalMKey === nextMonthKey);
                    const isCurrentMonthRenewal = (renewalMKey === currentMonthKey);
                    const isOverdue = renewalDate <= today && !alreadyIssued;

                    let isVisible = false;
                    if (alreadyIssued) {
                        // Vystaveno: Remains in the list until the start of the first payable month.
                        if (currentMonthKey < firstSplatnyMesicKey) {
                            isVisible = isNextMonthRenewal || isCurrentMonthRenewal || (renewalDate <= today);
                        } else {
                            isVisible = false;
                        }
                    } else {
                        isVisible = isNextMonthRenewal || isCurrentMonthRenewal || isOverdue;
                    }

                    if (isVisible) {
                        renewals.push({
                            id: cal.id,
                            customer: cal.customerName,
                            currentIssueDate: cal.issueDate,
                            renewalDate: renewalDate,
                            amount: cal.total / 12,
                            currency: cal.currency,
                            isIssued: alreadyIssued
                        });
                    }
                }
            });

            renewals.sort((a, b) => a.renewalDate - b.renewalDate);
            setCalendarRenewals(renewals);
        };

        loadData();
    }, [statsPeriod]);


    const formatCurrency = (amount, currency) => {
        return `${Math.round(amount).toLocaleString()} ${currency === 'EUR' ? '€' : 'Kč'}`;
    };

    const formatLongDate = (dateStr) => {
        if (!dateStr) return '';
        let d = null;
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            d = new Date(dateStr);
        } else if (dateStr.match(/^\d{1,2}\.\s\d{1,2}\.\s\d{4}$/)) {
            const parts = dateStr.split('.');
            if (parts.length >= 3) {
                d = new Date(`${parts[2].trim()}-${parts[1].trim()}-${parts[0].trim()}`);
            }
        }

        if (!d || isNaN(d.getTime())) return dateStr;

        const day = d.getDate();
        const monthGenitive = [
            'ledna', 'února', 'března', 'dubna', 'května', 'června',
            'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'
        ][d.getMonth()];
        const year = d.getFullYear();

        return `${day}. ${monthGenitive} ${year}`;
    };

    return (
        <div className="dashboard-main-container">
            <div style={{ width: '100%', margin: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="dashboard-grid-container">
                    {/* Column 1: Tile Buttons (4 buttons in 1/4 width) */}
                    <div className="dashboard-widget-wrapper area-nav" style={{ minWidth: 0 }}>
                        <div className="dashboard-widget animate-slide-up stagger-1">
                            <div className="dashboard-tiles-grid compact">
                                <div className="dashboard-tile animate-scale-in stagger-1" onClick={() => onNavigate('invoice')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                                        <path opacity=".4" d="M128 64L128 576L512 576L512 208L368 64L128 64zM192 128L288 128L288 176L192 176L192 128zM192 224L288 224L288 272L192 272L192 224zM192 352L448 352L448 480L192 480L192 352zM336 122.5L453.5 240L336 240L336 122.5z" />
                                        <path d="M216 128L192 128L192 176L288 176L288 128L216 128zM216 224L192 224L192 272L288 272L288 224L216 224zM192 352L192 480L448 480L448 352L192 352z" />
                                    </svg>
                                    <span>Faktura</span>
                                </div>

                                <div className="dashboard-tile animate-scale-in stagger-2" onClick={() => onNavigate('calendar')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                                        <path opacity=".4" d="M96 224L544 224L544 544L96 544L96 224zM160 288L160 352L224 352L224 288L160 288zM160 416L160 480L224 480L224 416L160 416zM288 288L288 352L352 352L352 288L288 288zM288 416L288 480L352 480L352 416L288 416zM416 288L416 352L480 352L480 288L416 288zM416 416L416 480L480 480L480 416L416 416z" />
                                        <path d="M256 96L256 64L192 64L192 128L96 128L96 224L544 224L544 128L448 128L448 64L384 64L384 128L256 128L256 96z" />
                                    </svg>
                                    <span>Kalendář</span>
                                </div>

                                <div className="dashboard-tile animate-scale-in stagger-3" onClick={() => onNavigate('customers')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                                        <path opacity=".4" d="M0 544L110.7 544L113.2 533.2L155 352L48 352L0 544zM24 224C24 263.8 56.2 296 96 296C135.8 296 168 263.8 168 224C168 184.2 135.8 152 96 152C56.2 152 24 184.2 24 224zM472 224C472 263.8 504.2 296 544 296C583.8 296 616 263.8 616 224C616 184.2 583.8 152 544 152C504.2 152 472 184.2 472 224zM485 352L526.8 533.2L529.3 544L640 544L592 352L485 352z" /><path d="M320 288C377.4 288 424 241.4 424 184C424 126.6 377.4 80 320 80C262.6 80 216 126.6 216 184C216 241.4 262.6 288 320 288zM480 544L432 336L208 336L160 544L480 544z" />
                                    </svg>
                                    <span>Odběratelé</span>
                                </div>

                                <div className="dashboard-tile animate-scale-in stagger-4" onClick={() => onNavigate('history')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                                        <path opacity=".4" d="M96 192L96 544L544 544L544 192L96 192zM224 304L416 304L416 352L224 352L224 304z" />
                                        <path d="M64 96L576 96L576 192L64 192z" />
                                    </svg>
                                    <span>Doklady</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Calendar Renewals (Nyní přes dva řádky) */}
                    <div
                        className="dashboard-widget-wrapper area-list"
                        style={{
                            minWidth: 0,
                            gridRow: 'span 2', // Toto zajistí roztažení přes dva řádky vertikálně
                            display: 'flex'    // Nutné pro správné natažení vnitřního obsahu
                        }}
                    >
                        <div
                            className="dashboard-widget animate-slide-up stagger-1"
                            style={{
                                flex: 1,           // Widget vyplní celou výšku wrapperu
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div className="widget-header">
                                <h3>Obnova kalendářů</h3>
                                <span className="purple-badge">Nadcházející</span>
                            </div>

                            <div
                                className="widget-content"
                                style={{
                                    flex: 1,           // Obsahová část vyplní zbytek výšky widgetu
                                    overflowY: 'auto'  // Pokud bude kalendářů hodně, bude se v rámci widgetu scrollovat
                                }}
                            >
                                {calendarRenewals.length === 0 ? (
                                    <p className="no-data">Žádné kalendáře k obnově</p>
                                ) : (
                                    <div className="renewal-list">
                                        {calendarRenewals.map((item, index) => {
                                            return (
                                                <div key={index} className={`renewal-item ${item.isIssued ? 'issued' : 'soon'}`}
                                                    style={!item.isIssued ? { cursor: 'pointer' } : {}}
                                                    onClick={() => !item.isIssued && onRenewCalendar && onRenewCalendar(item.id)}
                                                >
                                                    <div className="renewal-date">
                                                        <div className="date-row">
                                                            <span className="day">{item.renewalDate.getDate()}.</span>
                                                            <span className="month">{item.renewalDate.getMonth() + 1}.</span>
                                                        </div>
                                                        <span className="year">{item.renewalDate.getFullYear()}</span>
                                                    </div>
                                                    <div className="renewal-info">
                                                        <div className="renewal-customer">{item.customer}</div>
                                                        <div className="renewal-meta">
                                                            Vystavit: {formatLongDate(item.renewalDate.toISOString().split('T')[0])}
                                                        </div>
                                                    </div>
                                                    {item.isIssued ? (
                                                        <span className="status-tag issued">Vystavený</span>
                                                    ) : (
                                                        <span className="status-tag soon">Brzy</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Column 4: Income Overview (1/4 width) */}
                    <div className="dashboard-widget-wrapper area-graph" style={{ minWidth: 0 }}>
                        <div className="dashboard-widget animate-slide-up stagger-2 income-widget" style={{ minWidth: 0 }}>
                            <div className="widget-header">
                                <h3>Příjmy</h3>
                                <div className="widget-toggle-group">
                                    <button
                                        className={`toggle-btn ${statsPeriod === 'month' ? 'active' : ''}`}
                                        onClick={() => setStatsPeriod('month')}
                                    >
                                        Měsíc
                                    </button>
                                    <button
                                        className={`toggle-btn ${statsPeriod === 'year' ? 'active' : ''}`}
                                        onClick={() => setStatsPeriod('year')}
                                    >
                                        Rok
                                    </button>
                                </div>
                            </div>
                            <div className="widget-content stats-content">
                                <div className="income-stats-row">
                                    <div className="stat-item paid compact">
                                        <span className="stat-label">Uhrazeno</span>
                                        <div className="stat-value czk">{formatCurrency(stats.totalCZK, 'CZK')}</div>
                                    </div>
                                    <div className="stat-item unpaid compact">
                                        <span className="stat-label">Neuhrazeno</span>
                                        <div className="stat-value czk">{formatCurrency(stats.unpaidCZK, 'CZK')}</div>
                                    </div>
                                </div>

                                <div className="income-chart-container" style={{ minWidth: 0 }}>
                                    <div className="income-chart" style={{ minWidth: 0 }}>
                                        {stats.chartData && stats.chartData.map((data, idx) => {
                                            const total = data.paid + data.unpaid;
                                            const maxVal = Math.max(...stats.chartData.map(d => d.paid + d.unpaid), 0.01);
                                            const paidHeight = (data.paid / maxVal) * 100;
                                            const unpaidHeight = (data.unpaid / maxVal) * 100;
                                            const totalPercent = Math.round((total / maxVal) * 100);

                                            return (
                                                <div key={idx} className="chart-bar-group">
                                                    <span className="chart-percent">{totalPercent}%</span>
                                                    <div className="bar-wrapper">
                                                        <div className="bar-paid" style={{ height: `${paidHeight}%` }} title={`Uhrazeno: ${formatCurrency(data.paid, 'CZK')}`}></div>
                                                        <div className="bar-unpaid" style={{ height: `${unpaidHeight}%` }} title={`Neuhrazeno: ${formatCurrency(data.unpaid, 'CZK')}`}></div>
                                                    </div>
                                                    <span className="chart-month">{data.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extra Widgets placeholders row 2 */}
                    <div className="dashboard-widget-wrapper area-extra-1">
                        <div className="dashboard-widget animate-slide-up stagger-3" style={{ justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
                            <span style={{ color: 'var(--color-kralovnin-serik)', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '0.1rem' }}>MÍSTO PRO WIDGET</span>
                        </div>
                    </div>
                    <div className="dashboard-widget-wrapper area-extra-3">
                        <div className="dashboard-widget animate-slide-up stagger-3" style={{ justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
                            <span style={{ color: 'var(--color-kralovnin-serik)', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '0.1rem' }}>MÍSTO PRO WIDGET</span>
                        </div>
                    </div>
                    <div className="dashboard-widget-wrapper area-extra-4">
                        <div className="dashboard-widget animate-slide-up stagger-3" style={{ justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
                            <span style={{ color: 'var(--color-kralovnin-serik)', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '0.1rem' }}>MÍSTO PRO WIDGET</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;

