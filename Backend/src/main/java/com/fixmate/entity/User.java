package com.fixmate.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@Data
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Only relevant for PROVIDER role - must be approved by Admin before offering services
    @Builder.Default
    @Column(nullable = false)
    private boolean approved = false;

    // Allows Admin to disable/enable any account
    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Required by JPA. Defaults are repeated here because @Builder.Default
    // moves the field initializers out of the fields.
    public User() {
        this.approved = false;
        this.enabled = true;
        this.createdAt = LocalDateTime.now();
    }

    // Used by the Lombok builder. Parameter order must match the field order above.
    public User(Long id, String name, String email, String password, String phone,
                Role role, boolean approved, boolean enabled, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.role = role;
        this.approved = approved;
        this.enabled = enabled;
        this.createdAt = createdAt;
    }
}