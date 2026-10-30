package com.fixmate.repository;

import com.fixmate.entity.Booking;
import com.fixmate.entity.BookingStatus;
import com.fixmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomer(User customer);
    List<Booking> findByService_Provider(User provider);
    List<Booking> findByService_ProviderId(Long providerId);

    // A provider's bookings on one day, whichever of their services was booked
    List<Booking> findByService_ProviderIdAndBookingDateAndStatusIn(
            Long providerId, LocalDate bookingDate, Collection<BookingStatus> statuses);
}
