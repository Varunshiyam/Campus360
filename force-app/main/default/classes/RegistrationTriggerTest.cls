@isTest
public class RegistrationTriggerTest {

    @testSetup
    static void setupTestData() {
        // Create Participants
        List<participant__c> parts = new List<participant__c>();
        parts.add(new participant__c(Name = 'Test Part 1', Email__c = 'test1@example.com'));
        parts.add(new participant__c(Name = 'Test Part 2', Email__c = 'test2@example.com'));
        insert parts;

        // Create Event
        Event__c evt = new Event__c(
            Name = 'Test Waitlist Event',
            Coordinator_Contact_No__c = '1234567890',
            Start_Date__c = Date.today().addDays(5),
            Registration_Deadline__c = Date.today().addDays(2),
            Capacity__c = 1, // Only 1 capacity to force waitlisting
            Available_Seats__c = 1,
            Status__c = 'Open'
        );
        insert evt;

        // Create Approved Registration
        Registration__c reg1 = new Registration__c(
            Event__c = evt.Id,
            participant__c = parts[0].Id,
            Status__c = 'Approved',
            Registration_Date__c = Date.today(),
            Payment_Status__c = 'Paid'
        );
        insert reg1;
        
        // Wait 1 second to ensure CreatedDate is older
        // (In Apex tests, CreatedDate is usually the same for bulk, but we inserted separately so it's fine)

        // Create Waitlisted Registration
        Registration__c reg2 = new Registration__c(
            Event__c = evt.Id,
            participant__c = parts[1].Id,
            Status__c = 'Wait Listed',
            Registration_Date__c = Date.today(),
            Payment_Status__c = 'Pending'
        );
        insert reg2;
    }

    @isTest
    static void testWaitlistPromotion() {
        Event__c evt = [SELECT Id, Available_Seats__c FROM Event__c WHERE Name = 'Test Waitlist Event' LIMIT 1];
        List<Registration__c> regs = [SELECT Id, Status__c, participant__r.Name FROM Registration__c WHERE Event__c = :evt.Id ORDER BY CreatedDate ASC];
        
        Registration__c approvedReg = regs[0];
        Registration__c waitlistedReg = regs[1];
        
        Test.startTest();
        // Cancel the approved registration
        approvedReg.Status__c = 'Cancelled';
        update approvedReg;
        Test.stopTest();

        // Verify the waitlisted registration was promoted
        Registration__c promotedReg = [SELECT Status__c FROM Registration__c WHERE Id = :waitlistedReg.Id];
        System.assertEquals('Approved', promotedReg.Status__c, 'Waitlisted registration should be promoted to Approved.');
    }

    @isTest
    static void testRestoreSeats() {
        Event__c evt = [SELECT Id, Available_Seats__c FROM Event__c WHERE Name = 'Test Waitlist Event' LIMIT 1];
        List<Registration__c> regs = [SELECT Id, Status__c, participant__r.Name FROM Registration__c WHERE Event__c = :evt.Id ORDER BY CreatedDate ASC];
        
        Registration__c approvedReg = regs[0];
        Registration__c waitlistedReg = regs[1];
        
        // Delete waitlisted so we test empty waitlist
        delete waitlistedReg;
        
        Test.startTest();
        // Cancel the approved registration
        approvedReg.Status__c = 'Cancelled';
        update approvedReg;
        Test.stopTest();

        // Verify event seats were restored
        Event__c updatedEvt = [SELECT Available_Seats__c FROM Event__c WHERE Id = :evt.Id];
        System.assertEquals(evt.Available_Seats__c + 1, updatedEvt.Available_Seats__c, 'Available seats should increment if nobody is on waitlist.');
    }
}