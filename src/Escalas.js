import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Sidebar from './Sidebar';
import './Escalas.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUser, faClock, faStickyNote } from '@fortawesome/free-solid-svg-icons';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

const tiposEvento = [
  { id: 1, nome: 'Férias', cor: '#4CAF50' },
  { id: 2, nome: 'Folga', cor: '#2196F3' },
  { id: 3, nome: 'Day Off', cor: '#9C27B0' },
  { id: 4, nome: 'Feriado', cor: '#FF9800' },
  { id: 5, nome: 'Atestado', cor: '#f44336' }
];

const messages = {
  allDay: 'Dia inteiro',
  previous: 'Anterior',
  next: 'Próximo',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Não há eventos neste período.',
  showMore: total => `+ (${total}) eventos`,
  work_week: 'Semana de trabalho',
};

const formats = {
  monthHeaderFormat: date => format(date, "MMMM 'de' yyyy", { locale: ptBR }),
  weekdayFormat: date => format(date, 'EEEE', { locale: ptBR }),
  dayHeaderFormat: date => format(date, "d 'de' MMMM", { locale: ptBR }),
  dayRangeHeaderFormat: ({ start, end }) => 
    `${format(start, "d 'de' MMMM", { locale: ptBR })} - ${format(end, "d 'de' MMMM", { locale: ptBR })}`,
  agendaDateFormat: date => format(date, "d 'de' MMMM", { locale: ptBR }),
  agendaHeaderFormat: ({ start, end }) =>
    `${format(start, "d 'de' MMMM", { locale: ptBR })} - ${format(end, "d 'de' MMMM", { locale: ptBR })}`,
};

