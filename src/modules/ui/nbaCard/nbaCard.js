import { LightningElement, api } from 'lwc';
import {
    CardTitle,
    StageTraining,
    StageActivation,
    StageInferenceSetup,
    StageInferenceExecution,
    StageMonitoring
} from 'data/labels/NbaCard';

const STAGES = [StageTraining, StageActivation, StageInferenceSetup, StageInferenceExecution, StageMonitoring];

export default class NbaCard extends LightningElement {
    @api currentStage = 1;
    @api stageCompletionDates = {};
    @api nbaTitle = '';
    @api nbaDescription = '';
    @api ctaLabel = '';
    @api refreshedText = '';
    @api isOnboarding = false;

    labels = { CardTitle };

    get showNormalState() {
        return !this.isOnboarding;
    }

    get showProgressBar() {
        return !this.isOnboarding && this.currentStage > 0 && this.currentStage <= 5;
    }

    get showCta() {
        return !!this.ctaLabel;
    }

    get steps() {
        const keys = ['training', 'activation', 'inferenceSetup', 'inferenceExecution', 'monitoring'];
        return STAGES.map((label, index) => {
            const stageNum = index + 1;
            const isCompleted = stageNum < this.currentStage;
            const isCurrent = stageNum === this.currentStage;
            const sublabel = this.stageCompletionDates?.[keys[index]] || '';

            return {
                key: `step-${stageNum}`,
                label,
                sublabel: isCompleted || isCurrent ? sublabel : '',
                showSublabel: !!(isCompleted || isCurrent) && !!sublabel,
                dotClass: `mlc-dot ${isCompleted ? 'mlc-dot_complete' : isCurrent ? 'mlc-dot_current' : 'mlc-dot_upcoming'}`,
                showCheck: isCompleted,
                showBar: index < STAGES.length - 1,
                barClass: `mlc-bar ${stageNum < this.currentStage ? 'mlc-bar_complete' : 'mlc-bar_upcoming'}`
            };
        });
    }

    handleCtaClick() {
        this.dispatchEvent(new CustomEvent('ctaclick', { bubbles: true, composed: true }));
    }

    handleDisableClick() {
        this.dispatchEvent(new CustomEvent('disableclick', { bubbles: true, composed: true }));
    }
}
