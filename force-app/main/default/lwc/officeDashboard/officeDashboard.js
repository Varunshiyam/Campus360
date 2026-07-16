import { LightningElement, wire } from 'lwc';

import getAllAdmissions from '@salesforce/apex/AdmissionController.getAllAdmissions';
import getAllCertificateRequests from '@salesforce/apex/CertificateController.getAllCertificateRequests';
import getAllComplaints from '@salesforce/apex/ComplaintController.getAllComplaints';
import getAllIDCards from '@salesforce/apex/IDCardController.getAllIDCards';

const ADMISSION_COLUMNS = [
    { label: 'Admission No', fieldName: 'Admission_No__c' },
    { label: 'Department', fieldName: 'Department__c' },
    { label: 'Joining Year', fieldName: 'Joining_Year__c' },
    { label: 'Status', fieldName: 'Status__c' }
];

const CERTIFICATE_COLUMNS = [
    { label: 'Request No', fieldName: 'Request_No__c' },
    { label: 'Certificate Type', fieldName: 'Certificate_Type__c' },
    { label: 'Applied Date', fieldName: 'Applied_Date__c', type: 'date' },
    { label: 'Status', fieldName: 'Status__c' }
];

const COMPLAINT_COLUMNS = [
    { label: 'Complaint No', fieldName: 'Name' },
    { label: 'Category', fieldName: 'Category__c' },
    { label: 'Priority', fieldName: 'Priority__c' },
    { label: 'Status', fieldName: 'Status__c' }
];

const IDCARD_COLUMNS = [
    { label: 'Request No', fieldName: 'Request_No__c' },
    { label: 'Request Date', fieldName: 'Request_Date__c', type: 'date' },
    { label: 'Issue Date', fieldName: 'Issue_Date__c', type: 'date' },
    { label: 'Status', fieldName: 'Status__c' }
];

export default class OfficeDashboard extends LightningElement {

    admissions = [];
    certificates = [];
    complaints = [];
    idCards = [];

    admissionColumns = ADMISSION_COLUMNS;
    certificateColumns = CERTIFICATE_COLUMNS;
    complaintColumns = COMPLAINT_COLUMNS;
    idCardColumns = IDCARD_COLUMNS;

    admissionCount = 0;
    certificateCount = 0;
    complaintCount = 0;
    idCardCount = 0;

    @wire(getAllAdmissions)
    wiredAdmissions({ data }) {
        if (data) {
            this.admissions = data;
            this.admissionCount = data.length;
        }
    }

    @wire(getAllCertificateRequests)
    wiredCertificates({ data }) {
        if (data) {
            this.certificates = data;
            this.certificateCount = data.length;
        }
    }

    @wire(getAllComplaints)
    wiredComplaints({ data }) {
        if (data) {
            this.complaints = data;
            this.complaintCount = data.length;
        }
    }

    @wire(getAllIDCards)
    wiredIDCards({ data }) {
        if (data) {
            this.idCards = data;
            this.idCardCount = data.length;
        }
    }

}