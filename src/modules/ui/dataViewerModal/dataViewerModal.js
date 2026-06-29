import LightningModal from 'lightning/modal';
import { track } from 'lwc';
import * as Labels from 'data/labels/DataViewerModal';
import { getProfileCards, getTableColumns, getTableRows } from 'data/services/dataViewerService';

export default class DataViewerModal extends LightningModal {
    labels = Labels;
    @track profileCards = [];
    @track columns = [];
    @track tableData = [];
    @track activeView = 'chart';

    async connectedCallback() {
        const cards = await getProfileCards();
        this.profileCards = cards.map((card) => ({
            ...card,
            bars: card.bars.map((bar, idx) => ({
                ...bar,
                key: `${card.id}-bar-${idx}`,
                barStyle: `width: ${bar.width}%`,
            })),
        }));
        this.columns = await getTableColumns();
        const rows = await getTableRows();
        this.tableData = rows.map((row) => ({
            id: row.id,
            cells: this.columns.map((col) => ({
                key: `${row.id}-${col.fieldName}`,
                value: String(row[col.fieldName] ?? ''),
            })),
        }));
    }

    get clusterInfo() {
        return `${Labels.ClusterLabel} (${Labels.RowCount})`;
    }

    get tableStyle() {
        const width = 48 + (this.columns.length - 1) * 220;
        return `width: ${width}px`;
    }

    get chartViewVariant() {
        return this.activeView === 'chart' ? 'brand' : 'border-filled';
    }

    get tableViewVariant() {
        return this.activeView === 'table' ? 'brand' : 'border-filled';
    }

    get listViewVariant() {
        return this.activeView === 'list' ? 'brand' : 'border-filled';
    }

    handleViewChart() {
        this.activeView = 'chart';
    }

    handleViewTable() {
        this.activeView = 'table';
    }

    handleViewList() {
        this.activeView = 'list';
    }

    handleOk() {
        this.close('ok');
    }
}
