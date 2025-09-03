"use server";
import { createSessionClient } from "@/config/appwrite";
import { cookies } from "next/headers";
import { Query } from "node-appwrite";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";

// Convert a date string to a Luxon DateTime object in UTC
function toUTCDateTime(dateString) {
  // Converts all dates to the same format and timezone
  return DateTime.fromISO(dateString, { zone: "utc" }).toUTC();
}

// Check for overlapping date ranges
function dateRangesOverlap(checkInA, checkOutA, checkInB, checkOutB) {
  // If true, the date ranges overlap
  return checkInA < checkOutB && checkOutA > checkInB;
}
// Example of overlapping date ranges
// A- 13:00 - BOOK IN
// A- 15:00 - BOOK OUT
// B- 14:00 - BOOKED IN
// B- 17:00 - BOOKED OUT

// Example of non-overlapping date ranges
// A- 13:00 - BOOK IN
// A- 13:30 - BOOK OUT
// B- 14:00 - BOOKED IN
// B- 17:00 - BOOKED OUT

async function checkRoomAvailability(roomId, checkIn, checkOut) {
  const sessionCookie = cookies().get("appwrite-session");
  if (!sessionCookie) {
    redirect("/login");
  }

  try {
    const { databases } = await createSessionClient(sessionCookie.value);
    // Match the check-in and check-out dates dates with the booking dates
    const checkInDateTime = toUTCDateTime(checkIn);
    const checkOutDateTime = toUTCDateTime(checkOut);

    // Fetch all bookings for a given room
    const { documents: bookings } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      // Match the room_id field from the database with the roomId
      [Query.equal("room_id", roomId)]
    );

    // Loop over bookings and check for overlaps
    for (const booking of bookings) {
      // Match the booking dates with the check-in and check-out dates
      const bookingCheckInDateTime = toUTCDateTime(booking.check_in);
      const bookingCheckOutDateTime = toUTCDateTime(booking.check_out);

      if (
        dateRangesOverlap(
          // New bookings
          checkInDateTime,
          checkOutDateTime,
          // Existing bookings
          bookingCheckInDateTime,
          bookingCheckOutDateTime
        )
      ) {
        return false; // Overlap found, do not book
      }
    }

    // No overlap found, continue to book
    return true;
  } catch (error) {
    console.log("Failed to check availability", error);
    return {
      error: "Failed to check availability",
    };
  }
}

export default checkRoomAvailability;
