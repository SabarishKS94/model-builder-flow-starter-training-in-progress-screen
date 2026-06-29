import { LightningElement, track } from 'lwc';
import { navigate } from '../../../router';

const VERSION_DATA = {
    v1: {
        label: 'Version 1', short: 'V1', meta: 'Recommended', score: 87, scoreClass: 'score-card score-card_best',
        quality: { silhouette: 0.62, daviesBouldin: 1.1, interpretability: 'High' },
        structure: { clusters: 3, coverage: '98%', avgSize: '1,200' },
        operational: { trainingSize: '12,400', drift: '0.08' },
        labels: [
            { name: 'Billing', count: 1200, css: 'bar-billing' },
            { name: 'Support', count: 1200, css: 'bar-support' },
            { name: 'Feedback', count: 1200, css: 'bar-feedback' }
        ],
        shap: [
            { name: 'Products purchases', pct: 40.9, css: 'bar-shap-1' },
            { name: 'Amount spent', pct: 30, css: 'bar-shap-2' },
            { name: 'Product Review', pct: 20, css: 'bar-shap-3' },
            { name: 'Care Feedback', pct: 5.5, css: 'bar-shap-4' },
            { name: 'Customer Tier', pct: 3.5, css: 'bar-shap-5' }
        ]
    },
    v2: {
        label: 'Version 2 (Active)', short: 'V2', meta: 'Active', score: 78, scoreClass: 'score-card score-card_neutral',
        quality: { silhouette: 0.71, daviesBouldin: 1.4, interpretability: 'Medium' },
        structure: { clusters: 4, coverage: '94%', avgSize: '900' },
        operational: { trainingSize: '18,200', drift: '—' },
        labels: [
            { name: 'Billing', count: 1100, css: 'bar-billing' },
            { name: 'Support', count: 1050, css: 'bar-support' },
            { name: 'Feedback', count: 850, css: 'bar-feedback' },
            { name: 'Bug', count: 600, css: 'bar-bug' }
        ],
        shap: [
            { name: 'Products purchases', pct: 35.2, css: 'bar-shap-1' },
            { name: 'Amount spent', pct: 28.4, css: 'bar-shap-2' },
            { name: 'Product Review', pct: 22.1, css: 'bar-shap-3' },
            { name: 'Care Feedback', pct: 8.3, css: 'bar-shap-4' },
            { name: 'Customer Tier', pct: 6, css: 'bar-shap-5' }
        ]
    },
    v3: {
        label: 'Version 3', short: 'V3', meta: 'Inactive', score: 91, scoreClass: 'score-card score-card_best',
        quality: { silhouette: 0.79, daviesBouldin: 0.9, interpretability: 'High' },
        structure: { clusters: 4, coverage: '99%', avgSize: '1,350' },
        operational: { trainingSize: '26,400', drift: '0.04' },
        labels: [
            { name: 'Billing', count: 1350, css: 'bar-billing' },
            { name: 'Support', count: 1280, css: 'bar-support' },
            { name: 'Feedback', count: 1100, css: 'bar-feedback' },
            { name: 'Bug', count: 670, css: 'bar-bug' }
        ],
        shap: [
            { name: 'Products purchases', pct: 38.2, css: 'bar-shap-1' },
            { name: 'Amount spent', pct: 28.6, css: 'bar-shap-2' },
            { name: 'Product Review', pct: 19.4, css: 'bar-shap-3' },
            { name: 'Care Feedback', pct: 8.3, css: 'bar-shap-4' },
            { name: 'Customer Tier', pct: 5.5, css: 'bar-shap-5' }
        ]
    },
    v4: {
        label: 'Version 4', short: 'V4', meta: 'Failed', score: 41, scoreClass: 'score-card score-card_worst',
        quality: { silhouette: 0.38, daviesBouldin: 2.1, interpretability: 'Low' },
        structure: { clusters: 8, coverage: '76%', avgSize: '420' },
        operational: { trainingSize: '9,800', drift: '0.29' },
        labels: [
            { name: 'Billing', count: 620, css: 'bar-billing' },
            { name: 'Support', count: 580, css: 'bar-support' },
            { name: 'Feedback', count: 490, css: 'bar-feedback' },
            { name: 'Bug', count: 440, css: 'bar-bug' },
            { name: 'Feature Request', count: 380, css: 'bar-feature' },
            { name: 'Onboarding', count: 290, css: 'bar-onboarding' }
        ],
        shap: [
            { name: 'Products purchases', pct: 18.2, css: 'bar-shap-1' },
            { name: 'Amount spent', pct: 17.8, css: 'bar-shap-2' },
            { name: 'Product Review', pct: 22.5, css: 'bar-shap-3' },
            { name: 'Care Feedback', pct: 21.3, css: 'bar-shap-4' },
            { name: 'Customer Tier', pct: 20.2, css: 'bar-shap-5' }
        ]
    },
    v5: {
        label: 'Version 5 (New)', short: 'V5', meta: 'New', score: 64, scoreClass: 'score-card score-card_worst',
        quality: { silhouette: 0.68, daviesBouldin: 1.2, interpretability: 'Medium' },
        structure: { clusters: 6, coverage: '91%', avgSize: '720' },
        operational: { trainingSize: '22,000', drift: '0.14' },
        labels: [
            { name: 'Billing', count: 1050, css: 'bar-billing' },
            { name: 'Support', count: 1000, css: 'bar-support' },
            { name: 'Feedback', count: 540, css: 'bar-feedback' },
            { name: 'Bug', count: 480, css: 'bar-bug' },
            { name: 'Feature Request', count: 540, css: 'bar-feature' }
        ],
        shap: [
            { name: 'Products purchases', pct: 22.4, css: 'bar-shap-1' },
            { name: 'Amount spent', pct: 21.8, css: 'bar-shap-2' },
            { name: 'Product Review', pct: 26.3, css: 'bar-shap-3' },
            { name: 'Care Feedback', pct: 16, css: 'bar-shap-4' },
            { name: 'Customer Tier', pct: 13.5, css: 'bar-shap-5' }
        ]
    }
};

