import { LightningElement, track } from 'lwc';
import DemoModal from 'ui/demoModal';
import * as HomeLabels from 'data/labels/Home';
import { Loading, Edit, Delete } from 'data/labels/Common';

export default class Home extends LightningElement {
    labels = {
        ...HomeLabels,
        Loading,
        Edit,
        Delete,
    };
    @track inputValue = '';
    @track checkboxGroupValues = [];
    @track selectedRadioValue = 'option1';
    @track selectedComboboxValue = 'option1';
    @track sliderValue = 50;
    @track textAreaValue = '';
    @track dateValue = '';
    @track toggleValue = false;


    get datatableColumns() {
        return [
            { label: 'Work Plan Name', fieldName: 'name', type: 'text' },
            { label: 'Quick Start Template', fieldName: 'template', type: 'text' },
            { label: 'Work Plan Status', fieldName: 'status', type: 'text' },
            { label: 'Last Used On', fieldName: 'lastUsed', type: 'text' },
        ];
    }

    get datatableData() {
        return [
            { id: '1', name: 'Non Prof Customers Only', template: 'Publish a Campaign with CRM Data', status: 'In Progress', lastUsed: 'Jan 3, 2026 at 03:24 PM EST' },
            { id: '2', name: 'My Test', template: 'Build a Campaign with External Data', status: '100% Complete', lastUsed: 'Jan 3, 2026 at 03:24 PM EST' },
            { id: '3', name: 'Z_test', template: 'Build a Campaign with External Data', status: 'In Progress - 3 Errors', lastUsed: 'Jan 3, 2026 at 03:24 PM EST' },
        ];
    }

    get comboboxOptions() {
        return [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
            { label: 'Option 3', value: 'option3' },
        ];
    }

    get radioOptions() {
        return [
            { label: 'Radio Option 1', value: 'option1' },
            { label: 'Radio Option 2', value: 'option2' },
            { label: 'Radio Option 3', value: 'option3' },
        ];
    }

    get checkboxOptions() {
        return [
            { label: 'Checkbox Option 1', value: 'checkbox1' },
            { label: 'Checkbox Option 2', value: 'checkbox2' },
            { label: 'Checkbox Option 3', value: 'checkbox3' },
        ];
    }

    handleInputChange(event) {
        this.inputValue = event.detail.value;
    }

    handleCheckboxChange(event) {
        this.checkboxGroupValues = event.detail.value;
    }

    handleRadioChange(event) {
        this.selectedRadioValue = event.detail.value;
    }

    handleComboboxChange(event) {
        this.selectedComboboxValue = event.detail.value;
    }

    handleSliderChange(event) {
        this.sliderValue = event.detail.value;
    }

    handleTextAreaChange(event) {
        this.textAreaValue = event.detail.value;
    }

    handleDateChange(event) {
        this.dateValue = event.detail.value;
    }

    handleToggleChange(event) {
        this.toggleValue = event.detail.checked;
    }

    handleButtonClick() {
        alert('Button clicked! Check the console for form values.');
        console.log('Form Values:', {
            input: this.inputValue,
            checkboxGroup: this.checkboxGroupValues,
            radio: this.selectedRadioValue,
            combobox: this.selectedComboboxValue,
            slider: this.sliderValue,
            textArea: this.textAreaValue,
            date: this.dateValue,
            toggle: this.toggleValue,
        });
    }

    handleSuccessButton() {
        alert('Success button clicked!');
    }

    handleNeutralButton() {
        alert('Neutral button clicked!');
    }

    handleBrandButton() {
        alert('Brand button clicked!');
    }

    handleOpenModal() {
        DemoModal.open({
            size: 'medium',
            label: 'Demo Modal',
        });
    }
}
