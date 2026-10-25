package com.fixmate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

// The thumbnail of a service. It lives in its own table (same id as the service)
// so that loading the service list never drags the image bytes along with it.
@Entity
@Table(name = "service_images")
public class ServiceImage {

    @Id
    private Long serviceId;

    @Column(nullable = false)
    private String contentType;

    // Stored as bytea in PostgreSQL
    @Column(nullable = false)
    private byte[] data;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Required by JPA
    protected ServiceImage() {
    }

    public ServiceImage(Long serviceId) {
        this.serviceId = serviceId;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public byte[] getData() {
        return data;
    }

    public void setData(byte[] data) {
        this.data = data;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
