package com.fixmate.repository;

import com.fixmate.entity.ServiceImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ServiceImageRepository extends JpaRepository<ServiceImage, Long> {

    // Which services have a thumbnail, and when it last changed (without loading the image bytes)
    interface ImageStamp {
        Long getServiceId();

        LocalDateTime getUpdatedAt();
    }

    @Query("select i.serviceId as serviceId, i.updatedAt as updatedAt "
            + "from ServiceImage i where i.serviceId in :serviceIds")
    List<ImageStamp> findStampsByServiceIds(@Param("serviceIds") Collection<Long> serviceIds);
}
