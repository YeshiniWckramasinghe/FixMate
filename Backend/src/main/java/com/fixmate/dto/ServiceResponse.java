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
        String providerName,
        Double averageRating, // null while the service has no reviews
        long reviewCount,
        String thumbnailUrl) { // null while the provider hasn't added a thumbnail

    public static ServiceResponse fromEntity(ServiceItem s) {
        return new ServiceResponse(
                s.getId(),
                s.getName(),
                s.getDescription(),
                s.getCategory(),
                s.getPrice(),
                s.isActive(),
                s.getProvider().getId(),
                s.getProvider().getName(),
                null,
                0,
                null);
    }

    public ServiceResponse withRating(Double averageRating, long reviewCount) {
        return new ServiceResponse(
                id, name, description, category, price, active,
                providerId, providerName, averageRating, reviewCount, thumbnailUrl);
    }

    public ServiceResponse withThumbnailUrl(String thumbnailUrl) {
        return new ServiceResponse(
                id, name, description, category, price, active,
                providerId, providerName, averageRating, reviewCount, thumbnailUrl);
    }
}
