import { useState, useMemo, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CalendarDays, Clock, MapPin, Pencil, Trash2, Plus, List, Calendar as CalendarIcon, Loader2, AlertCircle, X, Users } from "lucide-react";
import { eventService } from "../../services/eventService";
import type { Event, CreateEventRequest, AttendeesResponse } from "../../services/eventService";
import { translationService } from "../../services/translationService";
import { parseToIST, formatISTForDisplay, getISTNow, formatISTISO, formatISTDateString } from "../../utils/timezone";

// Display format for events (simplified from API format)
type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string; // Formatted date string
  dateObj: Date; // Date object for calendar
  time: string;
  location: string;
  rsvps: number;
  isUpcoming: boolean;
};

// Helper function to parse date string to Date object (IST)
function parseEventDate(dateStr: string): Date | null {
  try {
    return parseToIST(dateStr);
  } catch {
    return null;
  }
}

// Helper function to combine event date and time into a single Date object (IST)
function combineEventDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    // Parse the date part
    const dateObj = parseEventDate(dateStr);
    if (!dateObj) return null;

    // Parse the time string (format: "HH:MM" or "HH:MM AM/PM")
    let hours = 0;
    let minutes = 0;
    
    // Handle 12-hour format with AM/PM
    const timeLower = timeStr.toLowerCase().trim();
    const isPM = timeLower.includes('pm');
    const isAM = timeLower.includes('am');
    
    // Extract numeric part
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return dateObj; // If time parsing fails, return date only
    
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    
    // Convert 12-hour to 24-hour format
    if (isPM && hours !== 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    
    // Create new date with the time
    const combinedDate = new Date(dateObj);
    combinedDate.setHours(hours, minutes, 0, 0);
    
    return combinedDate;
  } catch {
    return parseEventDate(dateStr); // Fallback to date only
  }
}

