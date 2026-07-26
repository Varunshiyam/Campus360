public class EventTriggerHandler {
    public static void handleAfterUpdate(Map<Id, Event__c> newMap, Map<Id, Event__c> oldMap) {
        Set<Id> cancelledEventIds = new Set<Id>();

        for (Event__c evt : newMap.values()) {
            if (evt.Status__c == 'Cancelled' && oldMap.get(evt.Id).Status__c != 'Cancelled') {
                cancelledEventIds.add(evt.Id);
            }
        }

        if (!cancelledEventIds.isEmpty()) {
            cancelRelatedRegistrations(cancelledEventIds);
        }
    }

    private static void cancelRelatedRegistrations(Set<Id> eventIds) {
        List<Registration__c> registrationsToCancel = [
            SELECT Id, participant__r.Email__c, Event__r.Name 
            FROM Registration__c 
            WHERE Event__c IN :eventIds AND Status__c != 'Cancelled'
        ];

        if (registrationsToCancel.isEmpty()) {
            return;
        }

        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        
        List<Registration__c> updateList = new List<Registration__c>();
        for (Registration__c reg : registrationsToCancel) {
            updateList.add(new Registration__c(Id = reg.Id, Status__c = 'Cancelled'));
            
            if (reg.participant__c != null && reg.participant__r.Email__c != null) {
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                email.setToAddresses(new String[] { reg.participant__r.Email__c });
                email.setSubject('Event Cancelled: ' + reg.Event__r.Name);
                email.setPlainTextBody('Hello,\n\nUnfortunately, the event "' + reg.Event__r.Name + '" has been cancelled. Your registration has been updated accordingly.\n\nThank you,\nCollege Event Team');
                emails.add(email);
            }
        }

        update updateList;

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails, false);
        }
    }
}