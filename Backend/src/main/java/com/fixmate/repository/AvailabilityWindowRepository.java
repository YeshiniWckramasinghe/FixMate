package com.fixmate.repository;

import com.fixmate.entity.AvailabilityWindow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.util.List;

public interface AvailabilityWindowRepository extends JpaRepository<AvailabilityWindow, Long> {

    List<AvailabilityWindow> findByProviderId(Long providerId);

    List<AvailabilityWindow> findByProviderIdAndDayOfWeek(Long providerId, DayOfWeek dayOfWeek);

    boolean existsByProviderId(Long providerId);

    @Modifying(flushAutomatically = true)
    @Query("delete from AvailabilityWindow w where w.provider.id = :providerId")
    void deleteByProviderId(@Param("providerId") Long providerId);
}
