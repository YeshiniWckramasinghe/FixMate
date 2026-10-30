package com.fixmate.dto;

import java.util.List;

public record AvailabilityResponse(
        int slotMinutes,
        List<AvailabilityWindowResponse> windows) {
}
