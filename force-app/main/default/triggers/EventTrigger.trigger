trigger EventTrigger on Event__c (after update) {
    if (Trigger.isAfter && Trigger.isUpdate) {
        EventTriggerHandler.handleAfterUpdate(Trigger.newMap, Trigger.oldMap);
    }
}