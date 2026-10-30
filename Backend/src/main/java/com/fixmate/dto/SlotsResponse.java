package com.fixmate.dto;

import java.time.LocalDate;
import java.util.List;

// scheduleSet is false when the provider has not entered any working hours yet,
// so the screen can say that instead of just "no times available".
public record SlotsResponse(
        LocalDate date,
        int slotMinutes,
        boolean scheduleSet,
        List<SlotResponse> slots) {
}
