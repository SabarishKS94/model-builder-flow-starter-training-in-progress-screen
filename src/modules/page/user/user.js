import { LightningElement } from 'lwc';
import { getCurrentRoute } from '../../../router';
import { User as UserLabel } from 'data/labels/User';

export default class User extends LightningElement {
    labels = { User: UserLabel };
    get route() {
        return getCurrentRoute();
    }

    get userId() {
        return this.route?.params?.id ?? '—';
    }
}
