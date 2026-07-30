import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class EventManagementDashboard extends LightningElement {
    
    @track isDashboardView = true;
    @track selectedObjectApiName = '';
    @track selectedObjectLabel = '';

    dashboardItems = [
        { id: '1', label: 'Event', objectApiName: 'Event__c', icon: 'custom:custom84', description: 'Manage all upcoming and past events.' },
        { id: '2', label: 'Registration', objectApiName: 'Registration__c', icon: 'custom:custom15', description: 'Track attendee registrations.' },
        { id: '3', label: 'Participant', objectApiName: 'Participant__c', icon: 'custom:custom11', description: 'View student and faculty participants.' },
        { id: '4', label: 'Venue', objectApiName: 'Venue__c', icon: 'custom:custom50', description: 'Manage event locations and capacities.' },
        { id: '5', label: 'Resource', objectApiName: 'Resource__c', icon: 'custom:custom24', description: 'Equipment and materials tracking.' },
        { id: '6', label: 'Judge', objectApiName: 'Judge__c', icon: 'custom:custom14', description: 'Manage event judges and panels.' },
        { id: '7', label: 'Winner', objectApiName: 'Winner__c', icon: 'custom:custom17', description: 'Record and view event winners.' },
        { id: '8', label: 'Certificate', objectApiName: 'Certificate__c', icon: 'custom:custom48', description: 'Manage generated certificates.' },
        { id: '9', label: 'Attendance', objectApiName: 'Attendance__c', icon: 'custom:custom83', description: 'Track participant attendance.' },
        { id: '10', label: 'Payment', objectApiName: 'Payment__c', icon: 'custom:custom16', description: 'Manage registration payments.' },
        { id: '11', label: 'Feedback', objectApiName: 'Feedback__c', icon: 'custom:custom86', description: 'Review event feedback.' },
        { id: '12', label: 'Department', objectApiName: 'Department__c', icon: 'custom:custom23', description: 'Manage involved departments.' },
        { id: '13', label: 'Volunteer Assignment', objectApiName: 'Volunteer_Assigment__c', icon: 'custom:custom47', description: 'Track volunteer duties.' }
    ];

    handleCardClick(event) {
        this.selectedObjectApiName = event.currentTarget.dataset.object;
        this.selectedObjectLabel = event.currentTarget.dataset.label;
        this.isDashboardView = false;
    }

    handleBack() {
        this.isDashboardView = true;
        this.selectedObjectApiName = '';
        this.selectedObjectLabel = '';
    }

    handleSuccess(event) {
        const evt = new ShowToastEvent({
            title: 'Success',
            message: `${this.selectedObjectLabel} created successfully!`,
            variant: 'success',
        });
        this.dispatchEvent(evt);
        this.handleBack();
    }
}