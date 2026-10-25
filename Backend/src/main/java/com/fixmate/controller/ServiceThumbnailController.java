package com.fixmate.controller;

import com.fixmate.entity.ServiceImage;
import com.fixmate.security.AuthUtil;
import com.fixmate.service.ServiceThumbnailService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

// SecurityConfig already covers these paths:
//   GET    /api/services/**  -> public (customers can see thumbnails)
//   PUT    /api/services/**  -> providers only
//   DELETE /api/services/**  -> providers only
@RestController
@RequestMapping("/api/services/{serviceId}/thumbnail")
public class ServiceThumbnailController {

    private final ServiceThumbnailService thumbnailService;
    private final AuthUtil authUtil;

    public ServiceThumbnailController(ServiceThumbnailService thumbnailService, AuthUtil authUtil) {
        this.thumbnailService = thumbnailService;
        this.authUtil = authUtil;
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> upload(@PathVariable Long serviceId, @RequestParam("file") MultipartFile file) {
        thumbnailService.saveThumbnail(authUtil.getCurrentUser(), serviceId, file);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<byte[]> view(@PathVariable Long serviceId) {
        ServiceImage image = thumbnailService.getThumbnail(serviceId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                // The service list links to this with ?v=<last change>, so a new upload gets a new URL
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .body(image.getData());
    }

    @DeleteMapping
    public ResponseEntity<Void> remove(@PathVariable Long serviceId) {
        thumbnailService.removeThumbnail(authUtil.getCurrentUser(), serviceId);
        return ResponseEntity.noContent().build();
    }
}
