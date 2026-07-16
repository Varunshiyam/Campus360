import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getStudentDashboardData from '@salesforce/apex/StudentPortalController.getStudentDashboardData';

export default class CertificateRequest extends LightningElement {
    @track searchKey = '';
    @track studentId = '';
    @track studentName = '';
    @track isVerified = false;
    @track isVerifying = false;

    handleSearchKeyChange(event) {
        this.searchKey = event.target.value;
    }

    handleVerify() {
        if (!this.searchKey) {
            this.showToast('Error', 'Please enter your Student ID or Email', 'error');
            return;
        }

        this.isVerifying = true;
        getStudentDashboardData({ searchKey: this.searchKey })
            .then(result => {
                this.isVerifying = false;
                if (result && result.student) {
                    this.studentId = result.student.Id;
                    this.studentName = result.student.Name;
                    this.isVerified = true;
                    this.showToast('Success', 'Identity verified successfully!', 'success');
                } else {
                    this.showToast('Error', 'Student record not found. Please verify your Student ID or Email.', 'error');
                }
            })
            .catch(error => {
                this.isVerifying = false;
                this.showToast('Error', 'Verification failed: ' + (error.body ? error.body.message : error.message), 'error');
            });
    }

    get todayDate() {
        return new Date().toISOString().substring(0, 10);
    }

    handleReset() {
        this.searchKey = '';
        this.studentId = '';
        this.studentName = '';
        this.isVerified = false;
    }

    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        fields.Status__c = 'Pending';
        fields.Applied_Date__c = this.todayDate;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
        this.isVerifying = true;
    }

    handleSuccess(event) {
        this.isVerifying = false;
        this.showToast('Success', 'Certificate request submitted successfully! Request ID: ' + event.detail.id, 'success');
        this.handleReset();
    }

    handleError(event) {
        this.isVerifying = false;
        this.showToast('Error', 'Failed to submit request: ' + event.detail.detail, 'error');
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
}