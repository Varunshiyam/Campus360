import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import basePath from '@salesforce/community/basePath';
import getStudentDashboardData from '@salesforce/apex/StudentPortalController.getStudentDashboardData';

const CERTIFICATE_COLUMNS = [
    { label: 'Request No', fieldName: 'Request_No__c', initialWidth: 120 },
    { label: 'Certificate Type', fieldName: 'Certificate_Type__c' },
    { label: 'Applied Date', fieldName: 'Applied_Date__c', type: 'date' },
    { label: 'Required Date', fieldName: 'Required_Date__c', type: 'date' },
    { label: 'Status', fieldName: 'Status__c' },
    { label: 'Reason', fieldName: 'Reason__c' }
];

const COMPLAINT_COLUMNS = [
    { label: 'Subject', fieldName: 'Subject__c' },
    { label: 'Category', fieldName: 'Category__c' },
    { label: 'Description', fieldName: 'Description__c' },
    { label: 'Priority', fieldName: 'Priority__c' },
    { label: 'Status', fieldName: 'Status__c' }
];

const IDCARD_COLUMNS = [
    { label: 'Request No', fieldName: 'Request_No__c', initialWidth: 120 },
    { label: 'Reason', fieldName: 'Reason__c' },
    { label: 'Photo Uploaded', fieldName: 'Photo_Uploaded__c', type: 'boolean' },
    { label: 'Request Date', fieldName: 'Request_Date__c', type: 'date' },
    { label: 'Issue Date', fieldName: 'Issue_Date__c', type: 'date' },
    { label: 'Status', fieldName: 'Status__c' }
];

export default class StudentDashboard extends NavigationMixin(LightningElement) {
    @track searchKey = '';
    @track student = null;
    @track certificates = [];
    @track complaints = [];
    @track idCards = [];
    
    @track isVerified = false;
    @track isLoading = false;

    certificateColumns = CERTIFICATE_COLUMNS;
    complaintColumns = COMPLAINT_COLUMNS;
    idCardColumns = IDCARD_COLUMNS;

    handleSearchKeyChange(event) {
        this.searchKey = event.target.value;
    }

    handleSearch() {
        if (!this.searchKey) {
            this.showToast('Error', 'Please enter your Student ID or Email address.', 'error');
            return;
        }

        this.isLoading = true;
        getStudentDashboardData({ searchKey: this.searchKey })
            .then(result => {
                this.isLoading = false;
                if (result && result.student) {
                    this.student = result.student;
                    this.certificates = result.certificates || [];
                    this.complaints = result.complaints || [];
                    this.idCards = result.idCards || [];
                    this.isVerified = true;
                    this.showToast('Success', 'Dashboard loaded successfully.', 'success');
                } else {
                    this.student = null;
                    this.isVerified = false;
                    this.showToast('Error', 'No student profile found with the provided details.', 'error');
                }
            })
            .catch(error => {
                this.isLoading = false;
                this.student = null;
                this.isVerified = false;
                this.showToast('Error', 'Failed to retrieve dashboard: ' + (error.body ? error.body.message : error.message), 'error');
            });
    }

    handleClear() {
        this.searchKey = '';
        this.student = null;
        this.certificates = [];
        this.complaints = [];
        this.idCards = [];
        this.isVerified = false;
    }

    get avatarInitials() {
        if (this.student && this.student.Name) {
            const parts = this.student.Name.split(' ');
            if (parts.length > 1) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return this.student.Name.substring(0, 2).toUpperCase();
        }
        return '';
    }

    get hasCertificates() {
        return this.certificates && this.certificates.length > 0;
    }

    get hasComplaints() {
        return this.complaints && this.complaints.length > 0;
    }

    get hasIdCards() {
        return this.idCards && this.idCards.length > 0;
    }

    navigateToCertificate() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: basePath + '/certificate-request'
            }
        });
    }

    navigateToComplaint() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: basePath + '/complaint'
            }
        });
    }

    navigateToIdCard() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: basePath + '/id-card-request'
            }
        });
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