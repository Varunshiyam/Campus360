import { LightningElement, track } from "lwc";
import LightningConfirm from "lightning/confirm";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import checkPrincipalExists from "@salesforce/apex/UnifiedCampusPortalController.checkPrincipalExists";
import getPrincipalName from "@salesforce/apex/UnifiedCampusPortalController.getPrincipalName";
import registerPrincipal from "@salesforce/apex/UnifiedCampusPortalController.registerPrincipal";
import loginUser from "@salesforce/apex/UnifiedCampusPortalController.loginUser";
import getDashboardOverview from "@salesforce/apex/UnifiedCampusPortalController.getDashboardOverview";
import getDepartmentList from "@salesforce/apex/UnifiedCampusPortalController.getDepartmentList";
import getDepartmentDetails from "@salesforce/apex/UnifiedCampusPortalController.getDepartmentDetails";
import changeDepartmentHOD from "@salesforce/apex/UnifiedCampusPortalController.changeDepartmentHOD";
import getFacultyDetails from "@salesforce/apex/UnifiedCampusPortalController.getFacultyDetails";
import saveFacultyDetails from "@salesforce/apex/UnifiedCampusPortalController.saveFacultyDetails";
import getLeaveRequests from "@salesforce/apex/UnifiedCampusPortalController.getLeaveRequests";
import updateLeaveStatus from "@salesforce/apex/UnifiedCampusPortalController.updateLeaveStatus";
import savePrincipalProfile from "@salesforce/apex/UnifiedCampusPortalController.savePrincipalProfile";
import submitLeaveRequest from "@salesforce/apex/UnifiedCampusPortalController.submitLeaveRequest";
import toggleStudentAttendance from "@salesforce/apex/UnifiedCampusPortalController.toggleStudentAttendance";
import postAnnouncement from "@salesforce/apex/UnifiedCampusPortalController.postAnnouncement";
import seedDatabase from "@salesforce/apex/UnifiedCampusPortalController.seedDatabase";
import addDepartment from "@salesforce/apex/UnifiedCampusPortalController.addDepartment";
import addHOD from "@salesforce/apex/UnifiedCampusPortalController.addHOD";
import addFaculty from "@salesforce/apex/UnifiedCampusPortalController.addFaculty";
import deleteFaculty from "@salesforce/apex/UnifiedCampusPortalController.deleteFaculty";
import deleteHOD from "@salesforce/apex/UnifiedCampusPortalController.deleteHOD";
import deleteDepartment from "@salesforce/apex/UnifiedCampusPortalController.deleteDepartment";

export default class LoginPortal extends LightningElement {
  @track modalErrorMessage = "";
  // Add Record Modals & Forms
  @track showAddDeptModal = false;
  @track showAddHodModal = false;
  @track showAddFacultyModal = false;

  @track newDeptForm = {
    name: "",
    code: "",
    block: "",
    email: "",
    phone: "",
    type: "UG"
  };

  @track newHodForm = {
    name: "",
    email: "",
    phone: "",
    employeeId: "",
    departmentId: "",
    username: "",
    password: "",
    experience: 5
  };

  @track newFacForm = {
    name: "",
    email: "",
    phone: "",
    designation: "Professor",
    qualification: "",
    experience: 5,
    departmentId: "",
    username: "",
    password: "",
    dob: ""
  };

  deptTypeOptions = [
    { label: "UG", value: "UG" },
    { label: "PG", value: "PG" }
  ];

  designationOptions = [
    { label: "Professor", value: "Professor" },
    { label: "Assistant Professor", value: "Assistant Professor" }
  ];

  get deptOptions() {
    return this.departments.map((dept) => {
      return { label: dept.name, value: dept.id };
    });
  }

  // Navigation & Views
  @track showRoleSelection = true;
  @track showLoginForm = false;
  @track showRegisterView = false;
  @track showDashboardView = false;

  // Roles & Session
  @track selectedRole = "";
  @track currentUserId = "";
  @track currentUserSession = {};

  // State indicators
  @track loading = false;
  @track loginErrorMessage = "";
  @track registerErrorMessage = "";
  @track currentTime = "";
  @track livePulse = "Operational";

