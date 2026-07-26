import { LightningElement } from 'lwc';

export default class EventDashboard extends LightningElement {
    eventName = '';
    numberOfPassengers = '';
    location = '';
    duration = '';

    handleChange(event) {
        const field = event.target.name;
        if (field === 'eventName') {
            this.eventName = event.target.value;
        } else if (field === 'numberOfPassengers') {
            this.numberOfPassengers = event.target.value;
        } else if (field === 'location') {
            this.location = event.target.value;
        } else if (field === 'duration') {
            this.duration = event.target.value;
        }
    }

    handleSave() {
        // Add your save logic here (e.g., Apex callout)
        // alert(`Saved: ${this.eventName}`);
    }
}