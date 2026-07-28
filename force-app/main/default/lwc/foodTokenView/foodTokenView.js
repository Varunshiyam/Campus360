import { LightningElement, api } from 'lwc';

export default class FoodTokenView extends LightningElement {
    @api tokens = [];

    handleNewToken() {
        this.dispatchEvent(new CustomEvent('newtoken'));
    }
}