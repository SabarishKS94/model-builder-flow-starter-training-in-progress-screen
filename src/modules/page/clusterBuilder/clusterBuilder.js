import { LightningElement, track } from 'lwc';
import * as Labels from 'data/labels/ClusterBuilder';
import DataViewerModal from 'ui/dataViewerModal';

const STEPS = [
    { id: 1, label: Labels.Step1 },
    { id: 2, label: Labels.Step2 },
    { id: 3, label: Labels.Step3 },
    { id: 4, label: Labels.Step4 },
    { id: 5, label: Labels.Step5 },
];

const ACCOUNT_VARIABLES = [
    { id: 'v1', name: 'Account_ExternalId', type: 'number', min: 1000, max: 99999 },
    { id: 'v2', name: 'Annual Revenue', type: 'number', selected: true, action: 'Replace Missing Values', min: 50000, max: 12500000 },
    { id: 'v3', name: 'Billing Latitude', type: 'number', min: 39.833644, max: 43.976418 },
    { id: 'v4', name: 'Billing Longitude', type: 'number', min: -122.418301, max: -71.058884 },
    { id: 'v5', name: 'Employees', type: 'number', min: 1, max: 250000 },
    { id: 'v6', name: 'Global Discount', type: 'number', min: 0, max: 0.45 },
    { id: 'v7', name: 'Account Currency', type: 'text', frequencies: [
        { label: 'USD', count: 14000 },
        { label: 'EUR', count: 11000 },
        { label: 'GBP', count: 2900 },
        { label: 'JPY', count: 1400 },
        { label: 'CAD', count: 1300 },
        { label: 'AUD', count: 403 },
    ] },
    { id: 'v8', name: 'Account Description', type: 'text', isLargeText: true, avgChars: 2400 },
    { id: 'v9', name: 'Account Fax', type: 'text' },
    { id: 'v10', name: 'Account ID', type: 'text' },
    { id: 'v11', name: 'Account Name', type: 'text' },
    { id: 'v12', name: 'Account Phone', type: 'text' },
    { id: 'v13', name: 'Account Source', type: 'text', frequencies: [
        { label: 'Web', count: 9800 },
        { label: 'Phone Inquiry', count: 7200 },
        { label: 'Partner Referral', count: 3100 },
        { label: 'Trade Show', count: 1800 },
        { label: 'Other', count: 950 },
    ] },
    { id: 'v14', name: 'Account Type', type: 'text', frequencies: [
        { label: 'Customer - Direct', count: 12500 },
        { label: 'Customer - Channel', count: 8200 },
        { label: 'Prospect', count: 4400 },
        { label: 'Other', count: 1100 },
    ] },
    { id: 'v15', name: 'Billing City', type: 'text' },
    { id: 'v16', name: 'Billing Country', type: 'text', frequencies: [
        { label: 'United States', count: 15800 },
        { label: 'United Kingdom', count: 4200 },
        { label: 'Germany', count: 3100 },
        { label: 'France', count: 2400 },
        { label: 'Japan', count: 1700 },
        { label: 'Canada', count: 1200 },
    ] },
    { id: 'v17', name: 'Billing State/Province', type: 'text' },
    { id: 'v18', name: 'Billing Street', type: 'text' },
    { id: 'v19', name: 'Billing Zip/Postal Code', type: 'text' },
    { id: 'v20', name: 'Created Date', type: 'date', selected: true, action: 'Group by Day', min: '1/1/2013, 05:30 AM', max: '1/22/2025, 05:30 AM' },
    { id: 'v21', name: 'Last Activity', type: 'date', selected: true, action: 'Group by Month', min: '4/12/2014, 05:30 AM', max: '6/29/2026, 05:30 AM' },
    { id: 'v24', name: 'Last Modified Date', type: 'date', selected: true, action: 'Group by Month', min: '3/22/2018, 05:30 AM', max: '6/30/2026, 05:30 AM' },
    { id: 'v25', name: 'System Modstamp', type: 'date', selected: true, action: 'Group by Month', min: '3/22/2018, 05:30 AM', max: '6/30/2026, 05:30 AM' },
    { id: 'v22', name: 'Industry', type: 'text', frequencies: [
        { label: 'Technology', count: 8400 },
        { label: 'Financial Services', count: 6200 },
        { label: 'Healthcare', count: 4900 },
        { label: 'Manufacturing', count: 3700 },
        { label: 'Retail', count: 2500 },
        { label: 'Education', count: 1100 },
    ] },
    { id: 'v23', name: 'Last Modified By ID', type: 'text' },
    { id: 'v26', name: 'Support Notes', type: 'text', isLargeText: true, avgChars: 3100 },
    { id: 'v27', name: 'Sales Engagement Log', type: 'text', isLargeText: true, avgChars: 1850 },
];

