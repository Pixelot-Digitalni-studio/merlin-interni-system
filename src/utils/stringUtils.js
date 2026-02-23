/**
 * Normalizes a string by removing diacritics (accents) and converting to lowercase.
 * Example: "Žižka" -> "zizka"
 */
export const normalizeString = (str) => {
    if (!str) return '';
    return str
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};
