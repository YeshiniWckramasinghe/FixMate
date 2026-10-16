package com.fixmate.dto;

import com.fixmate.entity.ServiceItem;

import java.math.BigDecimal;

public record ServiceResponse(
        Long id,
        String name,
        String description,
        String category,
        BigDecimal price,
        boolean active,
        Long providerId,
        String providerName) {

    public static ServiceResponse fromEntity(ServiceItem s) {
        return new ServiceResponse(
                s.getId(),
                s.getName(),
                s.getDescription(),
                s.getCategory(),
                s.getPrice(),
                s.isActive(),
                s.getProvider().getId(),
                s.getProvider().getName());
    }
}