@isTest
public class EventTriggerTest {
    
    @testSetup
    static void setupTestData() {
        // Create Participant
        participant__c part = new participant__c(
            Name = 'Test Participant',
            Email__c = 'test@example.com'
        );
        insert part;

        // Create Event
        Event__c evt = new Event__c(
            Name = 'Test Cancel Event',
            Coordinator_Contact_No__c = '1234567890',
            Start_Date__c = Date.today().addDays(5),
            Registration_Deadline__c = Date.today().addDays(2),
            Capacity__c = 10,
            Available_Seats__c = 10,
            Status__c = 'Open'
        );
        insert evt;

        // Create Registration
        Registration__c reg = new Registration__c(
            Event__c = evt.Id,
            participant__c = part.Id,
            Status__c = 'Approved',
            Registration_Date__c = Date.today(),
            Payment_Status__c = 'Paid'
        );
        insert reg;
    }

    @isTest
    static void testEventCancellation() {
        Event__c evt = [SELECT Id, Status__c FROM Event__c WHERE Name = 'Test Cancel Event' LIMIT 1];
        
        Test.startTest();
        evt.Status__c = 'Cancelled';
        update evt;
        Test.stopTest();

        // Verify Registration was cancelled
        List<Registration__c> regs = [SELECT Id, Status__c FROM Registration__c WHERE Event__c = :evt.Id];
        System.assertEquals(1, regs.size());
        System.assertEquals('Cancelled', regs[0].Status__c, 'Registration should be cancelled when event is cancelled.');
    }
}