import { LightningElement, api, track } from 'lwc';

export default class StudentView extends LightningElement {
    @api students = [];
    @track searchTerm = '';

    handleSearch(event) {
        this.searchTerm = (event.target.value || '').toLowerCase();
    }

    get filteredStudents() {
        if (!this.students) return [];
        if (!this.searchTerm) return this.students;
        return this.students.filter(s => 
            (s.name && s.name.toLowerCase().includes(this.searchTerm)) ||
            (s.regNumber && s.regNumber.toLowerCase().includes(this.searchTerm)) ||
            (s.department && s.department.toLowerCase().includes(this.searchTerm))
        );
    }
}