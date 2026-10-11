package com.fixmate.controller;

import com.fixmate.dto.ServiceRequest;
import com.fixmate.dto.ServiceResponse;
import com.fixmate.entity.User;
import com.fixmate.security.AuthUtil;
import com.fixmate.service.ServiceManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceManagementService serviceManagementService;
    private final AuthUtil authUtil;

    // Public - browse all active services
    @GetMapping("/api/services")
    public ResponseEntity<List<ServiceResponse>> getAllServices(
            @RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(serviceManagementService.getServicesByCategory(category));
        }
        return ResponseEntity.ok(serviceManagementService.getAllActiveServices());
    }

    // Public - view a single service
    @GetMapping("/api/services/{id}")
    public ResponseEntity<ServiceResponse> getServiceById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceManagementService.getServiceById(id));
    }

    // Provider only - view own services
    @GetMapping("/api/provider/services")
    public ResponseEntity<List<ServiceResponse>> getMyServices() {
        User provider = authUtil.getCurrentUser();
        return ResponseEntity.ok(serviceManagementService.getMyServices(provider));
    }

    // Public - view services offered by a specific provider
    @GetMapping("/api/providers/{providerId}/services")
    public ResponseEntity<List<ServiceResponse>> getServicesByProvider(@PathVariable Long providerId) {
        return ResponseEntity.ok(serviceManagementService.getServicesByProviderId(providerId));
    }

    // Provider only - create a new service
    @PostMapping("/api/services")
    public ResponseEntity<ServiceResponse> createService(@Valid @RequestBody ServiceRequest request) {
        User provider = authUtil.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceManagementService.createService(provider, request));
    }

    // Provider only - update own service
    @PutMapping("/api/services/{id}")
    public ResponseEntity<ServiceResponse> updateService(@PathVariable Long id, @Valid @RequestBody ServiceRequest request) {
        User provider = authUtil.getCurrentUser();
        return ResponseEntity.ok(serviceManagementService.updateService(provider, id, request));
    }

    // Provider only - deactivate own service (soft delete)
    @DeleteMapping("/api/services/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        User provider = authUtil.getCurrentUser();
        serviceManagementService.deleteService(provider, id);
        return ResponseEntity.noContent().build();
    }
}
