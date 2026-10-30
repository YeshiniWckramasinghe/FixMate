package com.fixmate.service;

import com.fixmate.exception.BadRequestException;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

// The arithmetic behind booking slots. It has no database code, so it is easy to test.
final class SlotCalculator {

    record TimeRange(LocalTime start, LocalTime end) {
    }

    private SlotCalculator() {
    }

    // Cuts each working block into back-to-back slots of slotMinutes.
    // 09:00-12:00 with 60-minute slots gives 09:00, 10:00 and 11:00.
    // A leftover piece too short for a whole slot is dropped (09:00-11:30 gives 09:00 and 10:00).
    static List<LocalTime> slotStarts(List<TimeRange> ranges, int slotMinutes) {
        List<LocalTime> starts = new ArrayList<>();
        List<TimeRange> sorted = new ArrayList<>(ranges);
        sorted.sort(Comparator.comparing(TimeRange::start));

        for (TimeRange range : sorted) {
            // Whole minutes since midnight, so a block that ends late in the evening can't wrap round midnight
            int end = range.end().getHour() * 60 + range.end().getMinute();
            int minute = range.start().getHour() * 60 + range.start().getMinute();
            while (minute + slotMinutes <= end) {
                starts.add(LocalTime.of(minute / 60, minute % 60));
                minute += slotMinutes;
            }
        }
        return starts;
    }

    // A booking takes slotMinutes starting at its start time. A slot is blocked if it would
    // overlap any existing booking, even one that doesn't line up with the slot grid.
    static boolean isBlocked(LocalTime slotStart, List<LocalTime> bookedStarts, int slotMinutes) {
        int slot = slotStart.getHour() * 60 + slotStart.getMinute();
        for (LocalTime booked : bookedStarts) {
            int other = booked.getHour() * 60 + booked.getMinute();
            if (Math.abs(other - slot) < slotMinutes) {
                return true;
            }
        }
        return false;
    }

    // Checks the blocks a provider entered for one day
    static void validateRanges(List<TimeRange> ranges, int slotMinutes, String dayLabel) {
        List<TimeRange> sorted = new ArrayList<>(ranges);
        sorted.sort(Comparator.comparing(TimeRange::start));

        TimeRange previous = null;
        for (TimeRange range : sorted) {
            if (!range.start().isBefore(range.end())) {
                throw new BadRequestException(dayLabel + ": each time range must start before it ends.");
            }
            int length = (range.end().getHour() * 60 + range.end().getMinute())
                    - (range.start().getHour() * 60 + range.start().getMinute());
            if (length < slotMinutes) {
                throw new BadRequestException(
                        dayLabel + ": each time range must be at least " + slotMinutes + " minutes long.");
            }
            if (previous != null && range.start().isBefore(previous.end())) {
                throw new BadRequestException(dayLabel + ": time ranges can't overlap.");
            }
            previous = range;
        }
    }
}
