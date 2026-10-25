package com.fixmate.service;

import com.fixmate.entity.ServiceImage;
import com.fixmate.entity.ServiceItem;
import com.fixmate.entity.User;
import com.fixmate.exception.BadRequestException;
import com.fixmate.exception.ForbiddenActionException;
import com.fixmate.exception.ResourceNotFoundException;
import com.fixmate.repository.ServiceImageRepository;
import com.fixmate.repository.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
public class ServiceThumbnailService {

    private static final long MAX_UPLOAD_BYTES = 5L * 1024 * 1024;

    private final ServiceRepository serviceRepository;
    private final ServiceImageRepository imageRepository;

    public ServiceThumbnailService(ServiceRepository serviceRepository, ServiceImageRepository imageRepository) {
        this.serviceRepository = serviceRepository;
        this.imageRepository = imageRepository;
    }

    @Transactional
    public void saveThumbnail(User provider, Long serviceId, MultipartFile file) {
        assertOwnership(provider, serviceId);

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please choose an image file.");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new BadRequestException("That image is too large (the limit is 5 MB).");
        }

        byte[] jpeg;
        try {
            jpeg = ThumbnailEncoder.toJpeg(file.getInputStream());
        } catch (IOException e) {
            throw new BadRequestException("We couldn't read that image. Please try another file.");
        }

        ServiceImage image = imageRepository.findById(serviceId).orElseGet(() -> new ServiceImage(serviceId));
        image.setContentType("image/jpeg");
        image.setData(jpeg);
        image.setUpdatedAt(LocalDateTime.now());
        imageRepository.save(image);
    }

    // Public: customers see this on the service list
    public ServiceImage getThumbnail(Long serviceId) {
        return imageRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("This service has no thumbnail"));
    }

    @Transactional
    public void removeThumbnail(User provider, Long serviceId) {
        assertOwnership(provider, serviceId);
        // Does nothing if the service has no thumbnail
        imageRepository.deleteById(serviceId);
    }

    private void assertOwnership(User provider, Long serviceId) {
        ServiceItem service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + serviceId));
        if (!service.getProvider().getId().equals(provider.getId())) {
            throw new ForbiddenActionException("You do not own this service");
        }
    }
}
