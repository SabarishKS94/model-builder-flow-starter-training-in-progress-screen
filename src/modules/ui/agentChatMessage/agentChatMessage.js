import { LightningElement, api, track } from 'lwc';
import AgentMessageActions from 'ui/agentMessageActions';

void AgentMessageActions;

/**
 * Agent feed item: avatar + plain text + footer (primary actions + feedback).
 * `agent_message_input` / `agent_input_confirmation` (Figma 46838:74857, 46895:75137): follow-up
 * form fields — use legacy `fieldLabel` + `inputValue` for a single text field, or `inputFields` for
 * multiple typed fields (`text`, `combobox`, `date`, `time`, `datetime`, `lookup`).
 * `agent_record_single` (Figma 46898:75317): message + `lightning-card` record summary (up to 5
 * `recordFields`) + `actions` (e.g. View). No copy control in the feedback cluster.
 * `agent_records_multiple` (Figma 46904:75381): same card chrome + 2–3 records in one body, each with
 * up to 5 fields, rows separated by horizontal rules; `records` is an array of
 * `{ recordFields: [{ label, value, isLink? }, ...] }` (or `fields` on each item). `actions` e.g.
 * "View All". No copy in feedback.
 * `agent_record_select_single` (Figma 46906:75489): `recordSelectOptions` (≤5 `{ label, value }`) as a
 * radio list inside a card, optional `utility:forward_up` affordance per row (non-navigating for now);
 * `actions` e.g. Submit. No copy in feedback.
 * `agent_record_select_mixed` (Figma 46912:75622): like single, but `recordSelectOptions` rows are
 * `{ label, value, objectLabel, iconName }` (≤5) — one-line title + object-type line + 24px standard
 * (or other) `lightning-icon` per row. No copy in feedback.
 * `user_message` (Figma 46970:69026; avatar graphic 46977:69041): plain user-typed line + default `svg.slds-icon`
 * composite (32px, Teal 50 + user) or `userAvatarSrc` when set. No primary actions, no feedback, no copy.
 */
export default class AgentChatMessage extends LightningElement {
    constructor() {
        super();
        this._fieldUid = Math.random().toString(36).slice(2, 11);
    }

    @api messageText = '';

    /**
     * `default` | `agent_message_text` | `agent_message_actions` (plain line + `actions` primary buttons) | `user_message` |
     * `agent_message_input` | `agent_input_confirmation` (alias of message input) | `agent_rich_text` | `agent_rich_text_actions`
     * (rich text + `actions`) | `agent_message_error` | `agent_record_single` | `agent_records_multiple` |
     * `agent_record_select_single` | `agent_record_select_mixed` | `agent_chart`
     */
    @api variant = 'default';

    /**
     * `user_message` only: optional profile image; when set, replaces the Figma 46977:69041 `svg.slds-icon` art.
     */
    @api userAvatarSrc = '';

    /** @deprecated `user_message` no longer uses LBC avatar initials; reserved for future use. */
    @api userInitials = '';

    /** @deprecated `user_message` default art is the Figma SVG, not a fallback `icon-name`. */
    @api userAvatarFallbackIcon = 'standard:account';

    /** `user_message` only: `alt` for `userAvatarSrc` (decorative Figma path uses `aria-hidden` on the inline SVG). */
    @api userAvatarAltText = 'User';

    @api rowId = '';

    /** @deprecated when `inputFields` is set — single text field label */
    @api fieldLabel = '';

    /** @deprecated when `inputFields` is set — single text field value */
    @api inputValue = '';

    /**
     * Configurable follow-up fields (agent_message_input / agent_input_confirmation).
     * When non-empty, replaces the legacy single `fieldLabel` / `inputValue` text field.
     * Each item: `id` (string), `type` (`'text'|'combobox'|'date'|'time'|'datetime'|'lookup'`), `label` (string),
     * for `text`/`lookup`: `value`, `placeholder` (optional; `lookup` defaults to "Search…");
     * for `combobox`: `value`, `options` ({label,value}[]), `placeholder` (optional);
     * for `date` / `time`: `value` (string);
     * for `datetime`: `dateValue`, `timeValue`, `dateLabel`, `timeLabel`.
     */
    @api inputFields = [];

    @api richText = '';

    @api errorText = '';

    @api actions = [];

    /** `agent_chart` only: chart card heading. */
    @api chartTitle = 'Viz Title';

    /** `agent_chart` only: chart card subtitle / range text. */
    @api chartSubtitle = 'Time Range';

