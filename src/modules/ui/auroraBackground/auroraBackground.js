import { LightningElement, api, track } from 'lwc';

export default class AuroraBackground extends LightningElement {
    @api isActive = false;
    @api brand = 'salesforce';
    @track _animating = false;

    _deactivateTimeout;

    get containerClasses() {
        let classes = 'aurora-container';
        if (this.isActive) {
            classes += ' aurora-active';
        }
        if (this._animating) {
            classes += ' aurora-deactivating';
        }
        return classes;
    }

    get buttonLabel() {
        return this.isActive ? 'Deactivate Voice' : 'Activate Voice';
    }

    get buttonClasses() {
        let classes = 'voice-btn';
        if (this.isActive) {
            classes += ' voice-btn-active';
        }
        return classes;
    }

    handleToggle() {
        if (this.isActive) {
            this._animating = true;
            this._deactivateTimeout = setTimeout(() => {
                this.isActive = false;
                this._animating = false;
            }, 1200);
        } else {
            this.isActive = true;
            this._animating = false;
        }

        this.dispatchEvent(
            new CustomEvent('auroratoggle', {
                bubbles: true,
                composed: true,
                detail: { active: this.isActive }
            })
        );
    }

    disconnectedCallback() {
        if (this._deactivateTimeout) {
            clearTimeout(this._deactivateTimeout);
        }
    }
}
