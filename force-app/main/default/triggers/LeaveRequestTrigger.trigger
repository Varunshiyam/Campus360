trigger LeaveRequestTrigger on Leave_Request__c (before insert, before update) {
    if (Trigger.isBefore) {
        LeaveRequestTriggerHandler.handleBefore(Trigger.new, Trigger.oldMap);
    }
}