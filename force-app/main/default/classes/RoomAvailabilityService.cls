public with sharing class RoomAvailabilityService {

    public static Boolean isRoomAvailable(Id roomId){

        Room__c room = [

            SELECT Id,
                   Capacity__c,
                   Current_Occupancy__c,
                   Availability__c
            FROM Room__c
            WHERE Id=:roomId
            LIMIT 1

        ];

        if(!room.Availability__c){
            return false;
        }

        return room.Current_Occupancy__c < room.Capacity__c;

    }

    public static Integer getAvailableRooms(Id hostelId){

        return [

            SELECT COUNT()

            FROM Room__c

            WHERE Hostel__c=:hostelId

            AND Availability__c = true

        ];

    }

    public static Integer getOccupiedRooms(Id hostelId){

        return [

            SELECT COUNT()

            FROM Room__c

            WHERE Hostel__c=:hostelId

            AND Availability__c = false

        ];

    }

    public static void updateRoomStatus(Set<Id> roomIds){

        List<Room__c> rooms=[

            SELECT Id,
                   Capacity__c,
                   Current_Occupancy__c

            FROM Room__c

            WHERE Id IN :roomIds

        ];

        for(Room__c r:rooms){

            if(r.Current_Occupancy__c>=r.Capacity__c){

                r.Availability__c = false;

            }
            else{

                r.Availability__c = true;

            }

        }

        update rooms;

    }

}