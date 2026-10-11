package com.fixmate.repository;

import com.fixmate.entity.ServiceItem;
import com.fixmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRepository extends JpaRepository<ServiceItem, Long> {
    List<ServiceItem> findByActiveTrue();
    List<ServiceItem> findByCategoryIgnoreCaseAndActiveTrue(String category);
    List<ServiceItem> findByProvider(User provider);
    List<ServiceItem> findByProviderId(Long providerId);
}
