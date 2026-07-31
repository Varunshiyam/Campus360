import { LightningElement, api } from 'lwc';

export default class RoomView extends LightningElement {
    @api rooms = [];
    @api hostels = [];
}