import { LightningElement, wire, track } from 'lwc';
import getEnrollmentSummary from '@salesforce/apex/LearningManagementController.getEnrollmentSummary';
import getRecentEnrollments from '@salesforce/apex/LearningManagementController.getRecentEnrollments';
import ceeLogo from '@salesforce/resourceUrl/ConnectedExecutiveEducationLogo';

export default class LearningManagementDashboard extends LightningElement {
    logoUrl = ceeLogo;

    @track summary = {
        totalEnrollments: 0,
        inProgress: 0,
        completed: 0,
        averageProgress: 0
    };

    @track enrollments = [];
    @track filteredEnrollments = [];
    @track searchTerm = '';
    @track errorMessage;

    wiredSummaryResult;
    wiredEnrollmentResult;

    @wire(getEnrollmentSummary)
    wiredSummary(value) {
        this.wiredSummaryResult = value;
        const { data, error } = value;
        if (data) {
            this.summary = data;
            this.errorMessage = undefined;
        } else if (error) {
            this.handleError(error);
        }
    }

    @wire(getRecentEnrollments, { limitSize: 15 })
    wiredEnrollments(value) {
        this.wiredEnrollmentResult = value;
        const { data, error } = value;
        if (data) {
            this.enrollments = data;
            this.filterEnrollments();
            this.errorMessage = undefined;
        } else if (error) {
            this.handleError(error);
        }
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.filterEnrollments();
    }

    filterEnrollments() {
        if (!this.searchTerm || this.searchTerm.trim() === '') {
            this.filteredEnrollments = this.enrollments;
            return;
        }

        const searchLower = this.searchTerm.toLowerCase().trim();
        this.filteredEnrollments = this.enrollments.filter(enrollment => {
            return (
                (enrollment.studentName && enrollment.studentName.toLowerCase().includes(searchLower)) ||
                (enrollment.studentEmail && enrollment.studentEmail.toLowerCase().includes(searchLower)) ||
                (enrollment.courseName && enrollment.courseName.toLowerCase().includes(searchLower)) ||
                (enrollment.courseCode && enrollment.courseCode.toLowerCase().includes(searchLower)) ||
                (enrollment.enrollmentNumber && enrollment.enrollmentNumber.toLowerCase().includes(searchLower))
            );
        });
    }

    handleError(error) {
        // Normalize Lightning / Apex error responses
        let message = 'An unexpected error occurred.';
        if (Array.isArray(error?.body)) {
            message = error.body.map((err) => err.message).join(', ');
        } else if (error?.body?.message) {
            message = error.body.message;
        } else if (error?.message) {
            message = error.message;
        }
        this.errorMessage = message;
    }

    get hasEnrollments() {
        return this.filteredEnrollments && this.filteredEnrollments.length > 0;
    }

    get summaryCards() {
        return [
            {
                label: 'Total Enrollments',
                value: this.summary.totalEnrollments,
                icon: 'standard:number_input'
            },
            {
                label: 'In Progress',
                value: this.summary.inProgress,
                icon: 'standard:process'
            },
            {
                label: 'Completed',
                value: this.summary.completed,
                icon: 'standard:task2'
            },
            {
                label: 'Avg Progress',
                value: `${this.summary.averageProgress || 0}%`,
                icon: 'standard:dashboard'
            }
        ];
    }
}