const DATA_MODEL_OBJECTS = [
    { id: 'dmo-1', label: 'Account', apiName: 'AMR_Account__dlm' },
    { id: 'dmo-2', label: 'Account', apiName: 'AMR_Account_WavePM__dlm' },
    { id: 'dmo-3', label: 'Account Contact', apiName: 'AMR_AccountContact__dlm' },
    { id: 'dmo-4', label: 'Attrition', apiName: 'AMR_Attrition__dlm' },
    { id: 'dmo-5', label: 'Contact Point Address', apiName: 'AMR_ContactPointAddress__dlm' },
    { id: 'dmo-6', label: 'Contact Point Email', apiName: 'AMR_ContactPointEmail__dlm' },
    { id: 'dmo-7', label: 'Contact Point Phone', apiName: 'AMR_ContactPointPhone__dlm' },
    { id: 'dmo-8', label: 'Fiscal Calendar WavePM', apiName: 'AMR_FiscalCalendar_WavePM__dlm' },
    { id: 'dmo-9', label: 'FreemanBDT', apiName: 'FreemanBDT__dlm' },
    { id: 'dmo-10', label: 'Individual', apiName: 'AMR_Individual__dlm' },
    { id: 'dmo-11', label: 'Lead', apiName: 'AMR_Lead__dlm' },
    { id: 'dmo-12', label: 'Lead Engagement Signals', apiName: 'Lead_Engagement_Signals__dlm' },
    { id: 'dmo-13', label: 'Opportunity', apiName: 'AMR_Opportunity__dlm' },
    { id: 'dmo-14', label: 'Case', apiName: 'AMR_Case__dlm' },
];

export default class ClusterBuilder extends LightningElement {
    labels = Labels;
    @track currentStep = 1;
    @track showLeftPanel = true;
    @track showRightPanel = true;
    @track dmoSearchTerm = '';
    @track showDmoDropdown = false;
    @track selectedDmo = null;
    @track filterSelection = 'all';
    @track variableSearchTerm = '';
    @track showOnlySelected = false;
    @track accountSectionOpen = true;
    @track selectedVariableIds = new Set(['v2', 'v20', 'v21', 'v24', 'v25']);
    @track variableActions = {
        v2: 'Replace Missing Values',
        v20: 'Group by Day',
        v21: 'Group by Month',
        v24: 'Group by Month',
        v25: 'Group by Month',
    };
    @track activeVariableId = null;
    @track variableTransformations = {
        v20: 'group-by-day',
        v21: 'group-by-month',
        v24: 'group-by-month',
        v25: 'group-by-month',
        v2: 'replace-missing',
    };
    @track variableReplaceWith = { v2: 'average' };
    @track variableGroupBy = { v2: 'account-name' };
    @track variableBuckets = {};
    @track selectedAlgorithm = 'kmeans';
    @track autoClusterEnabled = true;
    @track numberOfClusters = 4;
    @track modelName = Labels.ModelNameValue;
    @track clusterDescription = Labels.ClusterDescriptionValue;
    @track activeArticleId = null;
    @track isTraining = true;
    @track isAgentforceOpen = false;
    @track notifyEnabled = false;
    @track currentTrainingStage = 3;
    @track trainingVariant = 'a';
    @track ambientDetailsOpen = false;

