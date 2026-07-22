public with sharing class StaffController {
    @AuraEnabled(cacheable=true)
    public static List<Staff__c> getStaffRecords(Integer limitSize) {
        if (limitSize == null || limitSize <= 0) {
            limitSize = 10;
        }
        return [
            SELECT Id, Name__c, ID__c, Licensenum__c, experience__c, Status__c, 
                 Contact_Number__c, Email__c, Leave_Start_Date__c, Leave_End_Date__c,Leave_Count__c
            FROM Staff__c
            WITH SECURITY_ENFORCED
            ORDER BY CreatedDate DESC
            LIMIT :limitSize
        ];
    }
}