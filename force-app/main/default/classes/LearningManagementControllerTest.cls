@IsTest
private class LearningManagementControllerTest {
    @IsTest
    static void testGetEnrollmentSummaryAndRecentEnrollments() {
        Course__c course = new Course__c(
            Title__c = 'Executive Leadership',
            Category__c = 'Leadership',
            Duration_Hours__c = 12,
            Delivery_Format__c = 'Hybrid'
        );
        insert course;

        Student__c student = new Student__c(
            First_Name__c = 'Sophia',
            Last_Name__c = 'Robinson',
            Email__c = 'sophia.robinson@example.com',
            Company__c = 'CloudTech',
            Role__c = 'Director',
            Status__c = 'Active'
        );
        insert student;

        Date enrollDate = Date.today().addDays(-7);
        Enrollment__c enrollment = new Enrollment__c(
            Student__c = student.Id,
            Course__c = course.Id,
            Status__c = 'In Progress',
            Progress__c = 62,
            Enrollment_Date__c = enrollDate,
            Expected_Completion_Date__c = Date.today().addDays(21)
        );
        insert enrollment;

        Test.startTest();
        LearningManagementController.EnrollmentSummary summary = LearningManagementController.getEnrollmentSummary();
        List<LearningManagementController.EnrollmentItem> items = LearningManagementController.getRecentEnrollments(10);
        Test.stopTest();

        System.assertEquals(1, summary.totalEnrollments, 'Summary should count enrollments.');
        System.assertEquals(1, summary.inProgress, 'In progress count should reflect inserted enrollment.');
        System.assertEquals(0, summary.completed, 'Completed count should be zero.');
        System.assert(summary.averageProgress > 0, 'Average progress should be greater than zero.');

        System.assertEquals(1, items.size(), 'Should return the single enrollment.');
        LearningManagementController.EnrollmentItem item = items[0];
        System.assertEquals(enrollment.Id, item.recordId, 'ID should match inserted enrollment.');
        System.assertEquals(enrollment.Name, item.enrollmentNumber, 'Enrollment number should match auto number.');
        System.assertEquals('Sophia Robinson', item.studentName, 'Student name should combine first and last.');
        System.assertEquals(course.Title__c, item.courseName, 'Course title should be exposed.');
        System.assertEquals(course.Name, item.courseCode, 'Course code should be exposed.');
        System.assertEquals(enrollment.Progress__c, item.progress, 'Progress percent should match stored value.');
        DateTime expectedDate = DateTime.newInstance(enrollDate, Time.newInstance(0, 0, 0, 0));
        System.assertEquals(expectedDate, item.createdDate, 'Created date should match enrollment date at midnight.');
    }
}