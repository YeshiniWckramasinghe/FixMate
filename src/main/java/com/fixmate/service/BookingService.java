package com.fixmate.service;

import com.fixmate.dto.BookingRequest;
import com.fixmate.dto.BookingResponse;
import com.fixmate.entity.Booking;
import com.fixmate.entity.BookingStatus;
import com.fixmate.entity.Role;
import com.fixmate.entity.ServiceItem;
import com.fixmate.entity.User;
import com.fixmate.exception.BadRequestException;
import com.fixmate.exception.ForbiddenActionException;
import com.fixmate.exception.ResourceNotFoundException;
import com.fixmate.repository.BookingRepository;
import com.fixmate.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;

    @Transactional
    public BookingResponse createBooking(User customer, BookingRequest request) {
        ServiceItem service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + request.getServiceId()));

        if (!service.isActive()) {
            throw new BadRequestException("This service is currently unavailable");
        }

        Booking booking = Booking.builder()
                .customer(customer)
                .service(service)
                .bookingDate(request.getBookingDate())
                .bookingTime(request.getBookingTime())
                .address(request.getAddress())
                .notes(request.getNotes())
                .status(BookingStatus.PENDING)
                .build();

        return BookingResponse.fromEntity(bookingRepository.save(booking));
    }

    public List<BookingResponse> getMyBookingsAsCustomer(User customer) {
        return bookingRepository.findByCustomer(customer).stream()
                .map(BookingResponse::fromEntity)
                .toList();
    }

    public List<BookingResponse> getMyBookingsAsProvider(User provider) {
        return bookingRepository.findByService_Provider(provider).stream()
                .map(BookingResponse::fromEntity)
                .toList();
    }

    public BookingResponse getBookingById(User requester, Long bookingId) {
        Booking booking = findBookingOrThrow(bookingId);
        assertParticipant(requester, booking);
        return BookingResponse.fromEntity(booking);
    }

    // Provider accepts/rejects/completes a booking
    @Transactional
    public BookingResponse updateBookingStatusByProvider(User provider, Long bookingId, BookingStatus newStatus) {
        Booking booking = findBookingOrThrow(bookingId);

        if (!booking.getService().getProvider().getId().equals(provider.getId())) {
            throw new ForbiddenActionException("You do not manage this booking");
        }

        validateProviderTransition(booking.getStatus(), newStatus);

        booking.setStatus(newStatus);
        booking.setUpdatedAt(LocalDateTime.now());
        return BookingResponse.fromEntity(bookingRepository.save(booking));
    }

    // Customer cancels their own booking
    @Transactional
    public BookingResponse cancelBooking(User customer, Long bookingId) {
        Booking booking = findBookingOrThrow(bookingId);

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new ForbiddenActionException("You do not own this booking");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel a booking that is already " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());
        return BookingResponse.fromEntity(bookingRepository.save(booking));
    }

    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(BookingResponse::fromEntity)
                .toList();
    }

    private void validateProviderTransition(BookingStatus current, BookingStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == BookingStatus.ACCEPTED || next == BookingStatus.REJECTED;
            case ACCEPTED -> next == BookingStatus.COMPLETED || next == BookingStatus.CANCELLED;
            case REJECTED, COMPLETED, CANCELLED -> false;
        };

        if (!valid) {
            throw new BadRequestException("Cannot change booking status from " + current + " to " + next);
        }
    }

    private void assertParticipant(User user, Booking booking) {
        boolean isCustomer = booking.getCustomer().getId().equals(user.getId());
        boolean isProvider = booking.getService().getProvider().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isCustomer && !isProvider && !isAdmin) {
            throw new ForbiddenActionException("You are not part of this booking");
        }
    }

    private Booking findBookingOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }
}
