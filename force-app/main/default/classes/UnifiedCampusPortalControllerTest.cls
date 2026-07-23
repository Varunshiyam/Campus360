@IsTest
private class UnifiedCampusPortalControllerTest {
  @IsTest
  static void testWorkflow() {
    // 1. Check exists (should be false)
    System.assertEquals(
      false,
      UnifiedCampusPortalController.checkPrincipalExists()
    );

    // 2. Register Principal
    Map<String, String> regData = new Map<String, String>{
      'fullName' => 'Dr. John Smith',
      'employeeId' => 'PR-001',
      'mobileNumber' => '9999999999',
      'email' => 'john.smith@gmail.com', // should map to @college.edu
      'gender' => 'Male',
      'dob' => '1980-01-01',
      'qualification' => 'Ph.D. Education',
      'experience' => '12',
      'address' => '123 College St',
      'username' => 'johnsmith',
      'password' => 'password',
      'photo' => 'profile.png'
    };

    String regResult = UnifiedCampusPortalController.registerPrincipal(regData);
    System.assertEquals('OK', regResult);
    System.assertEquals(
      true,
      UnifiedCampusPortalController.checkPrincipalExists()
    );

    // Check validation mapping email/exp
    Principal__c principal = [
      SELECT Email__c, Experience__c
      FROM Principal__c
      LIMIT 1
    ];
    System.assertEquals('john.smith@college.edu', principal.Email__c);
    System.assertEquals(12, principal.Experience__c);

    // 3. Login Principal
    Map<String, Object> loginRes = UnifiedCampusPortalController.loginUser(
      'Principal',
      'johnsmith',
      'password'
    );
    System.assertNotEquals(null, loginRes.get('id'));
    System.assertEquals('Principal', loginRes.get('role'));

    // Test invalid login
    try {
      UnifiedCampusPortalController.loginUser(
        'Principal',
        'johnsmith',
        'wrong_pass'
      );
      System.assert(false, 'Should throw exception on invalid password');
    } catch (Exception e) {
      System.assert(true);
    }

    // 4. Seed Database
    UnifiedCampusPortalController.seedDatabase();

    // 5. Test HOD & Faculty Logins
    Map<String, Object> hodLogin = UnifiedCampusPortalController.loginUser(
      'HOD',
      'arun@college.edu',
      'password'
    );
    System.assertEquals('HOD', hodLogin.get('role'));

    Map<String, Object> facLogin = UnifiedCampusPortalController.loginUser(
      'Faculty',
      'rajesh@college.edu',
      'password'
    );
    System.assertEquals('Faculty', facLogin.get('role'));

    // 6. Stats & Lists
    UnifiedCampusPortalController.DashboardOverviewWrapper stats = UnifiedCampusPortalController.getDashboardOverview();
    System.assertNotEquals(0, stats.departmentsCount);

    List<UnifiedCampusPortalController.DepartmentItem> depts = UnifiedCampusPortalController.getDepartmentList();
    System.assert(!depts.isEmpty());

    String csDeptId;
    for (UnifiedCampusPortalController.DepartmentItem item : depts) {
      if (item.name == 'Computer Science') {
        csDeptId = item.id;
        break;
      }
    }

    // 7. Department Details
    Map<String, Object> deptDetails = UnifiedCampusPortalController.getDepartmentDetails(
      csDeptId
    );
    System.assertEquals('Computer Science', deptDetails.get('name'));

    // 8. Change HOD
    List<Faculty__c> candidates = (List<Faculty__c>) deptDetails.get(
      'candidates'
    );
    System.assert(!candidates.isEmpty());
    UnifiedCampusPortalController.changeDepartmentHOD(
      csDeptId,
      candidates[0].Id
    );

    // Verify HOD changed
    List<HOD__c> newHods = [
      SELECT Id, Name
      FROM HOD__c
      WHERE Department__c = :csDeptId
    ];
    System.assertEquals(candidates[0].Name, newHods[0].Name);

    // 9. Faculty Details & Save
    Faculty__c remainingFac = [SELECT Id, Name FROM Faculty__c LIMIT 1];
    UnifiedCampusPortalController.FacultyWrapper facDetails = UnifiedCampusPortalController.getFacultyDetails(
      remainingFac.Id
    );
    System.assertEquals(remainingFac.Name, facDetails.name);

    Map<String, String> editFields = new Map<String, String>{
      'name' => 'Dr. Rajesh Kumar',
      'email' => 'rajesh.k@college.edu',
      'phone' => '8888888888',
      'qualification' => 'Ph.D. Computer Science',
      'designation' => 'Professor',
      'experience' => '15'
    };
    UnifiedCampusPortalController.saveFacultyDetails(
      remainingFac.Id,
      editFields
    );
    Faculty__c updatedProf = [
      SELECT Name, Email__c
      FROM Faculty__c
      WHERE Id = :remainingFac.Id
    ];
    System.assertEquals('Dr. Rajesh Kumar', updatedProf.Name);

    // 10. Principal Edit Profile
    Map<String, String> princFields = new Map<String, String>{
      'name' => 'Dr. John W. Smith',
      'email' => 'john.w.smith@college.edu',
      'phone' => '7777777777',
      'qualification' => 'Ph.D. Leadership',
      'address' => '456 College Ave',
      'experience' => '18'
    };
    UnifiedCampusPortalController.savePrincipalProfile(
      (String) loginRes.get('id'),
      princFields
    );
    Principal__c updatedPrinc = [
      SELECT Name, Qualification__c
      FROM Principal__c
      WHERE Id = :(String) loginRes.get('id')
    ];
    System.assertEquals('Dr. John W. Smith', updatedPrinc.Name);

    // 11. Leave Requests
    Faculty__c testFac = [SELECT Id, Department__c FROM Faculty__c LIMIT 1];
    HOD__c testHod = [SELECT Id FROM HOD__c WHERE Department__c = :testFac.Department__c LIMIT 1];

    UnifiedCampusPortalController.submitLeaveRequest(
      testFac.Id,
      'Faculty',
      'Sick',
      String.valueOf(Date.today().addDays(1)),
      String.valueOf(Date.today().addDays(2)),
      'Personal work'
    );
    List<UnifiedCampusPortalController.LeaveRequestWrapper> leaves = UnifiedCampusPortalController.getLeaveRequests('Faculty', testFac.Id);
    System.assert(!leaves.isEmpty());
    UnifiedCampusPortalController.updateLeaveStatus(leaves[0].id, 'Approved', testHod.Id, 'Approved comments');

    Leave_Request__c lr = [
      SELECT Status__c
      FROM Leave_Request__c
      WHERE Id = :leaves[0].id
    ];
    System.assertEquals('Approved', lr.Status__c);

    // 12. Student Attendance marking
    UnifiedCampusPortalController.toggleStudentAttendance(
      'Aarav Sharma',
      'Absent'
    );
    List<Attendance__c> atts = [
      SELECT Status__c
      FROM Attendance__c
      WHERE Employee_Name__c = 'Aarav Sharma' AND Attendance_Date__c = TODAY
    ];
    System.assertEquals('Absent', atts[0].Status__c);

    UnifiedCampusPortalController.toggleStudentAttendance(
      'Aarav Sharma',
      'Present'
    );
    atts = [
      SELECT Status__c
      FROM Attendance__c
      WHERE Employee_Name__c = 'Aarav Sharma' AND Attendance_Date__c = TODAY
    ];
    System.assertEquals('Present', atts[0].Status__c);

    // 13. Announcement Posting and Target Auditing
    // Clean up existing seeded announcements first to get clean assertion counts
    delete [SELECT Id FROM Announcement__c];

    UnifiedCampusPortalController.postAnnouncement(
      'HOD Announcement',
      'This is specifically for HODs.',
      'Principal',
      true,
      false
    );
    UnifiedCampusPortalController.postAnnouncement(
      'Faculty Announcement',
      'This is specifically for Faculty.',
      'Principal',
      false,
      true
    );
    UnifiedCampusPortalController.postAnnouncement(
      'General Announcement',
      'This is for both HODs and Faculty.',
      'Principal',
      true,
      true
    );

    // Verify HOD dashboard announcements
    List<Announcement__c> hodAnns = UnifiedCampusPortalController.getAnnouncements('HOD');
    System.assertEquals(2, hodAnns.size(), 'HOD should see HOD Announcement and General Announcement');

    // Verify Faculty dashboard announcements
    List<Announcement__c> facAnns = UnifiedCampusPortalController.getAnnouncements('Faculty');
    System.assertEquals(2, facAnns.size(), 'Faculty should see Faculty Announcement and General Announcement');

    // Verify Principal sees all
    List<Announcement__c> princAnns = UnifiedCampusPortalController.getAnnouncements('Principal');
    System.assertEquals(3, princAnns.size(), 'Principal should see all announcements');

    // 14. Test New Record Insertions
    String newDeptId = UnifiedCampusPortalController.addDepartment(
      'BioTechnology',
      'BT-001',
      'D Block',
      'bt@college.edu',
      '9999999991',
      'UG'
    );
    System.assertNotEquals(null, newDeptId);

    String newHodId = UnifiedCampusPortalController.addHOD(
      'Dr. Biotech',
      'biotech@college.edu',
      '9999999992',
      'EMP-H005',
      newDeptId,
      'biotech',
      'password',
      6
    );
    System.assertNotEquals(null, newHodId);

    String newFacId = UnifiedCampusPortalController.addFaculty(
      'Mr. Bio',
      'bio@college.edu',
      '9999999993',
      'Assistant Professor',
      'M.Tech',
      4,
      newDeptId,
      'bio',
      'password',
      '1990-05-05'
    );
    System.assertNotEquals(null, newFacId);

    // 15. Test Record Deletions
    UnifiedCampusPortalController.deleteFaculty(newFacId);
    UnifiedCampusPortalController.deleteHOD(newHodId);
    UnifiedCampusPortalController.deleteDepartment(newDeptId);

    // Verify deletion
    System.assertEquals(
      0,
      [SELECT COUNT() FROM Faculty__c WHERE Id = :newFacId]
    );
    System.assertEquals(0, [SELECT COUNT() FROM HOD__c WHERE Id = :newHodId]);
    System.assertEquals(
      0,
      [SELECT COUNT() FROM Department__c WHERE Id = :newDeptId]
    );
  }

