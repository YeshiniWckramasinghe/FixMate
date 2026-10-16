package com.fixmate.dto;

import com.fixmate.entity.Review;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long bookingId,
        Long customerId,
        String customerName,
        Integer rating,
        String comment,
        LocalDateTime createdAt) {

    public static ReviewResponse fromEntity(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getBooking().getId(),
                r.getCustomer().getId(),
                r.getCustomer().getName(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt());
    }
}