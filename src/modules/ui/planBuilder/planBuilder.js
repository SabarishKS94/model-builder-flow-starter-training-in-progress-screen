import { LightningElement, track } from 'lwc';
import * as PlanBuilderLabels from 'data/labels/PlanBuilder';

const STEPS = [
    { id: 0, label: 'Add Your Data', dotColor: 'blue', title: 'Add Your Data', subtitle: 'Add data sources for your plan.' },
    { id: 1, label: 'Map and Model Data', dotColor: 'pink', title: 'Map and Model Data', subtitle: 'Define how your data maps to the model.' },
    { id: 2, label: 'Create Unified Profile Rules', dotColor: 'orange', title: 'Create Unified Profile Rules', subtitle: 'Set identity resolution and matching rules.' },
    { id: 3, label: 'Calculate Values', dotColor: 'blue', title: 'Calculate Values', subtitle: 'Define calculated insights and metrics.' },
    { id: 4, label: 'Segment and Activate', dotColor: 'orange', title: 'Segment and Activate', subtitle: 'Build segments and activate them.' }
];

export default class PlanBuilder extends LightningElement {
    labels = PlanBuilderLabels;
    @track activeStepId = 0;
    @track sidebarCollapsed = false;
    @track completedSteps = [];

    get steps() {
        return STEPS.map((step) => {
            const isActive = step.id === this.activeStepId;
            const isCompleted = this.completedSteps.includes(step.id);
            const isLocked = step.id > this.activeStepId && !isCompleted;
            return {
                ...step,
                isActive,
                isCompleted,
                isLocked,
                cssClass: this.computeStepClass(isActive, isLocked),
                dotClass: `pb-dot pb-dot-${step.dotColor}`,
                stepStyle: isLocked ? `opacity: ${Math.max(0.18, 0.55 - (step.id - this.activeStepId - 1) * 0.13)}` : ''
            };
        });
    }

    get activeStep() {
        return STEPS.find((s) => s.id === this.activeStepId) || STEPS[0];
    }

    get stepCountLabel() {
        return `${this.completedSteps.length} of ${STEPS.length} steps`;
    }

    get sidebarClass() {
        return `plan-builder-sidebar${this.sidebarCollapsed ? ' collapsed' : ''}`;
    }

    get dividerClass() {
        return `pb-divider${this.sidebarCollapsed ? ' collapsed' : ''}`;
    }

    computeStepClass(isActive, isLocked) {
        let cls = 'pb-step';
        if (isActive) cls += ' active';
        if (isLocked) cls += ' disabled locked';
        return cls;
    }

    handleStepClick(event) {
        const stepEl = event.currentTarget;
        const stepId = Number(stepEl.dataset.step);
        if (stepId > this.activeStepId && !this.completedSteps.includes(stepId)) return;
        this.activeStepId = stepId;
    }

    handleDividerClick() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    handleSkip() {
        this.advanceStep();
    }

    handleSearch() {
        this.advanceStep();
    }

    advanceStep() {
        if (!this.completedSteps.includes(this.activeStepId)) {
            this.completedSteps = [...this.completedSteps, this.activeStepId];
        }
        if (this.activeStepId < STEPS.length - 1) {
            this.activeStepId = this.activeStepId + 1;
        }
    }
}
