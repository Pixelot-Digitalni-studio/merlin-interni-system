import { createClient } from '../../utils/supabase/client';

const STORAGE_KEY = 'issued_invoices';
const supabase = createClient();

const InvoiceService = {
    fetchInvoices: async () => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Convert back array to frontend format
            const formatted = data.map(dbInv => ({
                id: dbInv.id,
                saveDate: dbInv.save_date,
                invoiceNumber: dbInv.invoice_number,
                variableSymbol: dbInv.variable_symbol,
                customerName: dbInv.customer_name,
                total: dbInv.total,
                currency: dbInv.currency,
                issueDate: dbInv.issue_date,
                status: dbInv.status,
                paidDate: dbInv.paid_date,
                type: dbInv.type,
                calendarActive: dbInv.calendar_active,
                calendarInactiveDate: dbInv.calendar_inactive_date,
                manualActiveOverride: dbInv.manual_active_override,
                payments: dbInv.payments,
                data: dbInv.data // The raw invoice JSON
            }));

            localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
            return formatted;
        } catch (error) {
            console.error('Supabase get error:', error);
            return InvoiceService.getAll();
        }
    },

    getAll: () => {
        const data = localStorage.getItem(STORAGE_KEY);
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    getById: (id) => {
        const invoices = InvoiceService.getAll();
        return invoices.find(inv => inv.id === id);
    },

    save: async (invoiceData) => {
        try {
            const entryId = invoiceData.id || Date.now().toString();
            const existing = InvoiceService.getById(entryId);

            const dbRow = {
                id: entryId,
                save_date: new Date().toISOString(),
                invoice_number: invoiceData.invoiceNumber,
                variable_symbol: invoiceData.payment?.variableSymbol,
                customer_name: invoiceData.customer?.name,
                total: invoiceData.payment?.total,
                currency: invoiceData.currency || 'CZK',
                issue_date: invoiceData.dates?.issue,
                status: invoiceData.status || (existing ? existing.status : 'unpaid'),
                paid_date: existing ? existing.paidDate : null,
                type: invoiceData.type || (existing ? existing.type : 'invoice'),
                calendar_active: invoiceData.type === 'calendar' ? true : undefined,
                data: invoiceData
            }

            const { error } = await supabase
                .from('invoices')
                .upsert(dbRow);

            if (error) throw error;
            await InvoiceService.fetchInvoices();

            return InvoiceService.getById(entryId); // Get fresh from local
        } catch (error) {
            console.error('Save invoice error', error);
            return null;
        }
    },

    delete: async (id) => {
        try {
            await supabase.from('invoices').update({ deleted_at: new Date().toISOString() }).eq('id', id);
            await InvoiceService.fetchInvoices();
            return InvoiceService.getAll();
        } catch (err) {
            console.error(err);
        }
    },

    update: async (id, invoiceData) => {
        invoiceData.id = id;
        return await InvoiceService.save(invoiceData);
    },

    togglePaid: async (id, paidDate) => {
        try {
            const existing = InvoiceService.getById(id);
            if (!existing) return null;

            const isMarkingAsPaid = existing.status !== 'paid';
            const newStatus = isMarkingAsPaid ? 'paid' : 'unpaid';
            const finalPaidDate = isMarkingAsPaid ? (paidDate || new Date().toISOString().split('T')[0]) : null;

            await supabase.from('invoices').update({
                status: newStatus,
                paid_date: finalPaidDate
            }).eq('id', id);

            await InvoiceService.fetchInvoices();
            return InvoiceService.getAll();
        } catch (e) {
            console.error(e)
        }
    },

    toggleCalendarActive: async (id, inactiveDate) => {
        try {
            const existing = InvoiceService.getById(id);
            if (!existing) return null;

            const wasActive = existing.calendarActive !== false;

            await supabase.from('invoices').update({
                calendar_active: wasActive ? false : true,
                calendar_inactive_date: wasActive ? (inactiveDate || null) : null,
                manual_active_override: true
            }).eq('id', id);

            await InvoiceService.fetchInvoices();
            return InvoiceService.getAll();
        } catch (e) {
            console.error(e)
        }
    },

    checkExpiredCalendars: async () => {
        // Na klientovi už tuto validaci dělat nebudeme přes save do DB takto agrasivně 
        // při loadu, tohle by mohl dělat cron job na serveru nebo jen UI filter.
        return InvoiceService.getAll();
    },

    getNextInvoiceNumber: (type = 'invoice') => {
        const invoices = InvoiceService.getAll();

        const relevantInvoices = invoices.filter(inv => {
            const invType = inv.type || 'invoice';
            return invType === type;
        });

        if (relevantInvoices.length === 0) return '';
        const valids = relevantInvoices.filter(inv => inv.invoiceNumber && inv.invoiceNumber.trim() !== '');
        if (valids.length === 0) return '';

        valids.sort((a, b) => {
            const numA = parseInt((a.invoiceNumber || '').replace(/\D/g, ''), 10) || 0;
            const numB = parseInt((b.invoiceNumber || '').replace(/\D/g, ''), 10) || 0;
            return numB - numA;
        });

        const lastNumber = valids[0].invoiceNumber;
        if (!lastNumber) return '';

        const match = lastNumber.match(/(\d+)(?!.*\d)/);
        if (!match) return lastNumber;

        const lastDigits = match[0];
        const nextDigits = (parseInt(lastDigits, 10) + 1).toString();
        const paddedNext = nextDigits.padStart(lastDigits.length, '0');

        return lastNumber.substring(0, match.index) + paddedNext + lastNumber.substring(match.index + lastDigits.length);
    },

    getDeleted: () => {
        const data = localStorage.getItem('deleted_invoices');
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    moveToTrash: async (id) => {
        return await InvoiceService.delete(id);
    },

    fetchDeleted: async () => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });

            if (error) throw error;

            const formatted = data.map(dbInv => ({
                id: dbInv.id,
                saveDate: dbInv.save_date,
                invoiceNumber: dbInv.invoice_number,
                customerName: dbInv.customer_name,
                total: dbInv.total,
                currency: dbInv.currency,
                issueDate: dbInv.issue_date,
                status: dbInv.status,
                type: dbInv.type,
                deletedAt: dbInv.deleted_at
            }));

            localStorage.setItem('deleted_invoices', JSON.stringify(formatted));
            return formatted;
        } catch (error) {
            return InvoiceService.getDeleted();
        }
    },

    restore: async (id) => {
        try {
            await supabase.from('invoices').update({ deleted_at: null }).eq('id', id);
            await InvoiceService.fetchInvoices();
            await InvoiceService.fetchDeleted();
            return InvoiceService.getDeleted();
        } catch (err) { }
    },

    hardDelete: async (id) => {
        try {
            await supabase.from('invoices').delete().eq('id', id);
            await InvoiceService.fetchDeleted();
            return InvoiceService.getDeleted();
        } catch (err) { }
    },

    emptyTrash: async () => {
        try {
            const trash = InvoiceService.getDeleted();
            for (const item of trash) {
                await supabase.from('invoices').delete().eq('id', item.id);
            }
            await InvoiceService.fetchDeleted();
            return [];
        } catch (err) { }
    },

    toggleCalendarMonthPaid: async (id, monthKey, paidDate, status) => {
        try {
            const existing = InvoiceService.getById(id);
            if (!existing) return null;

            let paymentsObj = existing.payments || {};

            if (status === 'paid') {
                paymentsObj[monthKey] = {
                    status: 'paid',
                    paidDate: paidDate || new Date().toISOString().split('T')[0]
                };
            } else {
                delete paymentsObj[monthKey];
            }

            await supabase.from('invoices').update({
                payments: paymentsObj
            }).eq('id', id);

            await InvoiceService.fetchInvoices();
            return InvoiceService.getAll();
        } catch (e) {
            console.error(e)
        }
    }
};

export default InvoiceService;
