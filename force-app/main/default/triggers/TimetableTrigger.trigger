trigger TimetableTrigger on Timetable__c (before insert, before update) {
    if (Trigger.isBefore) {
        TimetableTriggerHandler.handleBefore(Trigger.new, Trigger.oldMap);
    }
}