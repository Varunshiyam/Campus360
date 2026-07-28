import { LightningElement, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getDashboardSummary from '@salesforce/apex/CampusHostelHubController.getDashboardSummary';
import getAllStudentsList from '@salesforce/apex/CampusHostelHubController.getAllStudentsList';
import getAllHostelsList from '@salesforce/apex/CampusHostelHubController.getAllHostelsList';
import getAllRoomsList from '@salesforce/apex/CampusHostelHubController.getAllRoomsList';
import getAllBedAllocationsList from '@salesforce/apex/CampusHostelHubController.getAllBedAllocationsList';
import getRecentComplaints from '@salesforce/apex/CampusHostelHubController.getRecentComplaints';
import getTodayFoodTokens from '@salesforce/apex/CampusHostelHubController.getTodayFoodTokens';
import getRecentVisitors from '@salesforce/apex/CampusHostelHubController.getRecentVisitors';
import getFeePendingStudents from '@salesforce/apex/CampusHostelHubController.getFeePendingStudents';
import getPendingLeaveRequests from '@salesforce/apex/CampusHostelHubController.getPendingLeaveRequests';
import getAllAttendanceList from '@salesforce/apex/CampusHostelHubController.getAllAttendanceList';
import getRoomOccupancySummary from '@salesforce/apex/CampusHostelHubController.getRoomOccupancySummary';
import getStudentOptions from '@salesforce/apex/CampusHostelHubController.getStudentOptions';

import createComplaint from '@salesforce/apex/CampusHostelHubController.createComplaint';
import issueFoodToken from '@salesforce/apex/CampusHostelHubController.issueFoodToken';
import registerVisitor from '@salesforce/apex/CampusHostelHubController.registerVisitor';
import resolveComplaint from '@salesforce/apex/CampusHostelHubController.resolveComplaint';

export default class CampusHostelHub extends LightningElement {
    @track activeNav = 'dashboard';
    @track isSidebarCollapsed = false;
    @track isViewLoading = false;

    @track summary = {
        totalStudents: 0,
        totalHostels: 0,
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        pendingComplaints: 0,
        complaintsResolvedToday: 0,
        foodTokensIssuedToday: 0,
        todaysVisitors: 0,
        feePendingStudents: 0
    };

    @track studentsList = [];
    @track hostelsList = [];
    @track roomsList = [];
    @track bedAllocations = [];
    @track complaints = [];
    @track foodTokens = [];
    @track visitors = [];
    @track feePendingList = [];
    @track leaves = [];
    @track attendanceList = [];
    @track roomSummaries = [];
    @track studentOptions = [];

    isLoading = true;
    isRefreshing = false;
    lastRefreshedTime = '';

    // Modal Control States
    isComplaintModalOpen = false;
    isFoodTokenModalOpen = false;
    isVisitorModalOpen = false;

    // Form Field Values
    selectedStudentId = '';
    complaintCategory = 'Electrical';
    complaintPriority = 'High';
    complaintDescription = '';

    mealType = 'Lunch';
    menuItem = 'Standard Meals';

    visitorName = '';
    visitorRelation = 'Parents';
    visitorPhone = '';
    visitorPurpose = 'Visit Student';

    // Picklists
    categoryOptions = [
        { label: 'Electrical', value: 'Electrical' },
        { label: 'Plumbing', value: 'Plumbing' },
        { label: 'Food Quality', value: 'Food Quality' },
        { label: 'Cleanliness', value: 'Cleanliness' },
        { label: 'Internet / Wi-Fi', value: 'Internet / Wi-Fi' },
        { label: 'Other', value: 'Other' }
    ];

    priorityOptions = [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
    ];

    mealTypeOptions = [
        { label: 'Breakfast', value: 'Breakfast' },
        { label: 'Lunch', value: 'Lunch' },
        { label: 'Snacks', value: 'Snacks' },
        { label: 'Dinner', value: 'Dinner' }
    ];

    relationOptions = [
        { label: 'Parents', value: 'Parents' },
        { label: 'Friends', value: 'Friends' },
        { label: 'Relative', value: 'Relative' },
        { label: 'Other', value: 'Other' }
    ];

    // Wire Results Storage
    wiredSummaryResult;
    wiredStudentsResult;
    wiredHostelsResult;
    wiredRoomsResult;
    wiredAllocationsResult;
    wiredComplaintsResult;
    wiredTokensResult;
    wiredVisitorsResult;
    wiredFeesResult;
    wiredLeavesResult;
    wiredAttendanceResult;
    wiredRoomSummariesResult;

    connectedCallback() {
        this.updateRefreshedTime();
    }

    updateRefreshedTime() {
        const now = new Date();
        this.lastRefreshedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // NAVIGATION SWITCHING HANDLER
    handleNavSelect(event) {
        const targetNav = event.currentTarget.dataset.nav;
        if (targetNav === this.activeNav) return;
        
        this.isViewLoading = true;
        this.activeNav = targetNav;
        
        setTimeout(() => {
            this.isViewLoading = false;
        }, 150);
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    // VIEW STATE GETTERS
    get isDashboardView() { return this.activeNav === 'dashboard'; }
    get isStudentsView() { return this.activeNav === 'students'; }
    get isHostelsView() { return this.activeNav === 'hostels'; }
    get isRoomsView() { return this.activeNav === 'rooms'; }
    get isBedAllocationsView() { return this.activeNav === 'allocations'; }
    get isComplaintsView() { return this.activeNav === 'complaints'; }
    get isFoodTokensView() { return this.activeNav === 'tokens'; }
    get isVisitorsView() { return this.activeNav === 'visitors'; }
    get isHostelFeesView() { return this.activeNav === 'fees'; }
    get isLeaveRequestsView() { return this.activeNav === 'leaves'; }
    get isAttendanceView() { return this.activeNav === 'attendance'; }
    get isSettingsView() { return this.activeNav === 'settings'; }

    get viewTitle() {
        const titles = {
            dashboard: 'Dashboard Overview',
            students: 'Student Directory',
            hostels: 'Hostel Blocks & Infrastructure',
            rooms: 'Room & Bed Inventory',
            allocations: 'Bed Allocation Register',
            complaints: 'Complaints & Support Tickets',
            tokens: 'Mess Food Token System',
            visitors: 'Gate Visitor Log',
            fees: 'Hostel Fee Accounting',
            leaves: 'Leave & Outing Requests',
            attendance: 'Daily Student Attendance',
            settings: 'System Configuration & Settings'
        };
        return titles[this.activeNav] || 'Smart Hostel Management System';
    }

    get sidebarClass() {
        return this.isSidebarCollapsed ? 'app-sidebar collapsed' : 'app-sidebar';
    }

    get navItems() {
        const items = [
            { id: 'dashboard', label: 'Dashboard', icon: 'utility:home' },
            { id: 'students', label: 'Students', icon: 'utility:people' },
            { id: 'hostels', label: 'Hostels', icon: 'utility:company' },
            { id: 'rooms', label: 'Rooms', icon: 'utility:preview' },
            { id: 'allocations', label: 'Bed Allocations', icon: 'utility:layers' },
            { id: 'complaints', label: 'Complaints', icon: 'utility:warning' },
            { id: 'tokens', label: 'Food Tokens', icon: 'utility:note' },
            { id: 'visitors', label: 'Visitors', icon: 'utility:groups' },
            { id: 'fees', label: 'Hostel Fees', icon: 'utility:currency' },
            { id: 'leaves', label: 'Leave Requests', icon: 'utility:event' },
            { id: 'attendance', label: 'Attendance', icon: 'utility:checkin' },
            { id: 'settings', label: 'Settings', icon: 'utility:settings' }
        ];

        return items.map(item => ({
            ...item,
            class: item.id === this.activeNav ? 'nav-item active' : 'nav-item'
        }));
    }

    // WIRES
    @wire(getDashboardSummary)
    wiredSummary(result) {
        this.wiredSummaryResult = result;
        if (result.data) {
            this.summary = { ...this.summary, ...result.data };
            this.isLoading = false;
        }
    }

    @wire(getAllStudentsList)
    wiredStudents(result) {
        this.wiredStudentsResult = result;
        if (result.data) this.studentsList = result.data;
    }

    @wire(getAllHostelsList)
    wiredHostels(result) {
        this.wiredHostelsResult = result;
        if (result.data) this.hostelsList = result.data;
    }

    @wire(getAllRoomsList)
    wiredRooms(result) {
        this.wiredRoomsResult = result;
        if (result.data) this.roomsList = result.data;
    }

    @wire(getAllBedAllocationsList)
    wiredAllocations(result) {
        this.wiredAllocationsResult = result;
        if (result.data) this.bedAllocations = result.data;
    }

    @wire(getRecentComplaints)
    wiredComplaints(result) {
        this.wiredComplaintsResult = result;
        if (result.data) {
            this.complaints = result.data.map(c => ({
                ...c,
                priorityClass: `status-pill priority-${(c.priority || 'medium').toLowerCase()}`,
                statusClass: `status-pill status-${(c.status || 'new').toLowerCase().replace(' ', '-')}`,
                isPending: c.status !== 'Resolved'
            }));
        }
    }

    @wire(getTodayFoodTokens)
    wiredTokens(result) {
        this.wiredTokensResult = result;
        if (result.data) {
            this.foodTokens = result.data.map(ft => ({
                ...ft,
                statusClass: `status-pill status-${(ft.status || 'booked').toLowerCase()}`
            }));
        }
    }

    @wire(getRecentVisitors)
    wiredVisitors(result) {
        this.wiredVisitorsResult = result;
        if (result.data) {
            this.visitors = result.data.map(v => ({
                ...v,
                statusLabel: v.status ? 'Checked In' : 'Checked Out',
                statusClass: v.status ? 'status-pill status-resolved' : 'status-pill status-new'
            }));
        }
    }

    @wire(getFeePendingStudents)
    wiredFees(result) {
        this.wiredFeesResult = result;
        if (result.data) this.feePendingList = result.data;
    }

    @wire(getPendingLeaveRequests)
    wiredLeaves(result) {
        this.wiredLeavesResult = result;
        if (result.data) {
            this.leaves = result.data.map(l => ({
                ...l,
                statusClass: `status-pill status-${(l.status || 'pending').toLowerCase()}`
            }));
        }
    }

    @wire(getAllAttendanceList)
    wiredAttendance(result) {
        this.wiredAttendanceResult = result;
        if (result.data) this.attendanceList = result.data;
    }

    @wire(getRoomOccupancySummary)
    wiredRoomSummaries(result) {
        this.wiredRoomSummariesResult = result;
        if (result.data) {
            this.roomSummaries = result.data.map(h => {
                let colorClass = 'low';
                if (h.occupancyPercentage > 80) colorClass = 'high';
                else if (h.occupancyPercentage > 50) colorClass = 'medium';

                return {
                    ...h,
                    barStyle: `width: ${h.occupancyPercentage}%;`,
                    barClass: `bar-inner ${colorClass}`
                };
            });
        }
    }

    @wire(getStudentOptions)
    wiredStudentOptions({ data }) {
        if (data) {
            this.studentOptions = data.map(s => {
                const sName = (s.Student_Name__c && s.Student_Name__c !== '') ? s.Student_Name__c : s.Name;
                const regNo = (s.Register_Number__c && s.Register_Number__c !== '') ? s.Register_Number__c : (s.Student_Id__c ? s.Student_Id__c : 'REG-100' + s.Id.substring(15));
                return {
                    label: `${sName} (${regNo})`,
                    value: s.Id
                };
            });
            if (this.studentOptions.length > 0 && !this.selectedStudentId) {
                this.selectedStudentId = this.studentOptions[0].value;
            }
        }
    }

    // REFRESH DATA
    async handleRefresh() {
        this.isRefreshing = true;
        try {
            await Promise.all([
                refreshApex(this.wiredSummaryResult),
                refreshApex(this.wiredStudentsResult),
                refreshApex(this.wiredHostelsResult),
                refreshApex(this.wiredRoomsResult),
                refreshApex(this.wiredAllocationsResult),
                refreshApex(this.wiredComplaintsResult),
                refreshApex(this.wiredTokensResult),
                refreshApex(this.wiredVisitorsResult),
                refreshApex(this.wiredFeesResult),
                refreshApex(this.wiredLeavesResult),
                refreshApex(this.wiredAttendanceResult),
                refreshApex(this.wiredRoomSummariesResult)
            ]);
            this.updateRefreshedTime();
            this.showToast('Success', 'SPA views updated with live Salesforce data', 'success');
        } catch (error) {
            this.showToast('Error', 'Failed to refresh data', 'error');
        } finally {
            this.isRefreshing = false;
        }
    }

    // MODAL CONTROL
    openComplaintModal() { this.isComplaintModalOpen = true; }
    closeComplaintModal() { this.isComplaintModalOpen = false; }

    openFoodTokenModal() { this.isFoodTokenModalOpen = true; }
    closeFoodTokenModal() { this.isFoodTokenModalOpen = false; }

    openVisitorModal() { this.isVisitorModalOpen = true; }
    closeVisitorModal() { this.isVisitorModalOpen = false; }

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        if (field === 'student') this.selectedStudentId = event.detail.value;
        else if (field === 'category') this.complaintCategory = event.detail.value;
        else if (field === 'priority') this.complaintPriority = event.detail.value;
        else if (field === 'description') this.complaintDescription = event.detail.value;
        else if (field === 'mealType') this.mealType = event.detail.value;
        else if (field === 'menuItem') this.menuItem = event.detail.value;
        else if (field === 'visitorName') this.visitorName = event.detail.value;
        else if (field === 'relation') this.visitorRelation = event.detail.value;
        else if (field === 'phone') this.visitorPhone = event.detail.value;
        else if (field === 'purpose') this.visitorPurpose = event.detail.value;
    }

    async submitComplaint() {
        if (!this.selectedStudentId || !this.complaintDescription) {
            this.showToast('Warning', 'Select a student and description', 'warning');
            return;
        }
        this.isLoading = true;
        try {
            await createComplaint({
                studentId: this.selectedStudentId,
                category: this.complaintCategory,
                priority: this.complaintPriority,
                description: this.complaintDescription
            });
            this.showToast('Success', 'Complaint created successfully', 'success');
            this.closeComplaintModal();
            this.complaintDescription = '';
            await this.handleRefresh();
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : 'Failed to create complaint', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    async submitFoodToken() {
        if (!this.selectedStudentId) {
            this.showToast('Warning', 'Select a student', 'warning');
            return;
        }
        this.isLoading = true;
        try {
            await issueFoodToken({
                studentId: this.selectedStudentId,
                mealType: this.mealType,
                menuItem: this.menuItem
            });
            this.showToast('Success', 'Food Token issued successfully', 'success');
            this.closeFoodTokenModal();
            await this.handleRefresh();
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : 'Failed to issue token', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    async submitVisitor() {
        if (!this.selectedStudentId || !this.visitorName) {
            this.showToast('Warning', 'Enter visitor name and select student', 'warning');
            return;
        }
        this.isLoading = true;
        try {
            await registerVisitor({
                studentId: this.selectedStudentId,
                visitorName: this.visitorName,
                relation: this.visitorRelation,
                phone: this.visitorPhone,
                purpose: this.visitorPurpose
            });
            this.showToast('Success', 'Visitor registered successfully', 'success');
            this.closeVisitorModal();
            this.visitorName = '';
            await this.handleRefresh();
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : 'Failed to register visitor', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    async handleResolveComplaint(event) {
        const complaintId = event.detail.id || event.target.dataset.id;
        this.isLoading = true;
        try {
            await resolveComplaint({ complaintId });
            this.showToast('Success', 'Complaint marked as Resolved', 'success');
            await this.handleRefresh();
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : 'Failed to resolve complaint', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}