    /** `agent_chart` only: left-axis labels (typically 3 entries). */
    @api chartYAxisLabels = [];

    /** `agent_chart` only: bar descriptors ({ id, valueLabel, xLabel, height }). */
    @api chartBars = [];

    /**
     * Record card title (agent_record_single), shown in the card header with `recordIconName`.
     */
    @api recordTitle = '';

    /**
     * Standard (or other) icon in the record card header — e.g. `standard:account` for an Account.
     */
    @api recordIconName = 'standard:account';

    /**
     * Up to five { label, value, isLink?: boolean } rows for the record body (label / value list).
     */
    @api recordFields = [];

    /**
     * `agent_records_multiple` only: 2–3 items, each with `recordFields` or `fields` (same shape as
     * `recordFields` for a single record).
     */
    @api records = [];

    /**
     * `agent_record_select_single` / `agent_record_select_mixed`: up to 5 radio options.
     * - Single: `{ label, value }`.
     * - Mixed: `{ label, value, objectLabel, iconName? }` (`objectLabel` = e.g. "Opportunity";
     *   `iconName` = e.g. `standard:opportunity`, defaults to `recordIconName` if omitted).
     */
    @api recordSelectOptions = [];

    /** Selected option `value` (optional; defaults to the first option when empty). */
    @api selectValue = '';

    @track _recordSelectTouched = false;

    @track _recordSelectLocalValue = '';

    get isAgentMessageInputVariant() {
        return this.variant === 'agent_message_input' || this.variant === 'agent_input_confirmation';
    }

    get isAgentRecordSingleVariant() {
        return this.variant === 'agent_record_single';
    }

    get isAgentRecordsMultipleVariant() {
        return this.variant === 'agent_records_multiple';
    }

    get isAgentRecordSelectSingleVariant() {
        return this.variant === 'agent_record_select_single';
    }

    get isAgentRecordSelectMixedVariant() {
        return this.variant === 'agent_record_select_mixed';
    }

    /** `agent_record_select_single` or `agent_record_select_mixed` (shared radio + options API). */
    get isAgentRecordSelectListVariant() {
        return this.isAgentRecordSelectSingleVariant || this.isAgentRecordSelectMixedVariant;
    }

    get isAgentRichTextVariant() {
        return this.variant === 'agent_rich_text' || this.variant === 'agent_rich_text_actions';
    }

    get isAgentMessageErrorVariant() {
        return this.variant === 'agent_message_error';
    }

    get isAgentChartVariant() {
        return this.variant === 'agent_chart';
    }

    get isUserMessageVariant() {
        return this.variant === 'user_message';
    }

    get isUserAvatarCustomPhoto() {
        const s = this.userAvatarSrc;
        return s != null && String(s).trim() !== '';
    }

    get rootClass() {
        return this.isUserMessageVariant
            ? 'ui-agent-chat-message ui-agent-chat-message--user'
            : 'ui-agent-chat-message';
    }

    get showCopyInFeedback() {
        return (
            !this.isUserMessageVariant &&
            !this.isAgentMessageInputVariant &&
            !this.isAgentRecordSingleVariant &&
            !this.isAgentRecordsMultipleVariant &&
            !this.isAgentRecordSelectListVariant &&
            !this.isAgentChartVariant
        );
    }

    get copyButtonAssistiveText() {
        if (this.isAgentRichTextVariant) {
            return 'Copy rich text';
        }
        return 'Copy message';
    }

    get resolvedActions() {
        if (this.isUserMessageVariant) {
            return [];
        }
        if (this.isAgentMessageInputVariant) {
            return [{ id: 'save', label: 'Save', variant: 'neutral' }];
        }
        return this.actions;
    }

    get selectGroupName() {
        return `agent-record-sel-${this.rowId || this._fieldUid}`;
    }

    /**
     * Effective value: after user interaction, local value; else `selectValue` from parent; else first
     * option (Figma: first selected).
     */
    get effectiveRecordSelectValue() {
        if (this._recordSelectTouched) {
            return this._recordSelectLocalValue != null ? String(this._recordSelectLocalValue) : '';
        }
        if (this.selectValue != null && this.selectValue !== '') {
            return String(this.selectValue);
        }
        const rows = this._recordSelectOptionsNormalized;
        if (rows.length) {
            return String(rows[0].value);
        }
        return '';
    }

