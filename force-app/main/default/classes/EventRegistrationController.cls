public with sharing class EventRegistrationController {
    
    /**
     * @description Fetches a list of Events. Adjust the fields in the SELECT clause 
     * based on the actual custom fields on your Event__c object.
     * @return List of Event__c records
     */
    @AuraEnabled(cacheable=true)
    public static List<Event__c> getActiveEvents() {
        try {
            return [
                SELECT Id, Name, Start_Date__c, End_Date__c, Available_Seats__c, Status__c, Capacity__c, Description__c
                FROM Event__c
                WITH SECURITY_ENFORCED
                ORDER BY CreatedDate DESC
                LIMIT 50
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching events: ' + e.getMessage());
        }
    }

    /**
     * @description Handles registration for an event.
     * @param eventId The Id of the Event__c record
     * @param participantId The Id of the Participant__c record (optional based on your schema)
     * @return Success message or throws an exception
     */
    @AuraEnabled
    public static String registerForEvent(Id eventId, Id participantId) {
        try {
            if (eventId == null) {
                throw new AuraHandledException('Event ID is required for registration.');
            }

            Registration__c newRegistration = new Registration__c();
            newRegistration.Event__c = eventId;
            newRegistration.Registration_Date__c = Date.today();
            newRegistration.Status__c = 'Pending';
            newRegistration.Payment_Status__c = 'Pending';
            
            // If Participant__c is a lookup field on Registration__c:
            if (participantId != null) {
                newRegistration.Participant__c = participantId;
            }
            
            // Check for CRUD/FLS before insert
            if (!Schema.sObjectType.Registration__c.isCreateable()) {
                throw new AuraHandledException('Insufficient permissions to create Registration.');
            }

            insert newRegistration;
            return 'Registration successful!';
            
        } catch (Exception e) {
            throw new AuraHandledException('Error during registration: ' + e.getMessage());
        }
    }
}