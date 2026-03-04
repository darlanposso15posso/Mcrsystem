import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Event as CalendarEvent, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { Client, ServiceRecord } from '../../types';
import { MapPin, Navigation, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { ensureLocalDate } from '../../utils/timeUtils';

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
}

interface ServiceEvent extends CalendarEvent {
    clientId: number;
    clientName: string;
    address: string;
    lat?: number;
    lng?: number;
    serviceId?: number;
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

const CalendarView: React.FC<CalendarViewProps> = ({ clients, services }) => {
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
                        title: `Limpeza: ${client.name}`,
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
                borderRadius: '8px',
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
            <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <CalendarIcon className="text-emerald-500" />
                        Calendário & Otimização de Rotas
                    </h2>
                    <p className="text-black/40 text-sm mt-1">
                        Selecione uma data para visualizar os clientes no mapa e otimizar o deslocamento da equipe.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm font-bold bg-amber-50 text-amber-700 px-4 py-2 rounded-xl">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div> Atrasado
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold bg-blue-50 text-blue-700 px-4 py-2 rounded-xl">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div> Hoje
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Agendado
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Calendar Column */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-sm h-[700px] flex flex-col">
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
                <div className="bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-sm h-[700px] flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <MapPin className="text-blue-500" />
                            Mapa de Rota Dinâmico
                        </h3>
                        {selectedDateFilter && (
                            <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                                <Filter size={16} /> Data Selecionada: {format(selectedDateFilter, "dd 'de' MMMM", { locale: ptBR })}
                                <button onClick={() => setSelectedDateFilter(null)} className="ml-2 hover:bg-blue-100 rounded-full p-1" title="Mostrar todos">
                                    <span className="sr-only">Limpar filtro</span>
                                    &times;
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 rounded-2xl overflow-hidden border border-black/10 z-0">
                        <MapContainer
                            center={activeMarkers.length > 0 ? [activeMarkers[0].lat!, activeMarkers[0].lng!] : defaultCenter}
                            zoom={11}
                            className="w-full h-full"
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
                                    <Popup className="rounded-xl flex flex-col items-center">
                                        <div className="p-1">
                                            <div className="font-extrabold text-lg text-emerald-900 leading-tight mb-1">{marker.clientName}</div>
                                            <div className="text-xs font-medium text-gray-500 mb-3">{marker.address}</div>

                                            <button className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-xs font-bold transition-colors">
                                                <Navigation size={14} /> Como Chegar
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>

                    <div className="mt-6">
                        <div className="font-bold mb-3 flex items-center justify-between">
                            <span>Resumo da Rota ({activeMarkers.length} paradas)</span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                            {activeMarkers.length === 0 ? (
                                <p className="text-sm text-black/40 italic">Nenhum cliente agendado nesta data com coordenadas preenchidas.</p>
                            ) : (
                                activeMarkers.map((m, i) => (
                                    <div key={i} className="flex gap-3 items-center p-3 bg-black/[0.02] rounded-xl hover:bg-black/[0.04] transition-colors border border-black/5">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="truncate flex-1">
                                            <div className="font-bold text-sm truncate">{m.clientName}</div>
                                            <div className="text-xs text-black/50 truncate">{m.address}</div>
                                        </div>
                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
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
