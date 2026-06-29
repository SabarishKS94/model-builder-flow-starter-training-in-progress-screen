const GATEWAY_URL = 'https://eng-ai-model-gateway.sfproxy.devx-preprod.aws-esvc1-useast2.aws.sfdc.cl';
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
const STORAGE_KEY = 'llm-gateway-api-key';

export function getApiKey() {
    return localStorage.getItem(STORAGE_KEY);
}

export function setApiKey(key) {
    localStorage.setItem(STORAGE_KEY, key);
}

export function hasApiKey() {
    return Boolean(getApiKey());
}

export async function chatCompletion(messages, opts = {}) {
    const key = getApiKey();
    if (!key) {
        throw new Error('No API key configured');
    }

    const body = {
        model: opts.model || DEFAULT_MODEL,
        messages,
        ...(opts.maxTokens && { max_tokens: opts.maxTokens })
    };

    const response = await fetch(`${GATEWAY_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`LLM Gateway error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
}
