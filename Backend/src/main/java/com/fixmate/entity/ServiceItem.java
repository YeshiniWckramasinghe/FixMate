package com.fixmate.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Named ServiceItem (not "Service") to avoid clashing with java.* / Spring "Service" stereotype concepts
@Entity
@Table(name = "services")
@Data
@Builder
public class ServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private User provider;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    // e.g. Electrician, Plumber, AC Technician, Computer Repair, Cleaning, Appliance Repair
    @Column(nullable = false)
    private String category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Required by JPA. Defaults are repeated here because @Builder.Default
    // moves the field initializers out of the fields.
    public ServiceItem() {
        this.active = true;
        this.createdAt = LocalDateTime.now();
    }

    // Used by the Lombok builder. Parameter order must match the field order above.
    public ServiceItem(Long id, User provider, String name, String description, String category,
                       BigDecimal price, boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.provider = provider;
        this.name = name;
        this.description = description;
        this.category = category;
        this.price = price;
        this.active = active;
        this.createdAt = createdAt;
    }
}