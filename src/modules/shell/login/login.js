import { LightningElement, track } from 'lwc';
import { signInWithGoogle } from '../../../data/firebaseAuth.js';
import { SignInWithGoogle } from 'data/labels/Login';

export default class Login extends LightningElement {
    labels = { SignInWithGoogle };
    @track errorMessage = '';
    @track isLoading = false;

    async handleSignIn() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            await signInWithGoogle();
            // onAuthStateChanged in shell/app drives the transition — nothing more needed here
        } catch (err) {
            this.errorMessage = err.message ?? 'Sign-in failed. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }
}
