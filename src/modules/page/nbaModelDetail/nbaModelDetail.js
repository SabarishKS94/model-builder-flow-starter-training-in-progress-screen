import { LightningElement, track } from 'lwc';
import {
    PageBreadcrumb, PageTitle, MetaAuthor, MetaDate,
    StatusInactive, StatusTraining, LabelGoal, LabelCapability, LabelStatus,
    GoalValue, CapabilityValue, EditButton,
    TabOverview, TabTrainingMetrics, TabIntegrations, TabVersions, TabSettings, OrgToggleLabel, PreviewToggleLabel,
    VersionTitle, ActivateButton, EditAltText, CollapseAltText,
    LabelDescription, LabelLastModified, LabelLastModifiedBy, LabelCreatedOn, LabelCreatedBy,
    VersionDetailsTitle, LabelDataSpace, LabelDataModelObjects, LabelRecordsFields, LabelFiltering,
    DescriptionValue, DateValue, AuthorLink,
    DataSpaceValue, DataModelObjectsValue, RecordsFieldsValue, FilteringValue
} from 'data/labels/NbaModelDetail';
import { ComboboxLabel, ComboboxPlaceholder } from 'data/labels/NbaStates';
import { getNbaStateOptions, getNbaStateById } from 'data/services/nbaStatesService';

export default class NbaModelDetail extends LightningElement {
    labels = {
        PageBreadcrumb, PageTitle, MetaAuthor, MetaDate,
        StatusInactive, StatusTraining, LabelGoal, LabelCapability, LabelStatus,
        GoalValue, CapabilityValue, EditButton,
        TabOverview, TabTrainingMetrics, TabIntegrations, TabVersions,
        VersionTitle, ActivateButton, EditAltText, CollapseAltText,
        LabelDescription, LabelLastModified, LabelLastModifiedBy, LabelCreatedOn, LabelCreatedBy,
        VersionDetailsTitle, LabelDataSpace, LabelDataModelObjects, LabelRecordsFields, LabelFiltering,
        DescriptionValue, DateValue, AuthorLink,
        DataSpaceValue, DataModelObjectsValue, RecordsFieldsValue, FilteringValue,
        TabSettings, OrgToggleLabel, PreviewToggleLabel, ComboboxLabel, ComboboxPlaceholder
    };

    @track selectedStateId = 'training-in-progress';
    @track orgLevelEnabled = false;
    @track showPreview = true;
    @track autoEnabled = false;
    @track termsAccepted = false;
    @track showTermsModal = false;
    @track termsAgreed = false;
    @track showDisableModal = false;
    @track nbaDisabled = false;
    @track toastMessage = '';
    @track showToast = false;

    _toastTimer = null;

    get stateOptions() {
        return getNbaStateOptions();
    }

    get selectedState() {
        return getNbaStateById(this.selectedStateId);
    }

    get nbaCurrentStage() {
        return this.selectedState?.stage ?? 1;
    }

    get nbaStageCompletionDates() {
        return this.selectedState?.dates ?? {};
    }

    get nbaTitleText() {
        return this.selectedState?.title ?? '';
    }

    get nbaDescriptionText() {
        return this.selectedState?.description ?? '';
    }

    get nbaCtaLabel() {
        return this.selectedState?.ctaLabel ?? '';
    }

    get nbaRefreshedText() {
        return this.selectedState?.refreshed ?? '';
    }

    get showOnboarding() {
        return this.autoEnabled && !this.termsAccepted;
    }

    get showNbaCard() {
        return !this.nbaDisabled;
    }

    get isModelActive() {
        return this.selectedState?.isActive ?? false;
    }

    get headerStatusLabel() {
        return this.selectedState?.statusLabel ?? 'Inactive';
    }

    get headerActionLabel() {
        return this.isModelActive ? 'Deactivate' : 'Activate';
    }

    get headerActionVariant() {
        return this.isModelActive ? 'destructive' : 'brand';
    }

    get versionButtonLabel() {
        return this.isModelActive ? 'Deactivate' : 'Activate';
    }

    get versionButtonVariant() {
        return this.isModelActive ? 'destructive-text' : 'brand';
    }

    handleStateChange(event) {
        this.selectedStateId = event.detail.value;
    }

    handleNbaCtaClick() {
        if (this.showOnboarding) {
            this.showTermsModal = true;
            return;
        }
        if (this.selectedStateId === 'feature-not-enabled') {
            this.template.querySelector('lightning-tabset').activeTabValue = 'settings';
        }
    }

    handleEnableOrg() {
        this.orgLevelEnabled = true;
    }

    handleOrgToggle(event) {
        this.orgLevelEnabled = event.target.checked;
    }

    handlePreviewToggle(event) {
        this.showPreview = event.target.checked;
    }

    handleAutoEnabledToggle(event) {
        this.autoEnabled = event.target.checked;
        if (this.autoEnabled) {
            this.orgLevelEnabled = true;
            this.termsAccepted = false;
            this.nbaDisabled = false;
        }
    }

    handleNbaOnboardingContinue() {
        this.showTermsModal = true;
    }

    handleNbaDisable() {
        this.showDisableModal = true;
    }

    handleDisableModalClose() {
        this.showDisableModal = false;
    }

    handleDisableConfirmed() {
        this.showDisableModal = false;
        this.nbaDisabled = true;
    }

    handleTermsModalClose() {
        this.showTermsModal = false;
        this.termsAgreed = false;
    }

    handleTermsCheckbox(event) {
        this.termsAgreed = event.target.checked;
    }

    get isTermsDisabled() {
        return !this.termsAgreed;
    }

    handleTermsAccepted() {
        this.showTermsModal = false;
        this.termsAccepted = true;
        this.termsAgreed = false;
        this.selectedStateId = 'feature-just-enabled';
    }

    handleFeatureEnabled(event) {
        const { message } = event.detail;
        this.toastMessage = message;
        this.showToast = true;
    }

    handleToastDismiss() {
        this.showToast = false;
        this.toastMessage = '';
    }
}
