import { LightningElement, api, track } from 'lwc';
import AgentChatMessage from 'ui/agentChatMessage';
import { AGENT_FEED_COMPONENT_SHOWCASE } from './agentFeedComponentShowcase';
import { CHAT_HISTORY_SECTIONS, getChatById } from './chatHistoryFixtures';
import { chatCompletion, hasApiKey } from 'data/llmGateway';

const LOREM_IPSUM_PARAGRAPHS = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat.',
    'Integer in magna ac velit tincidunt tristique. Maecenas non massa a metus dignissim dictum eget eget dolor.',
    'Praesent eget nisl a metus tristique ullamcorper. In id massa a quam tristique tincidunt eget a magna.',
    'Vestibulum faucibus sapien vitae dolor sollicitudin, vitae tincidunt mauris condimentum. Suspendisse dapibus justo in libero tristique, non facilisis magna auctor.',
    'Duis eget orci a erat efficitur vehicula. Fusce non libero in massa tincidunt tincidunt in et erat.',
    'Mauris ut libero in erat tincidunt tristique. Aliquam erat volutpat. Donec a semper nisi, vel posuere magna.',
];

const AGENT_VARIANT_POOL = [
    'agent_message_text',
    'agent_message_actions',
    'agent_message_input',
    'agent_rich_text',
    'agent_rich_text_actions',
    'agent_chart',
    'agent_record_single',
    'agent_records_multiple',
];

const HISTORY_CONVERSATION_MESSAGE_COUNT = 7;

export default class Panel extends LightningElement {
    iconDownSrc = 'images/panel-header-down.svg';
    iconNewChatSrc = 'images/panel-header-new-chat.svg';
    iconChatHistorySrc = 'images/panel-header-chat-history.svg';
    iconPinnedSrc = 'images/panel-header-pinned.svg';
    iconCloseSrc = 'images/panel-header-close.svg';
    iconChatHistoryCloseSrc = 'images/chat-history-close.svg';

    internalDatatableActionsMenu = true;

    @api selectedPanel = 'agentforce_panel';
    @api panelUnpinned = false;
    @api panelExpanded = false;

    @track chatHistoryOpen = false;
    @track selectedChatId = 'handling-objections';
    @track selectedChatIsResumable = true;
    @track chatRowMenuOpenChatId = null;

    @track promptComposerValue = '';
    @track agentforceHeaderName = 'Agentforce';
    @track agentFeedMessages = [];
    @track _isLlmLoading = false;

    _conversationFeedByChatId = Object.create(null);
    _llmMessages = [];

    _randomLoremLine() {
        const p = LOREM_IPSUM_PARAGRAPHS;
        return p[Math.floor(Math.random() * p.length)];
    }

    _buildHistoryListConversationFeed(chatId, agentName) {
        const p = String(chatId || 'chat').replace(/\s/g, '-');
        const u1 = this._randomLoremLine();
        const u2 = this._randomLoremLine();
        const u3 = this._randomLoremLine();
        return [
            {
                id: `${p}-0`,
                variant: 'agent_message_text',
                messageText: `Hi I'm ${agentName}. How can I help you?`,
                actions: [],
            },
            { id: `${p}-1`, variant: 'user_message', messageText: u1 },
            this._makeRandomAgentMessageRow(`${p}-2`),
            { id: `${p}-3`, variant: 'user_message', messageText: u2 },
            this._makeRandomAgentMessageRow(`${p}-4`),
            { id: `${p}-5`, variant: 'user_message', messageText: u3 },
            this._makeRandomAgentMessageRow(`${p}-6`),
        ];
    }