// Format date for display (IST)
function formatEventDate(date: Date): string {
  return formatISTForDisplay(date, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Convert API Event to display EventItem
function convertEventToItem(event: Event): EventItem | null {
  const dateObj = parseEventDate(event.date);
  if (!dateObj) return null;

  // Combine date and time for accurate comparison
  const eventDateTime = combineEventDateTime(event.date, event.time) || dateObj;
  const now = getISTNow();
  const isUpcoming = eventDateTime >= now;

  return {
    id: event.id,
    title: event.title.en || event.title.te || "Untitled Event",
    description: event.description.en || event.description.te || "",
    date: formatEventDate(dateObj),
    dateObj,
    time: event.time,
    location: event.location.en || event.location.te || "",
    rsvps: event.rsvpCount,
    isUpcoming,
  };
}

function EventCard({ e, onEdit, onDelete, onShowAttendees }: { e: EventItem; onEdit?: () => void; onDelete?: () => void; onShowAttendees?: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="text-base font-semibold">{e.title}</div>
            {e.isUpcoming && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                Upcoming
              </span>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-600">{e.description}</div>

          <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-600" />
              {e.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              {e.time}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              {e.location}
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-500">{e.rsvps.toLocaleString()} RSVPs</div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onShowAttendees && (
            <button
              onClick={onShowAttendees}
              className="flex items-center gap-1 px-3 py-2 text-sm rounded-md border hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
              Attendees
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-3 py-2 text-sm rounded-md border hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-3 py-2 text-sm rounded-md border hover:bg-gray-50"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span className="text-red-600">Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type ViewMode = "list" | "calendar";

export default function EventManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState<Date>(getISTNow());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create event dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Attendees dialog state
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [attendees, setAttendees] = useState<AttendeesResponse | null>(null);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendeesError, setAttendeesError] = useState<string | null>(null);
  const [, setSelectedEventId] = useState<string | null>(null);
  
  // Form fields
  const [titleEn, setTitleEn] = useState("");
  const [titleTe, setTitleTe] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionTe, setDescriptionTe] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [locationEn, setLocationEn] = useState("");
  const [locationTe, setLocationTe] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // Track if Telugu fields were manually edited (to avoid overwriting manual edits)
  const titleTeManualEdit = useRef(false);
  const descriptionTeManualEdit = useRef(false);
  const locationTeManualEdit = useRef(false);

  // Auto-translate Title English to Telugu
  useEffect(() => {
    if (titleEn && !titleTeManualEdit.current) {
      const debouncedTranslate = translationService.createDebouncedTranslator(800);
      debouncedTranslate(titleEn, (translated) => {
        if (!titleTeManualEdit.current) {
          setTitleTe(translated);
        }
      });
    }
  }, [titleEn]);

  // Auto-translate Description English to Telugu
  useEffect(() => {
    if (descriptionEn && !descriptionTeManualEdit.current) {
      const debouncedTranslate = translationService.createDebouncedTranslator(800);
      debouncedTranslate(descriptionEn, (translated) => {
        if (!descriptionTeManualEdit.current) {
          setDescriptionTe(translated);
        }
      });
    }
  }, [descriptionEn]);

  // Auto-translate Location English to Telugu
  useEffect(() => {
    if (locationEn && !locationTeManualEdit.current) {
      const debouncedTranslate = translationService.createDebouncedTranslator(800);
      debouncedTranslate(locationEn, (translated) => {
        if (!locationTeManualEdit.current) {
          setLocationTe(translated);
        }
      });
    }
  }, [locationEn]);

  // Fetch events from API
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        const response = await eventService.getEvents({ per_page: 100, published_only: false });
        
        const eventItems = response.events
          .map(convertEventToItem)
          .filter((item): item is EventItem => item !== null);
        setEvents(eventItems);
      } catch (err: any) {
        console.error("Failed to fetch events:", err);
        setError(err.response?.data?.message || err.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Parse events and create a map of dates to events
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    events.forEach((event) => {
      const dateKey = formatISTDateString(event.dateObj);
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    const dateKey = formatISTDateString(selectedDate);
    return eventsByDate.get(dateKey) || [];
  }, [selectedDate, eventsByDate]);

  // Separate upcoming and past events
  const upcomingEvents = useMemo(() => {
    return events.filter((e) => e.isUpcoming).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [events]);

  const pastEvents = useMemo(() => {
    return events.filter((e) => !e.isUpcoming).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [events]);

  // Custom tile content to mark dates with events
  const tileContent = ({ date }: { date: Date }) => {
    const dateKey = formatISTDateString(date);
    const hasEvents = eventsByDate.has(dateKey);
    if (hasEvents) {
      const eventCount = eventsByDate.get(dateKey)!.length;
      return (
        <div className="flex flex-col items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1"></div>
          {eventCount > 1 && (
            <span className="text-xs text-orange-600 font-semibold mt-0.5">
              {eventCount}
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom tile className to highlight dates with events
  const tileClassName = ({ date }: { date: Date }) => {
    const dateKey = formatISTDateString(date);
    if (eventsByDate.has(dateKey)) {
      return "has-events";
    }
    return null;
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      await eventService.deleteEvent(eventId);
      setEvents(events.filter((e) => e.id !== eventId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  const handleShowAttendees = async (eventId: string) => {
    setSelectedEventId(eventId);
    setShowAttendeesDialog(true);
    setLoadingAttendees(true);
    setAttendeesError(null);
    setAttendees(null);

    try {
      const data = await eventService.getEventAttendees(eventId);
      setAttendees(data);
    } catch (err: any) {
      console.error("Failed to fetch attendees:", err);
      setAttendeesError(err.response?.data?.message || "Failed to load attendees");
    } finally {
      setLoadingAttendees(false);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    // Format phone number for display (e.g., +91 12345 67890)
    if (phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return formatISTForDisplay(date, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    // Validation
    if (!titleEn.trim()) {
      setCreateError("Title (English) is required");
      return;
    }
    if (!titleTe.trim()) {
      setCreateError("Title (Telugu) is required");
      return;
    }
    if (!descriptionEn.trim()) {
      setCreateError("Description (English) is required");
      return;
    }
    if (!descriptionTe.trim()) {
      setCreateError("Description (Telugu) is required");
      return;
    }
    if (!eventDate) {
      setCreateError("Event date is required");
      return;
    }
    if (!eventTime) {
      setCreateError("Event time is required");
      return;
    }
    if (!locationEn.trim()) {
      setCreateError("Location (English) is required");
      return;
    }
    if (!locationTe.trim()) {
      setCreateError("Location (Telugu) is required");
      return;
    }

    setCreating(true);

    try {
      // Format date to ISO format (YYYY-MM-DD) - treat as IST
      const dateObj = parseToIST(eventDate + 'T00:00:00');
      const isoDate = formatISTISO(dateObj).split('T')[0];

      const eventData: CreateEventRequest = {
        title_en: titleEn.trim(),
        title_te: titleTe.trim(),
        description_en: descriptionEn.trim(),
        description_te: descriptionTe.trim(),
        event_date: isoDate,
        event_time: eventTime.trim(),
        location_en: locationEn.trim(),
        location_te: locationTe.trim(),
        image_url: imageUrl.trim() || undefined,
        is_published: isPublished,
      };

      await eventService.createEvent(eventData);
      
      // Refresh events list to get the latest data
      const response = await eventService.getEvents({ per_page: 100 });
      const eventItems = response.events
        .map(convertEventToItem)
        .filter((item): item is EventItem => item !== null);
      setEvents(eventItems);

      // Reset form and close dialog
      resetCreateForm();
      setShowCreateDialog(false);
    } catch (err: any) {
      console.error("Failed to create event:", err);
      setCreateError(err.response?.data?.message || "Failed to create event. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setTitleEn("");
    setTitleTe("");
    setDescriptionEn("");
    setDescriptionTe("");
    setEventDate("");
    setEventTime("");
    setLocationEn("");
    setLocationTe("");
    setImageUrl("");
    setIsPublished(false);
    setCreateError(null);
    // Reset manual edit flags
    titleTeManualEdit.current = false;
    descriptionTeManualEdit.current = false;
    locationTeManualEdit.current = false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">Error loading events</span>
        </div>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Event Management</h1>
          <p className="text-sm text-gray-500">
            {events.length} {events.length === 1 ? "event" : "events"} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                viewMode === "calendar"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-orange-500 text-white hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-6">
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Upcoming Events ({upcomingEvents.length})</h2>
              <div className="space-y-4">
                {upcomingEvents.map((e) => (
                  <EventCard
                    key={e.id}
                    e={e}
                    onDelete={() => handleDelete(e.id)}
                    onShowAttendees={() => handleShowAttendees(e.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Past Events ({pastEvents.length})</h2>
              <div className="space-y-4">
                {pastEvents.map((e) => (
                  <EventCard
                    key={e.id}
                    e={e}
                    onDelete={() => handleDelete(e.id)}
                    onShowAttendees={() => handleShowAttendees(e.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {events.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No events found. Create your first event to get started.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-card p-4">
              <Calendar
                onChange={(value) => {
                  if (value instanceof Date) {
                    setSelectedDate(value);
                  }
                }}
                value={selectedDate}
                tileContent={tileContent}
                tileClassName={tileClassName}
                className="w-full border-0"
              />
              <style>{`
                .react-calendar {
                  width: 100%;
                  border: none;
                  font-family: inherit;
                }
                .react-calendar__tile {
                  padding: 0.75rem 0.5rem;
                  position: relative;
                }
                .react-calendar__tile--active {
                  background: #f97316;
                  color: white;
                }
                .react-calendar__tile--active:enabled:hover,
                .react-calendar__tile--active:enabled:focus {
                  background: #ea580c;
                }
                .react-calendar__tile.has-events {
                  background-color: #fff7ed;
                }
                .react-calendar__tile.has-events:hover {
                  background-color: #ffedd5;
                }
                .react-calendar__tile--now {
                  background: #fef3c7;
                }
                .react-calendar__tile--now:enabled:hover,
                .react-calendar__tile--now:enabled:focus {
                  background: #fde68a;
                }
                .react-calendar__navigation button {
                  color: #1f2937;
                  font-weight: 600;
                }
                .react-calendar__navigation button:enabled:hover,
                .react-calendar__navigation button:enabled:focus {
                  background-color: #f3f4f6;
                }
                .react-calendar__month-view__weekdays {
                  font-weight: 600;
                  color: #6b7280;
                }
              `}</style>
            </div>
          </div>

          {/* Events for Selected Date */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-card p-4 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">
                Events on {formatISTForDisplay(selectedDate, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors"
                    >
                      <div className="font-semibold text-sm mb-1">{event.title}</div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                        <div className="text-gray-500 mt-2">
                          {event.rsvps.toLocaleString()} RSVPs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">
                  No events scheduled for this date
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create New Event</h2>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  resetCreateForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title English */}
                <div>
                  <label className="text-sm font-medium">Title (English) *</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Enter event title in English"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    required
                  />
                </div>

                {/* Title Telugu */}
                <div>
                  <label className="text-sm font-medium">Title (Telugu) *</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="తెలుగులో శీర్షికను నమోదు చేయండి (Auto-translated)"
                    value={titleTe}
                    onChange={(e) => {
                      setTitleTe(e.target.value);
                      titleTeManualEdit.current = true;
                    }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Description English */}
                <div>
                  <label className="text-sm font-medium">Description (English) *</label>
                  <textarea
                    className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    rows={3}
                    placeholder="Enter event description in English"
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    required
                  />
                </div>

                {/* Description Telugu */}
                <div>
                  <label className="text-sm font-medium">Description (Telugu) *</label>
                  <textarea
                    className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    rows={3}
                    placeholder="తెలుగులో వివరణను నమోదు చేయండి (Auto-translated)"
                    value={descriptionTe}
                    onChange={(e) => {
                      setDescriptionTe(e.target.value);
                      descriptionTeManualEdit.current = true;
                    }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Date */}
                <div>
                  <label className="text-sm font-medium">Event Date *</label>
                  <input
                    type="date"
                    className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>

                {/* Event Time */}
                <div>
                  <label className="text-sm font-medium">Event Time *</label>
                  <input
                    type="time"
                    className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location English */}
                <div>
                  <label className="text-sm font-medium">Location (English) *</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Enter location in English"
                    value={locationEn}
                    onChange={(e) => setLocationEn(e.target.value)}
                    required
                  />
                </div>

                {/* Location Telugu */}
                <div>
                  <label className="text-sm font-medium">Location (Telugu) *</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="తెలుగులో స్థానాన్ని నమోదు చేయండి (Auto-translated)"
                    value={locationTe}
                    onChange={(e) => {
                      setLocationTe(e.target.value);
                      locationTeManualEdit.current = true;
                    }}
                    required
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="text-sm font-medium">Image URL (Optional)</label>
                <input
                  type="url"
                  className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              {/* Published Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isPublished" className="text-sm font-medium">
                  Publish immediately
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetCreateForm();
                  }}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creating}
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Event"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendees Dialog */}
      {showAttendeesDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {attendees ? attendees.event_title.en || attendees.event_title.te : "Event Attendees"}
              </h2>
              <button
                onClick={() => {
                  setShowAttendeesDialog(false);
                  setAttendees(null);
                  setAttendeesError(null);
                  setSelectedEventId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {loadingAttendees ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <span className="ml-2 text-gray-600">Loading attendees...</span>
                </div>
              ) : attendeesError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{attendeesError}</span>
                </div>
              ) : attendees ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <p className="text-sm text-gray-600">Total Attendees</p>
                      <p className="text-2xl font-semibold">{attendees.rsvp_count}</p>
                    </div>
                    <Users className="w-8 h-8 text-orange-500" />
                  </div>

                  {attendees.rsvps.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No attendees yet for this event.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-700 mb-3">Attendee List</div>
                      <div className="divide-y divide-gray-200">
                        {attendees.rsvps.map((rsvp, index) => (
                          <div
                            key={rsvp.id}
                            className="py-3 px-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {formatPhoneNumber(rsvp.phone_number)}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    RSVP'd on {formatDate(rsvp.created_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
