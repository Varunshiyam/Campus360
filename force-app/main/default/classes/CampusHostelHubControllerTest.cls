@isTest
private class CampusHostelHubControllerTest {
    @TestSetup
    static void makeData() {
        Student__c student = new Student__c(
            Student_Name__c = 'Test Student',
            First_Name__c = 'Test',
            Last_Name__c = 'Student',
            Student_Id__c = 'STU1001',
            Register_Number__c = 'REG1001',
            Department__c = 'CSE',
            Year__c = 'I Year',
            Gender__c = 'Male',
            Phone_Number__c = '9876543210',
            Parent_Contact__c = '9876543211',
            Emergency_Contact__c = '9876543212',
            Hostel_Status__c = 'Checked In',
            Email__c = 'test@example.com'
        );
        insert student;

        Hostel__c hostel = new Hostel__c(
            Name = 'Alpha Block',
            Hostel_Type__c = 'Boys Hostel'
        );
        insert hostel;

        Room__c room = new Room__c(
            Name = '101',
            Room_Number__c = '101',
            Hostel__c = hostel.Id,
            Capacity__c = 2,
            Current_Occupancy__c = 1,
            Availability__c = true
        );
        insert room;

        Complaint__c complaint = new Complaint__c(
            Student__c = student.Id,
            Category__c = 'Electrical',
            Priority__c = 'High',
            Description__c = 'Light bulb broken',
            Status__c = 'In Progress'
        );
        insert complaint;

        Visitor__c visitor = new Visitor__c(
            Name = 'John Visitor',
            Student__c = student.Id,
            Relation__c = 'Parents',
            Phone__c = '9876543210',
            Purpose__c = 'Visiting student',
            Check_in_Time__c = DateTime.now(),
            Visitor_Status__c = true
        );
        insert visitor;

        Food_Token__c token = new Food_Token__c(
            Student__c = student.Id,
            Meal_Date__c = Date.today(),
            Meal_Type__c = 'Lunch',
            Menu_Item__c = 'Special Meals',
            Booking_Time__c = DateTime.now(),
            Status__c = 'Booked'
        );
        insert token;

        Hostel_Fee__c fee = new Hostel_Fee__c(
            Student__c = student.Id,
            Academic_Year__c = 'I Year',
            Total_Fee__c = 50000,
            Paid_Amount__c = 10000,
            Payment_Status__c = 'Pending',
            Due_Date__c = Date.today().addDays(10)
        );
        insert fee;

        Leave_Request__c leave = new Leave_Request__c(
            Student__c = student.Id,
            From_Date__c = Date.today(),
            To_Date__c = Date.today().addDays(2),
            Destination__c = 'Hometown',
            Reason__c = 'Family event',
            Status__c = 'Pending'
        );
        insert leave;
    }

    @isTest
    static void testGetDashboardSummary() {
        Test.startTest();
        CampusHostelHubController.DashboardSummary summary = CampusHostelHubController.getDashboardSummary();
        Test.stopTest();
        System.assertNotEquals(null, summary, 'Summary should not be null');
        System.assert(summary.totalStudents >= 1, 'Should have at least 1 student');
    }

    @isTest
    static void testGetAllStudentsList() {
        Test.startTest();
        List<CampusHostelHubController.StudentWrapper> listRes = CampusHostelHubController.getAllStudentsList();
        Test.stopTest();
        System.assertNotEquals(0, listRes.size(), 'Should return student wrappers');
    }

    @isTest
    static void testGetRecentComplaints() {
        Test.startTest();
        List<CampusHostelHubController.ComplaintWrapper> listRes = CampusHostelHubController.getRecentComplaints();
        Test.stopTest();
        System.assertNotEquals(0, listRes.size(), 'Should return complaints');
    }

    @isTest
    static void testGetRecentVisitors() {
        Test.startTest();
        List<CampusHostelHubController.VisitorWrapper> listRes = CampusHostelHubController.getRecentVisitors();
        Test.stopTest();
        System.assertNotEquals(0, listRes.size(), 'Should return visitors');
    }

    @isTest
    static void testGetPendingLeaveRequests() {
        Test.startTest();
        List<CampusHostelHubController.LeaveWrapper> listRes = CampusHostelHubController.getPendingLeaveRequests();
        Test.stopTest();
        System.assertNotEquals(0, listRes.size(), 'Should return leave requests');
    }

    @isTest
    static void testGetRoomOccupancySummary() {
        Test.startTest();
        List<CampusHostelHubController.HostelRoomSummary> listRes = CampusHostelHubController.getRoomOccupancySummary();
        Test.stopTest();
        System.assertNotEquals(0, listRes.size(), 'Should return room summary');
    }

    @isTest
    static void testGetFeePendingStudents() {
        Test.startTest();
        List<CampusHostelHubController.FeeWrapper> listRes = CampusHostelHubController.getFeePendingStudents();
        Test.stopTest();
        System.assertNotEquals(0, listRes.size(), 'Should return fee pending list');
    }

    @isTest
    static void testGetTodayFoodTokens() {
        Test.startTest();
        List<CampusHostelHubController.FoodTokenWrapper> listRes = CampusHostelHubController.getTodayFoodTokens();
        Test.stopTest();
        System.assertNotEquals(0, listRes.size(), 'Should return food tokens');
    }

    @isTest
    static void testGetStudentOptions() {
        Test.startTest();
        List<Student__c> listRes = CampusHostelHubController.getStudentOptions();
        Test.stopTest();
        System.assertNotEquals(0, listRes.size(), 'Should return student options');
    }

    @isTest
    static void testImperativeActions() {
        Student__c s = [SELECT Id FROM Student__c LIMIT 1];
        Complaint__c c = [SELECT Id FROM Complaint__c LIMIT 1];

        Test.startTest();
        String cId = CampusHostelHubController.createComplaint(s.Id, 'Plumbing', 'Low', 'Water leakage');
        System.assertNotEquals(null, cId, 'Complaint ID should be created');

        String ftId = CampusHostelHubController.issueFoodToken(s.Id, 'Dinner', 'Chapati');
        System.assertNotEquals(null, ftId, 'Food token ID should be created');

        String vId = CampusHostelHubController.registerVisitor(s.Id, 'Jane Visitor', 'Friends', '9998887776', 'Meeting');
        System.assertNotEquals(null, vId, 'Visitor ID should be created');

        CampusHostelHubController.resolveComplaint(c.Id);
        Test.stopTest();

        Complaint__c updatedC = [SELECT Status__c FROM Complaint__c WHERE Id = :c.Id];
        System.assertEquals('Resolved', updatedC.Status__c, 'Status should be Resolved');
    }
}