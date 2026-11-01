import { useEffect, useMemo, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import Sidebar from '../components/Sidebar';
import {
  DAYS,
  DEFAULT_RANGE,
  MON_TO_SAT,
  WEEKDAYS,
  nextRange,
  presetSchedule,
  scheduleFromWindows,
  validateDay,
  windowsFromSchedule,
} from '../utils/availability';
import '../availability.css';

export default function ProviderAvailability() {
  const [schedule, setSchedule] = useState(null);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    client
      .get('/api/provider/availability')
      .then(({ data }) => {
        setSchedule(scheduleFromWindows(data.windows));
        setSlotMinutes(data.slotMinutes);
      })
      .catch((e) => setLoadError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const dayErrors = useMemo(() => {
    if (!schedule) return {};
    return Object.fromEntries(DAYS.map((day) => [day.key, validateDay(schedule[day.key], slotMinutes)]));
  }, [schedule, slotMinutes]);

  const hasErrors = Object.values(dayErrors).some(Boolean);
  const daysOpen = schedule ? DAYS.filter((day) => schedule[day.key].length > 0).length : 0;

  // Every edit goes through here, so the "Saved" message goes away as soon as something changes
  const change = (next) => {
    setSchedule(next);
    setSaved(false);
    setSaveError('');
  };

  const toggleDay = (key, on) => {
    change({ ...schedule, [key]: on ? [{ ...DEFAULT_RANGE }] : [] });
  };

  const updateRange = (key, index, field, value) => {
    change({
      ...schedule,
      [key]: schedule[key].map((range, i) => (i === index ? { ...range, [field]: value } : range)),
    });
  };

  const addRange = (key) => {
    change({ ...schedule, [key]: [...schedule[key], nextRange(schedule[key])] });
  };

  const removeRange = (key, index) => {
    change({ ...schedule, [key]: schedule[key].filter((_, i) => i !== index) });
  };

  const save = async () => {
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const { data } = await client.put('/api/provider/availability', {
        windows: windowsFromSchedule(schedule),
      });
      setSchedule(scheduleFromWindows(data.windows));
      setSaved(true);
    } catch (e) {
      setSaveError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="page-header">
          <h1>Availability</h1>
          <p>Choose the hours customers can book you. They only see times inside these hours.</p>
        </div>

        {loadError && <div className="alert alert-error">{loadError}</div>}

        {loading ? (
          <p className="loading-text">Loading your hours…</p>
        ) : (
          schedule && (
            <>
              <p className="avail-note">
                Every booking takes one {slotMinutes}-minute slot. A slot is taken as soon as a
                customer books it, whichever of your services they choose, and it opens up again
                if the booking is cancelled or declined. Bookings you already have are not
                affected when you change your hours.
              </p>

              <div className="avail-presets">
                <span>Quick set:</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => change(presetSchedule(WEEKDAYS))}
                >
                  Mon–Fri, 9 am to 5 pm
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => change(presetSchedule(MON_TO_SAT))}
                >
                  Mon–Sat, 9 am to 5 pm
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => change(presetSchedule([]))}
                >
                  Clear all
                </button>
              </div>

              <div className="card">
                {DAYS.map((day) => {
                  const ranges = schedule[day.key];
                  return (
                    <div className="day-row" key={day.key}>
                      <label className="day-toggle">
                        <input
                          type="checkbox"
                          checked={ranges.length > 0}
                          onChange={(e) => toggleDay(day.key, e.target.checked)}
                        />
                        {day.label}
                      </label>

                      <div className="day-ranges">
                        {ranges.length === 0 ? (
                          <span className="day-off">Not available</span>
                        ) : (
                          <>
                            {ranges.map((range, index) => (
                              <div className="range" key={index}>
                                <input
                                  type="time"
                                  value={range.start}
                                  aria-label={`${day.label} range ${index + 1} start`}
                                  onChange={(e) => updateRange(day.key, index, 'start', e.target.value)}
                                />
                                <span>to</span>
                                <input
                                  type="time"
                                  value={range.end}
                                  aria-label={`${day.label} range ${index + 1} end`}
                                  onChange={(e) => updateRange(day.key, index, 'end', e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="range-remove"
                                  aria-label={`Remove ${day.label} range ${index + 1}`}
                                  onClick={() => removeRange(day.key, index)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button type="button" className="avail-link" onClick={() => addRange(day.key)}>
                              Add another time range
                            </button>
                          </>
                        )}
                        {dayErrors[day.key] && <p className="day-error">{dayErrors[day.key]}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {saveError && <div className="alert alert-error">{saveError}</div>}
              {saved && (
                <div className="alert alert-success">
                  Saved. Customers can now book you on {daysOpen} {daysOpen === 1 ? 'day' : 'days'} a week.
                </div>
              )}

              <div className="card-actions">
                <button className="btn btn-primary" onClick={save} disabled={saving || hasErrors}>
                  {saving ? 'Saving…' : 'Save availability'}
                </button>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}
