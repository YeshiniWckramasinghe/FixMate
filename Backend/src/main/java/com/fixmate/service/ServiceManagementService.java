package com.fixmate.service;

import com.fixmate.dto.ServiceRequest;
import com.fixmate.dto.ServiceResponse;
import com.fixmate.entity.Role;
import com.fixmate.entity.ServiceItem;
import com.fixmate.entity.User;
import com.fixmate.exception.ForbiddenActionException;
import com.fixmate.exception.ResourceNotFoundException;
import com.fixmate.repository.ReviewRepository;
import com.fixmate.repository.ReviewRepository.RatingSummary;
import com.fixmate.repository.ServiceImageRepository;
import com.fixmate.repository.ServiceImageRepository.ImageStamp;
import com.fixmate.repository.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ServiceManagementService {

    private final ServiceRepository serviceRepository;
    private final ReviewRepository reviewRepository;
    private final ServiceImageRepository imageRepository;

    public ServiceManagementService(
            ServiceRepository serviceRepository,
            ReviewRepository reviewRepository,
            ServiceImageRepository imageRepository) {
        this.serviceRepository = serviceRepository;
        this.reviewRepository = reviewRepository;
        this.imageRepository = imageRepository;
    }

    public List<ServiceResponse> getAllActiveServices() {
        return toResponses(serviceRepository.findByActiveTrue());
    }

    public List<ServiceResponse> getServicesByCategory(String category) {
        return toResponses(serviceRepository.findByCategoryIgnoreCaseAndActiveTrue(category));
    }

    public ServiceResponse getServiceById(Long id) {
        return toResponse(findServiceOrThrow(id));
    }

    public List<ServiceResponse> getMyServices(User provider) {
        return toResponses(serviceRepository.findByProvider(provider));
    }

    public List<ServiceResponse> getServicesByProviderId(Long providerId) {
        return toResponses(serviceRepository.findByProviderId(providerId));
    }

    @Transactional
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

        // A brand new service has no reviews and no thumbnail yet
        return ServiceResponse.fromEntity(serviceRepository.save(service));
    }

    @Transactional
    public ServiceResponse updateService(User provider, Long serviceId, ServiceRequest request) {
        ServiceItem service = findServiceOrThrow(serviceId);
        assertOwnership(provider, service);

        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setCategory(request.getCategory());
        service.setPrice(request.getPrice());

        return toResponse(serviceRepository.save(service));
    }

    @Transactional
    public void deleteService(User provider, Long serviceId) {
        ServiceItem service = findServiceOrThrow(serviceId);
        assertOwnership(provider, service);
        // Soft delete keeps booking history intact
        service.setActive(false);
        serviceRepository.save(service);
    }

    // Adds the average rating, review count and thumbnail link to a list of services.
    // It uses two extra queries for the whole list, however long the list is.
    private List<ServiceResponse> toResponses(List<ServiceItem> items) {
        List<ServiceResponse> responses = new ArrayList<>();
        if (items.isEmpty()) {
            return responses;
        }

        List<Long> ids = items.stream().map(ServiceItem::getId).toList();

        Map<Long, RatingSummary> ratings = new HashMap<>();
        for (RatingSummary summary : reviewRepository.summarizeByServiceIds(ids)) {
            ratings.put(summary.getServiceId(), summary);
        }

        Map<Long, LocalDateTime> thumbnails = new HashMap<>();
        for (ImageStamp stamp : imageRepository.findStampsByServiceIds(ids)) {
            thumbnails.put(stamp.getServiceId(), stamp.getUpdatedAt());
        }

        for (ServiceItem item : items) {
            ServiceResponse response = ServiceResponse.fromEntity(item);

            RatingSummary summary = ratings.get(item.getId());
            if (summary != null) {
                // Round to one decimal place, e.g. 4.3333 -> 4.3
                double average = Math.round(summary.getAverageRating() * 10.0) / 10.0;
                response = response.withRating(average, summary.getReviewCount());
            }

            LocalDateTime changedAt = thumbnails.get(item.getId());
            if (changedAt != null) {
                // The ?v= part changes whenever the image changes, so browsers never show a stale one
                long version = changedAt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
                response = response.withThumbnailUrl("/api/services/" + item.getId() + "/thumbnail?v=" + version);
            }

            responses.add(response);
        }
        return responses;
    }

    private ServiceResponse toResponse(ServiceItem item) {
        return toResponses(List.of(item)).get(0);
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
