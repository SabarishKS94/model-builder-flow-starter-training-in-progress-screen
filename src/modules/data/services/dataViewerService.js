const PROFILE_CARDS = [
    {
        id: 'customer_id',
        fieldName: 'Customer ID',
        fieldCount: '1234',
        icon: 'utility:text',
        bars: [
            { label: 'short', width: 15 },
            { label: '', width: 27 },
            { label: 'really long', width: 33 },
            { label: '', width: 37 },
            { label: '', width: 50 },
            { label: 'long', width: 100 },
        ],
    },
    {
        id: 'email',
        fieldName: 'Email',
        fieldCount: '1189',
        icon: 'utility:email',
        bars: [
            { label: 'short', width: 20 },
            { label: '', width: 35 },
            { label: 'medium', width: 50 },
            { label: '', width: 65 },
            { label: 'long', width: 80 },
            { label: '', width: 100 },
        ],
    },
    {
        id: 'first_name',
        fieldName: 'First Name',
        fieldCount: '987',
        icon: 'utility:text',
        bars: [
            { label: 'A-D', width: 25 },
            { label: '', width: 40 },
            { label: 'E-K', width: 55 },
            { label: '', width: 70 },
            { label: 'L-R', width: 85 },
            { label: '', width: 100 },
        ],
    },
    {
        id: 'last_name',
        fieldName: 'Last Name',
        fieldCount: '1102',
        icon: 'utility:text',
        bars: [
            { label: 'short', width: 18 },
            { label: '', width: 30 },
            { label: 'medium', width: 45 },
            { label: '', width: 60 },
            { label: 'long', width: 75 },
            { label: '', width: 100 },
        ],
    },
    {
        id: 'age',
        fieldName: 'Age',
        fieldCount: '1234',
        icon: 'utility:number_input',
        bars: [
            { label: '18-24', width: 30 },
            { label: '', width: 50 },
            { label: '25-34', width: 70 },
            { label: '', width: 85 },
            { label: '35-44', width: 95 },
            { label: '45+', width: 100 },
        ],
    },
    {
        id: 'country',
        fieldName: 'Country',
        fieldCount: '45',
        icon: 'utility:location',
        bars: [
            { label: 'US', width: 100 },
            { label: '', width: 60 },
            { label: 'UK', width: 45 },
            { label: '', width: 30 },
            { label: 'DE', width: 20 },
            { label: '', width: 10 },
        ],
    },
];

const TABLE_COLUMNS = [
    { fieldName: 'index', label: '#', fixedWidth: 48 },
    { fieldName: 'customerId', label: 'Customer ID' },
    { fieldName: 'email', label: 'Email' },
    { fieldName: 'firstName', label: 'First Name' },
    { fieldName: 'lastName', label: 'Last Name' },
    { fieldName: 'age', label: 'Age' },
    { fieldName: 'country', label: 'Country' },
];

const TABLE_ROWS = Array.from({ length: 12 }, (_, i) => ({
    id: `row-${i + 1}`,
    index: i + 1,
    customerId: `0071A00000123000${i}XYZ`,
    email: `user${i + 1}@example.com`,
    firstName: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack', 'Kate', 'Leo'][i],
    lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'][i],
    age: [28, 34, 45, 22, 31, 29, 38, 41, 26, 33, 27, 36][i],
    country: ['US', 'UK', 'US', 'DE', 'US', 'UK', 'US', 'FR', 'US', 'DE', 'US', 'UK'][i],
}));

export async function getProfileCards() {
    return PROFILE_CARDS;
}

export async function getTableColumns() {
    return TABLE_COLUMNS;
}

export async function getTableRows() {
    return TABLE_ROWS;
}
