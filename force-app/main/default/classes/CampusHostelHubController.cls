public with sharing class CampusHostelHubController {

    public class DashboardSummary {
        @AuraEnabled public Integer totalStudents;
        @AuraEnabled public Integer totalHostels;
        @AuraEnabled public Integer totalRooms;
        @AuraEnabled public Integer availableRooms;
        @AuraEnabled public Integer occupiedRooms;
        @AuraEnabled public Integer pendingComplaints;
        @AuraEnabled public Integer complaintsResolvedToday;
        @AuraEnabled public Integer foodTokensIssuedToday;
        @AuraEnabled public Integer todaysVisitors;
        @AuraEnabled public Integer feePendingStudents;
    }

    public class StudentWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String studentName;
        @AuraEnabled public String regNumber;
        @AuraEnabled public String department;
        @AuraEnabled public String year;
        @AuraEnabled public String gender;
        @AuraEnabled public String phone;
        @AuraEnabled public String email;
        @AuraEnabled public String roomNumber;
        @AuraEnabled public String hostelStatus;
    }

    public class ComplaintWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String complaintId;
        @AuraEnabled public String studentName;
        @AuraEnabled public String studentId;
        @AuraEnabled public String category;
        @AuraEnabled public String description;
        @AuraEnabled public String priority;
        @AuraEnabled public String status;
        @AuraEnabled public DateTime createdDate;
        @AuraEnabled public Date resolutionDate;
    }

    public class VisitorWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String studentName;
        @AuraEnabled public String studentId;
        @AuraEnabled public String relation;
        @AuraEnabled public String phone;
        @AuraEnabled public DateTime checkInTime;
        @AuraEnabled public DateTime checkOutTime;
        @AuraEnabled public String purpose;
        @AuraEnabled public Boolean status;
    }

    public class LeaveWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String studentName;
        @AuraEnabled public String studentId;
        @AuraEnabled public Date fromDate;
        @AuraEnabled public Date toDate;
        @AuraEnabled public String destination;
        @AuraEnabled public String reason;
        @AuraEnabled public String status;
        @AuraEnabled public DateTime createdDate;
    }

    public class HostelRoomSummary {
        @AuraEnabled public String hostelId;
        @AuraEnabled public String hostelName;
        @AuraEnabled public String hostelType;
        @AuraEnabled public Integer totalRooms;
        @AuraEnabled public Integer availableRooms;
        @AuraEnabled public Integer occupiedRooms;
        @AuraEnabled public Decimal occupancyPercentage;
        @AuraEnabled public List<RoomDetail> rooms;
    }

    public class RoomDetail {
        @AuraEnabled public String id;
        @AuraEnabled public String roomNumber;
        @AuraEnabled public String roomType;
        @AuraEnabled public Decimal capacity;
        @AuraEnabled public Decimal currentOccupancy;
        @AuraEnabled public Boolean availability;
        @AuraEnabled public String hostelName;
    }

    public class FeeWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String studentName;
        @AuraEnabled public String academicYear;
        @AuraEnabled public Decimal totalFee;
        @AuraEnabled public Decimal paidAmount;
        @AuraEnabled public Decimal balance;
        @AuraEnabled public String paymentStatus;
        @AuraEnabled public Date dueDate;
        @AuraEnabled public Decimal paidPercentage;
    }

    public class FoodTokenWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String studentName;
        @AuraEnabled public Date mealDate;
        @AuraEnabled public String mealType;
        @AuraEnabled public String menuItem;
        @AuraEnabled public DateTime bookingTime;
        @AuraEnabled public String status;
    }

    public class BedAllocationWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String studentName;
        @AuraEnabled public String roomNumber;
        @AuraEnabled public String hostelName;
        @AuraEnabled public String bedNumber;
        @AuraEnabled public Date allocationDate;
        @AuraEnabled public String status;
    }

    public class AttendanceWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String studentName;
        @AuraEnabled public Date attDate;
        @AuraEnabled public DateTime checkInTime;
        @AuraEnabled public DateTime checkOutTime;
        @AuraEnabled public String status;
        @AuraEnabled public String remarks;
    }

    @AuraEnabled(cacheable=true)
    public static DashboardSummary getDashboardSummary() {
        DashboardSummary summary = new DashboardSummary();
        try {
            summary.totalStudents = [SELECT COUNT() FROM Student__c];
            summary.totalHostels = [SELECT COUNT() FROM Hostel__c];
            summary.totalRooms = [SELECT COUNT() FROM Room__c];
            summary.availableRooms = [SELECT COUNT() FROM Room__c WHERE Availability__c = true];
            
            summary.occupiedRooms = (summary.totalRooms >= summary.availableRooms) ? (summary.totalRooms - summary.availableRooms) : 0;

            summary.pendingComplaints = [SELECT COUNT() FROM Complaint__c WHERE Status__c != 'Resolved'];
            summary.complaintsResolvedToday = [SELECT COUNT() FROM Complaint__c WHERE Status__c = 'Resolved' AND (Resolution_Date__c = TODAY OR LastModifiedDate = TODAY)];
            
            summary.foodTokensIssuedToday = [SELECT COUNT() FROM Food_Token__c WHERE Booking_Time__c = TODAY OR Meal_Date__c = TODAY OR CreatedDate = TODAY];
            summary.todaysVisitors = [SELECT COUNT() FROM Visitor__c WHERE Check_in_Time__c = TODAY OR CreatedDate = TODAY];
            summary.feePendingStudents = [SELECT COUNT() FROM Hostel_Fee__c WHERE Balance__c > 0 OR Payment_Status__c = 'Pending' OR Payment_Status__c = 'Partial'];
        } catch (Exception e) {
            System.debug('Error in getDashboardSummary: ' + e.getMessage());
        }
        return summary;
    }

    @AuraEnabled(cacheable=true)
    public static List<StudentWrapper> getAllStudentsList() {
        List<StudentWrapper> listWrapper = new List<StudentWrapper>();
        try {
            List<Student__c> records = [
                SELECT Id, Name, Student_Name__c, Register_Number__c, Student_Id__c, Department__c, 
                       Year__c, Gender__c, Phone_Number__c, Email__c, Hostel_Status__c, Status__c,
                       (SELECT Room__r.Room_Number__c, Room__r.Name FROM Bed_Allocations__r LIMIT 1)
                FROM Student__c 
                ORDER BY Student_Name__c ASC 
                LIMIT 200
            ];
            for (Student__c s : records) {
                StudentWrapper sw = new StudentWrapper();
                sw.id = s.Id;
                sw.name = (s.Student_Name__c != null) ? s.Student_Name__c : s.Name;
                sw.studentName = sw.name;
                sw.regNumber = (s.Register_Number__c != null) ? s.Register_Number__c : (s.Student_Id__c != null ? s.Student_Id__c : s.Name);
                sw.department = (s.Department__c != null) ? s.Department__c : 'CSE';
                sw.year = (s.Year__c != null) ? s.Year__c : 'I Year';
                sw.gender = (s.Gender__c != null) ? s.Gender__c : 'Male';
                sw.phone = s.Phone_Number__c;
                sw.email = s.Email__c;
                sw.hostelStatus = (s.Hostel_Status__c != null) ? s.Hostel_Status__c : 'Checked In';
                
                if (s.Bed_Allocations__r != null && !s.Bed_Allocations__r.isEmpty()) {
                    sw.roomNumber = (s.Bed_Allocations__r[0].Room__r != null && s.Bed_Allocations__r[0].Room__r.Room_Number__c != null) ?
                                    s.Bed_Allocations__r[0].Room__r.Room_Number__c : s.Bed_Allocations__r[0].Room__r.Name;
                } else {
                    sw.roomNumber = '205';
                }
                listWrapper.add(sw);
            }
        } catch (Exception e) {
            System.debug('Error in getAllStudentsList: ' + e.getMessage());
        }
        return listWrapper;
    }

    @AuraEnabled(cacheable=true)
    public static List<Hostel__c> getAllHostelsList() {
        return [
            SELECT Id, Name, Hostel_Type__c, Total_Floors__c, Total_Rooms__c, Available_Rooms__c, Warden__c, Address__c
            FROM Hostel__c
            ORDER BY Name ASC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<RoomDetail> getAllRoomsList() {
        List<RoomDetail> listRooms = new List<RoomDetail>();
        try {
            List<Room__c> records = [
                SELECT Id, Name, Room_Number__c, Room_Type__c, Capacity__c, Current_Occupancy__c, Availability__c, Hostel__r.Name
                FROM Room__c
                ORDER BY Room_Number__c ASC
                LIMIT 200
            ];
            for (Room__c r : records) {
                RoomDetail rd = new RoomDetail();
                rd.id = r.Id;
                rd.roomNumber = (r.Room_Number__c != null) ? r.Room_Number__c : r.Name;
                rd.roomType = r.Room_Type__c;
                rd.capacity = (r.Capacity__c != null) ? r.Capacity__c : 0;
                rd.currentOccupancy = (r.Current_Occupancy__c != null) ? r.Current_Occupancy__c : 0;
                rd.availability = r.Availability__c;
                rd.hostelName = (r.Hostel__r != null) ? r.Hostel__r.Name : 'Unassigned';
                listRooms.add(rd);
            }
        } catch (Exception e) {
            System.debug('Error in getAllRoomsList: ' + e.getMessage());
        }
        return listRooms;
    }

    @AuraEnabled(cacheable=true)
    public static List<BedAllocationWrapper> getAllBedAllocationsList() {
        List<BedAllocationWrapper> listAlloc = new List<BedAllocationWrapper>();
        try {
            List<Bed_Allocation__c> records = [
                SELECT Id, Name, Student__r.Name, Student__r.Student_Name__c, Room__r.Room_Number__c, Room__r.Name, 
                       Hostel__r.Name, Bed_Number__c, Allocation_Date__c, Status__c
                FROM Bed_Allocation__c
                ORDER BY CreatedDate DESC
                LIMIT 100
            ];
            for (Bed_Allocation__c ba : records) {
                BedAllocationWrapper baw = new BedAllocationWrapper();
                baw.id = ba.Id;
                baw.name = ba.Name;
                baw.studentName = (ba.Student__r != null && ba.Student__r.Student_Name__c != null) ? ba.Student__r.Student_Name__c : 
                                   ((ba.Student__r != null) ? ba.Student__r.Name : 'N/A');
                baw.roomNumber = (ba.Room__r != null && ba.Room__r.Room_Number__c != null) ? ba.Room__r.Room_Number__c : 
                                  ((ba.Room__r != null) ? ba.Room__r.Name : 'N/A');
                baw.hostelName = (ba.Hostel__r != null) ? ba.Hostel__r.Name : 'N/A';
                baw.bedNumber = ba.Bed_Number__c;
                baw.allocationDate = ba.Allocation_Date__c;
                baw.status = (ba.Status__c != null) ? ba.Status__c : 'Active';
                listAlloc.add(baw);
            }
        } catch (Exception e) {
            System.debug('Error in getAllBedAllocationsList: ' + e.getMessage());
        }
        return listAlloc;
    }

    @AuraEnabled(cacheable=true)
    public static List<ComplaintWrapper> getRecentComplaints() {
        List<ComplaintWrapper> listWrapper = new List<ComplaintWrapper>();
        try {
            List<Complaint__c> records = [
                SELECT Id, Name, Complaint_ID__c, Student__c, Student__r.Name, Student__r.Student_Name__c, 
                       Category__c, Description__c, Priority__c, Status__c, Resolution_Date__c, CreatedDate 
                FROM Complaint__c 
                ORDER BY CreatedDate DESC 
                LIMIT 50
            ];
            for (Complaint__c c : records) {
                ComplaintWrapper cw = new ComplaintWrapper();
                cw.id = c.Id;
                cw.name = c.Name;
                cw.complaintId = (c.Complaint_ID__c != null) ? c.Complaint_ID__c : c.Name;
                cw.studentName = (c.Student__r != null && c.Student__r.Student_Name__c != null) ? c.Student__r.Student_Name__c : 
                                 ((c.Student__r != null) ? c.Student__r.Name : 'N/A');
                cw.studentId = c.Student__c;
                cw.category = c.Category__c;
                cw.description = c.Description__c;
                cw.priority = (c.Priority__c != null) ? c.Priority__c : 'Medium';
                cw.status = (c.Status__c != null) ? c.Status__c : 'New';
                cw.createdDate = c.CreatedDate;
                cw.resolutionDate = c.Resolution_Date__c;
                listWrapper.add(cw);
            }
        } catch (Exception e) {
            System.debug('Error in getRecentComplaints: ' + e.getMessage());
        }
        return listWrapper;
    }

    @AuraEnabled(cacheable=true)
    public static List<VisitorWrapper> getRecentVisitors() {
        List<VisitorWrapper> listWrapper = new List<VisitorWrapper>();
        try {
            List<Visitor__c> records = [
                SELECT Id, Name, Student__c, Student__r.Name, Student__r.Student_Name__c, 
                       Relation__c, Phone__c, Check_in_Time__c, Check_out_Time__c, Purpose__c, Visitor_Status__c, CreatedDate 
                FROM Visitor__c 
                ORDER BY CreatedDate DESC 
                LIMIT 50
            ];
            for (Visitor__c v : records) {
                VisitorWrapper vw = new VisitorWrapper();
                vw.id = v.Id;
                vw.name = v.Name;
                vw.studentName = (v.Student__r != null && v.Student__r.Student_Name__c != null) ? v.Student__r.Student_Name__c : 
                                 ((v.Student__r != null) ? v.Student__r.Name : 'N/A');
                vw.studentId = v.Student__c;
                vw.relation = v.Relation__c;
                vw.phone = v.Phone__c;
                vw.checkInTime = v.Check_in_Time__c;
                vw.checkOutTime = v.Check_out_Time__c;
                vw.purpose = v.Purpose__c;
                vw.status = (v.Visitor_Status__c == true);
                listWrapper.add(vw);
            }
        } catch (Exception e) {
            System.debug('Error in getRecentVisitors: ' + e.getMessage());
        }
        return listWrapper;
    }

    @AuraEnabled(cacheable=true)
    public static List<LeaveWrapper> getPendingLeaveRequests() {
        List<LeaveWrapper> listWrapper = new List<LeaveWrapper>();
        try {
            List<Leave_Request__c> records = [
                SELECT Id, Name, Student__c, Student__r.Name, Student__r.Student_Name__c, 
                       From_Date__c, To_Date__c, Destination__c, Reason__c, Status__c, CreatedDate 
                FROM Leave_Request__c 
                ORDER BY CreatedDate DESC 
                LIMIT 50
            ];
            for (Leave_Request__c l : records) {
                LeaveWrapper lw = new LeaveWrapper();
                lw.id = l.Id;
                lw.name = l.Name;
                lw.studentName = (l.Student__r != null && l.Student__r.Student_Name__c != null) ? l.Student__r.Student_Name__c : 
                                 ((l.Student__r != null) ? l.Student__r.Name : 'N/A');
                lw.studentId = l.Student__c;
                lw.fromDate = l.From_Date__c;
                lw.toDate = l.To_Date__c;
                lw.destination = l.Destination__c;
                lw.reason = l.Reason__c;
                lw.status = (l.Status__c != null) ? l.Status__c : 'Pending';
                lw.createdDate = l.CreatedDate;
                listWrapper.add(lw);
            }
        } catch (Exception e) {
            System.debug('Error in getPendingLeaveRequests: ' + e.getMessage());
        }
        return listWrapper;
    }

    @AuraEnabled(cacheable=true)
    public static List<HostelRoomSummary> getRoomOccupancySummary() {
        List<HostelRoomSummary> listSummary = new List<HostelRoomSummary>();
        try {
            List<Hostel__c> hostels = [
                SELECT Id, Name, Hostel_Type__c, Total_Rooms__c, Available_Rooms__c,
                       (SELECT Id, Name, Room_Number__c, Room_Type__c, Capacity__c, Current_Occupancy__c, Availability__c FROM Rooms__r)
                FROM Hostel__c
                LIMIT 20
            ];
            for (Hostel__c h : hostels) {
                HostelRoomSummary hrs = new HostelRoomSummary();
                hrs.hostelId = h.Id;
                hrs.hostelName = h.Name;
                hrs.hostelType = h.Hostel_Type__c;
                hrs.rooms = new List<RoomDetail>();
                
                Integer totalR = (h.Rooms__r != null) ? h.Rooms__r.size() : 0;
                Integer availR = 0;
                Integer occR = 0;

                if (h.Rooms__r != null) {
                    for (Room__c r : h.Rooms__r) {
                        RoomDetail rd = new RoomDetail();
                        rd.id = r.Id;
                        rd.roomNumber = (r.Room_Number__c != null) ? r.Room_Number__c : r.Name;
                        rd.roomType = r.Room_Type__c;
                        rd.capacity = (r.Capacity__c != null) ? r.Capacity__c : 0;
                        rd.currentOccupancy = (r.Current_Occupancy__c != null) ? r.Current_Occupancy__c : 0;
                        rd.availability = r.Availability__c;
                        rd.hostelName = h.Name;
                        hrs.rooms.add(rd);

                        if (r.Availability__c == true) {
                            availR++;
                        } else {
                            occR++;
                        }
                    }
                }
                hrs.totalRooms = totalR;
                hrs.availableRooms = availR;
                hrs.occupiedRooms = occR;
                hrs.occupancyPercentage = (totalR > 0) ? ((Decimal)occR / (Decimal)totalR * 100).setScale(1) : 0;
                listSummary.add(hrs);
            }
        } catch (Exception e) {
            System.debug('Error in getRoomOccupancySummary: ' + e.getMessage());
        }
        return listSummary;
    }

    @AuraEnabled(cacheable=true)
    public static List<FeeWrapper> getFeePendingStudents() {
        List<FeeWrapper> listWrapper = new List<FeeWrapper>();
        try {
            List<Hostel_Fee__c> records = [
                SELECT Id, Name, Student__c, Student__r.Name, Student__r.Student_Name__c, 
                       Academic_Year__c, Total_Fee__c, Paid_Amount__c, Balance__c, Payment_Status__c, Due_Date__c 
                FROM Hostel_Fee__c 
                ORDER BY Balance__c DESC NULLS LAST 
                LIMIT 50
            ];
            for (Hostel_Fee__c hf : records) {
                FeeWrapper fw = new FeeWrapper();
                fw.id = hf.Id;
                fw.name = hf.Name;
                fw.studentName = (hf.Student__r != null && hf.Student__r.Student_Name__c != null) ? hf.Student__r.Student_Name__c : 
                                 ((hf.Student__r != null) ? hf.Student__r.Name : 'N/A');
                fw.academicYear = hf.Academic_Year__c;
                fw.totalFee = (hf.Total_Fee__c != null) ? hf.Total_Fee__c : 0;
                fw.paidAmount = (hf.Paid_Amount__c != null) ? hf.Paid_Amount__c : 0;
                fw.balance = (hf.Balance__c != null) ? hf.Balance__c : (fw.totalFee - fw.paidAmount);
                fw.paymentStatus = (hf.Payment_Status__c != null) ? hf.Payment_Status__c : 'Pending';
                fw.dueDate = hf.Due_Date__c;
                fw.paidPercentage = (fw.totalFee > 0) ? ((fw.paidAmount / fw.totalFee) * 100).setScale(1) : 0;
                listWrapper.add(fw);
            }
        } catch (Exception e) {
            System.debug('Error in getFeePendingStudents: ' + e.getMessage());
        }
        return listWrapper;
    }

    @AuraEnabled(cacheable=true)
    public static List<FoodTokenWrapper> getTodayFoodTokens() {
        List<FoodTokenWrapper> listWrapper = new List<FoodTokenWrapper>();
        try {
            List<Food_Token__c> records = [
                SELECT Id, Name, Student__c, Student__r.Name, Student__r.Student_Name__c, 
                       Meal_Date__c, Meal_Type__c, Menu_Item__c, Booking_Time__c, Status__c 
                FROM Food_Token__c 
                ORDER BY CreatedDate DESC 
                LIMIT 50
            ];
            for (Food_Token__c ft : records) {
                FoodTokenWrapper ftw = new FoodTokenWrapper();
                ftw.id = ft.Id;
                ftw.name = ft.Name;
                ftw.studentName = (ft.Student__r != null && ft.Student__r.Student_Name__c != null) ? ft.Student__r.Student_Name__c : 
                                  ((ft.Student__r != null) ? ft.Student__r.Name : 'N/A');
                ftw.mealDate = ft.Meal_Date__c;
                ftw.mealType = ft.Meal_Type__c;
                ftw.menuItem = ft.Menu_Item__c;
                ftw.bookingTime = ft.Booking_Time__c;
                ftw.status = (ft.Status__c != null) ? ft.Status__c : 'Booked';
                listWrapper.add(ftw);
            }
        } catch (Exception e) {
            System.debug('Error in getTodayFoodTokens: ' + e.getMessage());
        }
        return listWrapper;
    }

    @AuraEnabled(cacheable=true)
    public static List<AttendanceWrapper> getAllAttendanceList() {
        List<AttendanceWrapper> listAtt = new List<AttendanceWrapper>();
        try {
            List<Attendance__c> records = [
                SELECT Id, Name, Student__r.Name, Student__r.Student_Name__c, Date__c, Check_in_Time__c, Check_out_Time__c, Status__c, Remarks__c
                FROM Attendance__c
                ORDER BY CreatedDate DESC
                LIMIT 50
            ];
            for (Attendance__c a : records) {
                AttendanceWrapper aw = new AttendanceWrapper();
                aw.id = a.Id;
                aw.name = a.Name;
                aw.studentName = (a.Student__r != null && a.Student__r.Student_Name__c != null) ? a.Student__r.Student_Name__c : 
                                  ((a.Student__r != null) ? a.Student__r.Name : 'N/A');
                aw.attDate = a.Date__c;
                aw.checkInTime = a.Check_in_Time__c;
                aw.checkOutTime = a.Check_out_Time__c;
                aw.status = (a.Status__c != null) ? a.Status__c : 'Present';
                aw.remarks = a.Remarks__c;
                listAtt.add(aw);
            }
        } catch (Exception e) {
            System.debug('Error in getAllAttendanceList: ' + e.getMessage());
        }
        return listAtt;
    }

    @AuraEnabled(cacheable=true)
    public static List<Student__c> getStudentOptions() {
        return [SELECT Id, Name, Student_Name__c, Register_Number__c FROM Student__c ORDER BY Student_Name__c ASC LIMIT 100];
    }

    @AuraEnabled
    public static String createComplaint(String studentId, String category, String priority, String description) {
        Complaint__c c = new Complaint__c(
            Student__c = studentId,
            Category__c = category,
            Priority__c = priority,
            Description__c = description,
            Status__c = 'In Progress'
        );
        insert c;
        return c.Id;
    }

    @AuraEnabled
    public static String issueFoodToken(String studentId, String mealType, String menuItem) {
        Food_Token__c ft = new Food_Token__c(
            Student__c = studentId,
            Meal_Type__c = mealType,
            Menu_Item__c = menuItem,
            Meal_Date__c = Date.today(),
            Booking_Time__c = DateTime.now(),
            Status__c = 'Booked'
        );
        insert ft;
        return ft.Id;
    }

    @AuraEnabled
    public static String registerVisitor(String studentId, String visitorName, String relation, String phone, String purpose) {
        Visitor__c v = new Visitor__c(
            Name = visitorName,
            Student__c = studentId,
            Relation__c = relation,
            Phone__c = phone,
            Purpose__c = purpose,
            Check_in_Time__c = DateTime.now(),
            Visitor_Status__c = true
        );
        insert v;
        return v.Id;
    }

    @AuraEnabled
    public static void resolveComplaint(String complaintId) {
        Complaint__c c = new Complaint__c(
            Id = complaintId,
            Status__c = 'Resolved',
            Resolution_Date__c = Date.today()
        );
        update c;
    }
}