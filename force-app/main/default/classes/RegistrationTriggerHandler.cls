public class RegistrationTriggerHandler {
    public static void handleAfterUpdate(Map<Id, Registration__c> newMap, Map<Id, Registration__c> oldMap) {
        // Map of EventId -> Number of seats to restore / waitlist to promote
        Map<Id, Integer> eventToCancelledCount = new Map<Id, Integer>();

        for (Registration__c reg : newMap.values()) {
            Registration__c oldReg = oldMap.get(reg.Id);
            // Check if an Approved registration was cancelled
            if (reg.Status__c == 'Cancelled' && oldReg.Status__c == 'Approved') {
                if (!eventToCancelledCount.containsKey(reg.Event__c)) {
                    eventToCancelledCount.put(reg.Event__c, 0);
                }
                eventToCancelledCount.put(reg.Event__c, eventToCancelledCount.get(reg.Event__c) + 1);
            }
        }

        if (!eventToCancelledCount.isEmpty()) {
            promoteWaitlistedOrRestoreSeats(eventToCancelledCount);
        }
    }

    private static void promoteWaitlistedOrRestoreSeats(Map<Id, Integer> eventToCancelledCount) {
        // First check which events are actually NOT cancelled
        Map<Id, Event__c> activeEvents = new Map<Id, Event__c>([
            SELECT Id, Available_Seats__c, Status__c 
            FROM Event__c 
            WHERE Id IN :eventToCancelledCount.keySet() 
            AND Status__c != 'Cancelled'
        ]);

        if (activeEvents.isEmpty()) {
            return;
        }

        // Find the waitlisted registrations for these active events
        List<Registration__c> waitlistedRegs = [
            SELECT Id, Event__c, participant__c, participant__r.Email__c, Event__r.Name
            FROM Registration__c
            WHERE Event__c IN :activeEvents.keySet() AND Status__c = 'Wait Listed'
            ORDER BY CreatedDate ASC
        ];

        Map<Id, List<Registration__c>> eventToWaitlist = new Map<Id, List<Registration__c>>();
        for (Registration__c reg : waitlistedRegs) {
            if (!eventToWaitlist.containsKey(reg.Event__c)) {
                eventToWaitlist.put(reg.Event__c, new List<Registration__c>());
            }
            eventToWaitlist.get(reg.Event__c).add(reg);
        }

        List<Registration__c> updateList = new List<Registration__c>();
        List<Event__c> eventsToUpdate = new List<Event__c>();
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for (Id eventId : activeEvents.keySet()) {
            Integer cancelledCount = eventToCancelledCount.get(eventId);
            List<Registration__c> waitlist = eventToWaitlist.containsKey(eventId) ? eventToWaitlist.get(eventId) : new List<Registration__c>();
            
            Integer promotedCount = 0;
            while (promotedCount < cancelledCount && promotedCount < waitlist.size()) {
                Registration__c promotedReg = waitlist[promotedCount];
                updateList.add(new Registration__c(Id = promotedReg.Id, Status__c = 'Approved'));

                if (promotedReg.participant__c != null && promotedReg.participant__r.Email__c != null) {
                    Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                    email.setToAddresses(new String[] { promotedReg.participant__r.Email__c });
                    email.setSubject('Approve Registration for Event');
                    email.setHtmlBody('<p>Hello,</p><p><br></p><p>Congratulations!</p><p><br></p><p>Your waitlisted registration has been approved because a spot opened up.</p><p><br></p><p>Event: ' + promotedReg.Event__r.Name + '</p><p><br></p><p>Thank You.</p><p><br></p><p>College Event Team</p>');
                    emails.add(email);
                }
                promotedCount++;
            }

            Integer seatsToRestore = cancelledCount - promotedCount;
            if (seatsToRestore > 0) {
                Event__c evt = activeEvents.get(eventId);
                if (evt.Available_Seats__c == null) {
                    evt.Available_Seats__c = seatsToRestore;
                } else {
                    evt.Available_Seats__c += seatsToRestore;
                }
                eventsToUpdate.add(evt);
            }
        }

        if (!eventsToUpdate.isEmpty()) {
            update eventsToUpdate;
        }

        if (!updateList.isEmpty()) {
            update updateList;
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails, false);
        }
    }
}