export default class CompareVersions extends LightningElement {
    activeVersionValue = 'v2';
    @track version1Value = 'v1';
    @track version2Value = 'v2';
    @track version3Value = 'v5';

    @track showTooltip = false;
    @track tooltipStyle = '';
    @track tooltipVersion = '';
    @track tooltipLabel = '';
    @track tooltipValue = '';
    @track tooltipPct = '';

    get activeVersionOptions() {
        return Object.entries(VERSION_DATA).map(([k, v]) => ({ label: v.label, value: k }));
    }

    get versionOptions() {
        return Object.entries(VERSION_DATA).map(([k, v]) => ({ label: v.label, value: k }));
    }

    get selectedVersions() {
        return [
            VERSION_DATA[this.version1Value],
            VERSION_DATA[this.version2Value],
            VERSION_DATA[this.version3Value]
        ];
    }

    get scoreCards() {
        const versions = this.selectedVersions;
        const scores = versions.map(v => v.score);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        return versions.map(v => {
            let cardClass = 'score-card score-card_neutral';
            if (v.score === maxScore) cardClass = 'score-card score-card_best';
            else if (v.score === minScore && maxScore !== minScore) cardClass = 'score-card score-card_worst';
            return {
                key: v.short,
                label: `${v.short} - ${v.meta}`,
                value: v.score,
                className: cardClass
            };
        });
    }

    get verdictText() {
        const versions = this.selectedVersions;
        const best = versions.reduce((a, b) => a.score > b.score ? a : b);
        const active = versions.find(v => v.meta === 'Active');
        if (active && active.short !== best.short) {
            return `${best.short} scores highest overall (${best.score} vs ${active.short}'s ${active.score}). Recommend switching to ${best.short}.`;
        }
        if (!active) {
            return `${best.short} has the highest overall score (${best.score}) among the selected versions. Consider activating it.`;
        }
        return `Your active version (${active.short}) has the best overall score (${active.score}) among the selected versions.`;
    }

    _buildCell(val, bold, highlight, key) {
        let cellClass = 'slds-text-align_right';
        if (bold) cellClass += ' slds-text-title_bold';
        if (highlight) cellClass += ' cell-highlight';
        return { key, val, cellClass };
    }

    get qualityTableRows() {
        const versions = this.selectedVersions;
        const sil = versions.map(v => v.quality.silhouette);
        const db = versions.map(v => v.quality.daviesBouldin);
        const interp = versions.map(v => v.quality.interpretability);
        const bestSil = Math.max(...sil);
        const bestDb = Math.min(...db);
        const interpRank = { High: 3, Medium: 2, Low: 1 };
        const bestInterp = Math.max(...interp.map(i => interpRank[i] || 0));
        const bestInterpIdx = interp.findIndex(i => (interpRank[i] || 0) === bestInterp);

        return [
            {
                key: 'silhouette', metric: 'Silhouette score (↑ better)',
                values: versions.map((v, i) => this._buildCell(sil[i].toString(), sil[i] === bestSil, sil[i] === bestSil, `sil-${v.short}`)),
                winner: versions[sil.indexOf(bestSil)].short
            },
            {
                key: 'davies', metric: 'Davies-Bouldin index (↓ better)',
                values: versions.map((v, i) => this._buildCell(db[i].toString(), db[i] === bestDb, db[i] === bestDb, `db-${v.short}`)),
                winner: versions[db.indexOf(bestDb)].short
            },
            {
                key: 'interp', metric: 'Label interpretability',
                values: versions.map((v, i) => this._buildCell(interp[i], i === bestInterpIdx, i === bestInterpIdx, `interp-${v.short}`)),
                winner: versions[bestInterpIdx].short
            }
        ];
    }

