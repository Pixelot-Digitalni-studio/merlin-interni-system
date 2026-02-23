export const paginateItems = (items) => {
    const pages = [];
    let itemsRemaining = [...items];

    // Limits calculated based on A4 height (297mm) and component heights
    // User calibrated values: 12 with footer, 17 without (on P1)
    const MAX_P1_WITH_FOOTER = 12;
    const MAX_P1_ITEMS_ONLY = 17;
    // Estimated limits for subsequent pages (less header content)
    const MAX_PN_WITH_FOOTER = 18;
    const MAX_PN_ITEMS_ONLY = 25;

    // Step 1: Handle Page 1
    if (itemsRemaining.length <= MAX_P1_WITH_FOOTER) {
        // Fits with footer
        pages.push({ items: itemsRemaining.splice(0, itemsRemaining.length), showFooter: true });
    } else {
        // Put as many items as possible on P1
        const p1itemsCount = Math.min(itemsRemaining.length, MAX_P1_ITEMS_ONLY);
        pages.push({ items: itemsRemaining.splice(0, p1itemsCount), showFooter: false });
    }

    // Step 2: Handle Subsequent Pages
    while (itemsRemaining.length > 0 || (pages.length > 0 && !pages[pages.length - 1].showFooter)) {
        if (itemsRemaining.length === 0) {
            // No items left but footer hasn't been shown, create a footer-only page
            pages.push({ items: [], showFooter: true });
        } else if (itemsRemaining.length <= MAX_PN_WITH_FOOTER) {
            // Fits with footer
            pages.push({ items: itemsRemaining.splice(0, itemsRemaining.length), showFooter: true });
        } else {
            // Fill with items, move footer to next page
            const pnItemsCount = Math.min(itemsRemaining.length, MAX_PN_ITEMS_ONLY);
            pages.push({ items: itemsRemaining.splice(0, pnItemsCount), showFooter: false });
        }
    }

    return pages;
};

export const getInvoiceFilename = (item) => {
    // Determine source data
    const targetData = item.data || item;
    const { variableSymbol } = targetData.payment || {};
    const { issue } = targetData.dates || { issue: '' };
    const customerName = (targetData.customer && targetData.customer.name) || 'Klient';

    // Parse month from DD. MM. YYYY or YYYY-MM-DD
    let month = '01';
    if (issue.includes('.')) {
        const parts = issue.split('.');
        if (parts.length >= 2) month = parts[1].trim();
    } else if (issue.includes('-')) {
        const parts = issue.split('-');
        if (parts.length >= 2) month = parts[1].trim();
    }
    const paddedMonth = month.padStart(2, '0');

    // Clean customer name for filename
    const safeName = customerName.replace(/[\\/:*?"<>|]/g, "").trim();

    // Use invoiceNumber Primarily, fall back to variableSymbol
    const rawNumber = targetData.invoiceNumber || variableSymbol || 'doklad';
    const number = rawNumber.toString().replace(/\//g, '');

    return `${number}_${paddedMonth}_${safeName}`;
};
