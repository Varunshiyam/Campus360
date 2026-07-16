public with sharing class ComplaintController {

    @AuraEnabled(cacheable=true)
    public static List<Complaint1__c> getAllComplaints(){

        return[
            SELECT Id,
                   Name,
                   Student1__c,
                   Category__c,
                   Subject__c,
                   Description__c,
                   Priority__c,
                   Status__c,
                   Assigned_To__c
            FROM Complaint1__c
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Complaint1__c getComplaint(Id complaintId){

        return[
            SELECT Id,
                   Name,
                   Student1__c,
                   Category__c,
                   Subject__c,
                   Description__c,
                   Priority__c,
                   Status__c,
                   Assigned_To__c
            FROM Complaint1__c
            WHERE Id=:complaintId
            LIMIT 1
        ];
    }

    @AuraEnabled
    public static String closeComplaint(Id complaintId){

        Complaint1__c comp=[
            SELECT Id,Status__c
            FROM Complaint1__c
            WHERE Id=:complaintId
            LIMIT 1
        ];

        comp.Status__c='Closed';

        update comp;

        return 'Complaint Closed Successfully';
    }

    @AuraEnabled
    public static String updateComplaintStatus(Id complaintId,String status){

        Complaint1__c comp=[
            SELECT Id,Status__c
            FROM Complaint1__c
            WHERE Id=:complaintId
            LIMIT 1
        ];

        comp.Status__c=status;

        update comp;

        return 'Complaint Updated Successfully';
    }

}