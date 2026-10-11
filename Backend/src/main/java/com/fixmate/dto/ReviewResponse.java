package com.fixmate.dto;

import com.fixmate.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long bookingId;
    private Long customerId;
    private String customerName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public static ReviewResponse fromEntity(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .bookingId(r.getBooking().getId())
                .customerId(r.getCustomer().getId())
                .customerName(r.getCustomer().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
