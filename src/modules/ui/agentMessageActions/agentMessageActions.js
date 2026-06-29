import { LightningElement, api } from 'lwc';

export default class AgentMessageActions extends LightningElement {
    @api actions = [];

    get hasActions() {
        return Array.isArray(this.actions) && this.actions.length > 0;
    }

    get showSingleButton() {
        return this.hasActions && this.actions.length === 1;
    }

    get showButtonGroup() {
        return this.hasActions && this.actions.length >= 2;
    }

    get singleAction() {
        return this.showSingleButton ? this.actions[0] : null;
    }

    get actionsForGroup() {
        if (!this.showButtonGroup) {
            return [];
        }
        return this.actions.map((action, index) => ({
            ...action,
            rowKey: `agent-msg-action-${action.id ?? index}`,
            rowIndex: index,
        }));
    }

    handleActionClick(event) {
        const raw = event.currentTarget?.dataset?.index;
        const index = raw === undefined ? 0 : Number.parseInt(raw, 10);
        const action = this.actions[index];
        if (!action) {
            return;
        }
        const actionId = action.id;
        this.dispatchEvent(
            new CustomEvent('agentmessageaction', {
                bubbles: true,
                composed: true,
                detail: {
                    actionId,
                    index,
                },
            })
        );
    }
}
