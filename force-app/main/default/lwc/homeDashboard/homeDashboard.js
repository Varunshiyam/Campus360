import { LightningElement } from 'lwc';

export default class HomeDashboard extends LightningElement {

    openFinance() {
        alert('Finance Dashboard');
    }

    openOffice() {
        alert('Office Dashboard');
    }

    openStudent() {
        alert('Student Dashboard');
    }

}