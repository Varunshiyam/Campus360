import { LightningElement, wire } from 'lwc';
import getDashboardData from '@salesforce/apex/HostelDashboardController.getDashboardData';

export default class HostelCommandCenter extends LightningElement {

    totalStudents = 0;
    availableRooms = 0;
    pendingComplaints = 0;
    foodTokens = 0;

    complaints = [
        {
            id: 1,
            student: 'Rahul',
            category: 'WiFi',
            status: 'Open'
        },
        {
            id: 2,
            student: 'Priya',
            category: 'Cleaning',
            status: 'In Progress'
        },
        {
            id: 3,
            student: 'Arun',
            category: 'Electrical',
            status: 'Resolved'
        }
    ];

    todayMenu = [
        {
            id: 1,
            name: '🥞 Breakfast - Idly & Sambar'
        },
        {
            id: 2,
            name: '🍛 Lunch - Rice, Sambar & Potato Fry'
        },
        {
            id: 3,
            name: '🥪 Snacks - Sandwich'
        },
        {
            id: 4,
            name: '🍲 Dinner - Chapathi & Kurma'
        }
    ];

    @wire(getDashboardData)
    wiredDashboard({ error, data }) {

        if (data) {

            this.totalStudents = data.totalStudents;
            this.availableRooms = data.availableRooms;
            this.pendingComplaints = data.pendingComplaints;
            this.foodTokens = data.foodTokens;

        }
        else if (error) {

            console.error(error);

        }

    }

}