    get recordSelectOptionsView() {
        if (!this.isAgentRecordSelectListVariant) {
            return [];
        }
        const sel = this.effectiveRecordSelectValue;
        return this._recordSelectOptionsNormalized.map((o) => ({
            key: o.key,
            label: o.label,
            value: o.value,
            inputId: o.inputId,
            checked: String(o.value) === String(sel),
            rowIconName: o.rowIconName,
            objectLabel: o.objectLabel,
            hasObjectLabel: Boolean(o.objectLabel),
        }));
    }

    get recordSelectLabelClass() {
        const b = 'slds-radio__label ui-agent-chat-message__record-select-radio-label';
        return this.isAgentRecordSelectMixedVariant
            ? `${b} ui-agent-chat-message__record-select-radio-label--mixed`
            : b;
    }

    get _recordSelectOptionsNormalized() {
        const raw = Array.isArray(this.recordSelectOptions) ? this.recordSelectOptions : [];
        return raw.slice(0, 5).map((row, index) => {
            const value =
                row && row.value != null && String(row.value) !== '' ? String(row.value) : `row-${index}`;
            const label = row && row.label != null ? String(row.label) : '';
            const id = `agent-sel-${this.rowId || this._fieldUid}-${index}`;
            const objectLabel =
                row && row.objectLabel != null && String(row.objectLabel) !== ''
                    ? String(row.objectLabel)
                    : '';
            const iconFromRow = row && row.iconName != null && String(row.iconName) !== '' ? String(row.iconName) : '';
            const rowIconName =
                iconFromRow || (row && row.objectIconName && String(row.objectIconName) !== '' ? String(row.objectIconName) : '') || this.recordIconName || 'standard:account';
            return { key: id, value, label, objectLabel, rowIconName, inputId: id };
        });
    }

    get recordFieldsView() {
        if (!this.isAgentRecordSingleVariant) {
            return [];
        }
        return this._mapRecordFieldRows(this.recordFields, 's');
    }

    get recordsListView() {
        if (!this.isAgentRecordsMultipleVariant) {
            return [];
        }
        const list = Array.isArray(this.records) ? this.records : [];
        const normalized = list
            .map((rec) => {
                if (!rec || typeof rec !== 'object') {
                    return null;
                }
                const src = Array.isArray(rec.fields) ? rec.fields : rec.recordFields;
                if (!Array.isArray(src) || src.length === 0) {
                    return null;
                }
                return rec;
            })
            .filter(Boolean);
        const sliced = normalized.slice(0, 3);
        return sliced.map((rec, recIndex) => {
            const src = Array.isArray(rec.fields) ? rec.fields : rec.recordFields;
            return {
                key: `rec-multi-${this.rowId || this._fieldUid}-${recIndex}`,
                fields: this._mapRecordFieldRows(src, `m${recIndex}`),
                showDivider: recIndex < sliced.length - 1,
            };
        });
    }

    /**
     * @param {unknown} sourceArray
     * @param {string} keyTag segment for unique field keys
     * @returns {Array<{ key: string, label: string, value: string, valueClass: string }>}
     */
    _mapRecordFieldRows(sourceArray, keyTag) {
        const raw = Array.isArray(sourceArray) ? sourceArray : [];
        return raw.slice(0, 5).map((row, index) => {
            const isLink = row && row.isLink === true;
            return {
                key: `rec-${this.rowId || this._fieldUid}-${keyTag}-f-${index}`,
                label: row && row.label != null ? row.label : '',
                value: row && row.value != null ? row.value : '',
                valueClass: isLink
                    ? 'ui-agent-chat-message__record-field-value ui-agent-chat-message__record-field-value--link slds-truncate'
                    : 'ui-agent-chat-message__record-field-value slds-truncate',
            };
        });
    }

    get fieldLabelDomId() {
        return `agent-chat-msg-field-${this.rowId || this._fieldUid}`;
    }

    get hasConfigurableInputFields() {
        return Array.isArray(this.inputFields) && this.inputFields.length > 0;
    }

    get inputFieldsView() {
        if (!this.isAgentMessageInputVariant) {
            return [];
        }
        if (this.hasConfigurableInputFields) {
            return this.inputFields.map((f, index) => this._normalizeFieldDescriptor(f, index));
        }
        return [
            this._normalizeFieldDescriptor(
                {
                    id: 'messageInput',
                    type: 'text',
                    label: this.fieldLabel,
                    value: this.inputValue,
                },
                0,
                { legacyLabelId: this.fieldLabelDomId }
            ),
        ];
    }

