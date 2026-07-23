@IsTest
public class LeaveRequestWorkflowTest {

    @TestSetup
    static void setupData() {
        // Create Department with all required fields
        Department__c dept = new Department__c(
            Name = 'Engineering',
            Department_Name__c = 'Engineering',
            Department_Code__c = '9999',
            Department_Type__c = 'UG',
            Email__c = 'engg@college.edu',
            Phone__c = '9999999999',
            Block__c = 'A Block'
        );
        insert dept;

        // Create Faculty
        Faculty__c fac = new Faculty__c(
            Name = 'Faculty Member',
            Email__c = 'fac@college.edu',
            Mobile__c = '9999999991',
            Department__c = dept.Id,
            Username__c = 'faculty1',
            Password__c = 'pass123',
            DOB__c = Date.today().addYears(-30)
        );
        insert fac;

        // Create HOD
        HOD__c hod = new HOD__c(
            Name = 'HOD Member',
            Email__c = 'hod@college.edu',
            Phone__c = '9999999992',
            Employee_ID__c = 'EMP-H999',
            Department__c = dept.Id,
            Username__c = 'hod1',
            Password__c = 'pass123'
        );
        insert hod;

        // Create Principal
        Principal__c princ = new Principal__c(
            Name = 'Principal Member',
            Employee_ID__c = 'PR-99',
            Mobile_Number__c = '9999999993',
            Email__c = 'princ@college.edu',
            Username__c = 'principal1',
            Password__c = 'pass123'
        );
        insert princ;
    }

    @IsTest
    static void testFacultyLeaveWorkflow() {
        Faculty__c fac = [SELECT Id FROM Faculty__c LIMIT 1];
        HOD__c hod = [SELECT Id FROM HOD__c LIMIT 1];

        Test.startTest();
        // Submit leave for Faculty
        UnifiedCampusPortalController.submitLeaveRequest(
            fac.Id,
            'Faculty',
            'Sick',
            String.valueOf(Date.today().addDays(1)),
            String.valueOf(Date.today().addDays(3)),
            'Medical reason'
        );

        List<UnifiedCampusPortalController.LeaveRequestWrapper> leaves = 
            UnifiedCampusPortalController.getLeaveRequests('Faculty', fac.Id);
        System.assertEquals(1, leaves.size(), 'Faculty should see their own leave request');
        System.assertEquals('Pending', leaves[0].status);
        System.assertEquals('HOD Member', leaves[0].approverName, 'Approver should automatically be mapped to the HOD');

        // Approve leave by assigned HOD
        UnifiedCampusPortalController.updateLeaveStatus(
            leaves[0].id,
            'Approved',
            hod.Id,
            'Get well soon!'
        );

        // Verify status changed
        leaves = UnifiedCampusPortalController.getLeaveRequests('Faculty', fac.Id);
        System.assertEquals('Approved', leaves[0].status);
        System.assertEquals('HOD Member', leaves[0].approvedBy);
        System.assertEquals('Get well soon!', leaves[0].comments);
        Test.stopTest();
    }

    @IsTest
    static void testHODLeaveWorkflow() {
        HOD__c hod = [SELECT Id FROM HOD__c LIMIT 1];
        Principal__c princ = [SELECT Id FROM Principal__c LIMIT 1];

        Test.startTest();
        // Submit leave for HOD
        UnifiedCampusPortalController.submitLeaveRequest(
            hod.Id,
            'HOD',
            'Personal',
            String.valueOf(Date.today().addDays(5)),
            String.valueOf(Date.today().addDays(6)),
            'Personal emergency'
        );

        List<UnifiedCampusPortalController.LeaveRequestWrapper> leaves = 
            UnifiedCampusPortalController.getLeaveRequests('HOD', hod.Id);
        System.assertEquals(1, leaves.size());
        System.assertEquals('Principal Member', leaves[0].approverName, 'Approver should automatically be mapped to the Principal');

        // Approve leave by assigned Principal
        UnifiedCampusPortalController.updateLeaveStatus(
            leaves[0].id,
            'Approved',
            princ.Id,
            'Approved by Principal'
        );

        leaves = UnifiedCampusPortalController.getLeaveRequests('HOD', hod.Id);
        System.assertEquals('Approved', leaves[0].status);
        Test.stopTest();
    }

    @IsTest
    static void testValidationAndSecurity() {
        Faculty__c fac = [SELECT Id FROM Faculty__c LIMIT 1];
        HOD__c hod = [SELECT Id FROM HOD__c LIMIT 1];

        // Insert first leave
        UnifiedCampusPortalController.submitLeaveRequest(
            fac.Id,
            'Faculty',
            'Sick',
            String.valueOf(Date.today().addDays(10)),
            String.valueOf(Date.today().addDays(12)),
            'Reason'
        );

        Test.startTest();
        // 1. Overlapping dates check
        try {
            UnifiedCampusPortalController.submitLeaveRequest(
                fac.Id,
                'Faculty',
                'Casual',
                String.valueOf(Date.today().addDays(11)),
                String.valueOf(Date.today().addDays(14)),
                'Another Reason'
            );
            System.assert(false, 'Should throw an error due to date overlap');
        } catch (Exception e) {
            // Overlap was successfully prevented by the trigger
            System.assert(true);
        }

        // Get leaves
        List<UnifiedCampusPortalController.LeaveRequestWrapper> leaves = 
            UnifiedCampusPortalController.getLeaveRequests('Faculty', fac.Id);

        // 2. Security Check: Invalid approver trying to approve
        try {
            UnifiedCampusPortalController.updateLeaveStatus(
                leaves[0].id,
                'Approved',
                fac.Id, // Faculty trying to approve their own leave
                'Nice try'
            );
            System.assert(false, 'Should throw an error because Faculty is not the assigned HOD');
        } catch (Exception e) {
            System.assert(true);
        }
        Test.stopTest();
    }
}