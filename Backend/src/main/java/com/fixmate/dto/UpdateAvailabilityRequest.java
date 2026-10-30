package com.fixmate.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

// The provider's whole weekly schedule. An empty list means "not available at all".
public record UpdateAvailabilityRequest(
        @NotNull(message = "Windows are required")
        @Valid
        List<AvailabilityWindowRequest> windows) {
}
