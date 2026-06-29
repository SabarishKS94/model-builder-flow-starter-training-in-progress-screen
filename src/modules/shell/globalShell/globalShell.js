import { LightningElement, api } from 'lwc';

export default class GlobalShell extends LightningElement {
    @api currentPage = 'home';
    @api navItems = [];
    @api apps = [];
    @api activeAppLabel = '';
    @api activeAppId = '';
    @api user;

    handleNavigate(event) {
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: event.detail,
                bubbles: true,
                composed: true,
            })
        );
    }

    handleAppSwitch(event) {
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('appswitch', {
                detail: event.detail,
                bubbles: true,
                composed: true,
            })
        );
    }

    handlePanelSelect(event) {
        this.dispatchEvent(
            new CustomEvent('panelselect', {
                detail: event.detail,
                bubbles: true,
                composed: true
            })
        );
    }

}