function Escalas() {
  const [eventos, setEventos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    start: new Date(),
    end: new Date(),
    colaborador: '',
    tipo: '',
    observacao: ''
  });
  const [colaboradores, setColaboradores] = useState([
    { id: 1, nome: 'Ana Silva' },
    { id: 2, nome: 'João Santos' },
    { id: 3, nome: 'Maria Oliveira' }
  ]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState(null);

  const handleSelect = ({ start, end }) => {
    const selectedStartDate = new Date(start);
    selectedStartDate.setHours(8, 0, 0, 0);
    
    const selectedEndDate = new Date(end);
    selectedEndDate.setDate(selectedEndDate.getDate() - 1);
    selectedEndDate.setHours(23, 59, 59, 999);
    
    setFormData({
      id: null,
      title: '',
      start: selectedStartDate,
      end: selectedEndDate,
      colaborador: '',
      tipo: '',
      observacao: ''
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (event) => {
    setFormData({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      colaborador: event.colaborador,
      tipo: event.tipo,
      observacao: event.observacao
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tipoEvento = tiposEvento.find(t => t.id === parseInt(formData.tipo));
    
    const dataFim = new Date(formData.end);
    const [horaFim, minutoFim] = format(dataFim, 'HH:mm').split(':');
    dataFim.setHours(parseInt(horaFim), parseInt(minutoFim), 0, 0);

    const dataInicio = new Date(formData.start);
    const [horaInicio, minutoInicio] = format(dataInicio, 'HH:mm').split(':');
    dataInicio.setHours(parseInt(horaInicio), parseInt(minutoInicio), 0, 0);

    const novoEvento = {
      id: formData.id || eventos.length + 1,
      title: formData.colaborador 
        ? `${colaboradores.find(c => c.id === parseInt(formData.colaborador))?.nome} - ${tipoEvento.nome}`
        : tipoEvento.nome,
      start: dataInicio,
      end: dataFim,
      colaborador: formData.colaborador,
      tipo: formData.tipo,
      observacao: formData.observacao,
      backgroundColor: tipoEvento.cor,
      allDay: false,
      showTimeSelect: true,
      ignoreTimezone: false
    };

    if (formData.id) {
      setEventos(eventos.map(ev => ev.id === formData.id ? novoEvento : ev));
    } else {
      setEventos([...eventos, novoEvento]);
    }

    setIsModalOpen(false);
    setFormData({
      id: null,
      title: '',
      start: new Date(),
      end: new Date(),
      colaborador: '',
      tipo: '',
      observacao: ''
    });
  };

  const handleDelete = () => {
    setEventoToDelete(formData);
    setIsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setEventos(eventos.filter(evento => evento.id !== eventoToDelete.id));
    setIsDeleteModalOpen(false);
    setEventoToDelete(null);
    setFormData({
      id: null,
      title: '',
      start: new Date(),
      end: new Date(),
      colaborador: '',
      tipo: '',
      observacao: ''
    });
  };

  // Função para ajustar a data para o fuso horário local
  const adjustDate = (date) => {
    if (!date) return '';
    const localDate = new Date(date);
    localDate.setMinutes(localDate.getMinutes() + localDate.getTimezoneOffset());
    return localDate.toISOString().split('T')[0];
  };

  return (
    <div className="escalas-container">
      <Sidebar />
      <div className="escalas-content">
        <h1 className="page-title">Escalas</h1>
        
        <div className="cards-container">
          <div className="card">
            <h2><FontAwesomeIcon icon={faCalendarAlt} /> Próximos Eventos</h2>
            <ul>
              {eventos.map(evento => (
                <li key={evento.id}>
                  <span>{evento.title}</span>
                  <span>{new Date(evento.start).toLocaleDateString('pt-BR')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 150px)' }}
            selectable
            onSelectSlot={handleSelect}
            onSelectEvent={handleEventClick}
            messages={messages}
            formats={formats}
            culture="pt-BR"
            views={['month', 'week', 'day']}
            defaultView="month"
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.backgroundColor
              }
            })}
            showAllEvents
            dayLayoutAlgorithm="no-overlap"
            timeslots={2}
            step={30}
            min={new Date(0, 0, 0, 6, 0, 0)}
            max={new Date(0, 0, 0, 22, 0, 0)}
            toolbar={true}
            resizable
          />
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{formData.id ? 'Editar Evento' : 'Novo Evento'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="colaborador">
                    <FontAwesomeIcon icon={faUser} className="form-icon" /> Colaborador
                  </label>
                  <select
                    id="colaborador"
                    name="colaborador"
                    value={formData.colaborador}
                    onChange={(e) => setFormData({...formData, colaborador: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.map(col => (
                      <option key={col.id} value={col.id}>{col.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="tipo">
                    <FontAwesomeIcon icon={faCalendarAlt} className="form-icon" /> Tipo
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {tiposEvento.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="start">
                    <FontAwesomeIcon icon={faCalendarAlt} className="form-icon" /> Data Início
                  </label>
                  <input
                    type="date"
                    id="start"
                    name="start"
                    value={formData.start ? format(new Date(formData.start), 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const newDate = new Date(e.target.value + 'T08:00:00');
                        setFormData({...formData, start: newDate});
                      } else {
                        setFormData({...formData, start: null});
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end">
                    <FontAwesomeIcon icon={faCalendarAlt} className="form-icon" /> Data Fim
                  </label>
                  <input
                    type="date"
                    id="end"
                    name="end"
                    value={formData.end ? format(new Date(formData.end), 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const newDate = new Date(e.target.value + 'T00:00:00');
                        setFormData({...formData, end: newDate});
                      } else {
                        setFormData({...formData, end: null});
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="startTime">
                    <FontAwesomeIcon icon={faClock} className="form-icon" /> Hora Início
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.start ? format(new Date(formData.start), 'HH:mm') : '08:00'}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(formData.start);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setFormData({...formData, start: newDate});
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">
                    <FontAwesomeIcon icon={faClock} className="form-icon" /> Hora Fim
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.end ? format(new Date(formData.end), 'HH:mm') : ''}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = formData.end ? new Date(formData.end) : new Date();
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setFormData({...formData, end: newDate});
                    }}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="observacao">
                    <FontAwesomeIcon icon={faStickyNote} className="form-icon" /> Observação
                  </label>
                  <textarea
                    id="observacao"
                    name="observacao"
                    value={formData.observacao}
                    onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                    rows="3"
                  />
                </div>

                <div className="modal-buttons">
                  <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  {formData.id && (
                    <button 
                      type="button" 
                      className="delete-btn"
                      onClick={handleDelete}
                    >
                      Excluir
                    </button>
                  )}
                  <button type="submit" className="save-btn">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h2>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir este evento?</p>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setEventoToDelete(null);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="delete-btn"
                  onClick={confirmDelete}
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Escalas; 