  @IsTest
  static void testAcademicWorkloadAndTimetable() {
    UnifiedCampusPortalController.seedDatabase();
    UnifiedCampusPortalController.generateFullTimetables();
    
    Department__c dept = [SELECT Id FROM Department__c LIMIT 1];
    
    List<UnifiedCampusPortalController.SubjectAllocationWrapper> allocations = UnifiedCampusPortalController.getSubjectAllocations(dept.Id);
    System.assertNotEquals(null, allocations);
    
    List<UnifiedCampusPortalController.FacultyWorkloadWrapper> workloads = UnifiedCampusPortalController.getFacultyWorkload(dept.Id, 'Semester 3');
    System.assertNotEquals(null, workloads);
    System.assert(!workloads.isEmpty());
    
    Faculty__c fac = [SELECT Id FROM Faculty__c WHERE Department__c = :dept.Id LIMIT 1];
    List<UnifiedCampusPortalController.TimetableEntryWrapper> facTimetable = UnifiedCampusPortalController.getFacultyTimetable(fac.Id);
    System.assertNotEquals(null, facTimetable);
    
    List<UnifiedCampusPortalController.TimetableEntryWrapper> labSchedule = UnifiedCampusPortalController.getLabSchedule(dept.Id);
    System.assertNotEquals(null, labSchedule);
    
    List<UnifiedCampusPortalController.TimetableEntryWrapper> deptTimetable = UnifiedCampusPortalController.getDepartmentTimetable(dept.Id, 'Section A', 'Semester 3');
    System.assertNotEquals(null, deptTimetable);
    
    List<UnifiedCampusPortalController.LeaveImpactWrapper> leaveImpacts = UnifiedCampusPortalController.getLeaveImpact(dept.Id);
    System.assertNotEquals(null, leaveImpacts);
    
    Subject__c sub = [SELECT Id, Assigned_Faculty__c, Weekly_Hours__c, Laboratory_Hours__c, Section__c FROM Subject__c WHERE Department__c = :dept.Id LIMIT 1];
    Faculty__c otherFac = [SELECT Id FROM Faculty__c WHERE Department__c = :dept.Id AND Id != :fac.Id LIMIT 1];
    
    UnifiedCampusPortalController.updateSubjectAssignment(sub.Id, otherFac.Id, (Integer)sub.Weekly_Hours__c, (Integer)sub.Laboratory_Hours__c, sub.Section__c);
    
    Subject__c updatedSub = [SELECT Assigned_Faculty__c FROM Subject__c WHERE Id = :sub.Id];
    System.assertEquals(otherFac.Id, updatedSub.Assigned_Faculty__c);
    
    // Clear any existing class for Tuesday Period 1 Section A to avoid trigger validation error
    delete [SELECT Id FROM Timetable__c WHERE Day__c = 'Tuesday' AND Section__c = 'Section A' AND Period__c = 1.0];
    
    UnifiedCampusPortalController.saveTimetableEntry(
      null,
      'Tuesday',
      1.0,
      'Programming in C',
      dept.Id,
      otherFac.Id,
      'Section A',
      'LH-101'
    );
    
    List<Timetable__c> entries = [
      SELECT Id, Day__c, Period__c 
      FROM Timetable__c 
      WHERE Day__c = 'Tuesday' AND Section__c = 'Section A' AND Period__c = 1.0
    ];
    System.assert(!entries.isEmpty());
    
    UnifiedCampusPortalController.deleteTimetableEntry(entries[0].Id);
    
    System.assertEquals(0, [SELECT COUNT() FROM Timetable__c WHERE Id = :entries[0].Id]);
  }

