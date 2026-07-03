public with sharing class CourseLookupAction {
    
    public class CourseSearchRequest {
        @InvocableVariable(label='Search Query' description='The search term to find courses' required=true)
        public String searchQuery;
    }
    
    public class CourseSearchResult {
        @InvocableVariable(label='Course Title' description='The title of the course')
        public String courseTitle;
        
        @InvocableVariable(label='Category' description='The category of the course')
        public String category;
        
        @InvocableVariable(label='Duration Hours' description='Duration of the course in hours')
        public Decimal durationHours;
        
        @InvocableVariable(label='Delivery Format' description='The delivery format of the course')
        public String deliveryFormat;
        
        @InvocableVariable(label='Description' description='Course description')
        public String description;
        
        @InvocableVariable(label='Course ID' description='Unique identifier for the course')
        public String courseId;
        
        @InvocableVariable(label='Course Code' description='The course code')
        public String courseCode;
        
        @InvocableVariable(label='Results Found' description='Indicates if results were found')
        public Boolean resultsFound;
        
        @InvocableVariable(label='Result Summary' description='Summary of all matching courses')
        public String resultSummary;
    }
    
    @InvocableMethod(label='Search Courses' description='Searches for courses based on title, category, or description' category='Learning Management')
    public static List<CourseSearchResult> searchCourses(List<CourseSearchRequest> requests) {
        List<CourseSearchResult> results = new List<CourseSearchResult>();
        
        // 1. Collect all search terms
        Set<String> searchTerms = new Set<String>();
        for (CourseSearchRequest request : requests) {
            if (String.isNotBlank(request.searchQuery)) {
                searchTerms.add('%' + String.escapeSingleQuotes(request.searchQuery) + '%');
            }
        }
        
        // 2. Perform a single bulk query if we have terms
        Map<String, Course__c> courseMap = new Map<String, Course__c>(); 
        // Note: For fuzzy matching in bulk, it's tricky to map back exactly 1-to-1 without multiple queries or in-memory filtering.
        // Given this is an Invocable (Flow), and usually limited batch size, we'll fetch all potential matches.
        // But since LIKE OR LIKE is hard to bulkify into a Map directly keyed by search term, we'll fetch all matching candidates 
        // and filter in memory to be safe against governor limits.
        
        List<Course__c> allMatches = new List<Course__c>();
        if (!searchTerms.isEmpty()) {
             // We can use dynamic SOQL to build the OR clauses if needed, but for simplicity/safety with small batches:
             // If the batch is large, this approach (fetching for all terms) might return too many rows.
             // However, for standard Flow usage, this "Deduplication" prevents 101 queries if 101 requests come in.
             
             // Constructing a dynamic query for multiple LIKEs
             // WHERE (Title__c LIKE :t1 OR Title__c LIKE :t2 ...)
             // This is the most robust way for bulk fuzzy search.
             
             String query = 'SELECT Id, Name, Title__c, Category__c, Duration_Hours__c, Delivery_Format__c, Description__c FROM Course__c WHERE (';
             List<String> likeClauses = new List<String>();
             for (String term : searchTerms) {
                 // We need to double-escape for dynamic SOQL string (already escaped once above)
                 // But bind variables are safer. Since we have a dynamic number of terms, dynamic binding is hard.
                 // We will revert to simple iteration if the list is small, OR perform one query per unique term if list is large (still better than per request).
                 // Actually, best practice for fuzzy bulk is difficult. 
                 // We'll use the "Query per Unique Term" approach which is standard for robust search actions.
                 // It reduces N queries to M unique queries.
             }
        }
        
        // Strategy B: "Query Per Unique Term". 
        // If we have 50 requests but only 2 unique terms (e.g. "Security", "Leadership"), we do 2 queries instead of 50.
        // This solves the Loop issue for the most common Flow issues (bulk uploads).
        
        Map<String, List<Course__c>> resultsByTerm = new Map<String, List<Course__c>>();
        for (String term : searchTerms) {
             List<Course__c> termMatches = [
                SELECT Id, Name, Title__c, Category__c, Duration_Hours__c, 
                       Delivery_Format__c, Description__c
                FROM Course__c
                WHERE (Title__c LIKE :term OR Category__c LIKE :term)
                WITH USER_MODE
                ORDER BY Title__c
                LIMIT 10
            ];
            resultsByTerm.put(term, termMatches);
        }
        
        // 3. Construct results
        for (CourseSearchRequest request : requests) {
            CourseSearchResult result = new CourseSearchResult();
            
            if (String.isBlank(request.searchQuery)) {
                result.resultsFound = false;
                result.resultSummary = 'No search query provided.';
                results.add(result);
                continue;
            }
            
            String termKey = '%' + String.escapeSingleQuotes(request.searchQuery) + '%';
            List<Course__c> matches = resultsByTerm.get(termKey);
            
            if (matches == null || matches.isEmpty()) {
                result.resultsFound = false;
                result.resultSummary = 'No courses found matching "' + request.searchQuery + '".';
            } else {
                Course__c course = matches[0];
                result.courseTitle = course.Title__c;
                result.category = course.Category__c;
                result.durationHours = course.Duration_Hours__c;
                result.deliveryFormat = course.Delivery_Format__c;
                result.description = course.Description__c;
                result.courseId = course.Id;
                result.courseCode = course.Name;
                result.resultsFound = true;
                
                // Build detailed summary for each course
                List<String> courseSummaries = new List<String>();
                for (Course__c c : matches) {
                    List<String> details = new List<String>();
                    details.add('• Title: ' + (c.Title__c != null ? c.Title__c : 'N/A'));
                    details.add('• Category: ' + (c.Category__c != null ? c.Category__c : 'N/A'));
                    details.add('• Course Code: ' + (c.Name != null ? c.Name : 'N/A'));
                    details.add('• Delivery Format: ' + (c.Delivery_Format__c != null ? c.Delivery_Format__c : 'N/A'));
                    details.add('• Duration: ' + (c.Duration_Hours__c != null ? String.valueOf(c.Duration_Hours__c.intValue()) + ' hours' : 'N/A'));
                    details.add('• Description: ' + (c.Description__c != null ? c.Description__c : 'N/A'));
                    courseSummaries.add(String.join(details, '\n'));
                }
                
                if (matches.size() == 1) {
                    result.resultSummary = 'Here are the details for the course "' + course.Title__c + '":\n' + courseSummaries[0];
                } else {
                    result.resultSummary = 'Found ' + matches.size() + ' courses matching "' + request.searchQuery + '":\n\n' + String.join(courseSummaries, '\n\n');
                }
            }
            results.add(result);
        }
        
        return results;
    }
}