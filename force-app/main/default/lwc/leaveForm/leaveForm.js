import { LightningElement } from 'lwc';

export default class LeaveForm extends LightningElement {
    driverName = '';
    startDate = '';
    endDate = '';
    reason = '';

    handleChange(event) {
        const field = event.target.name;
        if (field === 'driverName') {
            this.driverName = event.target.value;
        } else if (field === 'startDate') {
            this.startDate = event.target.value;
        } else if (field === 'endDate') {
            this.endDate = event.target.value;
        } else if (field === 'reason') {
            this.reason = event.target.value;
        }
    }

    handleSubmit() {
        // Add your submission logic here
        console.log('Leave requested by: ', this.driverName);
    }
}