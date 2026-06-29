import { LightningElement, track } from 'lwc';
import { navigate } from '../../../router';
import { listPredictModels } from 'data/services/predictModelsService';
import * as Labels from 'data/labels/PredictModels';

export default class PredictModels extends LightningElement {
    labels = Labels;
    @track data = [];
    searchTerm = '';

    async connectedCallback() {
        this.data = await listPredictModels();
    }

    get filteredData() {
        if (!this.searchTerm) return this.data;
        const term = this.searchTerm.toLowerCase();
        return this.data.filter(
            (m) =>
                m.name.toLowerCase().includes(term) ||
                m.capability.toLowerCase().includes(term) ||
                m.status.toLowerCase().includes(term) ||
                m.modifiedBy.toLowerCase().includes(term)
        );
    }

    get metaText() {
        const count = this.filteredData.length;
        return `${count} item${count !== 1 ? 's' : ''} • Updated a few seconds ago`;
    }

    handleSearch(event) {
        this.searchTerm = event.target.value;
    }

    handleSort(event) {
        const { fieldName, sortDirection } = event.detail;
        const cloned = [...this.data];
        cloned.sort((a, b) => {
            let aVal = (a[fieldName] || '').toLowerCase();
            let bVal = (b[fieldName] || '').toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        this.data = cloned;
    }

    handleModelClick(event) {
        navigate('/nba-model-detail');
    }
}
