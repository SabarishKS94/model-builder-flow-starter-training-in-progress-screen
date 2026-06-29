const BRAND_STORAGE_KEY = 'cosmos-brand';

export const brands = [
    {
        value: 'salesforce',
        label: 'Salesforce',
        color: '#374182',
        bodyClass: null,
        cssPath: null
    },
    {
        value: 'burgerking',
        label: 'Burger King',
        color: '#F96302',
        bodyClass: 'brand-burgerking',
        cssPath: '/cosmos-brand-burgerking.css'
    }
];

export function getStoredBrand() {
    return localStorage.getItem(BRAND_STORAGE_KEY) || 'salesforce';
}

export function setStoredBrand(brandValue) {
    localStorage.setItem(BRAND_STORAGE_KEY, brandValue);
}

export function getBrandByValue(value) {
    return brands.find(b => b.value === value) || brands[0];
}

let activeBrandStylesheet = null;

export function applyBrand(brandValue) {
    const brand = getBrandByValue(brandValue);
    const previous = brands.find(b => b.bodyClass && document.body.classList.contains(b.bodyClass));
    if (previous) {
        document.body.classList.remove(previous.bodyClass);
    }

    if (activeBrandStylesheet) {
        activeBrandStylesheet.remove();
        activeBrandStylesheet = null;
    }

    if (brand.bodyClass) {
        document.body.classList.add(brand.bodyClass);
    }

    if (brand.cssPath) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = brand.cssPath;
        link.id = 'cosmos-brand-stylesheet';
        document.head.appendChild(link);
        activeBrandStylesheet = link;
    }

    setStoredBrand(brandValue);
}
