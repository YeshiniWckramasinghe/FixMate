package com.fixmate.dto;

import com.fixmate.entity.Role;
import com.fixmate.entity.User;

public record UserResponse(
        Long id,
        String name,
        String email,
        String phone,
        Role role,
        boolean approved,
        boolean enabled) {

    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isApproved(),
                user.isEnabled());
    }
}