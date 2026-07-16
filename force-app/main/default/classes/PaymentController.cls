public with sharing class PaymentController {

    @AuraEnabled(cacheable=true)
    public static List<Payment__c> getAllPayments() {
        return [
            SELECT Id,
                   Name,
                   Payment_ID__c,
                   Amount_Paid__c,
                   Payment_Date__c,
                   Payment_Method__c,
                   Status__c,
                   Transaction_ID_Text__c,
                   Fee__c,
                   User__c
            FROM Payment__c
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static String updatePaymentStatus(Id paymentId, String newStatus) {
        Payment__c pay = [
            SELECT Id, Status__c
            FROM Payment__c
            WHERE Id = :paymentId
            LIMIT 1
        ];

        pay.Status__c = newStatus;
        update pay;

        return 'Payment Updated Successfully';
    }
}