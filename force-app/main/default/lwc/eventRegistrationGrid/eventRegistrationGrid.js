import { LightningElement, wire, track } from 'lwc';
import getActiveEvents from '@salesforce/apex/EventRegistrationController.getActiveEvents';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class EventRegistrationGrid extends NavigationMixin(LightningElement) {
    @track events = [];
    isLoading = true;
    hasEvents = false;

    @wire(getActiveEvents)
    wiredEvents(result) {
        if (result.data) {
            this.events = result.data.map(event => {
                let isFull = event.Available_Seats__c <= 0;
                
                let startDate = event.Start_Date__c ? new Date(event.Start_Date__c) : null;
                let formattedTime = startDate ? startDate.toLocaleDateString() : 'Date TBA';

                // Calculate progress bar style
                let capacity = event.Capacity__c || 1;
                let available = event.Available_Seats__c || 0;
                let booked = capacity - available;
                let percentBooked = (booked / capacity) * 100;
                let progressStyle = `width: ${percentBooked}%`;

                // Calculate status pill class
                let statusClass = 'status-badge default';
                if (event.Status__c === 'Published') {
                    statusClass = 'status-badge published';
                } else if (event.Status__c === 'Draft') {
                    statusClass = 'status-badge draft';
                } else if (event.Status__c === 'Cancelled') {
                    statusClass = 'status-badge cancelled';
                }

                return {
                    ...event,
                    isFull: isFull,
                    buttonLabel: isFull ? 'Full' : 'Register',
                    formattedTime: formattedTime,
                    progressStyle: progressStyle,
                    statusClass: statusClass
                };
            });
            this.hasEvents = this.events.length > 0;
            this.isLoading = false;
        } else if (result.error) {
            this.showToast('Error', 'Failed to load events. ' + result.error.body.message, 'error');
            this.isLoading = false;
        }
    }

    handleRegister(event) {
        const eventId = event.target.dataset.id;
        if (!eventId) return;

        const defaultValues = encodeDefaultFieldValues({
            Event__c: eventId
        });

        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Registration__c',
                actionName: 'new'
            },
            state: {
                defaultFieldValues: defaultValues
            }
        });
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }
}