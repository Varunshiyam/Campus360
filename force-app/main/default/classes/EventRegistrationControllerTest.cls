@isTest
private class EventRegistrationControllerTest {
    
    @testSetup
    static void setupTestData() {
        // Create a test Event
        Event__c testEvent = new Event__c(
            Name = 'Test Event',
            Coordinator_Contact_No__c = '1234567890',
            Status__c = 'Open',
            Capacity__c = 100,
            Start_Date__c = Date.today().addDays(10),
            Registration_Deadline__c = Date.today().addDays(5)
        );
        insert testEvent;
        
        // Create a test Participant
        Participant__c testParticipant = new Participant__c(
            Name = 'Test Participant',
            Email__c = 'test@example.com'
        );
        insert testParticipant;
    }

    @isTest
    static void testGetActiveEvents() {
        Test.startTest();
        List<Event__c> events = EventRegistrationController.getActiveEvents();
        Test.stopTest();
        
        System.assertNotEquals(null, events, 'Event list should not be null');
        System.assertEquals(1, events.size(), 'Should return 1 event');
        System.assertEquals('Test Event', events[0].Name, 'Event name should match');
    }

    @isTest
    static void testRegisterForEvent() {
        Event__c event = [SELECT Id FROM Event__c LIMIT 1];
        Participant__c participant = [SELECT Id FROM Participant__c LIMIT 1];
        
        Test.startTest();
        String result = EventRegistrationController.registerForEvent(event.Id, participant.Id);
        Test.stopTest();
        
        System.assertEquals('Registration successful!', result, 'Registration should be successful');
        
        List<Registration__c> registrations = [SELECT Id, Event__c, Participant__c FROM Registration__c];
        System.assertEquals(1, registrations.size(), 'Should have created 1 registration');
        System.assertEquals(event.Id, registrations[0].Event__c, 'Event ID should match');
    }
    
    @isTest
    static void testRegisterForEvent_Exception() {
        Test.startTest();
        try {
            EventRegistrationController.registerForEvent(null, null);
            System.assert(false, 'Exception should have been thrown');
        } catch (Exception e) {
            System.assert(e != null, 'An exception was thrown successfully.');
        }
        Test.stopTest();
    }
}