    get steps() {
        return STEPS.map((step) => {
            const isActive = step.id === this.currentStep;
            const isComplete = step.id < this.currentStep;
            let iconName = 'utility:routing_offline';
            let iconClass = 'step-icon step-icon_pending';
            if (isActive) {
                iconName = 'utility:choice';
                iconClass = 'step-icon step-icon_active';
            }
            return {
                ...step,
                number: step.id,
                isComplete,
                itemClass: `step-item${isActive ? ' step-item_active' : ''}${isComplete ? ' step-item_complete' : ''}`,
                iconName,
                iconClass,
                labelClass: isActive ? 'step-label step-label_active' : 'step-label',
            };
        });
    }

    get isStep1() {
        return this.currentStep === 1;
    }

    get isStep2() {
        return this.currentStep === 2;
    }

    get isStep3() {
        return this.currentStep === 3;
    }

    get isStep4() {
        return this.currentStep === 4;
    }

    get isStep5() {
        return this.currentStep === 5;
    }

    get reviewAlgorithmValue() {
        return this.selectedAlgorithm === 'hdbscan' ? Labels.ReviewAlgorithmValueHDBScan : Labels.ReviewAlgorithmValueKMeans;
    }

    get reviewVariablesInfo() {
        return `${this.selectedCount} of ${this.totalVariableCount} variables selected`;
    }

    get reviewFilterRecords() {
        return this.filterSelection === 'filtered'
            ? '504 of 1000000 records will be used to train the model'
            : '1000000 of 1000000 records will be used to train the model';
    }

    get reviewDmoValue() {
        return this.selectedDmo ? this.selectedDmo.label : 'Account';
    }

    get nextButtonLabel() {
        return this.currentStep === 5 ? Labels.SaveTrainButton : Labels.NextButton;
    }

    get nextButtonIcon() {
        return this.currentStep === 5 ? 'utility:einstein' : null;
    }

    get isFinalStep() {
        return this.currentStep === 5;
    }

    get previousButtonLabel() {
        return this.currentStep === 5 ? Labels.BackButton : Labels.PreviousButton;
    }

    get panelBadgeIcon() {
        return this.currentStep === 5 ? 'utility:fallback' : 'utility:edit';
    }

    get panelBadgeClass() {
        return this.currentStep === 5 ? 'panel-icon-badge panel-icon-badge_train' : 'panel-icon-badge';
    }

    get isKMeansSelected() {
        return this.selectedAlgorithm === 'kmeans';
    }

    get isHdbscanSelected() {
        return this.selectedAlgorithm === 'hdbscan';
    }

    get autoClusterToggleText() {
        return this.autoClusterEnabled ? Labels.AutoClusterEnabled : Labels.AutoClusterDisabled;
    }

    get showNumberOfClusters() {
        return this.selectedAlgorithm === 'kmeans' && !this.autoClusterEnabled;
    }

    get decrementDisabled() {
        return this.numberOfClusters <= 2;
    }

    get incrementDisabled() {
        return this.numberOfClusters >= 10;
    }

    get filteredVariables() {
        const term = this.variableSearchTerm.toLowerCase();
        return ACCOUNT_VARIABLES.filter((v) => {
            if (this.showOnlySelected && !this.selectedVariableIds.has(v.id)) return false;
            if (term && !v.name.toLowerCase().includes(term)) return false;
            return true;
        }).map((v) => {
            const isSelected = this.selectedVariableIds.has(v.id);
            let iconName = 'utility:text';
            if (v.type === 'number') iconName = 'utility:number_input';
            else if (v.type === 'date') iconName = 'utility:event';
            if (v.isLargeText) iconName = 'utility:richtextindent';
            const action = this.variableActions[v.id] || null;
            return {
                ...v,
                isSelected,
                action,
                actionLabel: action,
                actionVariant: 'neutral',
                iconName,
                showLargeTextInfo: !!v.isLargeText,
                rowClass: isSelected ? 'var-row var-row_selected' : 'var-row',
                showDelete: v.type !== 'date',
            };
        });
    }

    get selectedCount() {
        return this.selectedVariableIds.size;
    }

    get totalVariableCount() {
        return ACCOUNT_VARIABLES.length;
    }

