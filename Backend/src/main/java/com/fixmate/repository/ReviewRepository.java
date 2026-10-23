package com.fixmate.repository;



import com.fixmate.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByBooking_Service_ProviderId(Long providerId);

    Optional<Review> findByBookingId(Long bookingId);

    boolean existsByBookingId(Long bookingId);

    // One row per service that has at least one review
    interface RatingSummary {
        Long getServiceId();

        Double getAverageRating();

        Long getReviewCount();
    }

    @Query("select r.booking.service.id as serviceId, avg(r.rating) as averageRating, "
            + "count(r) as reviewCount from Review r "
            + "where r.booking.service.id in :serviceIds "
            + "group by r.booking.service.id")
    List<RatingSummary> summarizeByServiceIds(@Param("serviceIds") Collection<Long> serviceIds);
}

