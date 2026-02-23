import { createClient } from '../../utils/supabase/client';

const STORAGE_KEY = 'pixelot_customers';
const STORAGE_KEY_TRASH = 'pixelot_customers_trash';
const supabase = createClient();

const CustomerService = {
    // Nové asynchronní metody pro načítání ze Supabase
    fetchCustomers: async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .is('deleted_date', null);

            if (error) throw error;

            // Záloha pro offline použití
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return data;
        } catch (error) {
            console.error('Supabase get error:', error);
            return CustomerService.getAll(); // Fallback to local
        }
    },

    getAll: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            let customers = data ? JSON.parse(data) : [];
            if (!Array.isArray(customers)) customers = [];
            return customers.filter(c => c !== null && c !== undefined);
        } catch (error) {
            console.error('Error loading customers:', error);
            return [];
        }
    },

    exists: (newCustomer) => {
        const customers = CustomerService.getAll();
        return customers.some(c =>
            (newCustomer.name && c.name.toLowerCase() === newCustomer.name.toLowerCase()) ||
            (newCustomer.ico && c.ico === newCustomer.ico)
        );
    },

    save: async (customer) => {
        try {
            // Upsert method insert or update customer
            if (customer.id && customer.id.length > 30) {
                const { error } = await supabase
                    .from('customers')
                    .update(customer)
                    .eq('id', customer.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('customers')
                    .insert([customer]);
                if (error) throw error;
            }

            // Refresh storage
            await CustomerService.fetchCustomers();
            return CustomerService.getAll();
        } catch (err) {
            console.error('Update save err:', err)
        }
    },

    add: async (customer) => {
        try {
            delete customer.id; // supabase UUID will auto-fill
            return await CustomerService.save(customer);
        } catch (error) {
            console.error('Error adding customer:', error);
            return [];
        }
    },

    update: async (index, updatedCustomer) => {
        try {
            return await CustomerService.save(updatedCustomer);
        } catch (error) {
            console.error('Error updating customer:', error);
            return [];
        }
    },

    remove: async (index) => {
        try {
            const customers = CustomerService.getAll();
            if (index >= 0 && index < customers.length) {
                const item = customers[index];
                if (item.id) {
                    await supabase.from('customers').delete().eq('id', item.id);
                }
                customers.splice(index, 1);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
            }
            return customers;
        } catch (error) {
            console.error('Error removing customer:', error);
            return [];
        }
    },

    importData: async (data) => {
        try {
            if (!Array.isArray(data)) throw new Error('Invalid data format');

            const { error } = await supabase
                .from('customers')
                .insert(data);

            if (error) throw error;
            await CustomerService.fetchCustomers();

            return data;
        } catch (error) {
            console.error('Error importing customers:', error);
            return null;
        }
    },

    findDuplicates: () => {
        const customers = CustomerService.getAll();
        const icoGroups = {};
        customers.forEach((customer, index) => {
            if (customer.ico) {
                const key = customer.ico.trim();
                if (!icoGroups[key]) icoGroups[key] = [];
                icoGroups[key].push({ ...customer, originalIndex: index });
            }
        });
        const duplicates = [];
        Object.keys(icoGroups).forEach(ico => {
            if (icoGroups[ico].length > 1) duplicates.push(icoGroups[ico]);
        });
        return duplicates;
    },

    mergeDuplicates: async () => {
        return { count: 0, merged: 0 }; // Temporarily disabled for DB
    },

    getDeleted: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEY_TRASH);
            let items = data ? JSON.parse(data) : [];
            if (!Array.isArray(items)) items = [];
            return items.filter(i => i !== null && i !== undefined);
        } catch (error) {
            return [];
        }
    },

    fetchDeleted: async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .not('deleted_date', 'is', null);

            if (error) throw error;
            localStorage.setItem(STORAGE_KEY_TRASH, JSON.stringify(data));
            return data;
        } catch (error) {
            console.error('Supabase trash error:', error);
            return CustomerService.getDeleted();
        }
    },

    moveToTrash: async (index) => {
        try {
            const customers = CustomerService.getAll();
            if (index >= 0 && index < customers.length) {
                const item = customers[index];
                const deletedDate = new Date().toISOString();

                await supabase.from('customers').update({ deleted_date: deletedDate }).eq('id', item.id);

                await CustomerService.fetchCustomers();
                await CustomerService.fetchDeleted();
                return CustomerService.getAll();
            }
            return customers;
        } catch (error) {
            console.error('Error moving customer to trash:', error);
            return [];
        }
    },

    restore: async (index) => {
        try {
            const trash = CustomerService.getDeleted();
            if (index >= 0 && index < trash.length) {
                const item = trash[index];

                await supabase.from('customers').update({ deleted_date: null }).eq('id', item.id);

                await CustomerService.fetchCustomers();
                await CustomerService.fetchDeleted();
            }
            return CustomerService.getDeleted();
        } catch (error) {
            console.error('Error restoring customer:', error);
            return [];
        }
    },

    hardDelete: async (index) => {
        try {
            const trash = CustomerService.getDeleted();
            if (index >= 0 && index < trash.length) {
                await supabase.from('customers').delete().eq('id', trash[index].id);
                await CustomerService.fetchDeleted();
            }
            return CustomerService.getDeleted();
        } catch (error) {
            console.error('Error hard deleting customer:', error);
            return [];
        }
    },

    emptyTrash: async () => {
        try {
            const trash = CustomerService.getDeleted();
            for (const item of trash) {
                await supabase.from('customers').delete().eq('id', item.id);
            }
            await CustomerService.fetchDeleted();
            return [];
        } catch (error) {
            console.error('Error emptying trash:', error);
            return [];
        }
    }
};

export default CustomerService;