    get selectedSummary() {
        return `${this.selectedCount} of ${this.totalVariableCount} selected`;
    }

    get accountToggleIcon() {
        return this.accountSectionOpen ? 'utility:chevronup' : 'utility:chevrondown';
    }

    get showOnlySelectedVariant() {
        return this.showOnlySelected ? 'brand' : 'neutral';
    }

    get activeVariable() {
        if (!this.activeVariableId) return null;
        return ACCOUNT_VARIABLES.find((v) => v.id === this.activeVariableId) || null;
    }

    get isVariablePanelOpen() {
        return !!this.activeVariable;
    }

    get activeTransformation() {
        if (!this.activeVariableId) return 'none';
        if (this.variableTransformations[this.activeVariableId]) {
            return this.variableTransformations[this.activeVariableId];
        }
        const v = this.activeVariable;
        if (v && v.type === 'date') return 'group-by-day';
        return 'none';
    }

    get transformationOptions() {
        const v = this.activeVariable;
        if (!v) return [];
        if (v.type === 'text') {
            return [
                { label: Labels.TransformationNone, value: 'none' },
                { label: Labels.TransformationTextClustering, value: 'text-clustering' },
            ];
        }
        if (v.type === 'date') {
            return [
                { label: Labels.TransformationGroupByDay, value: 'group-by-day' },
                { label: Labels.TransformationGroupByMonth, value: 'group-by-month' },
            ];
        }
        return [
            { label: Labels.TransformationNone, value: 'none' },
            { label: Labels.TransformationReplaceMissing, value: 'replace-missing' },
        ];
    }

    get isActiveVariableNumber() {
        const v = this.activeVariable;
        return !!v && v.type === 'number';
    }

    get isActiveVariableText() {
        const v = this.activeVariable;
        return !!v && v.type === 'text';
    }

    get isActiveVariableDate() {
        const v = this.activeVariable;
        return !!v && v.type === 'date';
    }

    get showNumberBuckets() {
        return this.isActiveVariableNumber;
    }

    get activeBucketCount() {
        if (!this.activeVariableId) return 10;
        return this.variableBuckets[this.activeVariableId] || 10;
    }

    get textFrequencies() {
        const v = this.activeVariable;
        if (!v || v.type !== 'text' || !v.frequencies) return [];
        const max = Math.max(...v.frequencies.map((f) => f.count));
        return v.frequencies.map((f) => ({
            label: f.label,
            count: this.formatCount(f.count),
            barStyle: `width: ${Math.max(2, (f.count / max) * 100)}%`,
        }));
    }

    get showTextFrequencyChart() {
        const v = this.activeVariable;
        return !!v && v.type === 'text' && !!v.frequencies && v.frequencies.length > 0;
    }

    formatCount(n) {
        if (n >= 1000) {
            const k = n / 1000;
            return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
        }
        return String(n);
    }

    get replaceWithOptions() {
        return [
            { label: 'Average', value: 'average' },
            { label: 'Median', value: 'median' },
            { label: 'Mode', value: 'mode' },
            { label: 'Maximum', value: 'maximum' },
            { label: 'Minimum', value: 'minimum' },
        ];
    }

    get groupByOptions() {
        return [
            { label: 'Account Name', value: 'account-name' },
            { label: 'Industry', value: 'industry' },
            { label: 'Account Type', value: 'account-type' },
            { label: 'Billing Country', value: 'billing-country' },
        ];
    }

    get activeReplaceWith() {
        if (!this.activeVariableId) return 'average';
        return this.variableReplaceWith[this.activeVariableId] || 'average';
    }

    get activeGroupBy() {
        if (!this.activeVariableId) return 'account-name';
        return this.variableGroupBy[this.activeVariableId] || 'account-name';
    }

    get showReplaceMissingOptions() {
        return this.activeTransformation === 'replace-missing';
    }

    get showDistribution() {
        const v = this.activeVariable;
        return !!v && (v.type === 'number' || v.type === 'date');
    }

    get distributionMin() {
        const v = this.activeVariable;
        return v && v.min !== undefined ? v.min : '';
    }

