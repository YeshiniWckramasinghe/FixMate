package com.fixmate.dto;

import com.fixmate.entity.Booking;
import com.fixmate.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long serviceId;
    private String serviceName;
    private Long providerId;
    private String providerName;
    private LocalDate bookingDate;
    private LocalTime bookingTime;
    private String address;
    private String notes;
    private BookingStatus status;
    private LocalDateTime createdAt;

    public static BookingResponse fromEntity(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .customerId(b.getCustomer().getId())
                .customerName(b.getCustomer().getName())
                .serviceId(b.getService().getId())
                .serviceName(b.getService().getName())
                .providerId(b.getService().getProvider().getId())
                .providerName(b.getService().getProvider().getName())
                .bookingDate(b.getBookingDate())
                .bookingTime(b.getBookingTime())
                .address(b.getAddress())
                .notes(b.getNotes())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
