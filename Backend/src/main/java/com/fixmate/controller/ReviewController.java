package com.fixmate.controller;

import com.fixmate.dto.ReviewRequest;
import com.fixmate.dto.ReviewResponse;
import com.fixmate.entity.User;
import com.fixmate.security.AuthUtil;
import com.fixmate.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final AuthUtil authUtil;

    // Customer only - review a completed booking
    @PostMapping("/api/reviews")
    public ResponseEntity<ReviewResponse> createReview(@Valid @RequestBody ReviewRequest request) {
        User customer = authUtil.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.createReview(customer, request));
    }

    // Public - view all reviews for a provider
    @GetMapping("/api/providers/{providerId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getProviderReviews(@PathVariable Long providerId) {
        return ResponseEntity.ok(reviewService.getReviewsForProvider(providerId));
    }
}
