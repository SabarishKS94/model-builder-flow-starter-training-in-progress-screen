import { LightningElement, api, track } from 'lwc';
import { brands, getStoredBrand, applyBrand } from 'data/brands';
import * as ThemeSwitcherLabels from 'data/labels/ThemeSwitcher';

const SHELL_OPTIONS = [
    { label: 'Standard', value: 'standard' },
    { label: 'Glass', value: 'cosmos' },
];

const SHELL_STORAGE_KEY = 'shell-mode';

export default class ThemeSwitcher extends LightningElement {
    labels = ThemeSwitcherLabels;
    @api activeTheme = 'light';
    @track isCardOpen = false;
    @track activeBrand = getStoredBrand();

    get shellOptions() {
        return SHELL_OPTIONS;
    }

    get brandOptions() {
        return brands.map(b => ({ label: b.label, value: b.value }));
    }

    get activeShell() {
        return this.activeTheme?.startsWith('cosmos') ? 'cosmos' : 'standard';
    }

    get isDark() {
        return this.activeTheme === 'dark' || this.activeTheme === 'cosmos-dark';
    }

    handleIconClick() {
        this.isCardOpen = !this.isCardOpen;
    }

    handleBackdropClick() {
        this.isCardOpen = false;
    }

    handleShellChange(event) {
        const newShell = event.detail.value;
        if (newShell === this.activeShell) return;

        localStorage.setItem(SHELL_STORAGE_KEY, newShell);

        const theme = newShell === 'cosmos'
            ? (this.isDark ? 'cosmos-dark' : 'cosmos-light')
            : (this.isDark ? 'dark' : 'light');
        localStorage.setItem('slds-ui-theme', theme);

        const url = new URL(window.location);
        url.searchParams.delete('shell');
        window.location.href = url.toString();
    }

    handleDarkToggle(event) {
        const dark = event.target.checked;
        const theme = this.activeShell === 'cosmos'
            ? (dark ? 'cosmos-dark' : 'cosmos-light')
            : (dark ? 'dark' : 'light');

        this.dispatchEvent(new CustomEvent('applytheme', {
            bubbles: true,
            composed: true,
            detail: { theme }
        }));
    }

    handleBrandChange(event) {
        const brandValue = event.detail.value;
        this.activeBrand = brandValue;
        applyBrand(brandValue);
        this.dispatchEvent(new CustomEvent('applybrand', {
            bubbles: true,
            composed: true,
            detail: { brand: brandValue }
        }));
    }
}
