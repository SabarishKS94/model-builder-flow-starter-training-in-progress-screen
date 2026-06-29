import LightningModal from 'lightning/modal';
import { track } from 'lwc';
import {
    ApiKeyModalTitle, ApiKeyModalBody, ApiKeyPlaceholder,
    ApiKeyLabel, ConnectButton
} from 'data/labels/LlmChat';
import { setApiKey } from 'data/llmGateway';

export default class ApiKeyModal extends LightningModal {
    labels = { ApiKeyModalTitle, ApiKeyModalBody, ApiKeyPlaceholder, ApiKeyLabel, ConnectButton };

    @track _keyValue = '';

    get isConnectDisabled() {
        return !this._keyValue.startsWith('sk-');
    }

    handleKeyChange(event) {
        this._keyValue = event.target.value.trim();
    }

    handleKeydown(event) {
        if (event.key === 'Enter' && !this.isConnectDisabled) {
            this._save();
        }
    }

    handleConnect() {
        this._save();
    }

    _save() {
        setApiKey(this._keyValue);
        this.close('connected');
    }
}