    get structureTableRows() {
        const versions = this.selectedVersions;
        const coverageNums = versions.map(v => parseInt(v.structure.coverage));
        const bestCoverage = Math.max(...coverageNums);
        const bestCoverageIdx = coverageNums.indexOf(bestCoverage);

        return [
            {
                key: 'clusters', metric: '# of clusters',
                values: versions.map(v => this._buildCell(v.structure.clusters.toString(), false, false, `clust-${v.short}`)),
                winner: '—'
            },
            {
                key: 'coverage', metric: 'Coverage (% labeled)',
                values: versions.map((v, i) => this._buildCell(v.structure.coverage, i === bestCoverageIdx, i === bestCoverageIdx, `cov-${v.short}`)),
                winner: versions[bestCoverageIdx].short
            },
            {
                key: 'avgsize', metric: 'Avg cluster size',
                values: versions.map(v => this._buildCell(v.structure.avgSize, false, false, `avg-${v.short}`)),
                winner: '—'
            }
        ];
    }

    get operationalTableRows() {
        const versions = this.selectedVersions;
        const trainNums = versions.map(v => parseInt(v.operational.trainingSize.replace(/,/g, '')));
        const bestTrain = Math.max(...trainNums);
        const bestTrainIdx = trainNums.indexOf(bestTrain);

        return [
            {
                key: 'trainsize', metric: 'Training set size',
                values: versions.map((v, i) => this._buildCell(v.operational.trainingSize, i === bestTrainIdx, i === bestTrainIdx, `train-${v.short}`)),
                winner: versions[bestTrainIdx].short
            },
            {
                key: 'drift', metric: 'Drift vs Active',
                values: versions.map(v => this._buildCell(v.operational.drift, false, false, `drift-${v.short}`)),
                winner: '—'
            }
        ];
    }

    get tableHeaderVersions() {
        const versions = this.selectedVersions;
        const maxScore = Math.max(...versions.map(v => v.score));
        return versions.map(v => ({
            key: v.short,
            label: v.score === maxScore ? `${v.short} (Recommended)` : `${v.short} (${v.meta})`,
            isRecommended: v.score === maxScore
        }));
    }

    get labelChartRows() {
        return this.selectedVersions.map(v => {
            const total = v.labels.reduce((sum, l) => sum + l.count, 0);
            return {
                version: v.short, meta: v.meta,
                segments: v.labels.map(l => {
                    const pctNum = ((l.count / total) * 100).toFixed(1);
                    return {
                        key: `${v.short}-${l.name}`,
                        className: `bar-segment ${l.css}`,
                        style: `width:${pctNum}%`,
                        label: l.name,
                        value: l.count.toLocaleString(),
                        pct: `${pctNum}% of ${v.short}`,
                        text: `${l.name} ${l.count}`
                    };
                })
            };
        });
    }

    get shapChartRows() {
        return this.selectedVersions.map(v => ({
            version: v.short, meta: v.meta,
            segments: v.shap.map(s => ({
                key: `${v.short}-${s.name}`,
                className: `bar-segment ${s.css}`,
                style: `width:${s.pct}%`,
                label: s.name,
                value: `${s.pct}%`,
                pct: `${s.pct}% of ${v.short}`,
                text: s.pct >= 10 ? `${s.name} ${s.pct}%` : `${s.pct}%`
            }))
        }));
    }

    handleVersion1Change(event) {
        this.version1Value = event.detail.value;
    }

    handleVersion2Change(event) {
        this.version2Value = event.detail.value;
    }

    handleVersion3Change(event) {
        this.version3Value = event.detail.value;
    }

    handleBack() {
        navigate('/nba-model-detail');
    }

    handleSegmentHover(event) {
        const segment = event.target.closest('.bar-segment');
        if (!segment) return;

        const label = segment.dataset.label;
        const value = segment.dataset.value;
        const pct = segment.dataset.pct;
        const version = segment.dataset.version;

        if (!label) return;

        this.tooltipLabel = label;
        this.tooltipValue = value;
        this.tooltipPct = pct;
        this.tooltipVersion = version;

        const rect = segment.getBoundingClientRect();
        const scrollContainer = this.template.querySelector('.content-area');
        const containerRect = scrollContainer.getBoundingClientRect();

        const left = rect.left - containerRect.left + rect.width / 2;
        const top = rect.top - containerRect.top - 8 + scrollContainer.scrollTop;

        this.tooltipStyle = `left:${left}px;top:${top}px`;
        this.showTooltip = true;
    }

    handleSegmentLeave() {
        this.showTooltip = false;
    }
}
