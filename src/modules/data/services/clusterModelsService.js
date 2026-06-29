const MODELS = [
    {
        id: 'cluster-001',
        name: 'Custom Clusters',
        source: 'Created with Einstein',
        capability: 'Structured Clustering',
        status: 'Active',
        org: 'Org Name',
        lastModified: '2027 Feb 02',
        modifiedBy: 'User 1',
    },
    {
        id: 'cluster-002',
        name: 'Cluster Similar Accounts',
        source: 'Created with Einstein',
        capability: 'Structured Clustering',
        status: 'Active',
        org: 'Org Name',
        lastModified: '2027 Jan 01',
        modifiedBy: 'User 2',
    },
    {
        id: 'cluster-003',
        name: 'Customer Groups',
        source: 'Created with Einstein',
        capability: 'Structured Clustering',
        status: 'Active',
        org: 'Org Name',
        lastModified: '2027 Jan 01',
        modifiedBy: 'User 1',
    },
    {
        id: 'cluster-004',
        name: 'Product Clusters',
        source: 'Created with Einstein',
        capability: 'Structured Clustering',
        status: 'Inactive',
        org: 'Org Name',
        lastModified: '2027 Jan 01',
        modifiedBy: 'User 1',
    },
    {
        id: 'cluster-005',
        name: 'Purchase based clusters',
        source: 'Created with Einstein',
        capability: 'Structured Clustering',
        status: 'Active',
        org: 'Org Name',
        lastModified: '2027 Jan 01',
        modifiedBy: 'User 2',
    },
];

export async function listClusterModels() {
    return MODELS;
}