    _makeRandomAgentMessageRow(messageId) {
        const t = this._randomLoremLine();
        const t2 = this._randomLoremLine();
        const v = AGENT_VARIANT_POOL[Math.floor(Math.random() * AGENT_VARIANT_POOL.length)];
        switch (v) {
            case 'agent_message_text':
                return { id: messageId, variant: v, messageText: t, actions: [] };
            case 'agent_message_actions':
                return {
                    id: messageId,
                    variant: v,
                    messageText: t,
                    actions: [{ id: 'a1', label: 'Dolor sit', variant: 'neutral' }],
                };
            case 'agent_message_input':
                return {
                    id: messageId,
                    variant: v,
                    messageText: t,
                    fieldLabel: 'Amet consectetur',
                    inputValue: '',
                    actions: [],
                };
            case 'agent_rich_text':
                return { id: messageId, variant: v, messageText: t, richText: t2, actions: [] };
            case 'agent_rich_text_actions':
                return {
                    id: messageId,
                    variant: v,
                    messageText: t,
                    richText: t2,
                    actions: [{ id: 'a2', label: 'Eiusmod tempor', variant: 'neutral' }],
                };
            case 'agent_chart':
                return {
                    id: messageId,
                    variant: v,
                    messageText: 'Let’s take a look at what’s going on',
                    chartTitle: 'Viz Title',
                    chartSubtitle: 'Time Range',
                    chartYAxisLabels: ['##', '##', '##'],
                    chartBars: [
                        { id: `${messageId}-bar-1`, valueLabel: '##', xLabel: 'Label', height: 'lg' },
                        { id: `${messageId}-bar-2`, valueLabel: '##', xLabel: 'Label', height: 'md' },
                        { id: `${messageId}-bar-3`, valueLabel: '##', xLabel: 'Label', height: 'sm' },
                        { id: `${messageId}-bar-4`, valueLabel: '##', xLabel: 'Label', height: 'xl' },
                    ],
                    actions: [
                        { id: 'chart-label-1', label: 'Label', variant: 'neutral' },
                        { id: 'chart-label-2', label: 'Label', variant: 'neutral' },
                    ],
                };
            case 'agent_record_single':
                return {
                    id: messageId,
                    variant: v,
                    messageText: t,
                    recordTitle: 'Consectetur Ipsum',
                    recordIconName: 'standard:account',
                    recordFields: [
                        { label: 'Sed do', value: 'Eiusmod', isLink: true },
                        { label: 'Tempor', value: 'Incididunt' },
                        { label: 'Ut labore', value: '5/1/2026' },
                    ],
                    actions: [{ id: 'view', label: 'View', variant: 'neutral' }],
                };
            case 'agent_records_multiple': {
                const t3 = this._randomLoremLine();
                return {
                    id: messageId,
                    variant: v,
                    messageText: t,
                    recordTitle: 'Elit pellentesque',
                    recordIconName: 'standard:opportunity',
                    records: [
                        {
                            recordFields: [
                                { label: 'Name', value: 'Dolor A', isLink: true },
                                { label: 'Eiusmod', value: t2 },
                            ],
                        },
                        {
                            recordFields: [
                                { label: 'Name', value: 'Dolor B', isLink: true },
                                { label: 'Eiusmod', value: t3 },
                            ],
                        },
                    ],
                    actions: [{ id: 'va', label: 'View All', variant: 'neutral' }],
                };
            }
            default:
                return { id: messageId, variant: 'agent_message_text', messageText: t, actions: [] };
        }
    }

