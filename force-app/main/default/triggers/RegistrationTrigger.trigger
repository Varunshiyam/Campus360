trigger RegistrationTrigger on Registration__c (after update) {
    if (Trigger.isAfter && Trigger.isUpdate) {
        RegistrationTriggerHandler.handleAfterUpdate(Trigger.newMap, Trigger.oldMap);
    }
}