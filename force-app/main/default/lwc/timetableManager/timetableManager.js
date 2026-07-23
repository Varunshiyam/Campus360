import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getSubjectAllocations from '@salesforce/apex/UnifiedCampusPortalController.getSubjectAllocations';
import getFacultyWorkload from '@salesforce/apex/UnifiedCampusPortalController.getFacultyWorkload';
import getFacultyTimetable from '@salesforce/apex/UnifiedCampusPortalController.getFacultyTimetable';
import getDepartmentTimetable from '@salesforce/apex/UnifiedCampusPortalController.getDepartmentTimetable';
import saveTimetableEntry from '@salesforce/apex/UnifiedCampusPortalController.saveTimetableEntry';
import deleteTimetableEntry from '@salesforce/apex/UnifiedCampusPortalController.deleteTimetableEntry';
import generateFullTimetables from '@salesforce/apex/UnifiedCampusPortalController.generateFullTimetables';
import getDepartmentList from '@salesforce/apex/UnifiedCampusPortalController.getDepartmentList';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIOD_LIST = [
    { value: 1, timeLabel: '09:00 - 09:50' },
    { value: 2, timeLabel: '09:50 - 10:40' },
    { value: 3, timeLabel: '11:00 - 11:50' },
    { value: 4, timeLabel: '11:50 - 12:40' },
    { value: 5, timeLabel: '01:40 - 02:30' },
    { value: 6, timeLabel: '02:30 - 03:20' },
    { value: 7, timeLabel: '03:20 - 04:10' },
    { value: 8, timeLabel: '04:10 - 05:00' }
];

export default class TimetableManager extends LightningElement {
    @api role; // 'Principal', 'HOD', 'Faculty'
    @api departmentId; 
    @api facultyId;
    @api readOnly = false;
    @api leaveRequestTimetable = false;
    @api departments = []; // passed from parent

    @track selectedDeptId;
    @track selectedSection = 'Section A';
    @track selectedSemester = 'Semester 3';
    @track timetableEntries = [];
    @track workloads = [];
    @track subjects = [];

    // Modal state
    @track showModal = false;
    @track selectedDay;
    @track selectedPeriod;
    @track selectedEntryId;
    @track modalSubjectId;
    @track modalFacultyId;
    @track modalClassroom;
    @track modalError;
    @track conflictWarning;

    periods = PERIOD_LIST;
    loading = false;

    connectedCallback() {
        if (this.departmentId) {
            this.selectedDeptId = this.departmentId;
            this.refreshAll();
        } else if (this.departments && this.departments.length > 0) {
            this.selectedDeptId = this.departments[0].id;
            this.refreshAll();
        } else {
            getDepartmentList()
                .then(result => {
                    this.departments = result;
                    if (this.departments && this.departments.length > 0) {
                        this.selectedDeptId = this.departments[0].id;
                    }
                    this.refreshAll();
                })
                .catch(() => {
                    this.refreshAll();
                });
        }
    }

    @api
    refresh() {
        this.refreshAll();
    }

    refreshAll() {
        this.loading = true;
        const promises = [];

        if (this.isFacultyRole) {
            // Load specific faculty timetable
            if (this.facultyId) {
                promises.push(
                    getFacultyTimetable({ facultyId: this.facultyId })
                        .then(result => {
                            this.timetableEntries = result;
                        })
                );
            }
        } else {
            // Load department specific data
            if (this.selectedDeptId) {
                promises.push(
                    getDepartmentTimetable({ departmentId: this.selectedDeptId, section: this.selectedSection, semester: this.selectedSemester })
                        .then(result => {
                            this.timetableEntries = result;
                        })
                );
                promises.push(
                    getFacultyWorkload({ departmentId: this.selectedDeptId, semester: this.selectedSemester })
                        .then(result => {
                            this.workloads = result;
                        })
                );
                promises.push(
                    getSubjectAllocations({ departmentId: this.selectedDeptId })
                        .then(result => {
                            this.subjects = result;
                        })
                );
            }
        }

        Promise.all(promises)
            .catch(error => {
                this.showToast('Error', 'Failed to retrieve timetable data: ' + (error.body ? error.body.message : error.message), 'error');
            })
            .finally(() => {
                this.loading = false;
            });
    }

