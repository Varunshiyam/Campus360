public with sharing class ScholarshipController {

    @AuraEnabled(cacheable=true)
    public static List<Scholarship__c> getAllScholarships(){

        return[
            SELECT Id,
                   Name,
                   Student1__c,
                   Provider__c,
                   Percentage__c,
                   Amount__c,
                   Approval_Status__c,
                   Applied_Date__c,
                   Approved_Date__c
            FROM Scholarship__c
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static String approveScholarship(Id scholarshipId){

        Scholarship__c s=[SELECT Id,Approval_Status__c,Approved_Date__c
                          FROM Scholarship__c
                          WHERE Id=:scholarshipId
                          LIMIT 1];

        s.Approval_Status__c='Approved';
        s.Approved_Date__c=Date.today();

        update s;

        return 'Scholarship Approved';
    }

}