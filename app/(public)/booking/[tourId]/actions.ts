"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function submitBookingAction(formData: FormData) {
  const tourId = formData.get("tourId") as string;
  const date = formData.get("date") as string;
  const adultsNum = parseInt(formData.get("adults") as string, 10);
  const childrenNum = parseInt(formData.get("children") as string, 10);
  const totalPrice = parseFloat(formData.get("totalPrice") as string);
  
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const pickupLocation = formData.get("pickupLocation") as string;
  const specialRequests = formData.get("specialRequests") as string;

  if (!firstName || !lastName || !email || !phone) {
    return { error: "Please fill in all required fields." };
  }

  // Get current user if logged in
  const session = await auth();
  const customerId = session?.user?.id || null;

  // Generate Booking Ref
  const bookingRef = `JPN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  // Create Booking
  try {
    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        tourId,
        customerId,
        guestName: `${firstName} ${lastName}`,
        guestEmail: email,
        guestPhone: phone,
        tourDate: new Date(date),
        numAdults: adultsNum,
        numChildren: childrenNum,
        specialRequests: specialRequests + (pickupLocation ? `\nPickup: ${pickupLocation}` : ""),
        subtotal: totalPrice,
        totalAmount: totalPrice,
        discountAmount: 0,
        currency: "USD",
        paymentMethod: "STRIPE", // Mock
        paymentStatus: "PENDING",
        status: "CONFIRMED", // Auto-confirming for demo
        passengers: {
          create: {
            firstName,
            lastName,
            isLead: true,
          }
        }
      }
    });

  } catch (error) {
    console.error("Booking error:", error);
    return { error: "Failed to process reservation. Please try again." };
  }

  // Redirect to Bookings success page if logged in, or home if guest
  redirect(customerId ? "/bookings?success=true" : `/?success=true&ref=${bookingRef}`);
}
