package com.fixmate.service;

import com.fixmate.dto.AvailabilityResponse;
import com.fixmate.dto.AvailabilityWindowRequest;
import com.fixmate.dto.AvailabilityWindowResponse;
import com.fixmate.dto.SlotResponse;
import com.fixmate.dto.SlotsResponse;
import com.fixmate.dto.UpdateAvailabilityRequest;
import com.fixmate.entity.AvailabilityWindow;
import com.fixmate.entity.Booking;
import com.fixmate.entity.BookingStatus;
import com.fixmate.entity.ServiceItem;
import com.fixmate.entity.User;
import com.fixmate.exception.BadRequestException;
import com.fixmate.exception.ResourceNotFoundException;
import com.fixmate.repository.AvailabilityWindowRepository;
import com.fixmate.repository.BookingRepository;
import com.fixmate.repository.ProviderLockRepository;
import com.fixmate.repository.ServiceRepository;
import com.fixmate.service.SlotCalculator.TimeRange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class AvailabilityService {

    private static final int MAX_DAYS_AHEAD = 60;
    private static final int MAX_WINDOWS = 28;
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");
    // Bookings in these states still hold the provider's time; cancelled and rejected ones free it
    private static final List<BookingStatus> ACTIVE_STATUSES = List.of(BookingStatus.PENDING, BookingStatus.ACCEPTED);

    private final AvailabilityWindowRepository windowRepository;
    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final ProviderLockRepository providerLockRepository;
    private final int slotMinutes;

    public AvailabilityService(
            AvailabilityWindowRepository windowRepository,
            BookingRepository bookingRepository,
            ServiceRepository serviceRepository,
            ProviderLockRepository providerLockRepository,
            @Value("${app.booking.slot-minutes:60}") int slotMinutes) {
        this.windowRepository = windowRepository;
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.providerLockRepository = providerLockRepository;
        this.slotMinutes = slotMinutes;
    }

    // ---------- Provider: manage the weekly schedule ----------

    public AvailabilityResponse getSchedule(User provider) {
        return toResponse(windowRepository.findByProviderId(provider.getId()));
    }

    @Transactional
    public AvailabilityResponse replaceSchedule(User provider, UpdateAvailabilityRequest request) {
        List<AvailabilityWindowRequest> requested = request.windows();
        if (requested.size() > MAX_WINDOWS) {
            throw new BadRequestException("Too many time ranges. The limit is " + MAX_WINDOWS + ".");
        }

        // Group the ranges by day and check each day on its own
        Map<DayOfWeek, List<TimeRange>> byDay = new EnumMap<>(DayOfWeek.class);
        for (AvailabilityWindowRequest window : requested) {
            byDay.computeIfAbsent(window.dayOfWeek(), day -> new ArrayList<>())
                    .add(new TimeRange(
                            window.startTime().withSecond(0).withNano(0),
                            window.endTime().withSecond(0).withNano(0)));
        }
        for (Map.Entry<DayOfWeek, List<TimeRange>> entry : byDay.entrySet()) {
            SlotCalculator.validateRanges(
                    entry.getValue(), slotMinutes, entry.getKey().getDisplayName(TextStyle.FULL, Locale.ENGLISH));
        }

        // The saved schedule is replaced as a whole
        windowRepository.deleteByProviderId(provider.getId());
        List<AvailabilityWindow> saved = new ArrayList<>();
        for (Map.Entry<DayOfWeek, List<TimeRange>> entry : byDay.entrySet()) {
            for (TimeRange range : entry.getValue()) {
                saved.add(new AvailabilityWindow(provider, entry.getKey(), range.start(), range.end()));
            }
        }
        return toResponse(windowRepository.saveAll(saved));
    }

    // ---------- Customer: which times can I book? ----------

    public SlotsResponse getSlots(Long serviceId, String dateText) {
        ServiceItem service = serviceRepository.findById(serviceId)
                .filter(ServiceItem::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + serviceId));

        LocalDate date = parseDate(dateText);
        validateDateRange(date);

        Long providerId = service.getProvider().getId();
        boolean scheduleSet = windowRepository.existsByProviderId(providerId);
        List<LocalTime> booked = bookedStarts(providerId, date);

        List<SlotResponse> slots = new ArrayList<>();
        for (LocalTime start : slotStartsFor(providerId, date)) {
            if (hasPassed(date, start)) {
                continue; // earlier today
            }
            boolean free = !SlotCalculator.isBlocked(start, booked, slotMinutes);
            slots.add(new SlotResponse(start.format(HH_MM), free));
        }
        return new SlotsResponse(date, slotMinutes, scheduleSet, slots);
    }

    // ---------- Booking: the final check ----------

    // Called while a booking is being created, inside the same transaction.
    @Transactional
    public void assertSlotBookable(Long providerId, LocalDate date, LocalTime time) {
        // Lock the provider first. A second customer going for the same slot now waits here, and
        // when they get through they can see the first booking and are refused.
        providerLockRepository.findForUpdateById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found"));

        validateDateRange(date);
        LocalTime wanted = time.withSecond(0).withNano(0);

        if (!slotStartsFor(providerId, date).contains(wanted)) {
            throw new BadRequestException(
                    "That time is outside the provider’s available hours. Please pick one of the listed times.");
        }
        if (hasPassed(date, wanted)) {
            throw new BadRequestException("That time has already passed. Please pick a later time.");
        }
        if (SlotCalculator.isBlocked(wanted, bookedStarts(providerId, date), slotMinutes)) {
            throw new BadRequestException("That time slot was just taken. Please choose another one.");
        }
    }

    // ---------- helpers ----------

    private List<LocalTime> slotStartsFor(Long providerId, LocalDate date) {
        List<TimeRange> ranges = new ArrayList<>();
        for (AvailabilityWindow window : windowRepository.findByProviderIdAndDayOfWeek(providerId, date.getDayOfWeek())) {
            ranges.add(new TimeRange(window.getStartTime(), window.getEndTime()));
        }
        return SlotCalculator.slotStarts(ranges, slotMinutes);
    }

    private List<LocalTime> bookedStarts(Long providerId, LocalDate date) {
        List<LocalTime> starts = new ArrayList<>();
        for (Booking booking : bookingRepository.findByService_ProviderIdAndBookingDateAndStatusIn(
                providerId, date, ACTIVE_STATUSES)) {
            starts.add(booking.getBookingTime().withSecond(0).withNano(0));
        }
        return starts;
    }

    private boolean hasPassed(LocalDate date, LocalTime time) {
        return !LocalDateTime.of(date, time).isAfter(LocalDateTime.now());
    }

    private LocalDate parseDate(String text) {
        try {
            return LocalDate.parse(text);
        } catch (DateTimeParseException | NullPointerException e) {
            throw new BadRequestException("Please give the date as YYYY-MM-DD.");
        }
    }

    private void validateDateRange(LocalDate date) {
        LocalDate today = LocalDate.now();
        if (date.isBefore(today)) {
            throw new BadRequestException("Please choose today or a later date.");
        }
        if (date.isAfter(today.plusDays(MAX_DAYS_AHEAD))) {
            throw new BadRequestException("Bookings can be made up to " + MAX_DAYS_AHEAD + " days ahead.");
        }
    }

    private AvailabilityResponse toResponse(List<AvailabilityWindow> windows) {
        List<AvailabilityWindowResponse> sorted = windows.stream()
                .sorted(Comparator.comparing(AvailabilityWindow::getDayOfWeek)
                        .thenComparing(AvailabilityWindow::getStartTime))
                .map(AvailabilityWindowResponse::fromEntity)
                .toList();
        return new AvailabilityResponse(slotMinutes, sorted);
    }
}
