package com.fixmate.service;

import com.fixmate.dto.ReviewRequest;
import com.fixmate.dto.ReviewResponse;
import com.fixmate.entity.Booking;
import com.fixmate.entity.BookingStatus;
import com.fixmate.entity.Review;
import com.fixmate.entity.User;
import com.fixmate.exception.BadRequestException;
import com.fixmate.exception.ForbiddenActionException;
import com.fixmate.exception.ResourceNotFoundException;
import com.fixmate.repository.BookingRepository;
import com.fixmate.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public ReviewResponse createReview(User customer, ReviewRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + request.getBookingId()));

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new ForbiddenActionException("You can only review your own bookings");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("You can only review completed bookings");
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new BadRequestException("This booking has already been reviewed");
        }

        Review review = Review.builder()
                .booking(booking)
                .customer(customer)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        return ReviewResponse.fromEntity(reviewRepository.save(review));
    }

    public List<ReviewResponse> getReviewsForProvider(Long providerId) {
        return reviewRepository.findByBooking_Service_ProviderId(providerId).stream()
                .map(ReviewResponse::fromEntity)
                .toList();
    }
}
