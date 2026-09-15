package com.fixmate.service;

import com.fixmate.dto.ServiceRequest;
import com.fixmate.dto.ServiceResponse;
import com.fixmate.entity.Role;
import com.fixmate.entity.ServiceItem;
import com.fixmate.entity.User;
import com.fixmate.exception.ForbiddenActionException;
import com.fixmate.exception.ResourceNotFoundException;
import com.fixmate.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;



@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ServiceManagementService {

    private final ServiceRepository serviceRepository;

    public List<ServiceResponse> getAllActiveServices() {
        return serviceRepository.findByActiveTrue().stream()
                .map(ServiceResponse::fromEntity)
                .toList();
    }

    public List<ServiceResponse> getServicesByCategory(String category) {
        return serviceRepository.findByCategoryIgnoreCaseAndActiveTrue(category).stream()
                .map(ServiceResponse::fromEntity)
                .toList();
    }

    public ServiceResponse getServiceById(Long id) {
        ServiceItem service = findServiceOrThrow(id);
        return ServiceResponse.fromEntity(service);
    }

    public List<ServiceResponse> getMyServices(User provider) {
        return serviceRepository.findByProvider(provider).stream()
                .map(ServiceResponse::fromEntity)
                .toList();
    }

    public List<ServiceResponse> getServicesByProviderId(Long providerId) {
        return serviceRepository.findByProviderId(providerId).stream()
                .map(ServiceResponse::fromEntity)
                .toList();
    }

    public ServiceResponse createService(User provider, ServiceRequest request) {
        if (provider.getRole() != Role.PROVIDER) {
            throw new ForbiddenActionException("Only providers can create services");
        }
        if (!provider.isApproved()) {
            throw new ForbiddenActionException("Your provider account is pending admin approval");
        }

        ServiceItem service = ServiceItem.builder()
                .provider(provider)
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .active(true)
                .build();

        return ServiceResponse.fromEntity(serviceRepository.save(service));
    }

    public ServiceResponse updateService(User provider, Long serviceId, ServiceRequest request) {
        ServiceItem service = findServiceOrThrow(serviceId);
        assertOwnership(provider, service);

        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setCategory(request.getCategory());
        service.setPrice(request.getPrice());

        return ServiceResponse.fromEntity(serviceRepository.save(service));
    }

    public void deleteService(User provider, Long serviceId) {
        ServiceItem service = findServiceOrThrow(serviceId);
        assertOwnership(provider, service);
        // Soft delete keeps booking history intact
        service.setActive(false);
        serviceRepository.save(service);
    }

    private void assertOwnership(User provider, ServiceItem service) {
        if (!service.getProvider().getId().equals(provider.getId())) {
            throw new ForbiddenActionException("You do not own this service");
        }
    }

    private ServiceItem findServiceOrThrow(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + id));
    }
}
