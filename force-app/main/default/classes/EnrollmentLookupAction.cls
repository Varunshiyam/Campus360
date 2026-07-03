public with sharing class EnrollmentLookupAction {
    
    public class EnrollmentSearchRequest {
        @InvocableVariable(label='Search Query' description='The search term to find enrollments by student name, course title, or status' required=true)
        public String searchQuery;
    }
    
    public class EnrollmentSearchResult {
        @InvocableVariable(label='Enrollment Number' description='The enrollment record number')
        public String enrollmentNumber;
        
        @InvocableVariable(label='Student Name' description='Name of the enrolled student')
        public String studentName;
        
        @InvocableVariable(label='Course Title' description='Title of the enrolled course')
        public String courseTitle;
        
        @InvocableVariable(label='Status' description='Enrollment status')
        public String status;
        
        @InvocableVariable(label='Progress' description='Course completion progress percentage')
        public Decimal progress;
        
        @InvocableVariable(label='Enrollment Date' description='Date when enrollment was created')
        public Date enrollmentDate;
        
        @InvocableVariable(label='Enrollment ID' description='Unique identifier for the enrollment')
        public String enrollmentId;
        
        @InvocableVariable(label='Results Found' description='Indicates if results were found')
        public Boolean resultsFound;
        
        @InvocableVariable(label='Result Summary' description='Summary of all matching enrollments')
        public String resultSummary;
    }
    
    @InvocableMethod(label='Search Enrollments' description='Searches for enrollments by student name, course title, or status' category='Learning Management')
    public static List<EnrollmentSearchResult> searchEnrollments(List<EnrollmentSearchRequest> requests) {
        List<EnrollmentSearchResult> results = new List<EnrollmentSearchResult>();
        
        Set<String> searchTerms = new Set<String>();
        for (EnrollmentSearchRequest request : requests) {
            if (String.isNotBlank(request.searchQuery)) {
                searchTerms.add('%' + String.escapeSingleQuotes(request.searchQuery) + '%');
            }
        }
        
        Map<String, List<Enrollment__c>> resultsByTerm = new Map<String, List<Enrollment__c>>();
        for (String term : searchTerms) {
            List<Enrollment__c> matches = [
                SELECT Id, Name, Status__c, Progress__c, Enrollment_Date__c,
                       Student__r.First_Name__c, Student__r.Last_Name__c,
                       Course__r.Title__c
                FROM Enrollment__c
                WHERE Student__r.First_Name__c LIKE :term
                   OR Student__r.Last_Name__c LIKE :term
                   OR Course__r.Title__c LIKE :term
                   OR Status__c LIKE :term
                WITH USER_MODE
                ORDER BY Enrollment_Date__c DESC
                LIMIT 10
            ];
            resultsByTerm.put(term, matches);
        }
        
        for (EnrollmentSearchRequest request : requests) {
            EnrollmentSearchResult result = new EnrollmentSearchResult();
            
            if (String.isBlank(request.searchQuery)) {
                result.resultsFound = false;
                result.resultSummary = 'No search query provided.';
                results.add(result);
                continue;
            }
            
            String termKey = '%' + String.escapeSingleQuotes(request.searchQuery) + '%';
            List<Enrollment__c> enrollments = resultsByTerm.get(termKey);
            
            if (enrollments == null || enrollments.isEmpty()) {
                result.resultsFound = false;
                result.resultSummary = 'No enrollments found matching "' + request.searchQuery + '".';
            } else {
                Enrollment__c enrollment = enrollments[0];
                result.enrollmentNumber = enrollment.Name;
                result.studentName = (enrollment.Student__r != null && enrollment.Student__r.First_Name__c != null ? enrollment.Student__r.First_Name__c : '') + 
                                    ' ' + (enrollment.Student__r != null && enrollment.Student__r.Last_Name__c != null ? enrollment.Student__r.Last_Name__c : '');
                result.studentName = result.studentName.trim();
                result.courseTitle = enrollment.Course__r != null ? enrollment.Course__r.Title__c : null;
                result.status = enrollment.Status__c;
                result.progress = enrollment.Progress__c;
                result.enrollmentDate = enrollment.Enrollment_Date__c;
                result.enrollmentId = enrollment.Id;
                result.resultsFound = true;
                
                // Build detailed summary for each enrollment
                List<String> enrollmentSummaries = new List<String>();
                for (Enrollment__c e : enrollments) {
                    String studentFullName = ((e.Student__r != null && e.Student__r.First_Name__c != null ? e.Student__r.First_Name__c : '') + 
                                             ' ' + (e.Student__r != null && e.Student__r.Last_Name__c != null ? e.Student__r.Last_Name__c : '')).trim();
                    String courseName = e.Course__r != null && e.Course__r.Title__c != null ? e.Course__r.Title__c : 'N/A';
                    List<String> details = new List<String>();
                    details.add('• Enrollment Number: ' + (e.Name != null ? e.Name : 'N/A'));
                    details.add('• Student: ' + (String.isNotBlank(studentFullName) ? studentFullName : 'N/A'));
                    details.add('• Course: ' + courseName);
                    details.add('• Status: ' + (e.Status__c != null ? e.Status__c : 'N/A'));
                    details.add('• Progress: ' + (e.Progress__c != null ? String.valueOf(e.Progress__c.intValue()) + '%' : 'N/A'));
                    details.add('• Enrollment Date: ' + (e.Enrollment_Date__c != null ? String.valueOf(e.Enrollment_Date__c) : 'N/A'));
                    enrollmentSummaries.add(String.join(details, '\n'));
                }
                
                if (enrollments.size() == 1) {
                    result.resultSummary = 'Here are the details for the enrollment:\n' + enrollmentSummaries[0];
                } else {
                    result.resultSummary = 'Found ' + enrollments.size() + ' enrollments matching "' + request.searchQuery + '":\n\n' + String.join(enrollmentSummaries, '\n\n');
                }
            }
            results.add(result);
        }
        
        return results;
    }
}