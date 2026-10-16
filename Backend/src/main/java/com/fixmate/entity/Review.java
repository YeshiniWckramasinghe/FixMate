package com.fixmate.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Data
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(nullable = false)
    private Integer rating; // 1 - 5

    @Column(length = 1000)
    private String comment;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Required by JPA. Defaults are repeated here because @Builder.Default
    // moves the field initializers out of the fields.
    public Review() {
        this.createdAt = LocalDateTime.now();
    }

    // Used by the Lombok builder. Parameter order must match the field order above.
    public Review(Long id, Booking booking, User customer, Integer rating,
                  String comment, LocalDateTime createdAt) {
        this.id = id;
        this.booking = booking;
        this.customer = customer;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }
}