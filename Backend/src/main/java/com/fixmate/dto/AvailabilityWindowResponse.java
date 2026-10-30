package com.fixmate.dto;

import com.fixmate.entity.AvailabilityWindow;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record AvailabilityWindowResponse(
        Long id,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime) {

    public static AvailabilityWindowResponse fromEntity(AvailabilityWindow w) {
        return new AvailabilityWindowResponse(w.getId(), w.getDayOfWeek(), w.getStartTime(), w.getEndTime());
    }
}
