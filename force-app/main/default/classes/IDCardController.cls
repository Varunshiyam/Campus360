public with sharing class IDCardController {

    @AuraEnabled(cacheable=true)
    public static List<ID_Card_Request__c> getAllIDCards(){

        return[
            SELECT Id,
                   Name,
                   Request_No__c,
                   Student1__c,
                   Reason__c,
                   Photo_Uploaded__c,
                   Request_Date__c,
                   Issue_Date__c,
                   Status__c
            FROM ID_Card_Request__c
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static ID_Card_Request__c getIDCard(Id requestId){

        return[
            SELECT Id,
                   Name,
                   Request_No__c,
                   Student1__c,
                   Reason__c,
                   Photo_Uploaded__c,
                   Request_Date__c,
                   Issue_Date__c,
                   Status__c
            FROM ID_Card_Request__c
            WHERE Id=:requestId
            LIMIT 1
        ];
    }

    @AuraEnabled
    public static String issueIDCard(Id requestId){

        ID_Card_Request__c card=[
            SELECT Id,
                   Status__c,
                   Issue_Date__c
            FROM ID_Card_Request__c
            WHERE Id=:requestId
            LIMIT 1
        ];

        card.Status__c='Issued';
        card.Issue_Date__c=Date.today();

        update card;

        return 'ID Card Issued Successfully';
    }

    @AuraEnabled
    public static String updateStatus(Id requestId,String status){

        ID_Card_Request__c card=[
            SELECT Id,Status__c
            FROM ID_Card_Request__c
            WHERE Id=:requestId
            LIMIT 1
        ];

        card.Status__c=status;

        update card;

        return 'Status Updated Successfully';
    }

}