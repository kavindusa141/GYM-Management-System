import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, ChevronRight, List, Calendar as CalendarIcon } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const TrainerAvailabilityCalendar = ({ trainerId, trainerName }) => {
    const [view, setView] = useState(Views.DAY);
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (trainerId) {
            fetchAvailability();
        }
    }, [trainerId]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/availability/${trainerId}`);
            const availabilityData = response.data;

            const calendarEvents = [];

            // We need to map the slots to actual dates in the calendar view
            // Since availability is recurring/stored by date, we can just map the specific entries.

            availabilityData.forEach(record => {
                const dateStr = record.date; // YYYY-MM-DD
                const slots = record.slots || []; // [9, 10, 14]

                slots.forEach(hour => {
                    // Construct start/end times
                    // Note: hour is an integer e.g., 9
                    const start = new Date(`${dateStr}T00:00:00`);
                    start.setHours(hour, 0, 0, 0);

                    const end = new Date(start);
                    end.setHours(hour + 1, 0, 0, 0);

                    calendarEvents.push({
                        title: 'Available',
                        start,
                        end,
                        allDay: false,
                        resource: 'available'
                    });
                });
            });

            setEvents(calendarEvents);
        } catch (error) {
            console.error("Failed to fetch trainer availability", error);
            toast.error("Could not load trainer schedule");
        } finally {
            setLoading(false);
        }
    };

    const eventStyleGetter = () => {
        if (view === Views.AGENDA) {
            return {
                style: {
                    backgroundColor: 'white',
                    borderLeft: '4px solid #10b981', // Green indicator
                    borderBottom: '1px solid #f3f4f6',
                    color: '#111827', // Gray 900
                    borderRadius: '0px',
                    padding: '8px',
                    cursor: 'default'
                }
            };
        }
        return {
            style: {
                backgroundColor: '#10b981', // Emerald 500
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };

        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };

        const goToCurrent = () => {
            toolbar.onNavigate('TODAY');
        };

        const handleViewChange = (newView) => {
            setView(newView);
            toolbar.onView(newView);
        };

        return (
            <div className="flex flex-col gap-3 mb-4 px-2">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800 uppercase tracking-wide">
                        {toolbar.label}
                    </span>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={goToBack} className="p-1 hover:bg-white rounded-md transition-colors text-gray-600">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={goToCurrent} className="px-3 text-xs font-bold text-gray-600 hover:bg-white rounded-md transition-colors uppercase" title="Go to Today">
                            Current
                        </button>
                        <button onClick={goToNext} className="p-1 hover:bg-white rounded-md transition-colors text-gray-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-lg w-full">
                    <button
                        onClick={() => handleViewChange(Views.DAY)}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${view === Views.DAY ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <CalendarIcon size={14} /> Day View
                    </button>
                    <button
                        onClick={() => handleViewChange(Views.AGENDA)}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${view === Views.AGENDA ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <List size={14} /> 2-Week List
                    </button>
                </div>
            </div>
        );
    };

    if (!trainerId) {
        return <div className="p-10 text-center text-gray-500">Please select a trainer to view their schedule.</div>;
    }


    return (
        <div className="h-full bg-white rounded-xl">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '600px' }} // Fixed height for calendar itself
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                views={['day', 'agenda']} // Support Day and Agenda checks
                min={new Date(0, 0, 0, 6, 0, 0)} // Start at 6 AM
                max={new Date(0, 0, 0, 21, 0, 0)} // End at 9 PM
                eventPropGetter={eventStyleGetter}
                tooltipAccessor={null}
                length={14} // Agenda view shows 14 days by default
                components={{
                    toolbar: CustomToolbar
                }}
                messages={{
                    agenda: 'Availability List'
                }}
            />
        </div>
    );

};

export default TrainerAvailabilityCalendar;
