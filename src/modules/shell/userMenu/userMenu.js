import { LightningElement, api } from 'lwc';
import { signOut } from '../../../data/firebaseAuth.js';
import * as UserMenuLabels from 'data/labels/UserMenu';

export default class UserMenu extends LightningElement {
    labels = UserMenuLabels;
    @api user;
    _isOpen = false;

    _handleOutsideClick = (event) => {
        if (!this.template.host.contains(event.target)) {
            this._isOpen = false;
        }
    };

    connectedCallback() {
        document.addEventListener('click', this._handleOutsideClick);
    }

    disconnectedCallback() {
        document.removeEventListener('click', this._handleOutsideClick);
    }

    get avatarSrc() {
        return this.user?.photoURL || '';
    }

    get userName() {
        return this.user?.displayName || 'User';
    }

    get userEmail() {
        return this.user?.email || '';
    }

    get ariaExpanded() {
        return String(this._isOpen);
    }

    get dropdownClass() {
        return `user-menu-dropdown${this._isOpen ? '' : ' slds-hide'}`;
    }

    handleAvatarClick(event) {
        event.stopPropagation();
        this._isOpen = !this._isOpen;
    }

    async handleSignOut() {
        this._isOpen = false;
        try {
            await signOut();
        } catch (err) {
            console.error('Sign-out failed:', err);
        }
    }
}
