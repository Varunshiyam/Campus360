public with sharing class StudentLookupAction {
    
    public class StudentSearchRequest {
        @InvocableVariable(label='Search Query' description='The search term to find students by name, email, or company' required=true)
        public String searchQuery;
    }
    
    public class StudentSearchResult {
        @InvocableVariable(label='Student Name' description='Full name of the student')
        public String studentName;
        
        @InvocableVariable(label='Email' description='Student email address')
        public String email;
        
        @InvocableVariable(label='Company' description='Company name')
        public String company;
        
        @InvocableVariable(label='Role' description='Student role or job title')
        public String role;
        
        @InvocableVariable(label='Status' description='Student status')
        public String status;
        
        @InvocableVariable(label='Student ID' description='Unique identifier for the student')
        public String studentId;
        
        @InvocableVariable(label='Results Found' description='Indicates if results were found')
        public Boolean resultsFound;
        
        @InvocableVariable(label='Result Summary' description='Summary of all matching students')
        public String resultSummary;
    }
    
    @InvocableMethod(label='Search Students' description='Searches for students by name, email, or company' category='Learning Management')
    public static List<StudentSearchResult> searchStudents(List<StudentSearchRequest> requests) {
        List<StudentSearchResult> results = new List<StudentSearchResult>();
        
        Set<String> searchTerms = new Set<String>();
        for (StudentSearchRequest request : requests) {
            if (String.isNotBlank(request.searchQuery)) {
                searchTerms.add('%' + String.escapeSingleQuotes(request.searchQuery) + '%');
            }
        }
        
        Map<String, List<Student__c>> resultsByTerm = new Map<String, List<Student__c>>();
        for (String term : searchTerms) {
            List<Student__c> matches = [
                SELECT Id, First_Name__c, Last_Name__c, Email__c, 
                       Company__c, Role__c, Status__c
                FROM Student__c
                WHERE First_Name__c LIKE :term
                   OR Last_Name__c LIKE :term
                   OR Email__c LIKE :term
                   OR Company__c LIKE :term
                WITH USER_MODE
                ORDER BY Last_Name__c, First_Name__c
                LIMIT 10
            ];
            resultsByTerm.put(term, matches);
        }
        
        for (StudentSearchRequest request : requests) {
            StudentSearchResult result = new StudentSearchResult();
            
            if (String.isBlank(request.searchQuery)) {
                result.resultsFound = false;
                result.resultSummary = 'No search query provided.';
                results.add(result);
                continue;
            }
            
            String termKey = '%' + String.escapeSingleQuotes(request.searchQuery) + '%';
            List<Student__c> students = resultsByTerm.get(termKey);
            
            if (students == null || students.isEmpty()) {
                result.resultsFound = false;
                result.resultSummary = 'No students found matching "' + request.searchQuery + '".';
            } else {
                Student__c student = students[0];
                result.studentName = (student.First_Name__c != null ? student.First_Name__c : '') + 
                                    ' ' + (student.Last_Name__c != null ? student.Last_Name__c : '');
                result.studentName = result.studentName.trim();
                result.email = student.Email__c;
                result.company = student.Company__c;
                result.role = student.Role__c;
                result.status = student.Status__c;
                result.studentId = student.Id;
                result.resultsFound = true;
                
                // Build detailed summary for each student
                List<String> studentSummaries = new List<String>();
                for (Student__c s : students) {
                    String fullName = ((s.First_Name__c != null ? s.First_Name__c : '') + ' ' + (s.Last_Name__c != null ? s.Last_Name__c : '')).trim();
                    List<String> details = new List<String>();
                    details.add('• Name: ' + (String.isNotBlank(fullName) ? fullName : 'N/A'));
                    details.add('• Email: ' + (s.Email__c != null ? s.Email__c : 'N/A'));
                    details.add('• Company: ' + (s.Company__c != null ? s.Company__c : 'N/A'));
                    details.add('• Role: ' + (s.Role__c != null ? s.Role__c : 'N/A'));
                    details.add('• Status: ' + (s.Status__c != null ? s.Status__c : 'N/A'));
                    studentSummaries.add(String.join(details, '\n'));
                }
                
                if (students.size() == 1) {
                    result.resultSummary = 'Here are the details for student "' + result.studentName + '":\n' + studentSummaries[0];
                } else {
                    result.resultSummary = 'Found ' + students.size() + ' students matching "' + request.searchQuery + '":\n\n' + String.join(studentSummaries, '\n\n');
                }
            }
            results.add(result);
        }
        
        return results;
    }
}