    // Getters
    get containerClass() {
        return this.leaveRequestTimetable ? 'timetable-container leave-compact' : 'timetable-container';
    }

    get isPrincipal() {
        return this.role === 'Principal';
    }

    get isFacultyRole() {
        return this.role === 'Faculty';
    }

    get showWorkloadPanel() {
        return !this.isFacultyRole && !this.leaveRequestTimetable && this.workloads && this.workloads.length > 0;
    }

    get isReadOnly() {
        return this.readOnly === 'true' || this.readOnly === true || this.role === 'Faculty';
    }

    get gridTitle() {
        if (this.isFacultyRole) {
            return `Weekly Teaching Schedule (${this.selectedSemester})`;
        }
        const dept = this.departments.find(d => d.id === this.selectedDeptId);
        const deptName = dept ? dept.name : '';
        return `${deptName} - ${this.selectedSection} (${this.selectedSemester}) Timetable`;
    }

    get deptOptions() {
        return this.departments.map(d => ({ label: d.name, value: d.id }));
    }

    get sectionOptions() {
        return [
            { label: 'Section A', value: 'Section A' },
            { label: 'Section B', value: 'Section B' }
        ];
    }

    get semesterOptions() {
        return [
            { label: 'Semester 3 (2nd Year)', value: 'Semester 3' },
            { label: 'Semester 4 (2nd Year)', value: 'Semester 4' },
            { label: 'Semester 5 (3rd Year)', value: 'Semester 5' },
            { label: 'Semester 6 (3rd Year)', value: 'Semester 6' },
            { label: 'Semester 7 (4th Year)', value: 'Semester 7' },
            { label: 'Semester 8 (4th Year)', value: 'Semester 8' }
        ];
    }

    get subjectOptions() {
        // filter subjects by section and semester
        return this.subjects
            .filter(s => s.section === this.selectedSection && (!s.semester || s.semester === this.selectedSemester))
            .map(s => ({
                label: `${s.subjectName} (${s.subjectCode})`,
                value: s.id
            }));
    }

    get facultyOptions() {
        if (!this.workloads) return [];
        return this.workloads.map(f => ({
            label: `${f.name} (${f.totalWorkload}h assigned)`,
            value: f.id
        }));
    }

    get isLabSelected() {
        if (!this.modalSubjectId) return false;
        const sub = this.subjects.find(s => s.id === this.modalSubjectId);
        return sub && sub.subjectType === 'Lab';
    }

    get gridRows() {
        return DAYS.map(day => {
            const cells = PERIOD_LIST.map(p => {
                const entry = this.timetableEntries.find(e => e.day === day && e.period === p.value && (!this.isFacultyRole || e.semester === this.selectedSemester));
                const isLab = entry && (entry.subject.toLowerCase().includes('lab') || entry.subject.toLowerCase().includes('practice') || entry.subject.toLowerCase().includes('project'));
                
                let cellClass = 'timetable-cell';
                if (entry) {
                    cellClass += isLab ? ' cell-lab' : ' cell-theory';
                    if (!this.isReadOnly) {
                        cellClass += ' cell-clickable';
                    }
                } else if (!this.isReadOnly) {
                    cellClass += ' cell-empty cell-clickable';
                }

                return {
                    period: p.value,
                    hasEntry: !!entry,
                    subject: entry ? entry.subject : '',
                    facultyName: entry ? entry.facultyName : '',
                    classroom: entry ? entry.classroom : '',
                    cssClass: cellClass,
                    entryId: entry ? entry.id : null
                };
            });

            return {
                day,
                cells
            };
        });
    }

    // Event Handlers
    handleDeptChange(event) {
        this.selectedDeptId = event.detail.value;
        this.refreshAll();
    }

    handleSectionChange(event) {
        this.selectedSection = event.detail.value;
        this.refreshAll();
    }

    handleSemesterChange(event) {
        this.selectedSemester = event.detail.value;
        this.refreshAll();
    }

