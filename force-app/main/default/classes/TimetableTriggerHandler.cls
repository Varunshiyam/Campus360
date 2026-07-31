public with sharing class TimetableTriggerHandler {
    public static Boolean bypassConflictValidation = false;
    
    public static void handleBefore(List<Timetable__c> newRecords, Map<Id, Timetable__c> oldMap) {
        // 1. Validate Sunday and auto-populate Time fields from Period
        for (Timetable__c t : newRecords) {
            if (t.Day__c != null && t.Day__c.equalsIgnoreCase('Sunday')) {
                t.addError('Sunday is a holiday. No classes can be scheduled on Sunday.');
                continue;
            }
            
            // Map Period to start/end times
            if (t.Period__c != null) {
                Integer p = t.Period__c.intValue();
                if (p < 1 || p > 8) {
                    t.addError('Period must be between 1 and 8.');
                    continue;
                }
                populateTimes(t, p);
            }
        }
        
        // 2. Query and validate conflicts
        if (!bypassConflictValidation) {
            validateConflicts(newRecords, oldMap);
        }
    }
    
    private static void populateTimes(Timetable__c t, Integer period) {
        switch on period {
            when 1 {
                t.Start_Time__c = '9:00';
                t.End_Time__c = '9:50';
                t.Time_Slot__c = '9:00 - 9:50';
            }
            when 2 {
                t.Start_Time__c = '9:50';
                t.End_Time__c = '10:40';
                t.Time_Slot__c = '9:50 - 10:40';
            }
            when 3 {
                t.Start_Time__c = '10:50';
                t.End_Time__c = '11:40';
                t.Time_Slot__c = '10:50 - 11:40';
            }
            when 4 {
                t.Start_Time__c = '11:40';
                t.End_Time__c = '12:30';
                t.Time_Slot__c = '11:40 - 12:30';
            }
            when 5 {
                t.Start_Time__c = '1:20';
                t.End_Time__c = '2:10';
                t.Time_Slot__c = '1:20 - 2:10';
            }
            when 6 {
                t.Start_Time__c = '2:10';
                t.End_Time__c = '3:00';
                t.Time_Slot__c = '2:10 - 3:00';
            }
            when 7 {
                t.Start_Time__c = '3:10';
                t.End_Time__c = '4:00';
                t.Time_Slot__c = '3:10 - 4:00';
            }
            when 8 {
                t.Start_Time__c = '4:00';
                t.End_Time__c = '4:50';
                t.Time_Slot__c = '4:00 - 4:50';
            }
        }
    }
    
    private static void validateConflicts(List<Timetable__c> newRecords, Map<Id, Timetable__c> oldMap) {
        // Collect attributes to search the DB
        Set<String> days = new Set<String>();
        Set<Decimal> periods = new Set<Decimal>();
        Set<String> timeSlots = new Set<String>();
        
        for (Timetable__c t : newRecords) {
            if (t.Day__c != null) days.add(t.Day__c);
            if (t.Period__c != null) {
                periods.add(t.Period__c);
                periods.add(t.Period__c - 1);
                periods.add(t.Period__c + 1);
            }
            if (t.Time_Slot__c != null) timeSlots.add(t.Time_Slot__c);
        }
        
        if (days.isEmpty()) return;
        
        // Query database records that could potentially conflict
        List<Timetable__c> existing = [
            SELECT Id, Day__c, Period__c, Time_Slot__c, Faculty__c, Faculty_Name__c, 
                   Classroom__c, Subject__c, Section__c, Department__c, Academic_Year__c, Semester__c
            FROM Timetable__c
            WHERE Day__c IN :days
              AND (Period__c IN :periods OR Time_Slot__c IN :timeSlots)
        ];
        
        // Build combined list of records to validate against (DB + Trigger.new)
        // For updates, we replace the DB record with the updated one
        Map<Id, Timetable__c> allRecordsMap = new Map<Id, Timetable__c>();
        for (Timetable__c t : existing) {
            allRecordsMap.put(t.Id, t);
        }
        for (Timetable__c t : newRecords) {
            if (t.Id != null) {
                allRecordsMap.put(t.Id, t);
            }
        }
        
        List<Timetable__c> validationPool = new List<Timetable__c>(allRecordsMap.values());
        // For new records, we append them to the pool
        for (Timetable__c t : newRecords) {
            if (t.Id == null) {
                validationPool.add(t);
            }
        }
        
        // Validate each record in Trigger.new against the pool
        for (Timetable__c current : newRecords) {
            if (current.Day__c == null || (current.Period__c == null && current.Time_Slot__c == null)) {
                continue;
            }
            
            Boolean isLab = isLaboratorySubject(current.Subject__c);
            Boolean foundLabCompanion = false;
            
            for (Timetable__c other : validationPool) {
                // Skip comparing to the exact same record instance
                if (current === other || (current.Id != null && current.Id == other.Id)) {
                    continue;
                }
                
                // Compare on same Day and same Period/Time_Slot
                Boolean sameTime = (current.Day__c.equalsIgnoreCase(other.Day__c)) && 
                                   ((current.Period__c != null && other.Period__c != null && current.Period__c == other.Period__c) ||
                                    (current.Time_Slot__c != null && other.Time_Slot__c != null && current.Time_Slot__c.equalsIgnoreCase(other.Time_Slot__c)));
                
                if (sameTime) {
                    Boolean sameTerm = isSameTerm(current.Semester__c, other.Semester__c);
                    if (sameTerm) {
                        // Rule 1: A faculty member cannot be assigned to two classes during the same period.
                        Boolean sameFaculty = (current.Faculty__c != null && other.Faculty__c != null && current.Faculty__c == other.Faculty__c) ||
                                              (String.isNotBlank(current.Faculty_Name__c) && String.isNotBlank(other.Faculty_Name__c) && current.Faculty_Name__c.equalsIgnoreCase(other.Faculty_Name__c));
                        if (sameFaculty) {
                            current.addError('Faculty member is already assigned to another class during this period.');
                            break;
                        }
                        
                        // Rule 2: A classroom cannot be allocated to two sections at the same time.
                        Boolean sameClassroom = String.isNotBlank(current.Classroom__c) && 
                                                String.isNotBlank(other.Classroom__c) && 
                                                current.Classroom__c.equalsIgnoreCase(other.Classroom__c);
                        if (sameClassroom) {
                            current.addError('Classroom ' + current.Classroom__c + ' is already allocated to another section during this period.');
                            break;
                        }
                    }
                    
                    // Rule 3: A section cannot have two subjects in one period.
                    Boolean sameSection = isSameSection(current, other);
                    if (sameSection) {
                        current.addError('This section already has a class scheduled during this period.');
                        break;
                    }
                }
                
                // Rule 4: Laboratory subjects must occupy two consecutive periods.
                // Look for a companion lab entry in the same section, day, and subject
                if (isLab && isSameSection(current, other) && 
                    current.Day__c.equalsIgnoreCase(other.Day__c) && 
                    String.isNotBlank(current.Subject__c) && 
                    current.Subject__c.equalsIgnoreCase(other.Subject__c)) {
                    
                    if (current.Period__c != null && other.Period__c != null) {
                        Decimal diff = Math.abs(current.Period__c - other.Period__c);
                        if (diff == 1) {
                            foundLabCompanion = true;
                        }
                    }
                }
            }
            
            // If Laboratory and no companion was found, add error
            if (isLab && !foundLabCompanion) {
                current.addError('Laboratory subjects must occupy two consecutive periods (e.g. Periods 1-2, 3-4, 5-6, 7-8).');
            }
        }
    }
    
    private static Boolean isSameTerm(String sem1, String sem2) {
        if (String.isBlank(sem1) || String.isBlank(sem2)) return true;
        Boolean isOdd1 = sem1.contains('3') || sem1.contains('5') || sem1.contains('7');
        Boolean isOdd2 = sem2.contains('3') || sem2.contains('5') || sem2.contains('7');
        return isOdd1 == isOdd2;
    }
    
    private static Boolean isSameSection(Timetable__c t1, Timetable__c t2) {
        String sec1 = (t1.Department__c != null ? t1.Department__c : '') + '-' +
                      (t1.Academic_Year__c != null ? t1.Academic_Year__c : '') + '-' +
                      (t1.Semester__c != null ? t1.Semester__c : '') + '-' +
                      (t1.Section__c != null ? t1.Section__c : '');
        String sec2 = (t2.Department__c != null ? t2.Department__c : '') + '-' +
                      (t2.Academic_Year__c != null ? t2.Academic_Year__c : '') + '-' +
                      (t2.Semester__c != null ? t2.Semester__c : '') + '-' +
                      (t2.Section__c != null ? t2.Section__c : '');
        return sec1.equalsIgnoreCase(sec2);
    }
    
    private static Boolean isLaboratorySubject(String subject) {
        if (String.isBlank(subject)) return false;
        String s = subject.toLowerCase();
        return s.contains('lab') || 
               s.contains('laboratory') || 
               s.contains('practical') || 
               s.contains('drawing') || 
               s.contains('graphics') || 
               s.contains('workshop') || 
               s.contains('design project') || 
               s.contains('major project');
    }
}