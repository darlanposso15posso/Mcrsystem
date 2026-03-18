import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Event as CalendarEvent, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { Client, ServiceRecord } from '../../types';
import { MapPin, Navigation, Calendar as CalendarIcon, Filter, X, Mail, Clock, Send, Zap, Settings, MessageCircle, Key, Phone, Image as ImageIcon, CheckSquare, Loader2 } from 'lucide-react';
import { ensureLocalDate } from '../../utils/timeUtils';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

// Fix Leaflet's default icon path issues with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarViewProps {
    clients: Client[];
    services: ServiceRecord[];
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
}

interface ServiceEvent extends CalendarEvent {
    clientId: number | string;
    clientName: string;
    address: string;
    lat?: number;
    lng?: number;
    serviceId?: number | string;
    type: 'SCHEDULED' | 'COMPLETED';
}

const customMarkerIcon = new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

// Component to dynamically adjust map bounds to markers
const MapBounds = ({ markers }: { markers: ServiceEvent[] }) => {
    const map = useMap();

    React.useEffect(() => {
        if (markers.length === 0) return;

        const bounds = L.latLngBounds(markers.map(m => [m.lat as number, m.lng as number]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }, [map, markers]);

    return null;
};

const CalendarView: React.FC<CalendarViewProps> = ({ clients, services, settings = {}, segmentLabels }) => {
    const currentLang = (settings['language'] as Language) || 'pt';
    const t = translations[currentLang];
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());
    const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(new Date());

    const events: ServiceEvent[] = useMemo(() => {
        const allEvents: ServiceEvent[] = [];

        clients.forEach(client => {
            // Add upcoming scheduled services from clients
            if (client.nextServiceDate) {
                // Ensure date parsing doesn't shift timezone backwards
                const d = ensureLocalDate(client.nextServiceDate);
                if (d) {
                    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0); // Noon local time

                    allEvents.push({
                        title: `${segmentLabels?.service || 'Limpeza'}: ${client.name}`,
                        start: localDate,
                        end: localDate,
                        allDay: true,
                        clientId: client.id,
                        clientName: client.name,
                        address: `${client.address}, ${client.city}`,
                        lat: client.lat,
                        lng: client.lng,
                        type: 'SCHEDULED'
                    });
                }
            }
        });

        return allEvents;
    }, [clients]);

    // Filter markers for the currently selected date or view
    const activeMarkers = useMemo(() => {
        return events.filter(e => {
            if (!e.lat || !e.lng) return false;

            if (selectedDateFilter) {
                return isSameDay(new Date(e.start as Date), selectedDateFilter);
            }
            return true; // If no specific date selected, might show all in month view (optional)
        });
    }, [events, selectedDateFilter]);

    const handleSelectSlot = (slotInfo: { start: Date }) => {
        setSelectedDateFilter(slotInfo.start);
        setDate(slotInfo.start);
        setView('day');
    };

    const handleSelectEvent = (event: ServiceEvent) => {
        setSelectedDateFilter(event.start as Date);
        setDate(event.start as Date);
    };

    const getEventStyle = (event: ServiceEvent) => {
        let backgroundColor = '#10b981'; // Emerald 500
        if (isSameDay(event.start as Date, new Date(new Date().setHours(0, 0, 0, 0)))) {
            backgroundColor = '#3b82f6'; // Blue for today
        } else if (new Date(event.start as Date) < new Date(new Date().setHours(0, 0, 0, 0))) {
            backgroundColor = '#ef4444'; // Red for overdue/past
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '0px',
                opacity: 0.9,
                color: 'white',
                border: 'none',
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                padding: '2px 8px'
            }
        };
    };

    // Center on US / approximate general area if no markers
    const defaultCenter: [number, number] = [39.8283, -98.5795];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[var(--card-color)] p-6 rounded-none border border-[var(--border-muted)] shadow-2xl emerald-glow">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 text-white uppercase italic">
                        <CalendarIcon className="text-emerald-500" />
                        Calendário & Otimização
                    </h2>
                    <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-1">
                        Selecione uma data para visualizar os clientes no mapa e otimizar o deslocamento da equipe.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 px-4 py-2 rounded-none border border-red-500/20">
                        <div className="w-2 h-2 rounded-none bg-red-500"></div> Atrasado
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 px-4 py-2 rounded-none border border-blue-500/20">
                        <div className="w-2 h-2 rounded-none bg-blue-500"></div> Hoje
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-none border border-emerald-500/20">
                        <div className="w-2 h-2 rounded-none bg-emerald-500"></div> Agendado
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Calendar Column */}
                <div className="bg-[var(--card-color)] p-6 rounded-none border border-[var(--border-muted)] shadow-2xl h-[700px] flex flex-col emerald-glow">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ flex: 1 }}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        selectable
                        eventPropGetter={getEventStyle}
                        date={date}
                        onNavigate={(newDate) => setDate(newDate)}
                        view={view}
                        onView={(newView) => setView(newView)}
                        views={['month', 'week', 'day']}
                        culture="pt-BR"
                        messages={{
                            next: "Próximo",
                            previous: "Anterior",
                            today: "Hoje",
                            month: "Mês",
                            week: "Semana",
                            day: "Dia",
                            noEventsInRange: "Nenhum agendamento neste período.",
                        }}
                    />
                </div>

                {/* Route Map Column */}
                <div className="bg-[var(--card-color)] p-6 rounded-none border border-[var(--border-muted)] shadow-2xl h-[700px] flex flex-col relative overflow-hidden emerald-glow">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                            <MapPin className="text-emerald-500" />
                            Mapa de Operações
                        </h3>
                        {selectedDateFilter && (
                            <div className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-none border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Filter size={16} /> Data: {format(selectedDateFilter, "dd 'de' MMMM", { locale: ptBR })}
                                <button onClick={() => setSelectedDateFilter(null)} className="ml-2 hover:bg-emerald-500/20 rounded-none p-1" title="Mostrar todos">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 rounded-none overflow-hidden border border-[var(--border-color)] z-0 bg-[var(--bg-color)]">
                        <MapContainer
                            center={activeMarkers.length > 0 ? [activeMarkers[0].lat!, activeMarkers[0].lng!] : defaultCenter}
                            zoom={11}
                            className="w-full h-full invert-map"
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />

                            {activeMarkers.length > 0 && <MapBounds markers={activeMarkers} />}

                            {activeMarkers.map((marker, idx) => (
                                <Marker
                                    key={`${marker.clientId}-${idx}`}
                                    position={[marker.lat!, marker.lng!]}
                                    icon={customMarkerIcon}
                                >
                                    <Popup className="custom-popup">
                                        <div className="p-1">
                                            <div className="font-black text-lg text-emerald-500 leading-tight mb-1 uppercase italic">{marker.clientName}</div>
                                            <div className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">{marker.address}</div>

                                            <button
                                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}`, '_blank')}
                                                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[var(--bg-color)] py-2 px-3 rounded-none text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                <Navigation size={14} /> Traçar Rota
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>

                    <div className="mt-6">
                        <div className="font-black text-white uppercase tracking-widest text-[10px] mb-3 flex items-center justify-between border-b border-[var(--border-muted)] pb-1">
                            <span>Log de Paradas ({activeMarkers.length})</span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {activeMarkers.length === 0 ? (
                                <p className="text-[10px] text-[var(--text-faint)] italic font-bold uppercase tracking-widest">Nenhuma intervenção mapeada para hoje.</p>
                            ) : (
                                activeMarkers.map((m, i) => (
                                    <div key={i} className="flex gap-3 items-center p-3 bg-[var(--card-alt-color)] rounded-none hover:bg-[var(--card-alt-color)]/80 transition-colors border border-[var(--border-muted)]">
                                        <div className="w-6 h-6 rounded-none bg-emerald-500 text-[var(--bg-color)] font-black flex items-center justify-center text-xs shrink-0 shadow-lg shadow-emerald-500/20">
                                            {i + 1}
                                        </div>
                                        <div className="truncate flex-1">
                                            <div className="font-black text-sm truncate uppercase text-white">{m.clientName}</div>
                                            <div className="text-[10px] text-[var(--text-muted)] truncate font-bold uppercase tracking-tight">{m.address}</div>
                                        </div>
                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                                            <Navigation size={16} />
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
