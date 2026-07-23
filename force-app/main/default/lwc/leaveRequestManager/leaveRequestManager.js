import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import submitLeaveRequest from '@salesforce/apex/UnifiedCampusPortalController.submitLeaveRequest';

export default class LeaveRequestManager extends LightningElement {
    @api role = 'Employee';
    @api userId = '';
    
    @track leaveType = '';
    @track fromDate = '';
    @track toDate = '';
    @track reason = '';
    @track loading = false;

    get leaveTypeOptions() {
        return [
            { label: 'Casual Leave', value: 'Casual' },
            { label: 'Sick Leave', value: 'Sick' },
            { label: 'Study Leave', value: 'Study' },
            { label: 'Personal Leave', value: 'Personal' }
        ];
    }

    handleInputChange(event) {
        const field = event.target.dataset.id;
        if (field === 'leaveType') {
            this.leaveType = event.target.value;
        } else if (field === 'fromDate') {
            this.fromDate = event.target.value;
        } else if (field === 'toDate') {
            this.toDate = event.target.value;
        } else if (field === 'reason') {
            this.reason = event.target.value;
        }
    }

    handleSubmit() {
        if (!this.leaveType || !this.fromDate || !this.toDate || !this.reason) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please fill in all required fields.',
                    variant: 'error'
                })
            );
            return;
        }

        this.loading = true;
        submitLeaveRequest({
            requesterId: this.userId,
            role: this.role,
            leaveType: this.leaveType,
            fromDate: this.fromDate,
            toDate: this.toDate,
            reason: this.reason
        })
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Leave request submitted successfully!',
                    variant: 'success'
                })
            );
            this.leaveType = '';
            this.fromDate = '';
            this.toDate = '';
            this.reason = '';
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body ? error.body.message : 'Unknown error occurred.',
                    variant: 'error'
                })
            );
        })
        .finally(() => {
            this.loading = false;
        });
    }
}