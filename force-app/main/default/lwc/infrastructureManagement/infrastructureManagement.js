import { LightningElement } from 'lwc';

export default class InfrastructureManagement extends LightningElement {

    // Default tab
    isComplaint = true;
    isFeedback = false;
    isEmployee = false;
    isTool = false;
    isDashboard = false;

    // Active tab classes
    complaintClass = 'tab active';
    feedbackClass = 'tab';
    employeeClass = 'tab';
    toolClass = 'tab';
    dashboardClass = 'tab';

    resetTabs() {
        this.isComplaint = false;
        this.isFeedback = false;
        this.isEmployee = false;
        this.isTool = false;
        this.isDashboard = false;

        this.complaintClass = 'tab';
        this.feedbackClass = 'tab';
        this.employeeClass = 'tab';
        this.toolClass = 'tab';
        this.dashboardClass = 'tab';
    }

    showComplaint() {
        this.resetTabs();
        this.isComplaint = true;
        this.complaintClass = 'tab active';
    }

    showFeedback() {
        this.resetTabs();
        this.isFeedback = true;
        this.feedbackClass = 'tab active';
    }

    showEmployee() {
        this.resetTabs();
        this.isEmployee = true;
        this.employeeClass = 'tab active';
    }

    showTool() {
        this.resetTabs();
        this.isTool = true;
        this.toolClass = 'tab active';
    }

    showDashboard() {
        this.resetTabs();
        this.isDashboard = true;
        this.dashboardClass = 'tab active';
    }
}