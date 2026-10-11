package com.fixmate.controller;

import com.fixmate.dto.BookingRequest;
import com.fixmate.dto.BookingResponse;
import com.fixmate.dto.BookingStatusUpdateRequest;
import com.fixmate.entity.User;
import com.fixmate.security.AuthUtil;
import com.fixmate.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final AuthUtil authUtil;

    // Customer only - create a booking
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request) {
        User customer = authUtil.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(customer, request));
    }

    // Customer - view own bookings
    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings() {
        User customer = authUtil.getCurrentUser();
        return ResponseEntity.ok(bookingService.getMyBookingsAsCustomer(customer));
    }

    // Provider - view bookings received for their services
    @GetMapping("/provider")
    public ResponseEntity<List<BookingResponse>> getProviderBookings() {
        User provider = authUtil.getCurrentUser();
        return ResponseEntity.ok(bookingService.getMyBookingsAsProvider(provider));
    }

    // Any participant (customer/provider) or admin can view a specific booking
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable Long id) {
        User requester = authUtil.getCurrentUser();
        return ResponseEntity.ok(bookingService.getBookingById(requester, id));
    }

    // Provider - accept / reject / complete a booking
    @PutMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateStatus(@PathVariable Long id,
                                                          @Valid @RequestBody BookingStatusUpdateRequest request) {
        User provider = authUtil.getCurrentUser();
        return ResponseEntity.ok(bookingService.updateBookingStatusByProvider(provider, id, request.getStatus()));
    }

    // Customer - cancel own booking
    @DeleteMapping("/{id}")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable Long id) {
        User customer = authUtil.getCurrentUser();
        return ResponseEntity.ok(bookingService.cancelBooking(customer, id));
    }
}
