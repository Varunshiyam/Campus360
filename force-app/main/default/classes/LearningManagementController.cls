public with sharing class LearningManagementController {

    public class EnrollmentSummary {
        @AuraEnabled public Integer totalEnrollments;
        @AuraEnabled public Integer inProgress;
        @AuraEnabled public Integer completed;
        @AuraEnabled public Decimal averageProgress;
    }

    public class EnrollmentItem {
        @AuraEnabled public String enrollmentNumber;
        @AuraEnabled public String studentName;
        @AuraEnabled public String studentEmail;
        @AuraEnabled public String courseName;
        @AuraEnabled public String courseCode;
        @AuraEnabled public Decimal progress;
        @AuraEnabled public DateTime createdDate;
        @AuraEnabled public String status;
        @AuraEnabled public Id recordId;
    }

    @AuraEnabled(cacheable=true)
    public static EnrollmentSummary getEnrollmentSummary() {
        EnrollmentSummary summary = new EnrollmentSummary();
        summary.totalEnrollments = 0;
        summary.inProgress = 0;
        summary.completed = 0;
        summary.averageProgress = 0;

        AggregateResult totalResult = [
            SELECT COUNT(Id) totalCount
            FROM Enrollment__c
        ];
        summary.totalEnrollments = (Integer) totalResult.get('totalCount');

        if (summary.totalEnrollments == 0) {
            return summary;
        }

        Map<String, Integer> statusCounts = new Map<String, Integer>();
        for (AggregateResult ar : [
            SELECT Status__c status, COUNT(Id) total
            FROM Enrollment__c
            GROUP BY Status__c
        ]) {
            statusCounts.put((String) ar.get('status'), (Integer) ar.get('total'));
        }

        summary.inProgress = statusCounts.containsKey('In Progress') ? statusCounts.get('In Progress') : 0;
        summary.completed = statusCounts.containsKey('Completed') ? statusCounts.get('Completed') : 0;

        AggregateResult avgResult = [
            SELECT AVG(Progress__c) avgProgress
            FROM Enrollment__c
            WHERE Progress__c != NULL
        ];

        Object avgValue = avgResult.get('avgProgress');
        summary.averageProgress = avgValue == null ? 0 : ((Decimal) avgValue).setScale(0, RoundingMode.HALF_UP);

        return summary;
    }

    @AuraEnabled(cacheable=true)
    public static List<EnrollmentItem> getRecentEnrollments(Integer limitSize) {
        Integer normalizedLimit = limitSize == null || limitSize <= 0 ? 10 : Math.min(limitSize, 50);
        List<EnrollmentItem> items = new List<EnrollmentItem>();

        List<Enrollment__c> enrollments = [
            SELECT Id,
                   Name,
                   Status__c,
                   Progress__c,
                   Enrollment_Date__c,
                   CreatedDate,
                   Course__r.Title__c,
                   Course__r.Name,
                   Student__r.First_Name__c,
                   Student__r.Last_Name__c,
                   Student__r.Email__c
            FROM Enrollment__c
            ORDER BY CreatedDate DESC
            LIMIT :normalizedLimit
        ];

        for (Enrollment__c enrollment : enrollments) {
            EnrollmentItem item = new EnrollmentItem();
            item.recordId = enrollment.Id;
            item.enrollmentNumber = enrollment.Name;
            item.studentName = String.join(new List<String>{
                enrollment.Student__r != null ? enrollment.Student__r.First_Name__c : '',
                enrollment.Student__r != null ? enrollment.Student__r.Last_Name__c : ''
            }, ' ').trim();
            item.studentEmail = enrollment.Student__r != null ? enrollment.Student__r.Email__c : null;
            item.courseName = enrollment.Course__r != null ? enrollment.Course__r.Title__c : null;
            item.courseCode = enrollment.Course__r != null ? enrollment.Course__r.Name : null;
            item.progress = enrollment.Progress__c != null ? enrollment.Progress__c : 0;
            item.createdDate = enrollment.Enrollment_Date__c != null
                ? DateTime.newInstance(enrollment.Enrollment_Date__c, Time.newInstance(0, 0, 0, 0))
                : enrollment.CreatedDate;
            item.status = enrollment.Status__c;
            items.add(item);
        }

        return items;
    }
}