    get distributionMax() {
        const v = this.activeVariable;
        return v && v.max !== undefined ? v.max : '';
    }

    get showPrevious() {
        return this.currentStep > 1;
    }

    get isNextDisabled() {
        if (this.currentStep === 1) {
            return !this.selectedDmo;
        }
        return false;
    }

    get showRightPanelContent() {
        return this.showRightPanel && !this.isAgentforceOpen;
    }

    get isAllRecordsSelected() {
        return this.filterSelection === 'all';
    }

    get isFilteredRecordsSelected() {
        return this.filterSelection === 'filtered';
    }


    get panelTitle() {
        if (this.currentStep === 5) return Labels.Panel5Title;
        if (this.currentStep === 4) return Labels.Panel4Title;
        if (this.currentStep === 3) return Labels.Panel3Title;
        if (this.currentStep === 2) return Labels.Panel2Title;
        return Labels.PanelTitle;
    }

    get panelHeadline() {
        if (this.currentStep === 5) return Labels.Panel5Headline;
        if (this.currentStep === 4) return Labels.Panel4Headline;
        if (this.currentStep === 3) return Labels.Panel3Headline;
        if (this.currentStep === 2) return Labels.Panel2Headline;
        return Labels.PanelHeadline;
    }

    get panelBody() {
        if (this.currentStep === 5) {
            return [
                { id: 'b1', text: Labels.Panel5Body1 },
                { id: 'b2', text: Labels.Panel5Body2 },
                { id: 'b3', text: Labels.Panel5Body3 },
                { id: 'b4', text: Labels.Panel5Body4 },
            ];
        }
        if (this.currentStep === 4) return [{ id: 'b1', text: Labels.Panel4Body1 }];
        if (this.currentStep === 3) return [{ id: 'b1', text: Labels.Panel3Body1 }];
        if (this.currentStep === 2) return [{ id: 'b1', text: Labels.Panel2Body1 }];
        return [
            { id: 'b1', text: Labels.PanelBody1 },
            { id: 'b2', text: Labels.PanelBody2 },
            { id: 'b3', text: Labels.PanelBody3 },
        ];
    }

    get panelCards() {
        if (this.currentStep === 5) return [];
        if (this.currentStep === 4) {
            return [
                { id: 'c1', title: Labels.Panel4Card1Title, articleId: 'choosing-an-algorithm' },
            ];
        }
        if (this.currentStep === 3) {
            return [
                { id: 'c1', title: Labels.Panel3Card1Title, articleId: 'which-variables-to-include' },
                { id: 'c2', title: Labels.Panel3Card2Title, articleId: 'choosing-variables-manually' },
                { id: 'c3', title: Labels.Panel3Card3Title, articleId: 'refine-variable-selection' },
            ];
        }
        if (this.currentStep === 2) {
            return [
                { id: 'c1', title: Labels.Panel2Card1Title, articleId: 'why-filtering-matters' },
                { id: 'c2', title: Labels.Panel2Card2Title, articleId: 'what-should-i-filter' },
            ];
        }
        return [
            { id: 'c1', title: Labels.Card1Title, articleId: 'clustering-vs-multiclass' },
            { id: 'c2', title: Labels.Card2Title, articleId: 'prepare-data-for-clustering' },
        ];
    }

    get dataSpaceOptions() {
        return [
            { label: 'AMER', value: 'AMER' },
            { label: 'default', value: 'default', description: 'Default data space where all the current DLOs are made members' },
        ];
    }

    get dataObjectTypeOptions() {
        return [
            { label: 'Data Model Object', value: 'dmo' },
            { label: 'Calculated Insights', value: 'calculated-insights' },
        ];
    }

    get filteredDmoItems() {
        const term = this.dmoSearchTerm.toLowerCase();
        return DATA_MODEL_OBJECTS.filter(
            (item) => !term || item.label.toLowerCase().includes(term) || item.apiName.toLowerCase().includes(term)
        );
    }

    get dmoSearchValue() {
        return this.selectedDmo ? `${this.selectedDmo.label} (${this.selectedDmo.apiName})` : this.dmoSearchTerm;
    }

