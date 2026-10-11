package com.fixmate.repository;

import com.fixmate.entity.Booking;
import com.fixmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomer(User customer);
    List<Booking> findByService_Provider(User provider);
    List<Booking> findByService_ProviderId(Long providerId);
}
