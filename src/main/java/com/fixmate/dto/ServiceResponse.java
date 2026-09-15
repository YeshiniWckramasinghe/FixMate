package com.fixmate.dto;

import com.fixmate.entity.ServiceItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceResponse {
    private Long id;
    private String name;
    private String description;
    private String category;
    private BigDecimal price;
    private boolean active;
    private Long providerId;
    private String providerName;

    public static ServiceResponse fromEntity(ServiceItem s) {
        return ServiceResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .category(s.getCategory())
                .price(s.getPrice())
                .active(s.isActive())
                .providerId(s.getProvider().getId())
                .providerName(s.getProvider().getName())
                .build();
    }
}
