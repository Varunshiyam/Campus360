public with sharing class AdmissionController {

    @AuraEnabled(cacheable=true)
    public static List<Admission__c> getAllAdmissions(){

        return[
            SELECT Id,
                   Name,
                   Admission_No__c,
                   Admission_Date__c,
                   Department__c,
                   Documents_Verified__c,
                   Joining_Year__c,
                   Quota__c,
                   Status__c,
                   Student__c
            FROM Admission__c
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static String approveAdmission(Id admissionId){

        Admission__c a=[SELECT Id,Status__c
                        FROM Admission__c
                        WHERE Id=:admissionId
                        LIMIT 1];

        a.Status__c='Approved';

        update a;

        return 'Admission Approved';
    }

}