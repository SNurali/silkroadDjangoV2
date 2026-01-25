export const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return 'en';
};

export const getLocalized = (obj, field, lang = null) => {
    if (!obj) return '';
    const currentLang = lang || getCookie('django_language') || 'en';

    // If language is English, return the base field (e.g. 'name')
    if (currentLang === 'en') {
        return obj[field] || '';
    }

    // Try localized field (e.g. 'name_ru')
    const localizedField = `${field}_${currentLang}`;
    if (obj[localizedField]) {
        return obj[localizedField];
    }

    // Fallback to base field
    return obj[field] || '';
};