  @IsTest
  static void testPasswordResetWorkflow() {
    UnifiedCampusPortalController.seedDatabase();
    
    // Get a seeded Faculty
    Faculty__c fac = [SELECT Name, Department__r.Name FROM Faculty__c LIMIT 1];
    
    // Submit request for Faculty
    String submitRes = UnifiedCampusPortalController.submitPasswordResetRequest(
        fac.Name,
        fac.Department__r.Name,
        'Faculty'
    );
    System.assertEquals('OK', submitRes);
    
    // Submit request for non-existent staff to test no-match scenario
    UnifiedCampusPortalController.submitPasswordResetRequest(
        'Non Existent Staff',
        'Computer Science',
        'HOD'
    );
    
    // Retrieve pending requests
    List<UnifiedCampusPortalController.PasswordResetWrapper> reqs = 
        UnifiedCampusPortalController.getPasswordResetRequests();
    
    System.assertEquals(2, reqs.size());
    
    // Find our requests and verify matches
    UnifiedCampusPortalController.PasswordResetWrapper facReq;
    UnifiedCampusPortalController.PasswordResetWrapper fakeReq;
    for (UnifiedCampusPortalController.PasswordResetWrapper r : reqs) {
        if (r.staffName == fac.Name) {
            facReq = r;
        } else if (r.staffName == 'Non Existent Staff') {
            fakeReq = r;
        }
    }
    
    System.assertNotEquals(null, facReq);
    System.assertEquals(true, facReq.userExists);
    
    System.assertNotEquals(null, fakeReq);
    System.assertEquals(false, fakeReq.userExists);
    
    // Resolve the valid request
    String resolveRes = UnifiedCampusPortalController.resolvePasswordResetRequest(
        facReq.id,
        'newfacultyusername',
        'newfacultypassword'
    );
    System.assertEquals('OK', resolveRes);
    
    // Verify changes applied to the Faculty record
    Faculty__c updatedFac = [SELECT Username__c, Password__c FROM Faculty__c WHERE Id = :fac.Id];
    System.assertEquals('newfacultyusername', updatedFac.Username__c);
    System.assertEquals('newfacultypassword', updatedFac.Password__c);
    
    // Try resolving for the fake request and verify it throws an exception
    try {
        UnifiedCampusPortalController.resolvePasswordResetRequest(
            fakeReq.id,
            'fakeuser',
            'fakepass'
        );
        System.assert(false, 'Should have thrown an exception for non-existent staff match');
    } catch (Exception e) {
        System.assert(true);
    }
    
    // Test checkRequestStatus for the resolved request
    UnifiedCampusPortalController.PasswordResetWrapper resolvedStatus = 
        UnifiedCampusPortalController.checkRequestStatus(fac.Name, fac.Department__r.Name, 'Faculty');
    System.assertNotEquals(null, resolvedStatus);
    System.assertEquals('Resolved', resolvedStatus.status);
    System.assertEquals('newfacultyusername', resolvedStatus.newUsername);
    System.assertEquals('newfacultypassword', resolvedStatus.newPassword);
    
    // Test checkRequestStatus for a non-existent request
    UnifiedCampusPortalController.PasswordResetWrapper missingStatus = 
        UnifiedCampusPortalController.checkRequestStatus('Some Unknown Faculty', 'IT', 'Faculty');
    System.assertEquals(null, missingStatus);
  }
}