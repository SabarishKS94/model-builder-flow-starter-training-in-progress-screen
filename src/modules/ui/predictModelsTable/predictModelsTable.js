import { LightningElement, api, track } from 'lwc';

const STATUS_CONFIG = {
    Active: { icon: 'utility:success', iconClass: 'status-icon status-icon_success', textClass: 'status-badge status-badge_success' },
    Inactive: { icon: null, iconClass: '', textClass: 'status-badge status-badge_neutral' },
    Training: { icon: 'utility:spinner', iconClass: 'status-icon status-icon_neutral', textClass: 'status-badge status-badge_neutral' },
    Draft: { icon: 'utility:stage', iconClass: 'status-icon status-icon_neutral', textClass: 'status-badge status-badge_neutral' },
    Failed: { icon: 'utility:error', iconClass: 'status-icon status-icon_error', textClass: 'status-badge status-badge_error' },
    Alert: { icon: 'utility:alert', iconClass: 'status-icon status-icon_warning', textClass: 'status-badge status-badge_warning' },
    Disabled: { icon: 'utility:ban', iconClass: 'status-icon status-icon_warning', textClass: 'status-badge status-badge_warning' },
    Deprecated: { icon: 'utility:warning', iconClass: 'status-icon status-icon_warning', textClass: 'status-badge status-badge_warning' },
    Canceled: { icon: 'utility:close', iconClass: 'status-icon status-icon_warning', textClass: 'status-badge status-badge_warning' },
    Staging: { icon: 'utility:clock', iconClass: 'status-icon status-icon_neutral', textClass: 'status-badge status-badge_neutral' },
    Waiting: { icon: 'utility:spinner', iconClass: 'status-icon status-icon_neutral', textClass: 'status-badge status-badge_neutral' },
    Visible: { icon: 'utility:preview', iconClass: 'status-icon status-icon_neutral', textClass: 'status-badge status-badge_neutral' },
    Hidden: { icon: 'utility:hide', iconClass: 'status-icon status-icon_neutral', textClass: 'status-badge status-badge_neutral' },
};

export default class PredictModelsTable extends LightningElement {
    @api data = [];
    @track sortedBy = 'name';
    @track sortedDirection = 'asc';

    get rows() {
        return (this.data || []).map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Inactive;
            return {
                ...item,
                statusIcon: cfg.icon,
                statusIconClass: cfg.iconClass,
                statusClass: cfg.textClass,
            };
        });
    }

    get sortIcon() {
        return this.sortedDirection === 'asc' ? 'utility:arrowdown' : 'utility:arrowup';
    }

    get isNameSorted() { return this.sortedBy === 'name'; }
    get isSourceSorted() { return this.sortedBy === 'source'; }
    get isCapabilitySorted() { return this.sortedBy === 'capability'; }
    get isStatusSorted() { return this.sortedBy === 'status'; }
    get isOrgSorted() { return this.sortedBy === 'org'; }
    get isLastModifiedSorted() { return this.sortedBy === 'lastModified'; }
    get isModifiedBySorted() { return this.sortedBy === 'modifiedBy'; }

    handleSort(event) {
        const field = event.currentTarget.dataset.field;
        let direction = 'asc';
        if (this.sortedBy === field && this.sortedDirection === 'asc') {
            direction = 'desc';
        }
        this.sortedBy = field;
        this.sortedDirection = direction;
        this.dispatchEvent(new CustomEvent('sort', { detail: { fieldName: field, sortDirection: direction } }));
    }

    handleNameClick(event) {
        event.preventDefault();
        const id = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('modelclick', { detail: { id } }));
    }

    handleRowAction(event) {
        const id = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('rowaction', { detail: { id } }));
    }
}
