import { LightningElement, api } from 'lwc';

export default class DashboardView extends LightningElement {
    @api summary = {};
    @api complaints = [];
    @api roomSummaries = [];
    @api foodTokens = [];
    @api visitors = [];
    @api leaves = [];
    @api feePendingList = [];

    renderedCallback() {
        this.template.querySelectorAll('.bar-inner').forEach(bar => {
            const width = bar.dataset.width;
            if (width !== undefined) {
                bar.style.width = `${width}%`;
            }
        });
    }

    handleOpenComplaint() {
        this.dispatchEvent(new CustomEvent('opencomplaint'));
    }

    handleOpenFoodToken() {
        this.dispatchEvent(new CustomEvent('openfoodtoken'));
    }

    handleOpenVisitor() {
        this.dispatchEvent(new CustomEvent('openvisitor'));
    }

    handleResolve(event) {
        const id = event.target.dataset.id;
        this.dispatchEvent(new CustomEvent('resolve', { detail: { id } }));
    }
}