import { LightningElement } from 'lwc';

export default class ComplaintForm extends LightningElement {
    studentName = '';
    complaintDate = '';
    bus = '';
    complaintType = '';
    complaint = '';

    get typeOptions() {
        return [
            { label: 'Bus Condition', value: 'Bus Condition' },
            { label: 'Driver Behavior', value: 'Driver Behavior' },
            { label: 'Timing/Delay', value: 'Timing/Delay' },
            { label: 'Other', value: 'Other' },
        ];
    }

    handleChange(event) {
        const field = event.target.name;
        if (field === 'studentName') {
            this.studentName = event.target.value;
        } else if (field === 'complaintDate') {
            this.complaintDate = event.target.value;
        } else if (field === 'bus') {
            this.bus = event.target.value;
        } else if (field === 'complaintType') {
            this.complaintType = event.target.value;
        } else if (field === 'complaint') {
            this.complaint = event.target.value;
        }
    }

    handleSubmit() {
        // Add your submission logic here
        console.log('Complaint submitted: ', this.studentName, this.complaintType);
    }
}