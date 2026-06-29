/**
 * NBA States Service — provides the full set of NBA card states for prototype previewing.
 *
 * Each state represents a distinct lifecycle moment the NBA card can display.
 * Page components import from here to drive the state switcher.
 */

/**
 * @typedef {Object} NbaState
 * @property {string} id - Unique state identifier
 * @property {string} label - Human-readable label for the combobox
 * @property {number} stage - Current lifecycle stage (1-5)
 * @property {Object} dates - Stage completion date strings
 * @property {string} title - NBA card title text
 * @property {string} description - NBA card description text
 * @property {string} ctaLabel - CTA button label (empty string if no CTA)
 * @property {string} refreshed - Refreshed timestamp text
 */

const NBA_STATES = [
    {
        id: 'feature-not-enabled',
        label: '0. Feature Not Enabled',
        stage: 0,
        dates: {},
        title: 'Unlock AI-powered guidance for this model',
        description: 'Get recommendations on what to do next at every stage — from training to monitoring. Enable in Settings to activate.',
        ctaLabel: 'Go to Settings',
        refreshed: '',
        isActive: false,
        statusLabel: 'Inactive'
    },
    {
        id: 'feature-just-enabled',
        label: '0b. Feature Just Enabled',
        stage: 1,
        dates: { training: '10 hours left' },
        title: 'AI recommendations are now active for this model',
        description: 'You\'ll receive guidance at every lifecycle stage. Your first recommendation will appear once training completes.',
        ctaLabel: '',
        refreshed: 'Enabled just now',
        isActive: false,
        statusLabel: 'Training'
    },
    {
        id: 'training-in-progress',
        label: '1. Training In Progress',
        stage: 1,
        dates: { training: '10 hours left' },
        title: 'Training in progress — no action needed right now.',
        description: 'Once complete, you\'ll be guided to activate the model and set up inference. No action needed right now.',
        ctaLabel: '',
        refreshed: 'Refreshed 6 days ago',
        isActive: false,
        statusLabel: 'Training'
    },
    {
        id: 'activation-good',
        label: '2a. Activation — Good Performance',
        stage: 2,
        dates: { training: '14 days ago' },
        title: 'Training complete. Activate your best version to start predictions',
        description: 'v3 achieved 0.92 AUC - best across all versions. Ready for production.',
        ctaLabel: 'Activate Now',
        refreshed: 'Refreshed 6 days ago',
        isActive: false,
        statusLabel: 'Inactive'
    },
    {
        id: 'activation-average',
        label: '2b. Activation — Average Performance',
        stage: 2,
        dates: { training: '14 days ago' },
        title: 'Training complete. Activate to start predictions. Retrain later to improve.',
        description: 'Version 2 achieved 0.72 AUC - useful for prioritization but won\'t catch every case. Safe to activate now.',
        ctaLabel: 'Activate Now',
        refreshed: 'Refreshed 6 days ago',
        isActive: false,
        statusLabel: 'Inactive'
    },
    {
        id: 'activation-poor',
        label: '2c. Activation — Poor Performance',
        stage: 2,
        dates: { training: '20 days ago' },
        title: 'Model idle for 14 days since latest version trained. Activate now. Retrain later for better accuracy.',
        description: 'Version 1 achieved 0.38 AUC — below random (0.50). Predictions are unreliable at this level. Safe to test on a small segment.',
        ctaLabel: 'Activate Now',
        refreshed: 'Refreshed 6 days ago',
        isActive: false,
        statusLabel: 'Inactive'
    },
    {
        id: 'activation-very-high',
        label: '2d. Activation — Very High (Suspicious)',
        stage: 2,
        dates: { training: '14 days ago' },
        title: 'Training complete but data quality concern flagged. Review before activating.',
        description: '0.997 AUC is suspiciously perfect — likely data leakage. A feature may directly encode the outcome.',
        ctaLabel: 'Review Metrics',
        refreshed: 'Refreshed 6 days ago',
        isActive: false,
        statusLabel: 'Inactive'
    },
    {
        id: 'post-activation',
        label: '3. Post Activation',
        stage: 3,
        dates: { training: '14 days ago', activation: 'Just now' },
        title: 'Model activated. Set up inference to start generating predictions.',
        description: 'Version 3 is now active. Next: configure a data pipeline to run predictions on new data.',
        ctaLabel: 'Set Up Inference',
        refreshed: 'Refreshed just now',
        isActive: true,
        statusLabel: 'Active'
    },
    {
        id: 'inference-setup',
        label: '4. Inference Setup',
        stage: 3,
        dates: { training: '14 days ago', activation: '1 day ago' },
        title: 'Model is active but no inference pipeline configured yet.',
        description: 'Set up a batch or real-time pipeline so the model can score new records automatically.',
        ctaLabel: 'Configure Pipeline',
        refreshed: 'Refreshed 6 days ago',
        isActive: true,
        statusLabel: 'Active'
    },
    {
        id: 'inference-execution',
        label: '5. Inference Execution',
        stage: 4,
        dates: { training: '14 days ago', activation: '7 days ago', inferenceSetup: '3 days ago' },
        title: 'Pipeline configured. Start your first inference run.',
        description: 'Your batch pipeline is ready. Run it to generate predictions on the latest data.',
        ctaLabel: 'Run Now',
        refreshed: 'Refreshed 6 days ago',
        isActive: true,
        statusLabel: 'Active'
    },
    {
        id: 'monitoring-error-1',
        label: '6a. Monitoring — Inference Error',
        stage: 5,
        dates: { training: '30 days ago', activation: '21 days ago', inferenceSetup: '14 days ago', inferenceExecution: '1 day ago' },
        title: 'Last inference run failed. Check the error log and retry.',
        description: 'Pipeline encountered a timeout on the scoring step. This usually means the input data volume exceeded the configured limit.',
        ctaLabel: 'View Error Log',
        refreshed: 'Refreshed 1 hour ago',
        isActive: true,
        statusLabel: 'Active'
    },
    {
        id: 'monitoring-error-2',
        label: '6b. Monitoring — Data Quality Issue',
        stage: 5,
        dates: { training: '30 days ago', activation: '21 days ago', inferenceSetup: '14 days ago', inferenceExecution: '2 days ago' },
        title: 'Inference completed with warnings. Some records could not be scored.',
        description: '342 records had missing required fields and were skipped. Review your data source for completeness.',
        ctaLabel: 'View Details',
        refreshed: 'Refreshed 2 hours ago',
        isActive: true,
        statusLabel: 'Active'
    },
    {
        id: 'monitoring-running',
        label: '7a. Monitoring — Running Well',
        stage: 5,
        dates: { training: '45 days ago', activation: '30 days ago', inferenceSetup: '21 days ago', inferenceExecution: '1 day ago', monitoring: 'Active' },
        title: 'Everything is running smoothly. No action needed.',
        description: 'Last 5 inference runs completed successfully. Model performance is stable at 0.91 AUC.',
        ctaLabel: '',
        refreshed: 'Refreshed 3 hours ago',
        isActive: true,
        statusLabel: 'Active'
    },
    {
        id: 'monitoring-drift',
        label: '7b. Monitoring — Drift Detected',
        stage: 5,
        dates: { training: '90 days ago', activation: '75 days ago', inferenceSetup: '60 days ago', inferenceExecution: '1 day ago', monitoring: 'Drift' },
        title: 'Model drift detected. Performance has degraded — consider retraining.',
        description: 'AUC dropped from 0.91 to 0.74 over the last 30 days. Input data distribution has shifted significantly.',
        ctaLabel: 'Retrain Model',
        refreshed: 'Refreshed 1 hour ago',
        isActive: true,
        statusLabel: 'Active'
    },
    {
        id: 'monitoring-newer-version',
        label: '7c. Monitoring — Newer Version Available',
        stage: 5,
        dates: { training: '90 days ago', activation: '75 days ago', inferenceSetup: '60 days ago', inferenceExecution: '1 day ago', monitoring: 'Active' },
        title: 'A newer trained version is available. Activate it for better predictions.',
        description: 'Version 4 achieved 0.94 AUC vs your current 0.88. Activate the new version to improve accuracy.',
        ctaLabel: 'Activate v4',
        refreshed: 'Refreshed 2 hours ago',
        isActive: true,
        statusLabel: 'Active'
    },
    {
        id: 'post-lifecycle-done',
        label: '8. Post-Lifecycle — All Complete',
        stage: 6,
        dates: { training: '60 days ago', activation: '45 days ago', inferenceSetup: '30 days ago', inferenceExecution: '1 day ago', monitoring: 'Active' },
        title: 'Model fully operational. All lifecycle stages complete.',
        description: 'Your model is trained, activated, running inference, and being monitored. Performance stable at 0.91 AUC.',
        ctaLabel: '',
        refreshed: 'Refreshed 1 hour ago',
        isActive: true,
        statusLabel: 'Active'
    }
];

/** @returns {NbaState[]} All available NBA card states */
export function getAllNbaStates() {
    return NBA_STATES;
}

/** @returns {NbaState|undefined} A single state by ID */
export function getNbaStateById(id) {
    return NBA_STATES.find((state) => state.id === id);
}

/** @returns {{ label: string, value: string }[]} Options formatted for lightning-combobox */
export function getNbaStateOptions() {
    return NBA_STATES.map((state) => ({
        label: state.label,
        value: state.id
    }));
}
