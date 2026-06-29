import { LightningElement, api, track } from 'lwc';
import { Close } from 'data/labels/Common';

export default class ToastMessage extends LightningElement {
    @api message = '';
    @api variant = 'success';

    @track _visible = false;
    _timer = null;

    labels = { DismissLabel: Close };

    @api
    get visible() {
        return this._visible;
    }
    set visible(value) {
        const wasVisible = this._visible;
        this._visible = value;
        if (value && !wasVisible) {
            this._startAutoDismiss();
        } else if (!value) {
            this._clearTimer();
        }
    }

    disconnectedCallback() {
        this._clearTimer();
    }

    get toastClasses() {
        return `toast-bar toast-bar_${this.variant}`;
    }

    get iconName() {
        if (this.variant === 'success') return 'utility:success';
        if (this.variant === 'error') return 'utility:error';
        return 'utility:info';
    }

    _startAutoDismiss() {
        this._clearTimer();
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._timer = setTimeout(() => {
            this._dismiss();
        }, 5000);
    }

    _clearTimer() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    _dismiss() {
        this._visible = false;
        this._clearTimer();
        this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, composed: true }));
    }

    handleDismiss() {
        this._dismiss();
    }
}
