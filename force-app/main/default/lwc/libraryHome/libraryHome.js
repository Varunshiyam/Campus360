import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';


import libraryImage from '@salesforce/resourceUrl/LibraryImage';

export default class LibraryHome extends NavigationMixin(LightningElement) {

    imageUrl = libraryImage;

    navigateBooks() {
        this.navigateToObject('Book__c');
    }

    navigateStudents() {
        this.navigateToObject('Student0__c');
    }

    navigateIssue() {
        this.navigateToObject('Book_Issue__c');
    }

    navigateFine() {
        this.navigateToObject('Fine__c');
    }

    navigateLibrarian() {
        this.navigateToObject('Librarian__c');
    }

    navigateReports() {
        window.location.href='/lightning/o/Report/home';
    }

    navigateDashboard() {
        window.location.href='/lightning/r/Dashboard/01ZEc000008lWpRMAU/view?queryScope=userFolders';
    }

    navigateToObject(objectApiName){

        this[NavigationMixin.Navigate]({
            type:'standard__objectPage',
            attributes:{
                objectApiName:objectApiName,
                actionName:'list'
            }
        });

    }

}