    handleDmoSearchFocus() {
        this.showDmoDropdown = true;
    }

    handleDmoSearchInput(event) {
        this.dmoSearchTerm = event.target.value;
        this.selectedDmo = null;
        this.showDmoDropdown = true;
    }

    handleDmoSelect(event) {
        const id = event.currentTarget.dataset.id;
        this.selectedDmo = DATA_MODEL_OBJECTS.find((item) => item.id === id);
        this.dmoSearchTerm = '';
        this.showDmoDropdown = false;
    }

    handleDmoSearchBlur() {
        // Delay to allow click on list item
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            this.showDmoDropdown = false;
        }, 200);
    }

    handleSelectAllRecords() {
        this.filterSelection = 'all';
    }

    handleSelectFilteredRecords() {
        this.filterSelection = 'filtered';
    }

    handleVariableSearch(event) {
        this.variableSearchTerm = event.target.value;
    }

    handleToggleShowOnlySelected() {
        this.showOnlySelected = !this.showOnlySelected;
    }

    handleToggleAccountSection() {
        this.accountSectionOpen = !this.accountSectionOpen;
    }

    handleVariableToggle(event) {
        const id = event.currentTarget.dataset.id;
        const next = new Set(this.selectedVariableIds);
        if (next.has(id)) {
            next.delete(id);
            const actions = { ...this.variableActions };
            delete actions[id];
            this.variableActions = actions;
        } else {
            next.add(id);
        }
        this.selectedVariableIds = next;
    }

    handleRemoveVariable(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        const next = new Set(this.selectedVariableIds);
        next.delete(id);
        this.selectedVariableIds = next;
        const actions = { ...this.variableActions };
        delete actions[id];
        this.variableActions = actions;
        const trans = { ...this.variableTransformations };
        delete trans[id];
        this.variableTransformations = trans;
        if (this.activeVariableId === id) {
            this.activeVariableId = null;
        }
    }

    handleVariableNameClick(event) {
        event.preventDefault();
        const id = event.currentTarget.dataset.id;
        this.activeVariableId = id;
        this.showRightPanel = true;
    }

    handleCloseVariablePanel() {
        this.activeVariableId = null;
    }

    handleTransformationChange(event) {
        const id = this.activeVariableId;
        if (!id) return;
        const value = event.detail.value;
        const trans = { ...this.variableTransformations };
        const actions = { ...this.variableActions };
        const next = new Set(this.selectedVariableIds);

        if (value === 'none') {
            delete trans[id];
            delete actions[id];
            next.delete(id);
        } else {
            trans[id] = value;
            if (value === 'replace-missing') actions[id] = Labels.TransformationReplaceMissing;
            else if (value === 'text-clustering') actions[id] = Labels.TransformationTextClustering;
            else if (value === 'group-by-month') actions[id] = Labels.TransformationGroupByMonth;
            else if (value === 'group-by-day') actions[id] = Labels.TransformationGroupByDay;
            next.add(id);
        }

        this.variableTransformations = trans;
        this.variableActions = actions;
        this.selectedVariableIds = next;
    }

    handleReplaceWithChange(event) {
        const id = this.activeVariableId;
        if (!id) return;
        this.variableReplaceWith = { ...this.variableReplaceWith, [id]: event.detail.value };
    }

    handleGroupByChange(event) {
        const id = this.activeVariableId;
        if (!id) return;
        this.variableGroupBy = { ...this.variableGroupBy, [id]: event.detail.value };
    }

    handleBucketChange(event) {
        const id = this.activeVariableId;
        if (!id) return;
        this.variableBuckets = { ...this.variableBuckets, [id]: parseInt(event.target.value, 10) };
    }

    handleSelectKMeans() {
        this.selectedAlgorithm = 'kmeans';
    }

    handleSelectHdbscan() {
        this.selectedAlgorithm = 'hdbscan';
    }

    handleToggleAutoCluster(event) {
        this.autoClusterEnabled = event.target.checked;
    }

    handleClusterCountChange(event) {
        const val = parseInt(event.target.value, 10);
        if (!isNaN(val) && val >= 2 && val <= 10) {
            this.numberOfClusters = val;
        }
    }

    handleClusterDecrement() {
        if (this.numberOfClusters > 2) {
            this.numberOfClusters -= 1;
        }
    }

    handleClusterIncrement() {
        if (this.numberOfClusters < 10) {
            this.numberOfClusters += 1;
        }
    }

    handleModelNameChange(event) {
        this.modelName = event.target.value;
    }

    handleClusterDescriptionChange(event) {
        this.clusterDescription = event.target.value;
    }

    handleSaveTrain() {
        this.isTraining = true;
    }

    handleCancelTraining() {
        this.isTraining = false;
        this.notifyEnabled = false;
        this.currentTrainingStage = 3;
    }

    get trainingStages() {
        const stageLabels = [
            Labels.TrainingStage1,
            Labels.TrainingStage2,
            Labels.TrainingStage3,
            Labels.TrainingStage4,
            Labels.TrainingStage5,
        ];
        const total = stageLabels.length;
        return stageLabels.map((label, idx) => {
            const number = idx + 1;
            const isComplete = number < this.currentTrainingStage;
            const isActive = number === this.currentTrainingStage;
            const isFirst = idx === 0;
            const isLast = idx === total - 1;
            let itemClass = 'training-stage';
            if (isComplete) itemClass += ' training-stage_complete';
            else if (isActive) itemClass += ' training-stage_active';
            else itemClass += ' training-stage_pending';
            if (isFirst) itemClass += ' training-stage_first';
            if (isLast) itemClass += ' training-stage_last';
            return {
                id: `stage-${number}`,
                label,
                itemClass,
                isComplete,
                isActive,
            };
        });
    }

    get isVariantA() {
        return this.trainingVariant === 'a';
    }

    get isVariantB() {
        return this.trainingVariant === 'b';
    }

    get isVariantC() {
        return this.trainingVariant === 'c';
    }

    get variantAClass() {
        return this.isVariantA ? 'variant-chip variant-chip_active' : 'variant-chip';
    }

    get variantBClass() {
        return this.isVariantB ? 'variant-chip variant-chip_active' : 'variant-chip';
    }

    get variantCClass() {
        return this.isVariantC ? 'variant-chip variant-chip_active' : 'variant-chip';
    }

    handleSelectVariantA() {
        this.trainingVariant = 'a';
    }

    handleSelectVariantB() {
        this.trainingVariant = 'b';
    }

    handleSelectVariantC() {
        this.trainingVariant = 'c';
    }

    get horizontalStages() {
        const stageLabels = [
            Labels.TrainingStage1,
            Labels.TrainingStage2,
            Labels.TrainingStage3,
            Labels.TrainingStage4,
            Labels.TrainingStage5,
        ];
        return stageLabels.map((label, idx) => {
            const number = idx + 1;
            const isComplete = number < this.currentTrainingStage;
            const isActive = number === this.currentTrainingStage;
            let itemClass = 'hstage';
            if (isComplete) itemClass += ' hstage_complete';
            else if (isActive) itemClass += ' hstage_active';
            else itemClass += ' hstage_pending';
            return {
                id: `hstage-${number}`,
                label,
                itemClass,
                tickClass: `hstage-tick${isComplete ? ' hstage-tick_complete' : ''}${isActive ? ' hstage-tick_active' : ''}`,
                labelClass: `hstage-label${isActive ? ' hstage-label_active' : ''}`,
            };
        });
    }

    get horizontalBarFillStyle() {
        const total = 5;
        const reached = Math.max(0, Math.min(total, this.currentTrainingStage) - 1);
        const pct = (reached / (total - 1)) * 100;
        return `width: ${Math.min(100, Math.max(0, pct))}%`;
    }

    get activityEntries() {
        return [
            {
                id: 'act-now',
                isNow: true,
                time: Labels.TrainingActivityNowLabel,
                text: Labels.TrainingActivityNowText,
            },
            {
                id: 'act-features',
                isNow: false,
                time: Labels.TrainingActivityFeaturesTime,
                text: Labels.TrainingActivityFeaturesText,
            },
            {
                id: 'act-data',
                isNow: false,
                time: Labels.TrainingActivityDataTime,
                text: Labels.TrainingActivityDataText,
            },
            {
                id: 'act-start',
                isNow: false,
                time: Labels.TrainingActivityStartTime,
                text: Labels.TrainingActivityStartText,
            },
        ];
    }

    get ambientToggleLabel() {
        return this.ambientDetailsOpen ? 'Hide detailed progress' : Labels.TrainingSeeDetailsLink;
    }

    handleToggleAmbientDetails() {
        this.ambientDetailsOpen = !this.ambientDetailsOpen;
    }

