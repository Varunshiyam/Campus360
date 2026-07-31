import { LightningElement, api } from 'lwc';

export default class ComplaintView extends LightningElement {
    @api complaints = [];

    handleNewComplaint() {
        this.dispatchEvent(new CustomEvent('newcomplaint'));
    }

    handleResolve(event) {
        const id = event.target.dataset.id;
        this.dispatchEvent(new CustomEvent('resolve', { detail: { id } }));
    }
}