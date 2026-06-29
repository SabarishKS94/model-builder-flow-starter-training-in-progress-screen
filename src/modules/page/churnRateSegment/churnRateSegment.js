import { LightningElement } from 'lwc';
import * as ChurnRateSegmentLabels from 'data/labels/ChurnRateSegment';

const BASE_STEPS = [
    {
        id: 'step-1',
        title: 'Step Title',
        description: 'Step description',
        items: ['Sub step 1', 'Sub step 2'],
        status: 'current',
    },
    {
        id: 'step-2',
        title: 'Connect',
        description: 'Determine which data to bring in',
        checklist: ['Review Connection Requirements', 'Salesforce CRM', 'Snowflake'],
        status: 'upcoming',
    },
    {
        id: 'step-3',
        title: 'Step Title',
        description: 'Step description',
        items: ['Sub step 1', 'Sub step 2'],
        status: 'upcoming',
    },
    {
        id: 'step-4',
        title: 'Step Title',
        description: 'Step description',
        items: ['Sub step 1', 'Sub step 2'],
        status: 'upcoming',
    },
];

export default class ChurnRateSegment extends LightningElement {
    labels = ChurnRateSegmentLabels;
    supportingMaterials = [
        { id: 'support-1', title: 'Supporting Material', items: ['Snowflake requirements'] },
        { id: 'support-2', title: 'Supporting Material', items: ['Snowflake requirements'] },
    ];

    get steps() {
        return BASE_STEPS.map((step) => ({
            ...step,
            isComplete: step.status === 'complete',
            isCurrent: step.status === 'current',
            ariaCurrent: step.status === 'current' ? 'step' : null,
            statusClass:
                step.status === 'complete'
                    ? 'slds-progress__item slds-is-completed'
                    : step.status === 'current'
                      ? 'slds-progress__item slds-is-active'
                      : 'slds-progress__item',
        }));
    }

    handleBack() {
        history.back();
    }
}
