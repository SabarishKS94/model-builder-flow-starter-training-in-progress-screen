import { LightningElement } from 'lwc';
import { navigate } from '../../../router';
import * as labels from 'data/labels/NotFound';

export default class NotFound extends LightningElement {
    labels = labels;

    handleGoHome() {
        navigate('/');
    }
}
