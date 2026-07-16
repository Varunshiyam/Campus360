public with sharing class FeeController {

    @AuraEnabled(cacheable=true)
    public static List<Fee__c> getAllFees() {

        return [
            SELECT Id,
                   Name,
                   Academic_Year__c,
                   Semester__c,
                   Tuition_Fee__c,
                   Exam_Fee__c,
                   Lab_Fee__c,
                   Other_Fee__c,
                   Total_Amount__c,
                   Due_Date__c,
                   Status__c,
                   Student__c
            FROM Fee__c
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Fee__c> getPendingFees(){

        return[
            SELECT Id,
                   Name,
                   Total_Amount__c,
                   Due_Date__c,
                   Status__c
            FROM Fee__c
            WHERE Status__c='Pending'
        ];
    }

    @AuraEnabled
    public static String updateFeeStatus(Id feeId,String statusValue){

        Fee__c fee=[SELECT Id,Status__c FROM Fee__c WHERE Id=:feeId LIMIT 1];

        fee.Status__c=statusValue;

        update fee;

        return 'Fee Updated Successfully';
    }

}