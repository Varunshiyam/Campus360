import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';

import getDashboardCounts
    from '@salesforce/apex/InfrastructureManagementController.getDashboardCounts';

import getEmployees
    from '@salesforce/apex/InfrastructureManagementController.getEmployees';

import getTools
    from '@salesforce/apex/InfrastructureManagementController.getTools';

import getComplaints
    from '@salesforce/apex/InfrastructureManagementController.getComplaints';

import getFeedbacks
    from '@salesforce/apex/InfrastructureManagementController.getFeedbacks';


export default class InfrastructureManagementDashboard
    extends LightningElement {


    // ==========================================
    // COUNTS
    // ==========================================

    employeeCount = 0;

    toolCount = 0;

    complaintCount = 0;

    feedbackCount = 0;


    // ==========================================
    // DATA
    // ==========================================

    employees = [];

    tools = [];

    complaints = [];

    feedbacks = [];


    // Default section
    activeSection = 'employees';

    isLoading = false;


    // Wire results for Refresh
    dashboardCountResult;

    employeeResult;

    toolResult;

    complaintResult;

    feedbackResult;


    // ==========================================
    // TABLE COLUMNS
    // ==========================================

    employeeColumns = [

        {
            label: 'Employee Name',
            fieldName: 'Name',
            type: 'text'
        },

        {
            label: 'Created Date',
            fieldName: 'CreatedDate',
            type: 'date'
        }

    ];


    toolColumns = [

        {
            label: 'Tool Name',
            fieldName: 'Name',
            type: 'text'
        },

        {
            label: 'Created Date',
            fieldName: 'CreatedDate',
            type: 'date'
        }

    ];


    complaintColumns = [

        {
            label: 'Complaint Name',
            fieldName: 'Name',
            type: 'text'
        },

        {
            label: 'Created Date',
            fieldName: 'CreatedDate',
            type: 'date'
        }

    ];


    feedbackColumns = [

        {
            label: 'Feedback Name',
            fieldName: 'Name',
            type: 'text'
        },

        {
            label: 'Created Date',
            fieldName: 'CreatedDate',
            type: 'date'
        }

    ];


    // ==========================================
    // DASHBOARD COUNTS
    // ==========================================

    @wire(getDashboardCounts)
    wiredDashboardCounts(result) {

        this.dashboardCountResult = result;

        const { data, error } = result;


        if (data) {

            this.employeeCount =
                data.employees || 0;

            this.toolCount =
                data.tools || 0;

            this.complaintCount =
                data.complaints || 0;

            this.feedbackCount =
                data.feedbacks || 0;

        }


        if (error) {

            console.error(
                'Dashboard Count Error',
                error
            );

        }

    }


    // ==========================================
    // EMPLOYEES
    // ==========================================

    @wire(getEmployees)
    wiredEmployees(result) {

        this.employeeResult = result;

        const { data, error } = result;


        if (data) {

            this.employees = data;

        }


        if (error) {

            console.error(
                'Employee Error',
                error
            );

        }

    }


    // ==========================================
    // TOOLS
    // ==========================================

    @wire(getTools)
    wiredTools(result) {

        this.toolResult = result;

        const { data, error } = result;


        if (data) {

            this.tools = data;

        }


        if (error) {

            console.error(
                'Tool Error',
                error
            );

        }

    }


    // ==========================================
    // COMPLAINTS
    // ==========================================

    @wire(getComplaints)
    wiredComplaints(result) {

        this.complaintResult = result;

        const { data, error } = result;


        if (data) {

            this.complaints = data;

        }


        if (error) {

            console.error(
                'Complaint Error',
                error
            );

        }

    }


    // ==========================================
    // FEEDBACK
    // ==========================================

    @wire(getFeedbacks)
    wiredFeedbacks(result) {

        this.feedbackResult = result;

        const { data, error } = result;


        if (data) {

            this.feedbacks = data;

        }


        if (error) {

            console.error(
                'Feedback Error',
                error
            );

        }

    }


    // ==========================================
    // NAVIGATION
    // ==========================================

    handleSectionChange(event) {

        this.activeSection =
            event.currentTarget.dataset.section;

    }


    // ==========================================
    // SHOW / HIDE SECTIONS
    // ==========================================

    get showEmployees() {

        return this.activeSection === 'employees';

    }


    get showTools() {

        return this.activeSection === 'tools';

    }


    get showComplaints() {

        return this.activeSection === 'complaints';

    }


    get showFeedback() {

        return this.activeSection === 'feedback';

    }


    // ==========================================
    // BUTTON CSS CLASSES
    // ==========================================

    get employeeButtonClass() {

        return this.activeSection === 'employees'
            ? 'nav-button active'
            : 'nav-button';

    }


    get toolButtonClass() {

        return this.activeSection === 'tools'
            ? 'nav-button active'
            : 'nav-button';

    }


    get complaintButtonClass() {

        return this.activeSection === 'complaints'
            ? 'nav-button active'
            : 'nav-button';

    }


    get feedbackButtonClass() {

        return this.activeSection === 'feedback'
            ? 'nav-button active'
            : 'nav-button';

    }


    // ==========================================
    // REFRESH
    // ==========================================

    async handleRefresh() {

        this.isLoading = true;


        try {

            await Promise.all([

                refreshApex(
                    this.dashboardCountResult
                ),

                refreshApex(
                    this.employeeResult
                ),

                refreshApex(
                    this.toolResult
                ),

                refreshApex(
                    this.complaintResult
                ),

                refreshApex(
                    this.feedbackResult
                )

            ]);


        } catch (error) {

            console.error(
                'Refresh Error',
                error
            );


        } finally {

            this.isLoading = false;

        }

    }

}