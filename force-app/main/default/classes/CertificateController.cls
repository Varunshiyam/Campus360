public with sharing class CertificateController {

    @AuraEnabled(cacheable=true)
    public static List<Certificate_Request__c> getAllCertificateRequests(){

        return[
            SELECT Id,
                   Name,
                   Request_No__c,
                   Student1__c,
                   Certificate_Type__c,
                   Reason__c,
                   Applied_Date__c,
                   Required_Date__c,
                   Status__c,
                   User__c
            FROM Certificate_Request__c
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Certificate_Request__c getCertificateRequest(Id requestId){

        return[
            SELECT Id,
                   Name,
                   Request_No__c,
                   Student1__c,
                   Certificate_Type__c,
                   Reason__c,
                   Applied_Date__c,
                   Required_Date__c,
                   Status__c,
                   User__c
            FROM Certificate_Request__c
            WHERE Id=:requestId
            LIMIT 1
        ];
    }

    @AuraEnabled
    public static String approveCertificate(Id requestId){

        Certificate_Request__c req=[
            SELECT Id,Status__c
            FROM Certificate_Request__c
            WHERE Id=:requestId
            LIMIT 1
        ];

        req.Status__c='Approved';

        update req;

        return 'Certificate Approved Successfully';
    }

    @AuraEnabled
    public static String rejectCertificate(Id requestId){

        Certificate_Request__c req=[
            SELECT Id,Status__c
            FROM Certificate_Request__c
            WHERE Id=:requestId
            LIMIT 1
        ];

        req.Status__c='Rejected';

        update req;

        return 'Certificate Rejected Successfully';
    }

}