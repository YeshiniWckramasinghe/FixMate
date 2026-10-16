package com.fixmate.dto;

import com.fixmate.entity.Booking;
import com.fixmate.entity.BookingStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record BookingResponse(
        Long id,
        Long customerId,
        String customerName,
        Long serviceId,
        String serviceName,
        Long providerId,
        String providerName,
        LocalDate bookingDate,
        LocalTime bookingTime,
        String address,
        String notes,
        BookingStatus status,
        LocalDateTime createdAt) {

    public static BookingResponse fromEntity(Booking b) {
        return new BookingResponse(
                b.getId(),
                b.getCustomer().getId(),
                b.getCustomer().getName(),
                b.getService().getId(),
                b.getService().getName(),
                b.getService().getProvider().getId(),
                b.getService().getProvider().getName(),
                b.getBookingDate(),
                b.getBookingTime(),
                b.getAddress(),
                b.getNotes(),
                b.getStatus(),
                b.getCreatedAt());
    }
}