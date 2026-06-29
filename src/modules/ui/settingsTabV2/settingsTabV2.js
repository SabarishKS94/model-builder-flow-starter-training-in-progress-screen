import { LightningElement, api, track } from 'lwc';
import {
    DriftTrackingTitle, DriftTrackingDescription,
    NbaTitle, NbaDescription,
    EnableButton, DisableButton, EnabledBadge,
    HeroHeadline, HeroSubtext, OrgCalloutText, OrgCalloutLinkText,
    PreviewTitle, DriftPreviewText, NbaPreviewText,
    ToastDriftEnabled, ToastDriftDisabled, ToastNbaEnabled, ToastNbaDisabled
} from 'data/labels/SettingsTab';

export default class SettingsTabV2 extends LightningElement {
    @api orgLevelEnabled = false;
    @api showPreview = false;
    @api autoEnabled = false;

    @track driftEnabled = false;
    @track nbaEnabled = false;
    _autoApplied = false;

    renderedCallback() {
        if (this.autoEnabled && !this._autoApplied) {
            this._autoApplied = true;
            this.driftEnabled = true;
            this.nbaEnabled = true;
        }
    }
    @track showModal = false;
    @track pendingFeature = '';
    @track isDisabling = false;

    labels = {
        DriftTrackingTitle, DriftTrackingDescription,
        NbaTitle, NbaDescription,
        EnableButton, DisableButton, EnabledBadge,
        HeroHeadline, HeroSubtext, OrgCalloutText, OrgCalloutLinkText,
        PreviewTitle, DriftPreviewText, NbaPreviewText
    };

    get showOrgNotification() {
        return !this.orgLevelEnabled;
    }

    get isDriftDisabled() {
        return !this.orgLevelEnabled;
    }

    get isNbaDisabled() {
        return !this.orgLevelEnabled;
    }

    get driftActionsClass() {
        return this.driftEnabled ? 'actions-toggle actions-toggle_enabled' : 'actions-toggle';
    }

    get nbaActionsClass() {
        return this.nbaEnabled ? 'actions-toggle actions-toggle_enabled' : 'actions-toggle';
    }

    handleDriftToggle() {
        if (this.orgLevelEnabled) {
            this.pendingFeature = 'drift';
            this.isDisabling = this.driftEnabled;
            this.showModal = true;
        }
    }

    handleNbaToggle() {
        if (this.orgLevelEnabled) {
            this.pendingFeature = 'nba';
            this.isDisabling = this.nbaEnabled;
            this.showModal = true;
        }
    }

    handleModalClose() {
        this.showModal = false;
        this.pendingFeature = '';
        this.isDisabling = false;
    }

    handleModalConfirm(event) {
        this.showModal = false;
        const feature = event.detail.featureName;
        const wasDisabling = event.detail.isDisabling;

        if (feature === 'drift') {
            this.driftEnabled = !wasDisabling;
            const message = this.driftEnabled ? ToastDriftEnabled : ToastDriftDisabled;
            this.dispatchEvent(new CustomEvent('featureenabled', {
                detail: { featureName: 'drift', enabled: this.driftEnabled, message },
                bubbles: true,
                composed: true
            }));
        } else if (feature === 'nba') {
            this.nbaEnabled = !wasDisabling;
            const message = this.nbaEnabled ? ToastNbaEnabled : ToastNbaDisabled;
            this.dispatchEvent(new CustomEvent('featureenabled', {
                detail: { featureName: 'nba', enabled: this.nbaEnabled, message },
                bubbles: true,
                composed: true
            }));
        }
        this.pendingFeature = '';
        this.isDisabling = false;
    }

    handleEnableNow(event) {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { route: '/aim-feature-manager' },
            bubbles: true,
            composed: true
        }));
    }
}
