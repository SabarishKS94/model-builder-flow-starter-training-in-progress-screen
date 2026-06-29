import { LightningElement, api } from 'lwc';

const DEFAULT_Y_AXIS_LABELS = ['##', '##', '##'];
const DEFAULT_BARS = [
    { id: 'bar-1', valueLabel: '##', xLabel: 'Label', height: 'lg' },
    { id: 'bar-2', valueLabel: '##', xLabel: 'Label', height: 'md' },
    { id: 'bar-3', valueLabel: '##', xLabel: 'Label', height: 'sm' },
    { id: 'bar-4', valueLabel: '##', xLabel: 'Label', height: 'xl' },
];

const HEIGHT_CLASS_BY_KEY = {
    xs: 'ui-agent-chart__bar-fill--xs',
    sm: 'ui-agent-chart__bar-fill--sm',
    md: 'ui-agent-chart__bar-fill--md',
    lg: 'ui-agent-chart__bar-fill--lg',
    xl: 'ui-agent-chart__bar-fill--xl',
};

export default class AgentChart extends LightningElement {
    @api title = 'Viz Title';
    @api subtitle = 'Time Range';
    @api yAxisLabels = [];
    @api bars = [];

    get yAxisLabelsView() {
        const labels = Array.isArray(this.yAxisLabels) ? this.yAxisLabels : [];
        const normalized = labels
            .slice(0, 3)
            .map((label) => (label == null ? '' : String(label).trim()))
            .filter((label) => label !== '');
        return normalized.length ? normalized : DEFAULT_Y_AXIS_LABELS;
    }

    get barsView() {
        const source = Array.isArray(this.bars) && this.bars.length ? this.bars : DEFAULT_BARS;
        return source.slice(0, 4).map((bar, index) => {
            const heightKeyRaw = bar?.height == null ? 'md' : String(bar.height).toLowerCase();
            const heightClass = HEIGHT_CLASS_BY_KEY[heightKeyRaw] || HEIGHT_CLASS_BY_KEY.md;
            return {
                key: bar?.id ? String(bar.id) : `bar-${index + 1}`,
                valueLabel:
                    bar?.valueLabel == null || String(bar.valueLabel).trim() === ''
                        ? '##'
                        : String(bar.valueLabel),
                xLabel:
                    bar?.xLabel == null || String(bar.xLabel).trim() === ''
                        ? 'Label'
                        : String(bar.xLabel),
                fillClass: `ui-agent-chart__bar-fill ${heightClass}`,
            };
        });
    }
}
