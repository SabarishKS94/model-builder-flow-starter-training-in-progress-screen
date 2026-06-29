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

    get steps() {
        return STEPS.map((step) => {
            const isActive = step.id === this.currentStep;
            const isComplete = step.id < this.currentStep;
            return {
                ...step,
                number: step.id,
                itemClass: `step-item${isActive ? ' step-item_active' : ''}${isComplete ? ' step-item_complete' : ''}`,
                ringClass: `step-ring${isActive ? ' step-ring_active' : ''}${isComplete ? ' step-ring_complete' : ''}`,
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

    get showPrevious() {
        return this.currentStep > 1;
    }

    get isNextDisabled() {
        if (this.currentStep === 1) {
            return !this.selectedDmo;
        }
        return false;
    }

    get isAllRecordsSelected() {
        return this.filterSelection === 'all';
    }

    get isFilteredRecordsSelected() {
        return this.filterSelection === 'filtered';
    }


    get panelTitle() {
        return this.currentStep === 2 ? Labels.Panel2Title : Labels.PanelTitle;
    }

    get panelHeadline() {
        return this.currentStep === 2 ? Labels.Panel2Headline : Labels.PanelHeadline;
    }

    get panelBody() {
        if (this.currentStep === 2) {
            return [
                { id: 'b1', text: Labels.Panel2Body1 },
                { id: 'b2', text: Labels.Panel2Body2 },
            ];
        }
        return [
            { id: 'b1', text: Labels.PanelBody1 },
            { id: 'b2', text: Labels.PanelBody2 },
            { id: 'b3', text: Labels.PanelBody3 },
        ];
    }

    get panelCards() {
        if (this.currentStep === 2) {
            return [
                { id: 'c1', title: Labels.Panel2Card1Title },
                { id: 'c2', title: Labels.Panel2Card2Title },
                { id: 'c3', title: Labels.Panel2Card3Title },
            ];
        }
        return [
            { id: 'c1', title: Labels.Card1Title },
            { id: 'c2', title: Labels.Card2Title },
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

    handleNext() {
        if (this.currentStep < 5) {
            this.currentStep += 1;
        }
    }

    handlePrevious() {
        if (this.currentStep > 1) {
            this.currentStep -= 1;
        }
    }

    handleStepClick(event) {
        const step = parseInt(event.currentTarget.dataset.step, 10);
        if (step && step >= 1 && step <= 5) {
            this.currentStep = step;
        }
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
        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: { path: '/aim-cluster' },
                bubbles: true,
                composed: true,
            })
        );
    }
}