    handleGenerateFullTimetables() {
        this.loading = true;
        generateFullTimetables()
            .then(() => {
                this.showToast('Success', 'Full timetables generated for Semesters 3-8 (Mon-Sat) for all departments!', 'success');
                this.refreshAll();
            })
            .catch(error => {
                this.showToast('Error', 'Failed to generate timetables: ' + (error.body ? error.body.message : error.message), 'error');
            })
            .finally(() => {
                this.loading = false;
            });
    }

    handleCellClick(event) {
        if (this.isReadOnly) return;
        
        const day = event.currentTarget.dataset.day;
        const period = parseInt(event.currentTarget.dataset.period, 10);
        
        this.selectedDay = day;
        this.selectedPeriod = period;
        
        const cellData = this.gridRows
            .find(r => r.day === day).cells
            .find(c => c.period === period);
            
        this.selectedEntryId = cellData.entryId;
        
        if (cellData.hasEntry) {
            // Find subject id by name match
            const sub = this.subjects.find(s => s.subjectName === cellData.subject && s.section === this.selectedSection);
            this.modalSubjectId = sub ? sub.id : null;
            
            // Find faculty id by name
            const fac = this.workloads.find(f => f.name === cellData.facultyName);
            this.modalFacultyId = fac ? fac.id : null;
            this.modalClassroom = cellData.classroom;
        } else {
            this.modalSubjectId = null;
            this.modalFacultyId = null;
            // Default classroom based on department code & section
            const dept = this.departments.find(d => d.id === this.selectedDeptId);
            const deptCode = dept ? dept.code : 'ROOM';
            const suffix = this.selectedSection === 'Section A' ? 'A101' : 'B102';
            this.modalClassroom = `${deptCode}-${suffix}`;
        }
        
        this.modalError = null;
        this.conflictWarning = null;
        this.showModal = true;
    }

    handleModalSubjectChange(event) {
        this.modalSubjectId = event.detail.value;
        this.modalError = null;
        
        // Auto-assign faculty prefilled on the subject allocation
        const sub = this.subjects.find(s => s.id === this.modalSubjectId);
        if (sub) {
            this.modalFacultyId = sub.facultyId;
            if (sub.subjectType === 'Lab') {
                const dept = this.departments.find(d => d.id === this.selectedDeptId);
                const deptCode = dept ? dept.code : 'ROOM';
                this.modalClassroom = `${deptCode}-LAB1`;
            }
        }
        this.checkConflicts();
    }

    handleModalFacultyChange(event) {
        this.modalFacultyId = event.detail.value;
        this.checkConflicts();
    }

    handleModalClassroomChange(event) {
        this.modalClassroom = event.detail.value;
        this.checkConflicts();
    }

    checkConflicts() {
        this.conflictWarning = null;
    }

    closeModal() {
        this.showModal = false;
    }

    handleSaveSlot() {
        if (!this.modalSubjectId || !this.modalFacultyId || !this.modalClassroom) {
            this.modalError = 'Please select a Subject, Faculty, and Classroom.';
            return;
        }

        const sub = this.subjects.find(s => s.id === this.modalSubjectId);
        const subName = sub ? sub.subjectName : '';

        this.loading = true;
        saveTimetableEntry({
            id: this.selectedEntryId || '',
            day: this.selectedDay,
            period: this.selectedPeriod,
            subject: subName,
            departmentId: this.selectedDeptId,
            facultyId: this.modalFacultyId,
            section: this.selectedSection,
            classroom: this.modalClassroom
        })
        .then(() => {
            this.showToast('Success', 'Timetable slot allocated successfully.', 'success');
            this.showModal = false;
            this.refreshAll();
        })
        .catch(error => {
            this.modalError = (error.body ? error.body.message : error.message);
        })
        .finally(() => {
            this.loading = false;
        });
    }

    handleDeleteSlot() {
        if (!this.selectedEntryId) return;

        this.loading = true;
        deleteTimetableEntry({ id: this.selectedEntryId })
        .then(() => {
            this.showToast('Cleared', 'Timetable slot cleared.', 'info');
            this.showModal = false;
            this.refreshAll();
        })
        .catch(error => {
            this.modalError = (error.body ? error.body.message : error.message);
        })
        .finally(() => {
            this.loading = false;
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
}