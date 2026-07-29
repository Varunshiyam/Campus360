public class LeaveRequestTriggerHandler {
    public static void handleBefore(List<Leave_Request__c> newRecords, Map<Id, Leave_Request__c> oldMap) {
        // 1. Gather Faculty and HOD IDs to query details
        Set<Id> facultyIds = new Set<Id>();
        Set<Id> hodIds = new Set<Id>();
        for (Leave_Request__c lr : newRecords) {
            if (lr.Employee_Faculty__c != null) {
                facultyIds.add(lr.Employee_Faculty__c);
            }
            if (lr.Employee_HOD__c != null) {
                hodIds.add(lr.Employee_HOD__c);
            }
        }
        
        // Query Faculty department mappings
        Map<Id, Faculty__c> facultyMap = new Map<Id, Faculty__c>();
        if (!facultyIds.isEmpty()) {
            facultyMap = new Map<Id, Faculty__c>([SELECT Id, Department__c FROM Faculty__c WHERE Id IN :facultyIds]);
        }
        
        // Gather all departments of the faculties to find their HODs
        Set<Id> deptIds = new Set<Id>();
        for (Faculty__c f : facultyMap.values()) {
            if (f.Department__c != null) {
                deptIds.add(f.Department__c);
            }
        }
        
        // Query HODs for these departments
        Map<Id, Id> deptToHodMap = new Map<Id, Id>();
        if (!deptIds.isEmpty()) {
            for (HOD__c h : [SELECT Id, Department__c FROM HOD__c WHERE Department__c IN :deptIds]) {
                deptToHodMap.put(h.Department__c, h.Id);
            }
        }
        
        // Query the Principal record
        Principal__c princ = null;
        List<Principal__c> principals = [SELECT Id FROM Principal__c LIMIT 1];
        if (!principals.isEmpty()) {
            princ = principals[0];
        }
        
        // Fetch existing active leaves for overlap check
        List<Leave_Request__c> existingLeaves = [
            SELECT Id, Employee_Faculty__c, Employee_HOD__c, From_Date__c, To_Date__c, Status__c
            FROM Leave_Request__c
            WHERE Status__c IN ('Pending', 'Approved')
              AND (Employee_Faculty__c IN :facultyIds OR Employee_HOD__c IN :hodIds)
        ];
        
        // Process each request
        for (Leave_Request__c lr : newRecords) {
            // Verify date validation
            if (lr.From_Date__c == null || lr.To_Date__c == null) {
                continue; // Handled by standard validation/required rules
            }
            
            // Enforce overlap checks
            for (Leave_Request__c ex : existingLeaves) {
                // Skip check against itself on update
                if (lr.Id != null && ex.Id == lr.Id) {
                    continue;
                }
                
                Boolean isOverlap = false;
                if (lr.Employee_Faculty__c != null && ex.Employee_Faculty__c == lr.Employee_Faculty__c) {
                    isOverlap = (lr.From_Date__c <= ex.To_Date__c && lr.To_Date__c >= ex.From_Date__c);
                } else if (lr.Employee_HOD__c != null && ex.Employee_HOD__c == lr.Employee_HOD__c) {
                    isOverlap = (lr.From_Date__c <= ex.To_Date__c && lr.To_Date__c >= ex.From_Date__c);
                }
                
                if (isOverlap) {
                    lr.addError('You already have an active leave request (Pending or Approved) that overlaps with these dates.');
                    break;
                }
            }
            
            // Auto-populate logic on insert
            Boolean isInsert = (lr.Id == null);
            if (isInsert) {
                lr.Status__c = 'Pending';
            }
            
            if (lr.Employee_Faculty__c != null) {
                Faculty__c f = facultyMap.get(lr.Employee_Faculty__c);
                if (f != null && f.Department__c != null) {
                    Id hodId = deptToHodMap.get(f.Department__c);
                    if (hodId != null) {
                        lr.Approver_HOD__c = hodId;
                    }
                }
            } else if (lr.Employee_HOD__c != null) {
                if (princ != null) {
                    lr.Approver_Principal__c = princ.Id;
                }
            }
        }
    }
}