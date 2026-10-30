package com.fixmate.controller;

import com.fixmate.dto.AvailabilityResponse;
import com.fixmate.dto.SlotsResponse;
import com.fixmate.dto.UpdateAvailabilityRequest;
import com.fixmate.security.AuthUtil;
import com.fixmate.service.AvailabilityService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// SecurityConfig already covers these paths:
//   /api/provider/**         -> providers only
//   GET /api/services/**     -> public (customers pick a time before they log in to book)
@RestController
public class AvailabilityController {

    private final AvailabilityService availabilityService;
    private final AuthUtil authUtil;

    public AvailabilityController(AvailabilityService availabilityService, AuthUtil authUtil) {
        this.availabilityService = availabilityService;
        this.authUtil = authUtil;
    }

    @GetMapping("/api/provider/availability")
    public AvailabilityResponse mySchedule() {
        return availabilityService.getSchedule(authUtil.getCurrentUser());
    }

    @PutMapping("/api/provider/availability")
    public AvailabilityResponse saveSchedule(@Valid @RequestBody UpdateAvailabilityRequest request) {
        return availabilityService.replaceSchedule(authUtil.getCurrentUser(), request);
    }

    @GetMapping("/api/services/{serviceId}/slots")
    public SlotsResponse slots(@PathVariable Long serviceId, @RequestParam("date") String date) {
        return availabilityService.getSlots(serviceId, date);
    }
}
