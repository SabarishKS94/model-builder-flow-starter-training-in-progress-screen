import { LightningElement, track } from 'lwc';

export default class FeatureManager extends LightningElement {
    @track orgLevelEnabled = true;
    @track showPreview = true;
    @track autoEnabled = true;
    @track toastMessage = '';
    @track showToast = false;

    handleEnableOrg() {
        this.orgLevelEnabled = true;
    }

    handleFeatureEnabled(event) {
        const { message } = event.detail;
        this.toastMessage = message;
        this.showToast = true;
    }

    handleToastDismiss() {
        this.showToast = false;
        this.toastMessage = '';
    }
}
