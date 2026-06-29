import { LightningElement } from 'lwc';
import { linkHref } from '../../../router';

export default class VersionsTab extends LightningElement {
    handleCompareVersions() {
        const href = linkHref('/compare-versions');
        window.open(href, '_blank');
    }

    versions = [
        {
            id: '5',
            number: '5',
            status: 'Inactive',
            statusClass: 'status-badge status-inactive',
            statusIcon: '',
            description: 'Lorem ipsum dol...',
            clusters: '4',
            silhouetteScore: '0.67',
            algorithm: 'K Means',
            createdBy: 'User 1',
            createdOn: '1/22/2026, 04:45...'
        },
        {
            id: '4',
            number: '4',
            status: 'Failed',
            statusClass: 'status-badge status-failed',
            statusIcon: 'utility:error',
            description: 'Lorem ipsum dol...',
            clusters: 'NA',
            silhouetteScore: 'NA',
            algorithm: 'HDBScan',
            createdBy: 'User 2',
            createdOn: '2/11/2026, 04:45...'
        },
        {
            id: '3',
            number: '3',
            status: 'Inactive',
            statusClass: 'status-badge status-inactive',
            statusIcon: '',
            description: 'Lorem ipsum dol...',
            clusters: '5',
            silhouetteScore: '0.78',
            algorithm: 'HDBScan',
            createdBy: 'User 3',
            createdOn: '3/12/2026, 04:45...'
        },
        {
            id: '2',
            number: '2',
            status: 'Active',
            statusClass: 'status-badge status-active',
            statusIcon: 'utility:success',
            description: 'Lorem ipsum dol...',
            clusters: '4',
            silhouetteScore: 'Label',
            algorithm: 'K Means',
            createdBy: 'User 1',
            createdOn: '3/12/2026, 04:45...'
        },
        {
            id: '1',
            number: '1',
            status: 'Inactive',
            statusClass: 'status-badge status-inactive',
            statusIcon: '',
            description: 'Lorem ipsum dol...',
            clusters: '4',
            silhouetteScore: 'Label',
            algorithm: 'K Means',
            createdBy: 'User 1',
            createdOn: '3/12/2026, 04:45...'
        }
    ];
}