get notifyButtonLabel() {
        return this.notifyEnabled ? Labels.NotifyMeEnabledLabel : Labels.NotifyMeButton;
    }

    get notifyButtonVariant() {
        return this.notifyEnabled ? 'success' : 'brand';
    }

    get notifyButtonIcon() {
        return this.notifyEnabled ? 'utility:check' : 'utility:notification';
    }

    handleToggleNotify() {
        this.notifyEnabled = !this.notifyEnabled;
    }

    handleBackToClusterBuilder() {
        window.location.href = '/app/aim-cluster';
    }

    handleEditStep(event) {
        const step = parseInt(event.currentTarget.dataset.step, 10);
        if (step && step >= 1 && step <= 5) {
            this.currentStep = step;
        }
    }

    handleNext() {
        if (this.currentStep < 5) {
            this.currentStep += 1;
            this.activeArticleId = null;
        }
    }

    handlePrevious() {
        if (this.currentStep > 1) {
            this.currentStep -= 1;
            this.activeArticleId = null;
        }
    }

    handleStepClick(event) {
        const step = parseInt(event.currentTarget.dataset.step, 10);
        if (step && step >= 1 && step <= 5) {
            this.currentStep = step;
            this.activeArticleId = null;
        }
    }

    handleOpenArticle(event) {
        event.preventDefault();
        const articleId = event.currentTarget.dataset.article;
        if (articleId && Labels.ARTICLES[articleId]) {
            this.activeArticleId = articleId;
        }
    }

    handleCloseArticle() {
        this.activeArticleId = null;
    }

    get isArticleOpen() {
        return !!this.activeArticleId;
    }

    get activeArticle() {
        if (!this.activeArticleId) return null;
        const article = Labels.ARTICLES[this.activeArticleId];
        if (!article) return null;
        return {
            title: article.title,
            blocks: article.blocks.map((block, idx) => {
                const id = `blk-${idx}`;
                if (block.type === 'p') {
                    return { id, isParagraph: true, text: block.text };
                }
                if (block.type === 'h') {
                    return { id, isHeading: true, text: block.text };
                }
                if (block.type === 'ul') {
                    return {
                        id,
                        isUnorderedList: true,
                        items: block.items.map((it, i) => ({
                            id: `${id}-i${i}`,
                            strong: it.strong || '',
                            hasStrong: !!it.strong,
                            text: it.text,
                        })),
                    };
                }
                if (block.type === 'ol') {
                    return {
                        id,
                        isOrderedList: true,
                        items: block.items.map((it, i) => ({
                            id: `${id}-i${i}`,
                            strong: it.strong || '',
                            hasStrong: !!it.strong,
                            text: it.text,
                        })),
                    };
                }
                return { id, isParagraph: true, text: '' };
            }),
        };
    }

    handleToggleLeft() {
        this.showLeftPanel = !this.showLeftPanel;
    }

    handleToggleRight() {
        this.showRightPanel = !this.showRightPanel;
    }

    async handleViewData() {
        await DataViewerModal.open({ size: 'large' });
    }

    handleBack() {
        window.location.href = '/app/aim-cluster';
    }

    get showAgentforceToggle() {
        return !this.isTraining;
    }

    handleToggleAgentforce() {
        this.isAgentforceOpen = !this.isAgentforceOpen;
    }

    handleCloseAgentforce() {
        this.isAgentforceOpen = false;
    }
}
