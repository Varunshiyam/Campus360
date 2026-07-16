import { LightningElement, wire } from 'lwc';
import getAllFees from '@salesforce/apex/FeeController.getAllFees';

const COLUMNS = [
    { label: 'Fee', fieldName: 'Name' },
    { label: 'Academic Year', fieldName: 'Academic_Year__c' },
    { label: 'Semester', fieldName: 'Semester__c' },
    { label: 'Total Amount', fieldName: 'Total_Amount__c', type: 'currency' },
    { label: 'Due Date', fieldName: 'Due_Date__c', type: 'date' },
    { label: 'Status', fieldName: 'Status__c' }
];

export default class FeeDashboard extends LightningElement {

    columns = COLUMNS;
    fees;
    error;

    @wire(getAllFees)
    wiredFees({ error, data }) {

        if (data) {
            this.fees = data;
            this.error = undefined;
        } else if (error) {
            this.error = error.body ? error.body.message : 'Unknown Error';
            this.fees = undefined;
        }

    }
}