  // Seeding Status
  @track principalExists = false;
  @track existingPrincipalName = "";

  // Dashboard Overview Stats
  @track stats = {
    departmentsCount: 0,
    hodsCount: 0,
    facultyCount: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0
  };

  // Lists
  @track departments = [];
  @track leaveRequests = [];
  @track announcementItems = [];
  @track sendToHOD = true;
  @track sendToFaculty = true;
  @track timetableEntries = [];
  @track attendanceRecords = [
    { id: "1", name: "Aarav Sharma", status: "Present" },
    { id: "2", name: "Meera Nair", status: "Present" },
    { id: "3", name: "Rohan Gupta", status: "Present" }
  ];

  // Modals & Details
  @track showDeptModal = false;
  @track selectedDept = {};
  @track newHodId = "";
  @track hodCandidates = [];

  @track showFacultyModal = false;
  @track selectedFaculty = {};
  @track facultyEditForm = {
    name: "",
    email: "",
    phone: "",
    qualification: "",
    designation: "",
    experience: ""
  };

  @track showProfileModal = false;
  @track profileEditForm = {
    name: "",
    email: "",
    phone: "",
    qualification: "",
    address: "",
    experience: ""
  };

  // Registration inputs
  @track regFields = {
    fullName: "",
    employeeId: "",
    mobileNumber: "",
    email: "",
    gender: "Male",
    dob: "",
    qualification: "",
    experience: "",
    address: "",
    username: "",
    password: "",
    confirmPassword: "",
    photo: ""
  };

  // Standard Login inputs
  @track loginUsername = "";
  @track loginPassword = "";

  // Form inputs (Leave & Announcement creation)
  @track leaveEmployee = "";
  @track leaveReason = "";
  @track leaveType = "";
  @track leaveFromDate = "";
  @track leaveToDate = "";
  @track announceTitle = "";
  @track announceMessage = "";

