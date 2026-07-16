import { LightningElement, track, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { getRecord } from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import basePath from "@salesforce/community/basePath";
import USER_ID from "@salesforce/user/Id";
import USER_NAME_FIELD from "@salesforce/schema/User.Name";
import getFinanceDashboardData from "@salesforce/apex/StudentPortalController.getFinanceDashboardData";

export default class FinanceDashboard extends NavigationMixin(
  LightningElement
) {
  @track totalStudents = "";
  @track totalFees = "";
  @track totalCollection = "";
  @track pendingAmount = "";
  @track scholarships = "";

  @track collectedPercentage = 0;
  @track pendingPercentage = 0;

  @track onlinePercentage = 0;
  @track upiPercentage = 0;
  @track cardPercentage = 0;
  @track transferPercentage = 0;

  @track btechPending = "";
  @track mbaPending = "";
  @track bcomPending = "";
  @track bscPending = "";
  @track othersPending = "";

  @track recentRequests = [];
  @track isLoading = true;

  // Tab lists data
  @track studentList = [];
  @track feeList = [];
  @track paymentList = [];
  @track scholarshipList = [];
  @track certificateRequests = [];
  @track complaintRequests = [];
  @track idCardRequests = [];

  // Navigation and tabs control
  @track activeTab = "dashboards";

  // Current User Data
  @wire(getRecord, { recordId: USER_ID, fields: [USER_NAME_FIELD] })
  currentUser;

  get currentUserName() {
    return this.currentUser && this.currentUser.data
      ? this.currentUser.data.fields.Name.value
      : "System Admin";
  }

  get organizationName() {
    return "Karpagam College of Engineering (KCE)";
  }

  get todaysDate() {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  wiredDashboardResult;

  @wire(getFinanceDashboardData)
  wiredDashboardData(result) {
    this.wiredDashboardResult = result;
    this.isLoading = true;
    const { error, data } = result;
    if (data) {
      this.totalStudents = data.totalStudents;
      this.totalFees = data.totalFees;
      this.totalCollection = data.totalCollection;
      this.pendingAmount = data.pendingAmount;
      this.scholarships = data.scholarships;

      this.collectedPercentage = data.collectedPercentage;
      this.pendingPercentage = data.pendingPercentage;

      this.onlinePercentage = data.onlinePercentage;
      this.upiPercentage = data.upiPercentage;
      this.cardPercentage = data.cardPercentage;
      this.transferPercentage = data.transferPercentage;

      this.btechPending = data.btechPending;
      this.mbaPending = data.mbaPending;
      this.bcomPending = data.bcomPending;
      this.bscPending = data.bscPending;
      this.othersPending = data.othersPending;

      this.recentRequests = data.recentRequests || [];

      // Tab lists data from Apex with safe relation mappings
      this.studentList = data.studentList || [];
      this.feeList = (data.feeList || []).map((fee) => {
        return {
          ...fee,
          StudentName: fee.Student__r ? fee.Student__r.Name : "Guest Student"
        };
      });
      this.paymentList = data.paymentList || [];
      this.scholarshipList = (data.scholarshipList || []).map((sch) => {
        return {
          ...sch,
          StudentName: sch.Student1__r ? sch.Student1__r.Name : "Guest Student"
        };
      });
      this.certificateRequests = data.certificateRequests || [];
      this.complaintRequests = (data.complaintRequests || []).map((comp) => {
        return {
          ...comp,
          StudentName: comp.Student1__r
            ? comp.Student1__r.Name
            : "Guest Student"
        };
      });
      this.idCardRequests = data.idCardRequests || [];

      this.isLoading = false;
    } else if (error) {
      console.error("Error fetching finance dashboard data:", error);
      this.isLoading = false;
    }
  }

  // Dynamic styles for summary cards
  get studentsCountValue() {
    return this.totalStudents && this.totalStudents !== 4256
      ? this.totalStudents
      : 3;
  }

  get feeRecordsCountValue() {
    return this.feeList && this.feeList.length > 0 ? this.feeList.length : 3;
  }

  get paymentsReceivedCountValue() {
    return this.paymentList && this.paymentList.length > 0
      ? this.paymentList.length
      : 2;
  }

  get pendingPaymentsCountValue() {
    const pendingCount = this.feeList
      ? this.feeList.filter((f) => f.Status__c === "Pending").length
      : 0;
    return pendingCount > 0 ? pendingCount : 1;
  }

  get scholarshipsCountValue() {
    return this.scholarshipList && this.scholarshipList.length > 0
      ? this.scholarshipList.length
      : 1;
  }

  // --------------------------------------------------------
  // Charts Getters
  // --------------------------------------------------------

  // Chart 1: Fee Status (Paid vs Pending) -> Donut Chart
  get feeStatusDonutStyle() {
    const fees = this.feeList || [];
    const paidCount = fees.filter(
      (f) =>
        f.Status__c === "Paid" ||
        f.Status__c === "Success" ||
        f.Status__c === "Completed"
    ).length;
    const pendingCount = fees.filter(
      (f) => f.Status__c === "Pending" || f.Status__c === "Draft"
    ).length;

    let paidPct = 75; // Default mock
    let pendingPct = 25; // Default mock

    if (fees.length > 0) {
      const total = paidCount + pendingCount || 1;
      paidPct = Math.round((paidCount / total) * 100);
      pendingPct = 100 - paidPct;
    }

    this._feeStatusPaid = paidPct;
    this._feeStatusPending = pendingPct;

    return `background: conic-gradient(
            #1b5299 0% ${paidPct}%, 
            #1b5299 ${paidPct}% 100%
        );`;
  }
  get feeStatusPaid() {
    return this._feeStatusPaid !== undefined ? this._feeStatusPaid : 75;
  }
  get feeStatusPending() {
    return this._feeStatusPending !== undefined ? this._feeStatusPending : 25;
  }
  get feePaidCount() {
    const fees = this.feeList || [];
    return fees.filter(
      (f) =>
        f.Status__c === "Paid" ||
        f.Status__c === "Success" ||
        f.Status__c === "Completed"
    ).length;
  }
  get feePendingCount() {
    const fees = this.feeList || [];
    return fees.filter(
      (f) => f.Status__c === "Pending" || f.Status__c === "Draft"
    ).length;
  }

  // Chart 2: Payment Methods (Cash, UPI, Card, Bank Transfer) -> Pie Chart
  get paymentMethodsPieStyle() {
    const payments = this.paymentList || [];
    const cash = payments.filter((p) => p.Payment_Method__c === "Cash").length;
    const upi = payments.filter((p) => p.Payment_Method__c === "UPI").length;
    const card = payments.filter(
      (p) =>
        p.Payment_Method__c === "Card" || p.Payment_Method__c === "Credit Card"
    ).length;
    const bank = payments.filter(
      (p) =>
        p.Payment_Method__c === "Bank Transfer" ||
        p.Payment_Method__c === "Net Banking" ||
        p.Payment_Method__c === "Transfer"
    ).length;

    let cashPct = 15;
    let upiPct = 45;
    let cardPct = 25;
    let bankPct = 15;

    if (payments.length > 0) {
      const total = cash + upi + card + bank || 1;
      cashPct = Math.round((cash / total) * 100);
      upiPct = Math.round((upi / total) * 100);
      cardPct = Math.round((card / total) * 100);
      bankPct = 100 - (cashPct + upiPct + cardPct);
    }

    this._payCash = cashPct;
    this._payUpi = upiPct;
    this._payCard = cardPct;
    this._payBank = bankPct;

    const limit1 = cashPct;
    const limit2 = limit1 + upiPct;
    const limit3 = limit2 + cardPct;

    return `background: conic-gradient(
            #2ecc71 0% ${limit1}%, 
            #0abde3 ${limit1}% ${limit2}%, 
            #ff6b81 ${limit2}% ${limit3}%, 
            #1b5299 ${limit3}% 100%
        );`;
  }
  get payCash() {
    return this._payCash !== undefined ? this._payCash : 15;
  }
  get payUpi() {
    return this._payUpi !== undefined ? this._payUpi : 45;
  }
  get payCard() {
    return this._payCard !== undefined ? this._payCard : 25;
  }
  get payBank() {
    return this._payBank !== undefined ? this._payBank : 15;
  }
  get payCashCount() {
    const payments = this.paymentList || [];
    return payments.filter((p) => p.Payment_Method__c === "Cash").length;
  }
  get payUpiCount() {
    const payments = this.paymentList || [];
    return payments.filter((p) => p.Payment_Method__c === "UPI").length;
  }
  get payCardCount() {
    const payments = this.paymentList || [];
    return payments.filter(
      (p) =>
        p.Payment_Method__c === "Card" || p.Payment_Method__c === "Credit Card"
    ).length;
  }
  get payBankCount() {
    const payments = this.paymentList || [];
    return payments.filter(
      (p) =>
        p.Payment_Method__c === "Bank Transfer" ||
        p.Payment_Method__c === "Net Banking" ||
        p.Payment_Method__c === "Transfer"
    ).length;
  }

  // Chart 3: Certificate Requests (Pending, Approved, Rejected) -> Bar Chart
  get certRequestsBarStats() {
    const certs = this.certificateRequests || [];
    const pending = certs.filter(
      (c) =>
        c.Status__c === "Pending" ||
        c.Status__c === "New" ||
        c.Status__c === "In Progress"
    ).length;
    const approved = certs.filter(
      (c) => c.Status__c === "Approved" || c.Status__c === "Completed"
    ).length;
    const rejected = certs.filter(
      (c) => c.Status__c === "Rejected" || c.Status__c === "Declined"
    ).length;

    let pendingPct = 30;
    let approvedPct = 60;
    let rejectedPct = 10;

    if (certs.length > 0) {
      const total = pending + approved + rejected || 1;
      pendingPct = Math.round((pending / total) * 100);
      approvedPct = Math.round((approved / total) * 100);
      rejectedPct = 100 - (pendingPct + approvedPct);
    }

    return [
      {
        label: "Pending",
        pct: pendingPct,
        style: `height: ${pendingPct}%; background-color: #1b5299;`
      },
      {
        label: "Approved",
        pct: approvedPct,
        style: `height: ${approvedPct}%; background-color: #1b5299;`
      },
      {
        label: "Rejected",
        pct: rejectedPct,
        style: `height: ${rejectedPct}%; background-color: #ef4444;`
      }
    ];
  }

  // Chart 4: Complaint Status (Open, In Progress, Resolved) -> Donut Chart
  get complaintStatusDonutStyle() {
    const comps = this.complaintRequests || [];
    const open = comps.filter(
      (c) => c.Status__c === "Open" || c.Status__c === "New"
    ).length;
    const inProgress = comps.filter(
      (c) => c.Status__c === "In Progress"
    ).length;
    const resolved = comps.filter(
      (c) =>
        c.Status__c === "Resolved" ||
        c.Status__c === "Closed" ||
        c.Status__c === "Completed"
    ).length;

    let openPct = 25;
    let ipPct = 35;
    let resPct = 40;

    if (comps.length > 0) {
      const total = open + inProgress + resolved || 1;
      openPct = Math.round((open / total) * 100);
      ipPct = Math.round((inProgress / total) * 100);
      resPct = 100 - (openPct + ipPct);
    }

    this._compOpen = openPct;
    this._compIp = ipPct;
    this._compRes = resPct;

    const limit1 = openPct;
    const limit2 = limit1 + ipPct;

    return `background: conic-gradient(
            #ef4444 0% ${limit1}%, 
            #1b5299 ${limit1}% ${limit2}%, 
            #10b981 ${limit2}% 100%
        );`;
  }
  get compOpen() {
    return this._compOpen !== undefined ? this._compOpen : 25;
  }
  get compIp() {
    return this._compIp !== undefined ? this._compIp : 35;
  }
  get compRes() {
    return this._compRes !== undefined ? this._compRes : 40;
  }

  // Chart 5: ID Card Requests (Pending, Approved, Issued) -> Horizontal Bar Chart
  get idCardRequestsHorizontalStats() {
    const idCards = this.idCardRequests || [];
    const pending = idCards.filter(
      (i) => i.Status__c === "Pending" || i.Status__c === "New"
    ).length;
    const approved = idCards.filter(
      (i) => i.Status__c === "Approved" || i.Status__c === "In Progress"
    ).length;
    const issued = idCards.filter(
      (i) => i.Status__c === "Issued" || i.Status__c === "Completed"
    ).length;

    let pendingPct = 20;
    let approvedPct = 50;
    let issuedPct = 30;

    if (idCards.length > 0) {
      const total = pending + approved + issued || 1;
      pendingPct = Math.round((pending / total) * 100);
      approvedPct = Math.round((approved / total) * 100);
      issuedPct = 100 - (pendingPct + approvedPct);
    }

    return [
      {
        label: "Pending",
        pct: pendingPct,
        style: `width: ${pendingPct}%; background-color: #1b5299;`
      },
      {
        label: "Approved",
        pct: approvedPct,
        style: `width: ${approvedPct}%; background-color: #3b82f6;`
      },
      {
        label: "Issued",
        pct: issuedPct,
        style: `width: ${issuedPct}%; background-color: #10b981;`
      }
    ];
  }

  // Chart 6: Scholarship Status (Applied, Approved, Rejected) -> Doughnut Chart
  get scholarshipDoughnutStyle() {
    const schs = this.scholarshipList || [];
    const applied = schs.filter(
      (s) =>
        s.Approval_Status__c === "Applied" ||
        s.Approval_Status__c === "New" ||
        s.Approval_Status__c === "Pending"
    ).length;
    const approved = schs.filter(
      (s) => s.Approval_Status__c === "Approved"
    ).length;
    const rejected = schs.filter(
      (s) =>
        s.Approval_Status__c === "Rejected" ||
        s.Approval_Status__c === "Declined"
    ).length;

    let appPct = 20;
    let apprvPct = 70;
    let rejPct = 10;

    if (schs.length > 0) {
      const total = applied + approved + rejected || 1;
      appPct = Math.round((applied / total) * 100);
      apprvPct = Math.round((approved / total) * 100);
      rejPct = 100 - (appPct + apprvPct);
    }

    this._schApp = appPct;
    this._schApprv = apprvPct;
    this._schRej = rejPct;

    const limit1 = appPct;
    const limit2 = limit1 + apprvPct;

    return `background: conic-gradient(
            #3b82f6 0% ${limit1}%, 
            #10b981 ${limit1}% ${limit2}%, 
            #ef4444 ${limit2}% 100%
        );`;
  }
  get schApp() {
    return this._schApp !== undefined ? this._schApp : 20;
  }
  get schApprv() {
    return this._schApprv !== undefined ? this._schApprv : 70;
  }
  get schRej() {
    return this._schRej !== undefined ? this._schRej : 10;
  }

  // Dynamic getters for new 2x2 redesigned charts layout
  get serviceRequestsBarStats() {
    const certs = (this.certificateRequests || []).length;
    const comps = (this.complaintRequests || []).length;
    const idCards = (this.idCardRequests || []).length;

    const maxVal = Math.max(certs, comps, idCards, 1);

    const certPct = Math.round((certs / maxVal) * 100);
    const compPct = Math.round((comps / maxVal) * 100);
    const idCardPct = Math.round((idCards / maxVal) * 100);

    return [
      {
        label: "Certificates",
        count: certs,
        pct: certPct,
        style: `height: ${certPct}%; background-color: #1b5299;`
      },
      {
        label: "Complaints",
        count: comps,
        pct: compPct,
        style: `height: ${compPct}%; background-color: #e2a106;`
      },
      {
        label: "ID Cards",
        count: idCards,
        pct: idCardPct,
        style: `height: ${idCardPct}%; background-color: #3b82f6;`
      }
    ];
  }

  get complaintStatusHorizontalStats() {
    const comps = this.complaintRequests || [];
    const open = comps.filter(
      (c) => c.Status__c === "Open" || c.Status__c === "New"
    ).length;
    const inProgress = comps.filter(
      (c) => c.Status__c === "In Progress"
    ).length;
    const resolved = comps.filter(
      (c) =>
        c.Status__c === "Resolved" ||
        c.Status__c === "Closed" ||
        c.Status__c === "Completed"
    ).length;

    const total = open + inProgress + resolved || 1;

    const openPct = Math.round((open / total) * 100);
    const ipPct = Math.round((inProgress / total) * 100);
    const resPct = 100 - (openPct + ipPct);

    return [
      {
        label: "Open",
        count: open,
        pct: openPct,
        style: `width: ${openPct}%; background-color: #ea001e;`
      },
      {
        label: "In Progress",
        count: inProgress,
        pct: ipPct,
        style: `width: ${ipPct}%; background-color: #e2a106;`
      },
      {
        label: "Resolved",
        count: resolved,
        pct: resPct,
        style: `width: ${resPct}%; background-color: #2e7d32;`
      }
    ];
  }

  get totalRequestsCount() {
    return (
      (this.certificateRequests || []).length +
      (this.complaintRequests || []).length +
      (this.idCardRequests || []).length
    );
  }

  get totalComplaintsCount() {
    return (this.complaintRequests || []).length;
  }

  // --------------------------------------------------------
  // Tab active state flags
  // --------------------------------------------------------
  get isHome() {
    return this.activeTab === "home";
  }
  get isDashboards() {
    return this.activeTab === "dashboards";
  }
  get isStudents() {
    return this.activeTab === "students";
  }
  get isFinance() {
    return this.activeTab === "finance";
  }
  get isOffice() {
    return this.activeTab === "office";
  }
  get isScholarships() {
    return this.activeTab === "scholarships";
  }

  // Sidebar active class mapping
  get homeClass() {
    return this.activeTab === "home" ? "nav-item active" : "nav-item";
  }
  get dashboardsClass() {
    return this.activeTab === "dashboards" ? "nav-item active" : "nav-item";
  }
  get studentsClass() {
    return this.activeTab === "students" ? "nav-item active" : "nav-item";
  }
  get financeClass() {
    return this.activeTab === "finance" ? "nav-item active" : "nav-item";
  }
  get officeClass() {
    return this.activeTab === "office" ? "nav-item active" : "nav-item";
  }
  get scholarshipsClass() {
    return this.activeTab === "scholarships" ? "nav-item active" : "nav-item";
  }

  // Dynamic header title mapping
  get pageTitle() {
    return "Finance & Office Management Dashboard";
  }

  get pageSubtitle() {
    return "Salesforce CRM";
  }

  // Tab click handler
  handleTabClick(event) {
    event.preventDefault();
    const tab = event.currentTarget.dataset.tab;
    if (tab) {
      this.activeTab = tab;
    }
  }

  // Quick Action button handler
  handleQuickAction(event) {
    const tab = event.currentTarget.dataset.tab;
    if (tab) {
      this.activeTab = tab;
    }
  }

  // --------------------------------------------------------
  // Quick Actions Navigation
  // --------------------------------------------------------

  @track showAddStudentModal = false;
  @track showRecordPaymentModal = false;

  handleAddStudent() {
    this.showAddStudentModal = true;
  }

  closeAddStudentModal() {
    this.showAddStudentModal = false;
  }

  handleAddStudentSuccess() {
    this.showAddStudentModal = false;
    this.showToast(
      "Success",
      "Student profile created successfully.",
      "success"
    );
    return refreshApex(this.wiredDashboardResult);
  }

  handleRecordPayment() {
    this.showRecordPaymentModal = true;
  }

  closeRecordPaymentModal() {
    this.showRecordPaymentModal = false;
  }

  handleRecordPaymentSuccess() {
    this.showRecordPaymentModal = false;
    this.showToast(
      "Success",
      "Payment transaction logged successfully.",
      "success"
    );
    return refreshApex(this.wiredDashboardResult);
  }

  handleCertificateRequest() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: basePath + "/certificate-request"
      }
    });
  }

  handleRegisterComplaint() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: basePath + "/complaint"
      }
    });
  }

  handleIdCardRequest() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: basePath + "/id-card-request"
      }
    });
  }

  showToast(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
      })
    );
  }
}