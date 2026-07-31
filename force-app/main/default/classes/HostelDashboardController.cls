public with sharing class HostelDashboardController {
  @AuraEnabled(cacheable=true)
  public static DashboardData getDashboardData() {
    DashboardData data = new DashboardData();
    data.totalStudents = [SELECT COUNT() FROM Student__c];
    data.availableRooms = [SELECT COUNT() FROM Room__c WHERE Availability__c = TRUE];
    data.pendingComplaints = [SELECT COUNT() FROM Complaint__c WHERE Status__c != 'Resolved'];
    data.foodTokens = [SELECT COUNT() FROM Food_Token__c];
    return data;
  }

  public class DashboardData {
    @AuraEnabled public Integer totalStudents;
    @AuraEnabled public Integer availableRooms;
    @AuraEnabled public Integer pendingComplaints;
    @AuraEnabled public Integer foodTokens;
  }
}