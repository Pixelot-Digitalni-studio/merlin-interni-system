"use client";
import React, { useMemo } from 'react';
import Header from './Header';
import InvoiceInfo from './InvoiceInfo';
import DatesPanel from './DatesPanel';
import ItemsTable from './ItemsTable';
import Footer from './Footer';
import { paginateItems } from '../utils/invoiceUtils';

const InvoicePDFPreview = ({ invoiceData, scale = 1, marginBottom = '0px', showBorders = true }) => {
    const pages = useMemo(() => {
        if (!invoiceData || !invoiceData.items) return [];
        return paginateItems(invoiceData.items);
    }, [invoiceData]);

    if (!invoiceData) return null;

    const supplier = invoiceData.supplier || {};

    return (
        <div className="pdf-preview-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
            {pages.map((page, index) => (
                <div
                    key={index}
                    className={`invoice-container ${!showBorders ? 'no-border' : ''}`}
                    style={{
                        fontFamily: supplier.fontFamily || 'Saira',
                        transform: scale !== 1 ? `scale(${scale})` : 'none',
                        transformOrigin: 'top center',
                        marginBottom: marginBottom,
                        flexShrink: 0
                    }}
                >
                    <Header
                        invoiceNumber={(invoiceData.type === 'calendar' && invoiceData.contractNumber) ? invoiceData.contractNumber : invoiceData.invoiceNumber}
                        logo={supplier.logo}
                        accentColor={supplier.accentColor}
                        secondaryColor={supplier.secondaryColor}
                        backgroundColor={supplier.backgroundColor}
                        primaryTextColor={supplier.primaryTextColor}
                        footerTextColor={supplier.footerTextColor}
                        type={invoiceData.type}
                    />

                    {/* Detailed info only on Page 1 */}
                    {index === 0 && (
                        <>
                            <InvoiceInfo
                                supplier={supplier}
                                customer={invoiceData.customer}
                                accentColor={supplier.accentColor}
                                secondaryColor={supplier.secondaryColor}
                                backgroundColor={supplier.backgroundColor}
                                primaryTextColor={supplier.primaryTextColor}
                            />
                            <DatesPanel
                                issue={invoiceData.dates?.issue}
                                due={invoiceData.dates?.due}
                                accentColor={supplier.accentColor}
                                secondaryColor={supplier.secondaryColor}
                                primaryTextColor={supplier.primaryTextColor}
                                footerTextColor={supplier.footerTextColor}
                                type={invoiceData.type}
                                subject={invoiceData.subject}
                                invoiceNumber={invoiceData.invoiceNumber}
                            />
                        </>
                    )}

                    <ItemsTable
                        items={page.items}
                        currency={invoiceData.currency}
                        accentColor={supplier.accentColor}
                        secondaryColor={supplier.secondaryColor}
                        backgroundColor={supplier.backgroundColor}
                        primaryTextColor={supplier.primaryTextColor}
                        type={invoiceData.type}
                    />

                    {/* Footer only if required for this page */}
                    {page.showFooter && (
                        <Footer
                            payment={invoiceData.payment}
                            currency={invoiceData.currency}
                            accentColor={supplier.accentColor}
                            secondaryColor={supplier.secondaryColor}
                            primaryTextColor={supplier.primaryTextColor}
                            footerTextColor={supplier.footerTextColor}
                            type={invoiceData.type}
                            monthlyAmount={invoiceData.items && invoiceData.items[0] ? invoiceData.items[0].price : 0}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default InvoicePDFPreview;