    _normalizeFieldDescriptor(f, index, { legacyLabelId } = {}) {
        const id = f.id != null && String(f.id) !== '' ? String(f.id) : `field-${index}`;
        const type = f.type || 'text';
        const base = {
            rowKey: `agent-input-${this.rowId || 'row'}-${id}`,
            fieldId: id,
            type,
        };
        const labelId = legacyLabelId || `agent-field-lbl-${this.rowId || this._fieldUid}-${id}`;

        if (type === 'datetime') {
            return {
                ...base,
                isText: false,
                isCombobox: false,
                isDate: false,
                isTime: false,
                isDateTime: true,
                isLookup: false,
                dateLabel: f.dateLabel || f.label || 'Date',
                timeLabel: f.timeLabel || 'Time',
                dateLabelId: `${labelId}-d`,
                timeLabelId: `${labelId}-t`,
                dateValue: f.dateValue != null ? f.dateValue : '',
                timeValue: f.timeValue != null ? f.timeValue : '',
            };
        }

        const isCombobox = type === 'combobox' || type === 'picklist';
        const isDate = type === 'date';
        const isTime = type === 'time';
        const isLookup = type === 'lookup' || type === 'search';
        const isText =
            type === 'text' || (!isCombobox && !isDate && !isTime && !isLookup);
        return {
            ...base,
            label: f.label != null ? f.label : '',
            value: f.value != null ? f.value : '',
            labelId,
            placeholder:
                isLookup
                    ? f.placeholder != null && f.placeholder !== ''
                        ? f.placeholder
                        : 'Search…'
                    : f.placeholder,
            options: Array.isArray(f.options) ? f.options : [],
            isText,
            isCombobox,
            isDate,
            isTime,
            isDateTime: false,
            isLookup,
        };
    }

    handleRecordSelectChange(event) {
        if (!this.isAgentRecordSelectListVariant) {
            return;
        }
        const t = event.target;
        if (!t || t.name !== this.selectGroupName) {
            return;
        }
        this._recordSelectTouched = true;
        this._recordSelectLocalValue = t.value;
        this.dispatchEvent(
            new CustomEvent('agentrecordselectchange', {
                bubbles: true,
                composed: true,
                detail: { value: t.value, rowId: this.rowId },
            })
        );
    }

    /**
     * Placeholder for future navigation to a record; icon is not a link yet.
     */
    handleRecordSelectLinkClick(event) {
        event.stopPropagation();
    }

    handleFeedbackClick(event) {
        event.stopPropagation();
        const action = event.currentTarget?.dataset?.action;
        if (action !== 'copy' || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
            return;
        }
        if (this.isAgentRichTextVariant) {
            const text = this.richText ?? '';
            if (!text) {
                return;
            }
            navigator.clipboard.writeText(text).then(
                () => {
                    this.dispatchEvent(
                        new CustomEvent('agentmessagerichtextcopy', {
                            bubbles: true,
                            composed: true,
                            detail: { rowId: this.rowId },
                        })
                    );
                },
                () => {
                    /* ignore */
                }
            );
            return;
        }
        if (this.isAgentMessageErrorVariant) {
            const intro = (this.messageText || '').trim();
            const err = (this.errorText || '').trim();
            const text = [intro, err].filter(Boolean).join('\n\n');
            if (!text) {
                return;
            }
            navigator.clipboard.writeText(text).then(
                () => {
                    this.dispatchEvent(
                        new CustomEvent('agentmessageerrorcopy', {
                            bubbles: true,
                            composed: true,
                            detail: { rowId: this.rowId },
                        })
                    );
                },
                () => {
                    /* ignore */
                }
            );
        }
    }

    handleAgentMessageAction(event) {
        this.dispatchEvent(
            new CustomEvent('agentmessageaction', {
                bubbles: true,
                composed: true,
                detail: event.detail,
            })
        );
    }

    /**
     * Single handler for all follow-up LBCs. `event.detail` includes `value` where applicable;
     * `data-part` is set for `datetime` (`date` | `time`). Dispatches `agentmessageinputchange`
     * with `fieldId` (and `part` for datetime rows). Legacy single field uses `fieldId: 'messageInput'`.
     */
    handleInputFieldChange(event) {
        const t = event.currentTarget;
        const fieldId = t?.dataset?.fieldId;
        const part = t?.dataset?.part;
        const value = event.detail?.value;
        this.dispatchEvent(
            new CustomEvent('agentmessageinputchange', {
                bubbles: true,
                composed: true,
                detail: {
                    value,
                    fieldId: fieldId || 'messageInput',
                    part: part || undefined,
                    rowId: this.rowId,
                },
            })
        );
    }
}