    _buildClosingDealsConversationFeed(chatId, agentName) {
        const p = String(chatId || 'chat').replace(/\s/g, '-');
        return [
            {
                id: `${p}-0`,
                variant: 'agent_message_text',
                messageText: `Hi I'm ${agentName}. How can I help you?`,
                actions: [],
            },
            {
                id: `${p}-1`,
                variant: 'user_message',
                messageText: 'I need a quick read on deal momentum before quarter close.',
            },
            {
                id: `${p}-2`,
                variant: 'agent_chart',
                messageText: 'Let’s take a look at what’s going on',
                chartTitle: 'Viz Title',
                chartSubtitle: 'Time Range',
                chartYAxisLabels: ['##', '##', '##'],
                chartBars: [
                    { id: `${p}-2-bar-1`, valueLabel: '##', xLabel: 'Label', height: 'lg' },
                    { id: `${p}-2-bar-2`, valueLabel: '##', xLabel: 'Label', height: 'md' },
                    { id: `${p}-2-bar-3`, valueLabel: '##', xLabel: 'Label', height: 'sm' },
                    { id: `${p}-2-bar-4`, valueLabel: '##', xLabel: 'Label', height: 'xl' },
                ],
                actions: [
                    { id: 'chart-label-1', label: 'Label', variant: 'neutral' },
                    { id: 'chart-label-2', label: 'Label', variant: 'neutral' },
                ],
            },
            {
                id: `${p}-3`,
                variant: 'user_message',
                messageText: 'Great. Can you also call out where I should focus this week?',
            },
            {
                id: `${p}-4`,
                variant: 'agent_message_actions',
                messageText: 'Absolutely. I can break it down by account tier and expected close date.',
                actions: [{ id: 'focus-accounts', label: 'Show focus accounts', variant: 'neutral' }],
            },
            {
                id: `${p}-5`,
                variant: 'user_message',
                messageText: 'Show me the top accounts at risk.',
            },
            {
                id: `${p}-6`,
                variant: 'agent_records_multiple',
                messageText: 'Here are the highest-risk opportunities for this quarter.',
                recordTitle: 'At-risk opportunities',
                recordIconName: 'standard:opportunity',
                records: [
                    {
                        recordFields: [
                            { label: 'Name', value: 'Edge Communications', isLink: true },
                            { label: 'Stage', value: 'Negotiation' },
                            { label: 'Close Date', value: '6/28/2026' },
                        ],
                    },
                    {
                        recordFields: [
                            { label: 'Name', value: 'GenePoint', isLink: true },
                            { label: 'Stage', value: 'Proposal' },
                            { label: 'Close Date', value: '6/29/2026' },
                        ],
                    },
                ],
                actions: [{ id: 'view-all-risk', label: 'View All', variant: 'neutral' }],
            },
        ];
    }

    _setConversationForChatId(chatId, agentName) {
        const hit = this._conversationFeedByChatId[chatId];
        if (chatId === 'closing-deals') {
            const hasChart = Array.isArray(hit) && hit.some((row) => row?.variant === 'agent_chart');
            if (!hit || hit.length !== HISTORY_CONVERSATION_MESSAGE_COUNT || !hasChart) {
                this._conversationFeedByChatId[chatId] = this._buildClosingDealsConversationFeed(
                    chatId,
                    agentName
                );
            }
            this.agentFeedMessages = this._conversationFeedByChatId[chatId];
            this._scheduleScrollChatFeedToBottom();
            return;
        }
        if (!hit || hit.length !== HISTORY_CONVERSATION_MESSAGE_COUNT) {
            this._conversationFeedByChatId[chatId] = this._buildHistoryListConversationFeed(
                chatId,
                agentName
            );
        }
        this.agentFeedMessages = this._conversationFeedByChatId[chatId];
        this._scheduleScrollChatFeedToBottom();
    }

    _scrollChatFeedToBottom() {
        const el = this.template?.querySelector('.shell-panel__chat-feed');
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }

