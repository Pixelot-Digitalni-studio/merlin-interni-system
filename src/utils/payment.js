import IBAN from 'iban';

const SWIFT_MAP = {
    '0100': 'KOMBKZPP',
    '0300': 'CEKOCZPP',
    '0600': 'MONACZPP',
    '0710': 'MAXBCZPP',
    '0800': 'CSCBCZPP',
    '2010': 'FIOBCZPP',
    '2700': 'UNCRCZPP',
    '3030': 'AIRBCZPP',
    '5500': 'RBCZPP',
    '6210': 'MBANKCZPP',
    '6700': 'LBBWCZPP',
};

export const calculateIBAN = (account) => {
    if (!account) return '';
    const accNum = account.replace(/\s/g, '');

    // If already looks like an IBAN, return it cleaned
    if (accNum.startsWith('CZ') && accNum.length >= 24) {
        return accNum;
    }

    try {
        const parts = accNum.split('/');
        if (parts.length === 2) {
            const bankCode = parts[1].padStart(4, '0');
            const accountPart = parts[0];

            let prefix = '000000';
            let number = accountPart;

            if (accountPart.includes('-')) {
                const accParts = accountPart.split('-');
                prefix = accParts[0].padStart(6, '0');
                number = accParts[1].padStart(10, '0');
            } else {
                number = accountPart.padStart(10, '0');
            }

            const bban = bankCode + prefix + number;
            return IBAN.fromBBAN('CZ', bban) || '';
        }
    } catch (e) {
        console.error("Failed to convert account to IBAN", e);
    }
    return '';
};

export const getSwiftCode = (account) => {
    if (!account) return '';
    const accNum = account.replace(/\s/g, '');
    const parts = accNum.split('/');
    if (parts.length === 2) {
        const bankCode = parts[1].padStart(4, '0');
        return SWIFT_MAP[bankCode] || '';
    }
    return '';
};

export const generateSpaydString = (payment) => {
    const { account, iban: providedIban, total, variableSymbol, message } = payment;

    if (!account && !providedIban) return null;

    let iban = (providedIban || '').replace(/\s/g, '');

    if (!iban && account) {
        iban = calculateIBAN(account);
    }

    if (!iban || !IBAN.isValid(iban)) {
        return null;
    }

    // SPAYD format
    const amount = Number(total).toFixed(2);
    const vs = variableSymbol ? `*X-VS:${variableSymbol}` : '';
    const msg = message ? `*MSG:${message.substring(0, 60)}` : '';

    return `SPD*1.0*ACC:${iban}*AM:${amount}*CC:CZK${msg}${vs}*`;
};
