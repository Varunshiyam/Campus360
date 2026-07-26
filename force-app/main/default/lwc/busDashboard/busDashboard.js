import { LightningElement, track, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

export default class BusDashboard extends LightningElement {
    @api recordId;
    @api objectApiName;
    
    @api status = 'Under Construction';
    @api busName = 'Campus Express - Route A';
    @api isStaffAvailable = false;
    @api driverStatus = 'Available';
    @api damagedParts = '';

    get fieldNames() {
        if (this.objectApiName) {
            return [`${this.objectApiName}.No_of_Seats_Occupied__c`, `${this.objectApiName}.Total_Capacity__c`];
        }
        return undefined;
    }

    @wire(getRecord, { recordId: '$recordId', fields: '$fieldNames' })
    busRecord;

    get occupiedSeats() {
        if (this.busRecord && this.busRecord.data && this.objectApiName) {
            return getFieldValue(this.busRecord.data, `${this.objectApiName}.No_of_Seats_Occupied__c`);
        }
        return 0;
    }

    get totalSeats() {
        if (this.busRecord && this.busRecord.data && this.objectApiName) {
            return getFieldValue(this.busRecord.data, `${this.objectApiName}.Total_Capacity__c`);
        }
        return 0;
    }

    // Mock data for the rest of the bus details.
    @track busData = {
        name: 'Campus Express - Route A',
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        manufacturer: 'Volvo',
        model: 'B11R',
        year: '2023',
        chassisNumber: 'VLV-9876543210'
    };

    isEditing = false;

    handleEdit() {
        this.isEditing = true;
    }

    closeModal() {
        this.isEditing = false;
    }

    handleSuccess(event) {
        this.isEditing = false;
        const evt = new ShowToastEvent({
            title: 'Success',
            message: 'Bus details updated successfully!',
            variant: 'success',
        });
        this.dispatchEvent(evt);
    }

    get isUnderConstruction() {
        return this.status === 'Under Construction';
    }

    // Dynamically returns badge color based on bus status
    get statusBadgeClass() {
        if (this.status === 'Active') {
            return 'slds-badge slds-theme_success slds-p-horizontal_medium slds-p-vertical_xx-small status-badge';
        }
        if (this.status === 'Inactive') {
            return 'slds-badge slds-theme_error slds-p-horizontal_medium slds-p-vertical_xx-small status-badge';
        }
        return 'slds-badge slds-theme_warning slds-p-horizontal_medium slds-p-vertical_xx-small status-badge';
    }

    // Formats a list of days for the UI, highlighting the active working days
    get weekDays() {
        const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return allDays.map(day => {
            const isWorkingDay = this.busData.workingDays.includes(day);
            return {
                label: day,
                isActive: isWorkingDay,
                class: isWorkingDay 
                    ? 'slds-badge slds-theme_success day-badge active-day' 
                    : 'slds-badge day-badge inactive-day'
            };
        });
    }
}