  // Options for Picklists
  genderOptions = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" }
  ];

  connectedCallback() {
    this.updateClock();
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.intervalId = window.setInterval(() => this.updateClock(), 1000);
    this.livePulse = this.getPulseLabel();

    // Auto-seed the database on load so that the application is fully functional
    seedDatabase()
      .then(() => {
        console.log("Database auto-seeded successfully.");
      })
      .catch((error) => {
        console.error("Error auto-seeding database:", error);
      });
  }

  disconnectedCallback() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }

  updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    this.livePulse = this.getPulseLabel();
  }

  getPulseLabel() {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning Shift";
    if (hour < 17) return "Afternoon Shift";
    return "Evening Shift";
  }

  get greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }

  get displayName() {
    if (this.currentUserSession && this.currentUserSession.name) {
      return this.currentUserSession.name;
    }
    return this.selectedRole || "Guest";
  }

  get isPrincipal() {
    return this.selectedRole === "Principal";
  }

  get isHod() {
    return this.selectedRole === "HOD";
  }

  get isFaculty() {
    return this.selectedRole === "Faculty";
  }

  get hodLeaveRequests() {
    return this.leaveRequests.filter(req => req.requesterRole === 'HOD');
  }

  get pendingHodLeaves() {
    return this.leaveRequests.filter(req => req.requesterRole === 'HOD' && req.isPending);
  }

  get historyHodLeaves() {
    return this.leaveRequests.filter(req => req.requesterRole === 'HOD' && !req.isPending);
  }

  get facultyLeaveRequests() {
    if (!this.currentUserSession || !this.currentUserSession.departmentId) {
      return [];
    }
    const hodDeptId = this.currentUserSession.departmentId;
    return this.leaveRequests.filter(req => req.requesterRole === 'Faculty' && req.departmentId === hodDeptId);
  }

  get pendingFacultyLeaves() {
    if (!this.currentUserSession || !this.currentUserSession.departmentId) {
      return [];
    }
    const hodDeptId = this.currentUserSession.departmentId;
    return this.leaveRequests.filter(req => req.requesterRole === 'Faculty' && req.departmentId === hodDeptId && req.isPending);
  }

  get historyFacultyLeaves() {
    if (!this.currentUserSession || !this.currentUserSession.departmentId) {
      return [];
    }
    const hodDeptId = this.currentUserSession.departmentId;
    return this.leaveRequests.filter(req => req.requesterRole === 'Faculty' && req.departmentId === hodDeptId && !req.isPending);
  }

  get myLeaveRequests() {
    if (!this.currentUserSession || !this.currentUserSession.name) {
      return [];
    }
    return this.leaveRequests.filter(req => req.employeeName === this.currentUserSession.name);
  }

  get assignedApproverName() {
    if (this.selectedRole === 'HOD') {
      return 'Principal';
    }
    if (this.selectedRole === 'Faculty' && this.currentUserSession && this.currentUserSession.departmentId) {
      const myDept = this.departments.find(d => d.id === this.currentUserSession.departmentId);
      return myDept && myDept.hodName !== 'N/A' ? myDept.hodName : 'Department HOD';
    }
    return 'N/A';
  }

  get leaveTypeOptions() {
    return [
      { label: "Casual Leave", value: "Casual" },
      { label: "Sick Leave", value: "Sick" },
      { label: "Study Leave", value: "Study" },
      { label: "Personal Leave", value: "Personal" }
    ];
  }

  get attendancePercent() {
    const total = (this.stats.presentToday || 0) + (this.stats.absentToday || 0);
    if (total === 0) return 0;
    return Math.round((this.stats.presentToday / total) * 100);
  }

  get attendanceDashoffset() {
    const pct = this.attendancePercent;
    return 314 - (314 * pct) / 100;
  }

  get processedDepartments() {
    if (!this.departments) return [];
    const maxFaculty = this.departments.reduce((max, dept) => Math.max(max, dept.facultyCount || 0), 0) || 1;
    
    return this.departments.map(dept => {
      const pct = dept.attendancePercent || 0;
      let badgeColor = 'rgba(197, 160, 89, 0.15)'; // gold
      let textColor = '#a27e3d';
      if (pct >= 90) {
        badgeColor = 'rgba(74, 117, 89, 0.15)'; // soft green
        textColor = '#4a7559';
      } else if (pct < 75) {
        badgeColor = 'rgba(169, 68, 66, 0.15)'; // soft red
        textColor = '#a94442';
      }
      
      const widthPercent = Math.round(((dept.facultyCount || 0) / maxFaculty) * 100);
      
      return {
        ...dept,
        barStyle: `width: ${widthPercent}%; background: linear-gradient(90deg, #cbd5e1 0%, #c5a059 100%);`,
        badgeStyle: `background-color: ${badgeColor}; color: ${textColor};`,
        statusClass: pct >= 90 ? 'status-badge status-excellent' : (pct < 75 ? 'status-badge status-warning' : 'status-badge status-normal'),
        statusText: pct >= 90 ? 'Excellent' : (pct < 75 ? 'Low Attendance' : 'Good')
      };
    });
  }

  get showLoginFormView() {
    return (
      this.showLoginForm && !this.showDashboardView && !this.showRegisterView
    );
  }

  get isAbsenceRemarksRequired() {
    return false;
  }

  // Role Selection Action
  handleRoleSelect(event) {
    const role = event.currentTarget.dataset.role;
    this.selectedRole = role;
    this.loginUsername = "";
    this.loginPassword = "";
    this.loginErrorMessage = "";

    if (role === "Principal") {
      this.loading = true;
      checkPrincipalExists()
        .then((exists) => {
          this.principalExists = exists;
          if (exists) {
            return getPrincipalName();
          }
          return "";
        })
        .then((name) => {
          this.existingPrincipalName = name;
          this.loading = false;
          if (this.principalExists) {
            this.showLoginForm = true;
            this.showRoleSelection = false;
          } else {
            // First-time setup flow
            this.showRegisterView = true;
            this.showRoleSelection = false;
          }
        })
        .catch((err) => {
          this.loading = false;
          this.showToast(
            "Error",
            "Unable to check Principal status: " + err.body.message,
            "error"
          );
        });
    } else {
      this.showLoginForm = true;
      this.showRoleSelection = false;
    }
  }

  handleBack() {
    this.showRoleSelection = true;
    this.showLoginForm = false;
    this.showRegisterView = false;
    this.showDashboardView = false;
    this.selectedRole = "";
    this.loginErrorMessage = "";
    this.registerErrorMessage = "";
  }

  // Handle standard login inputs
  handleLoginUsernameChange(event) {
    this.loginUsername = event.target.value;
  }

  handleLoginPasswordChange(event) {
    this.loginPassword = event.target.value;
  }

  // Login logic calling Apex
  handleLogin() {
    this.loginErrorMessage = "";
    if (!this.loginUsername || !this.loginPassword) {
      this.loginErrorMessage = "Please enter both username and password.";
      return;
    }

    this.loading = true;
    loginUser({
      role: this.selectedRole,
      username: this.loginUsername,
      password: this.loginPassword
    })
      .then((sessionData) => {
        this.currentUserSession = sessionData;
        this.leaveEmployee = sessionData.name;
        this.currentUserId = sessionData.id;
        this.showLoginForm = false;
        this.showDashboardView = true;
        this.showToast(
          "Success",
          `Logged in successfully as ${sessionData.name}`,
          "success"
        );
        this.refreshWorkspaceData();
      })
      .catch((err) => {
        this.loginErrorMessage =
          err.body.message || "Invalid username or password.";
      })
      .finally(() => {
        this.loading = false;
      });
  }

  // Load/Refresh Dashboard details
  refreshWorkspaceData() {
    this.loading = true;
    getDashboardOverview()
      .then((overviewStats) => {
        this.stats = overviewStats;
        return getDepartmentList();
      })
      .then((deptList) => {
        this.departments = deptList;
        return getLeaveRequests({ role: this.selectedRole, userId: this.currentUserId });
      })
      .then((leaves) => {
        this.leaveRequests = leaves.map(item => {
          let statusClass = 'status-pill';
          if (item.status === 'Pending') {
            statusClass += ' status-yellow';
          } else if (item.status === 'Approved') {
            statusClass += ' status-green';
          } else if (item.status === 'Rejected') {
            statusClass += ' status-red';
          }
          return {
            ...item,
            isPending: item.status === 'Pending',
            statusClass: statusClass
          };
        });
        // Seed some announcement items from metadata/records if empty
        this.announcementItems = [
          {
            id: "1",
            title: "Mid-Term Timetable Released",
            detail: "Check the timetable tab for details.",
            date: "Today",
            postedBy: "Principal"
          },
          {
            id: "2",
            title: "Academic Audit Meeting",
            detail: "HOD conference room at 2:00 PM.",
            date: "Today",
            postedBy: "Principal"
          }
        ];
      })
      .catch((err) => {
        this.showToast(
          "Error",
          "Failed to retrieve dashboard data: " + err.body.message,
          "error"
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  // Principal Registration field changes
  handleRegFieldChange(event) {
    const field = event.target.dataset.id;
    this.regFields[field] = event.target.value;
  }

  // Save/Register Principal (First-Time Flow)
  handlePrincipalRegister() {
    this.registerErrorMessage = "";
    if (
      !this.regFields.fullName ||
      !this.regFields.employeeId ||
      !this.regFields.username ||
      !this.regFields.password
    ) {
      this.registerErrorMessage =
        "Please fill out all required fields (Full Name, Employee ID, Username, Password).";
      return;
    }
    if (this.regFields.password !== this.regFields.confirmPassword) {
      this.registerErrorMessage = "Passwords do not match.";
      return;
    }

    this.loading = true;
    registerPrincipal({ data: this.regFields })
      .then((result) => {
        if (result === "OK") {
          this.showToast(
            "Success",
            "Principal account created successfully! Please log in.",
            "success"
          );
          this.showRegisterView = false;
          this.showLoginForm = true;
          this.principalExists = true;
          this.existingPrincipalName = this.regFields.fullName;
        }
      })
      .catch((err) => {
        this.registerErrorMessage = err.body.message;
      })
      .finally(() => {
        this.loading = false;
      });
  }

  // View Profile modal
  openProfileModal() {
    this.profileEditForm = {
      name: this.currentUserSession.name,
      email: this.currentUserSession.email,
      phone: this.currentUserSession.phone,
      qualification: this.currentUserSession.qualification || "",
      address: this.currentUserSession.address || "",
      experience: this.currentUserSession.experience || ""
    };
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  handleProfileFieldChange(event) {
    const field = event.target.dataset.id;
    this.profileEditForm[field] = event.target.value;
  }

  saveProfile() {
    this.loading = true;
    savePrincipalProfile({
      principalId: this.currentUserId,
      fields: this.profileEditForm
    })
      .then(() => {
        this.showToast("Success", "Profile updated successfully!", "success");
        this.currentUserSession = {
          ...this.currentUserSession,
          name: this.profileEditForm.name,
          email: this.profileEditForm.email,
          phone: this.profileEditForm.phone,
          qualification: this.profileEditForm.qualification,
          address: this.profileEditForm.address,
          experience: this.profileEditForm.experience
        };
        this.showProfileModal = false;
      })
      .catch((err) => {
        this.showToast(
          "Error",
          "Failed to save profile: " + err.body.message,
          "error"
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  // Department details view modal
  openDepartmentDetails(event) {
    const deptId = event.currentTarget.dataset.id;
    this.loading = true;
    getDepartmentDetails({ deptId: deptId })
      .then((details) => {
        this.selectedDept = details;
        this.hodCandidates = details.candidates || [];

        // Construct timetable entries for this department
        this.timetableEntries = details.timetable || [];

        this.showDeptModal = true;
      })
      .catch((err) => {
        this.showToast(
          "Error",
          "Failed to retrieve department details: " + err.body.message,
          "error"
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  closeDeptModal() {
    this.showDeptModal = false;
  }

  handleHODChange(event) {
    this.newHodId = event.detail.value;
  }

  submitHODAssignment() {
    if (!this.newHodId) {
      this.showToast(
        "Warning",
        "Please select a faculty member to assign as HOD.",
        "warning"
      );
      return;
    }

    this.loading = true;
    changeDepartmentHOD({
      departmentId: this.selectedDept.id,
      facultyId: this.newHodId
    })
      .then(() => {
        this.showToast(
          "Success",
          "Department HOD changed successfully!",
          "success"
        );
        this.showDeptModal = false;
        this.refreshWorkspaceData();
      })
      .catch((err) => {
        this.showToast(
          "Error",
          "Failed to change HOD: " + err.body.message,
          "error"
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  // Faculty Details Modal
  openFacultyDetails(event) {
    const facultyId = event.currentTarget.dataset.id;
    this.loading = true;
    getFacultyDetails({ facultyId: facultyId })
      .then((fac) => {
        this.selectedFaculty = fac;
        this.facultyEditForm = {
          name: fac.name,
          email: fac.email,
          phone: fac.phone,
          qualification: fac.qualification || "",
          designation: fac.designation || "",
          experience: fac.experience || ""
        };
        this.showFacultyModal = true;
      })
      .catch((err) => {
        this.showToast(
          "Error",
          "Failed to load faculty details: " + err.body.message,
          "error"
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  closeFacultyModal() {
    this.showFacultyModal = false;
  }

  handleFacultyFieldChange(event) {
    const field = event.target.dataset.id;
    this.facultyEditForm[field] = event.target.value;
  }

  submitFacultyEdit() {
    this.loading = true;
    saveFacultyDetails({
      facultyId: this.selectedFaculty.id,
      fields: this.facultyEditForm
    })
      .then(() => {
        this.showToast(
          "Success",
          "Faculty details updated successfully!",
          "success"
        );
        this.showFacultyModal = false;

        // If department details modal is open, refresh its data
        if (this.showDeptModal) {
          this.getUpdatedDepartmentDetails(this.selectedDept.id);
        } else {
          this.refreshWorkspaceData();
        }
      })
      .catch((err) => {
        this.showToast(
          "Error",
          "Failed to update faculty details: " + err.body.message,
          "error"
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  getUpdatedDepartmentDetails(deptId) {
    getDepartmentDetails({ deptId: deptId })
      .then((details) => {
        this.selectedDept = details;
        this.hodCandidates = details.candidates || [];
      })
      .catch((err) => {
        console.error(err);
      });
  }

  // Leave request action
  handleLeaveAction(event) {
    const leaveId = event.currentTarget.dataset.id;
    const action = event.currentTarget.dataset.action; // 'Approved' or 'Rejected'

    // Retrieve comments
    const commentArea = this.template.querySelector(`lightning-textarea[data-id="${leaveId}"]`);
    const comments = commentArea ? commentArea.value : '';

    this.loading = true;
    updateLeaveStatus({
      leaveId: leaveId,
      status: action,
      approverId: this.currentUserId,
      comments: comments
    })
      .then(() => {
        this.showToast(
          "Success",
          `Leave request successfully ${action.toLowerCase()}!`,
          "success"
        );
        this.refreshWorkspaceData();
      })
      .catch((err) => {
        this.showToast(
          "Error",
          "Failed to process leave request: " + err.body.message,
          "error"
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  // Submit Leave Request (For Faculty view/HOD view)
  handleLeaveSubmit() {
    if (!this.leaveType || !this.leaveFromDate || !this.leaveToDate || !this.leaveReason) {
      this.showToast(
        "Warning",
        "Please fill in all required fields (Leave Type, Dates, and Reason).",
        "warning"
      );
      return;
    }

    this.loading = true;
    submitLeaveRequest({
      requesterId: this.currentUserId,
      role: this.selectedRole,
      leaveType: this.leaveType,
      fromDate: this.leaveFromDate,
      toDate: this.leaveToDate,
      reason: this.leaveReason
    })
      .then(() => {
        this.showToast(
          "Success",
          "Leave request submitted successfully!",
          "success"
        );
        this.leaveType = "";
        this.leaveFromDate = "";
        this.leaveToDate = "";
        this.leaveReason = "";
        this.refreshWorkspaceData();
      })
      .catch((err) => {
        this.showToast(
          "Error",
          "Failed to submit leave request: " + (err.body ? err.body.message : err.message),
          "error"
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  handleLeaveInput(event) {
    const fieldId = event.target.dataset.id;
    if (fieldId === "leaveEmployee") {
      this.leaveEmployee = event.target.value;
    } else if (fieldId === "leaveReason") {
      this.leaveReason = event.target.value;
    } else if (fieldId === "leaveType") {
      this.leaveType = event.target.value;
    } else if (fieldId === "leaveFromDate") {
      this.leaveFromDate = event.target.value;
    } else if (fieldId === "leaveToDate") {
      this.leaveToDate = event.target.value;
    }
  }

  // Toggle Attendance Board (For Faculty Role)
  handleAttendanceToggle(event) {
    const studentName = event.currentTarget.dataset.name;
    const currentStatus = event.currentTarget.dataset.status;
    const nextStatus = currentStatus === "Present" ? "Absent" : "Present";

    this.loading = true;
    toggleStudentAttendance({ studentName: studentName, status: nextStatus })
      .then(() => {
        // Update local list
        this.attendanceRecords = this.attendanceRecords.map((item) => {
          if (item.name === studentName) {
            return { ...item, status: nextStatus };
          }
          return item;
        });
        this.showToast(
          "Success",
          `Attendance updated for ${studentName} to ${nextStatus}`,
          "success"
        );
      })
      .catch((err) => {
        this.showToast(
          "Error",
          "Failed to update attendance: " + err.body.message,
          "error"
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  // Announcement input changes
  handleAnnounceTitleChange(event) {
    this.announceTitle = event.target.value;
  }

  handleAnnounceMessageChange(event) {
    this.announceMessage = event.target.value;
  }

  handleSendToHODChange(event) {
    this.sendToHOD = event.target.checked;
  }

  handleSendToFacultyChange(event) {
    this.sendToFaculty = event.target.checked;
  }

  // Post announcement
  handlePostAnnouncement() {
    if (!this.announceTitle || !this.announceMessage) {
      this.showToast(
        "Warning",
        "Please fill out both Title and Message.",
        "warning"
      );
      return;
    }

    if (this.announceMessage.length < 20) {
      this.showToast(
        "Warning",
        "Announcement Message should contain at least 20 characters.",
        "warning"
      );
      return;
    }

    this.loading = true;
    postAnnouncement({
      title: this.announceTitle,
      message: this.announceMessage,
      postedBy: this.selectedRole,
      sendToHOD: this.sendToHOD,
      sendToFaculty: this.sendToFaculty
    })
      .then(() => {
        this.showToast(
          "Success",
          "Announcement posted successfully!",
          "success"
        );
        // Push local list
        this.announcementItems = [
          {
            id: Date.now().toString(),
            title: this.announceTitle,
            detail: this.announceMessage,
            date: "Just Now",
            postedBy: this.selectedRole
          },
          ...this.announcementItems
        ];
        this.announceTitle = "";
        this.announceMessage = "";
        this.sendToHOD = true;
        this.sendToFaculty = true;
      })
      .catch((err) => {
        this.showToast(
          "Error",
          "Failed to post announcement: " + err.body.message,
          "error"
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  // Logout Action
  handleLogout() {
    this.showDashboardView = false;
    this.showRoleSelection = true;
    this.selectedRole = "";
    this.currentUserSession = {};
    this.currentUserId = "";
    this.leaveEmployee = "";
    this.leaveReason = "";
    this.showToast("Success", "Logged out successfully.", "success");
  }

  // Helper Toast Method
  showToast(title, message, variant) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(evt);
  }

  handleImageError(event) {
    event.target.src =
      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  }

  // Add Buttons Handlers
  openAddDeptModal() {
    this.modalErrorMessage = "";
    this.newDeptForm = {
      name: "",
      code: "",
      block: "",
      email: "",
      phone: "",
      type: "UG"
    };
    this.modalErrorMessage = "";
    this.showAddDeptModal = true;
  }
  closeAddDeptModal() {
    this.showAddDeptModal = false;
  }
  openAddHodModal() {
    this.modalErrorMessage = "";
    this.newHodForm = {
      name: "",
      email: "",
      phone: "",
      employeeId: "",
      departmentId: "",
      username: "",
      password: "",
      experience: 5
    };
    this.modalErrorMessage = "";
    this.showAddHodModal = true;
  }
  closeAddHodModal() {
    this.showAddHodModal = false;
  }
  openAddFacultyModal() {
    this.modalErrorMessage = "";
    this.newFacForm = {
      name: "",
      email: "",
      phone: "",
      designation: "Professor",
      qualification: "",
      experience: 5,
      departmentId: "",
      username: "",
      password: "",
      dob: ""
    };
    this.modalErrorMessage = "";
    this.showAddFacultyModal = true;
  }
  closeAddFacultyModal() {
    this.showAddFacultyModal = false;
  }

  handleNewDeptFieldChange(event) {
    this.newDeptForm[event.target.dataset.id] = event.target.value;
  }
  handleNewHodFieldChange(event) {
    this.newHodForm[event.target.dataset.id] = event.target.value;
  }
  handleNewFacFieldChange(event) {
    this.newFacForm[event.target.dataset.id] = event.target.value;
  }

  submitNewDepartment() {
    this.modalErrorMessage = "";
    if (!this.newDeptForm.name || !this.newDeptForm.code) {
      this.modalErrorMessage = "Please fill in all required fields (*).";
      this.showToast("Error", this.modalErrorMessage, "error");
      return;
    }
    this.loading = true;
    addDepartment({
      name: this.newDeptForm.name,
      code: this.newDeptForm.code,
      block: this.newDeptForm.block,
      email: this.newDeptForm.email,
      phone: this.newDeptForm.phone,
      type: this.newDeptForm.type
    })
      .then(() => {
        this.showToast("Success", "Department added successfully.", "success");
        this.showAddDeptModal = false;
        this.refreshWorkspaceData();
      })
      .catch((err) => {
        this.modalErrorMessage =
          err && err.body && err.body.message
            ? err.body.message
            : err && err.message
              ? err.message
              : "Failed to add department";
        this.showToast("Error", this.modalErrorMessage, "error");
      })
      .finally(() => {
        this.loading = false;
      });
  }

  submitNewHOD() {
    this.modalErrorMessage = "";
    if (
      !this.newHodForm.name ||
      !this.newHodForm.email ||
      !this.newHodForm.employeeId ||
      !this.newHodForm.departmentId ||
      !this.newHodForm.username ||
      !this.newHodForm.password
    ) {
      this.modalErrorMessage = "Please fill in all required fields (*).";
      this.showToast("Error", this.modalErrorMessage, "error");
      return;
    }
    this.loading = true;
    addHOD({
      name: this.newHodForm.name,
      email: this.newHodForm.email,
      phone: this.newHodForm.phone,
      employeeId: this.newHodForm.employeeId,
      departmentId: this.newHodForm.departmentId,
      username: this.newHodForm.username,
      password: this.newHodForm.password,
      experience: this.newHodForm.experience
        ? parseInt(this.newHodForm.experience, 10)
        : null
    })
      .then(() => {
        this.showToast("Success", "HOD added successfully.", "success");
        this.showAddHodModal = false;
        this.refreshWorkspaceData();
      })
      .catch((err) => {
        this.modalErrorMessage =
          err && err.body && err.body.message
            ? err.body.message
            : err && err.message
              ? err.message
              : "Failed to add HOD";
        this.showToast("Error", this.modalErrorMessage, "error");
      })
      .finally(() => {
        this.loading = false;
      });
  }

  submitNewFaculty() {
    this.modalErrorMessage = "";
    if (
      !this.newFacForm.name ||
      !this.newFacForm.email ||
      !this.newFacForm.designation ||
      !this.newFacForm.departmentId ||
      !this.newFacForm.username ||
      !this.newFacForm.password
    ) {
      this.modalErrorMessage = "Please fill in all required fields (*).";
      this.showToast("Error", this.modalErrorMessage, "error");
      return;
    }
    this.loading = true;
    addFaculty({
      name: this.newFacForm.name,
      email: this.newFacForm.email,
      phone: this.newFacForm.phone,
      designation: this.newFacForm.designation,
      qualification: this.newFacForm.qualification,
      experience: this.newFacForm.experience
        ? parseInt(this.newFacForm.experience, 10)
        : null,
      departmentId: this.newFacForm.departmentId,
      username: this.newFacForm.username,
      password: this.newFacForm.password,
      dob: this.newFacForm.dob
    })
      .then(() => {
        this.showToast("Success", "Faculty added successfully.", "success");
        this.showAddFacultyModal = false;
        this.refreshWorkspaceData();
      })
      .catch((err) => {
        this.modalErrorMessage =
          err && err.body && err.body.message
            ? err.body.message
            : err && err.message
              ? err.message
              : "Failed to add Faculty";
        this.showToast("Error", this.modalErrorMessage, "error");
      })
      .finally(() => {
        this.loading = false;
      });
  }

  // Deletion UI Handlers
  async removeFaculty() {
    const result = await LightningConfirm.open({
      message: "Are you sure you want to remove this faculty member?",
      label: "Remove Faculty",
      theme: "warning"
    });
    if (result) {
      this.loading = true;
      deleteFaculty({ facultyId: this.selectedFaculty.id })
        .then(() => {
          this.showToast("Success", "Faculty member removed successfully.", "success");
          this.showFacultyModal = false;
          this.showDeptModal = false;
          this.refreshWorkspaceData();
        })
        .catch((err) => {
          this.showToast("Error", err.body.message || "Failed to remove faculty member", "error");
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }

  async removeHOD() {
    const result = await LightningConfirm.open({
      message: "Are you sure you want to remove this HOD?",
      label: "Remove HOD",
      theme: "warning"
    });
    if (result) {
      this.loading = true;
      deleteHOD({ hodId: this.selectedDept.hodId })
        .then(() => {
          this.showToast("Success", "HOD removed successfully.", "success");
          this.showDeptModal = false;
          this.refreshWorkspaceData();
        })
        .catch((err) => {
          this.showToast("Error", err.body.message || "Failed to remove HOD", "error");
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }

  async removeDepartment() {
    const result = await LightningConfirm.open({
      message: "Are you sure you want to delete this department and all its associated staff?",
      label: "Delete Department",
      theme: "warning"
    });
    if (result) {
      this.loading = true;
      deleteDepartment({ deptId: this.selectedDept.id })
        .then(() => {
          this.showToast("Success", "Department deleted successfully.", "success");
          this.showDeptModal = false;
          this.refreshWorkspaceData();
        })
        .catch((err) => {
          this.showToast("Error", err.body.message || "Failed to delete department", "error");
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
}