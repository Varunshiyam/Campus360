import { LightningElement, api } from 'lwc';

export default class VisitorView extends LightningElement {
    @api visitors = [];

    handleNewVisitor() {
        this.dispatchEvent(new CustomEvent('newvisitor'));
    }
}