    _scheduleScrollChatFeedToBottom() {
        if (!this.showAgentforcePanel) {
            return;
        }
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this._scrollChatFeedToBottom();
            });
        });
    }

    _onDocumentKeydown = (e) => {
        if (e.key === 'Escape' && this.chatHistoryOpen) {
            this.handleCloseChatHistory();
        }
    };

    connectedCallback() {
        void AgentChatMessage;
        void AGENT_FEED_COMPONENT_SHOWCASE;
        const initial = getChatById(this.selectedChatId);
        if (this.showAgentforcePanel && initial?.agent) {
            this.agentforceHeaderName = initial.agent;
        }
        this.selectedChatIsResumable = initial?.isResumable !== false;
        this._setConversationForChatId(this.selectedChatId, this.agentforceHeaderName);
        document.addEventListener('keydown', this._onDocumentKeydown);
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this._onDocumentKeydown);
    }

    get showAgentforcePanel() {
        return this.selectedPanel === 'agentforce_panel';
    }

    get rootClass() {
        const base = 'shell-panel__root';
        if (this.showAgentforcePanel && this.panelExpanded) {
            return `${base} ${base}_expanded`;
        }
        return base;
    }

    get expandRailIconName() {
        return this.panelExpanded ? 'utility:chevronright' : 'utility:chevronleft';
    }

    get expandRailLabel() {
        return this.panelExpanded ? 'Shrink panel' : 'Expand panel';
    }

    get showTrailheadPanel() {
        return this.selectedPanel === 'trailhead_panel';
    }

    get showNotificationPanel() {
        return this.selectedPanel === 'notification_panel';
    }

    get showSettingsPanel() {
        return this.selectedPanel === 'settings_panel';
    }

    get pinActionLabel() {
        return this.panelUnpinned ? 'Pin panel' : 'Unpin panel';
    }

    get pinIconClass() {
        const base = 'shell-panel__header-icon-img shell-panel__header-icon-img_pinned';
        return this.panelUnpinned
            ? `${base} shell-panel__header-icon-img_pinned--unpinned-state`
            : base;
    }

    get panelTitle() {
        if (this.showAgentforcePanel) {
            return this.agentforceHeaderName;
        }
        const titles = {
            trailhead_panel: 'Guidance Center',
            notification_panel: 'Notifications',
            settings_panel: 'Setup',
        };
        return titles[this.selectedPanel] || 'Panel Header';
    }

    get panelContent() {
        const content = {
            agentforce_panel: 'Agentforce panel content',
            trailhead_panel: 'Trailhead guidance content',
            notification_panel: 'Notifications panel content',
            settings_panel: 'Settings panel content',
        };
        return content[this.selectedPanel] || 'A panel body accepts any layout or component';
    }

    get agentforceWorkspaceClass() {
        const base = 'shell-panel__agentforce-workspace';
        return this.panelExpanded ? `${base} ${base}_wide` : base;
    }

    get chatHistoryFullPanelClass() {
        const base = 'shell-panel__chat-history-full-panel';
        return this.chatHistoryOpen ? `${base} ${base}_open` : base;
    }

    get chatHistoryAriaHidden() {
        return this.chatHistoryOpen ? 'false' : 'true';
    }

    get promptComposerSendDisabled() {
        return !this.selectedChatIsResumable || this.promptComposerValue.trim().length === 0 || this._isLlmLoading;
    }

    get promptComposerInputDisabled() {
        return !this.selectedChatIsResumable;
    }

    get promptComposerPlaceholder() {
        return this.selectedChatIsResumable
            ? 'Describe your task or ask a question...'
            : 'This conversation cannot be restarted';
    }

    get promptEditorClass() {
        const base = 'shell-panel__prompt-editor';
        return this.selectedChatIsResumable ? base : `${base} ${base}_disabled`;
    }

    get chatHistorySectionsView() {
        return CHAT_HISTORY_SECTIONS.map((section) => ({
            ...section,
            chats: section.chats.map((chat) => {
                const isSelected = chat.id === this.selectedChatId;
                const menuOpen = this.chatRowMenuOpenChatId === chat.id;
                return {
                    ...chat,
                    isSelected,
                    rowClasses: `shell-panel__chat-row${isSelected ? ' shell-panel__chat-row_selected' : ''}${menuOpen ? ' shell-panel__chat-row_menu-open' : ''}`,
                };
            }),
        }));
    }

    handleClosePanel() {
        this.dispatchEvent(
            new CustomEvent('panelclose', { bubbles: true, composed: true })
        );
    }

    handlePanelPinClick() {
        this.dispatchEvent(
            new CustomEvent('panelpintoggle', { bubbles: true, composed: true })
        );
    }

    handleNewChatClick() {
        this._llmMessages = [];
        this.agentFeedMessages = [
            {
                id: `new-chat-greeting`,
                variant: 'agent_message_text',
                messageText: `Hi I'm ${this.agentforceHeaderName}. How can I help you?`,
                actions: [],
            },
        ];
        this._scheduleScrollChatFeedToBottom();
    }

    handleChatHistoryClick() {
        this.chatHistoryOpen = true;
    }

    handleCloseChatHistory() {
        this.chatHistoryOpen = false;
        this.chatRowMenuOpenChatId = null;
    }

    @api
    openChatHistory() {
        this.chatHistoryOpen = true;
    }

    handleChatRowClick(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id) {
            return;
        }
        const row = getChatById(id);
        this.selectedChatId = id;
        this.selectedChatIsResumable = row?.isResumable !== false;
        if (this.showAgentforcePanel) {
            const name = row?.agent ?? 'Agentforce';
            this.agentforceHeaderName = name;
            this._setConversationForChatId(id, name);
        }
        if (!this.panelExpanded) {
            this.handleCloseChatHistory();
        }
    }

    handleChatRowMenuOpen(event) {
        const row = this._findChatRowFromComposedPath(event);
        const id = row?.dataset?.id;
        if (id) {
            this.chatRowMenuOpenChatId = id;
        }
    }

    handleChatRowMenuClose(event) {
        const row = this._findChatRowFromComposedPath(event);
        const id = row?.dataset?.id;
        if (id && this.chatRowMenuOpenChatId === id) {
            this.chatRowMenuOpenChatId = null;
        }
    }

    handleChatRowMenuSelect() {
        /* noop */
    }

    _findChatRowFromComposedPath(event) {
        const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
        return path.find(
            (el) => el && el.classList && el.classList.contains('shell-panel__chat-row')
        );
    }

    handleAgentMenuClick() {
        this.dispatchEvent(new CustomEvent('panelagentmenu', { bubbles: true, composed: true }));
    }

    handlePanelExpandRailClick() {
        this.dispatchEvent(new CustomEvent('panelexpandtoggle', { bubbles: true, composed: true }));
    }

    handlePromptComposerInput(event) {
        this.promptComposerValue = event.target.value;
        this._maybeResizePromptTextarea(event.target);
    }

    _maybeResizePromptTextarea(textarea) {
        if (typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content')) {
            return;
        }
        if (!textarea) {
            return;
        }
        const linePx = 18;
        const maxPx = linePx * 8;
        textarea.style.height = 'auto';
        const next = Math.min(Math.max(textarea.scrollHeight, linePx), maxPx);
        textarea.style.height = `${next}px`;
    }

    handlePromptComposerAttachClick(event) {
        event.stopPropagation();
    }

    handlePromptComposerSendClick(event) {
        event.stopPropagation();
        if (this.promptComposerSendDisabled) {
            return;
        }
        this._submitPrompt();
    }

    handlePromptComposerKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey && !this.promptComposerSendDisabled) {
            event.preventDefault();
            this._submitPrompt();
        }
    }

    handleChangeKey() {
        this.dispatchEvent(
            new CustomEvent('requestapikey', { bubbles: true, composed: true })
        );
    }

    async _submitPrompt() {
        const userText = this.promptComposerValue.trim();
        if (!userText) return;

        if (!hasApiKey()) {
            this.dispatchEvent(
                new CustomEvent('requestapikey', { bubbles: true, composed: true })
            );
            return;
        }

        const userMsgId = `user-${Date.now()}`;
        this.agentFeedMessages = [
            ...this.agentFeedMessages,
            { id: userMsgId, variant: 'user_message', messageText: userText },
        ];
        this.promptComposerValue = '';
        this._isLlmLoading = true;
        this._scheduleScrollChatFeedToBottom();

        this._llmMessages.push({ role: 'user', content: userText });

        try {
            const reply = await chatCompletion([...this._llmMessages]);
            this._llmMessages.push({ role: 'assistant', content: reply });
            const agentMsgId = `agent-${Date.now()}`;
            this.agentFeedMessages = [
                ...this.agentFeedMessages,
                { id: agentMsgId, variant: 'agent_message_text', messageText: reply, actions: [] },
            ];
        } catch (err) {
            const errMsgId = `err-${Date.now()}`;
            this.agentFeedMessages = [
                ...this.agentFeedMessages,
                { id: errMsgId, variant: 'agent_message_error', messageText: 'Something went wrong.', errorText: err.message, actions: [] },
            ];
        } finally {
            this._isLlmLoading = false;
            this._scheduleScrollChatFeedToBottom();
        }
    }

    handleAgentFeedMessageAction(event) {
        void event.detail;
    }

    handleAgentFeedInputChange(event) {
        const { value, rowId, fieldId } = event.detail || {};
        if (!rowId) {
            return;
        }
        if (fieldId && fieldId !== 'messageInput') {
            return;
        }
        this.agentFeedMessages = this.agentFeedMessages.map((row) =>
            row.id === rowId ? { ...row, inputValue: value } : row
        );
        if (this.selectedChatId) {
            this._conversationFeedByChatId[this.selectedChatId] = this.agentFeedMessages;
        }
    }
}
