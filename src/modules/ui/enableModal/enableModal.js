import { LightningElement, api, track } from 'lwc';
import {
    DriftEnableTitle, NbaEnableTitle, EnableBodyText, EnableCheckboxLabel,
    DriftDisableTitle, NbaDisableTitle, DisableBodyText, DisableCheckboxLabel,
    CancelButton, EnableButton, DisableButton, CloseAltText
} from 'data/labels/EnableModal';

export default class EnableModal extends LightningElement {
    @api featureName = '';
    @api visible = false;
    @api isDisabling = false;

    @track agreed = false;

    labels = { CancelButton, EnableButton, DisableButton, CloseAltText };

    get modalTitle() {
        if (this.isDisabling) {
            return this.featureName === 'drift' ? DriftDisableTitle : NbaDisableTitle;
        }
        return this.featureName === 'drift' ? DriftEnableTitle : NbaEnableTitle;
    }

    get bodyText() {
        return this.isDisabling ? DisableBodyText : EnableBodyText;
    }

    get checkboxLabel() {
        return this.isDisabling ? DisableCheckboxLabel : EnableCheckboxLabel;
    }

    get confirmButtonLabel() {
        return this.isDisabling ? DisableButton : EnableButton;
    }

    get isConfirmDisabled() {
        return !this.agreed;
    }

    handleCheckboxChange(event) {
        this.agreed = event.target.checked;
    }

    handleCancel() {
        this.agreed = false;
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleClose() {
        this.agreed = false;
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleConfirm() {
        this.agreed = false;
        this.dispatchEvent(new CustomEvent('confirm', {
            detail: { featureName: this.featureName, isDisabling: this.isDisabling }
        }));
    }
}
