import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import getStaffRecords from '@salesforce/apex/StaffController.getStaffRecords';

export default class StaffDashboard extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;
    @api limitSize = 4; // Display 4 staff members by default in the dashboard

    @track staffList = [];
    isEditing = false;
    editRecordId = null;

    @wire(getStaffRecords, { limitSize: '$limitSize' })
    wiredStaff({ error, data }) {
        if (data) {
            this.staffList = data.map(staff => {
                let hasLeaveDetails = staff.Leave_Start_Date__c != null || staff.Leave_End_Date__c != null || (staff.Leave_Count__c && staff.Leave_Count__c > 0);
                let badgeClass = staff.Status__c === 'Active' 
                    ? 'slds-badge slds-theme_success slds-p-horizontal_medium slds-p-vertical_xx-small status-badge' 
                    : 'slds-badge slds-theme_error slds-p-horizontal_medium slds-p-vertical_xx-small status-badge';
                
                return {
                    ...staff,
                    hasLeaveDetails: hasLeaveDetails,
                    staffStatusBadgeClass: badgeClass,
                    name: staff.Name__c || 'Unknown Staff',
                    staffId: staff.ID__c || 'N/A',
                    license: staff.Licensenum__c || 'N/A',
                    experience: staff.experience__c || 'N/A',
                    status: staff.Status__c || 'Unknown',
                    contactNum: staff.Contact_Number__c || 'N/A',
                    email: staff.Email__c || '',
                    leaveStartDate: staff.Leave_Start_Date__c,
                    leaveEndDate: staff.Leave_End_Date__c,
                    leaveCount: staff.Leave_Count__c || 0
                };
            });
        } else if (error) {
            console.error('Error fetching staff records:', error);
            this.staffList = [];
        }
    }

    handleEditProfile(event) {
        this.editRecordId = event.target.dataset.id;
        this.isEditing = true;
    }

    closeModal() {
        this.isEditing = false;
        this.editRecordId = null;
    }

    handleSuccess(event) {
        this.isEditing = false;
        this.editRecordId = null;
        const toastEvent = new ShowToastEvent({
            title: 'Success',
            message: 'Staff profile saved successfully!',
            variant: 'success',
        });
        this.dispatchEvent(toastEvent);
    }

    handleSeeMore() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Staff__c',
                actionName: 'list'
            },
            state: {
                filterName: 'Recent'
            }
        });
    }
}