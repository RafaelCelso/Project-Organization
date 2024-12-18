import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Escalas.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUser, faClock, faStickyNote, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { addDoc, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import * as XLSX from 'xlsx';
import NotificationButton from './components/NotificationButton';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { addDays } from 'date-fns';

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

const getFeriadosNacionais = (ano) => {
  const feriados = [
    { data: `${ano}-01-01`, nome: 'Confraternização Universal' },
    { data: `${ano}-04-21`, nome: 'Tiradentes' },
    { data: `${ano}-05-01`, nome: 'Dia do Trabalho' },
    { data: `${ano}-09-07`, nome: 'Independência do Brasil' },
    { data: `${ano}-10-12`, nome: 'Nossa Senhora Aparecida' },
    { data: `${ano}-11-02`, nome: 'Finados' },
    { data: `${ano}-11-15`, nome: 'Proclamação da República' },
    { data: `${ano}-12-25`, nome: 'Natal' }
  ];

  // Se for 2025, adiciona feriados específicos daquele ano
  if (ano === 2025) {
    feriados.push(
      { data: '2025-03-04', nome: 'Carnaval' },        // Terça de Carnaval
      { data: '2025-03-05', nome: 'Quarta de Cinzas' }, // Quarta de Cinzas
      { data: '2025-04-18', nome: 'Sexta-feira Santa' },
      { data: '2025-04-20', nome: 'Páscoa' },
      { data: '2025-06-19', nome: 'Corpus Christi' }
    );
  } else {
    // Calcula a Páscoa (Algoritmo de Meeus/Jones/Butcher)
    const calcularPascoa = (ano) => {
      const a = ano % 19;
      const b = Math.floor(ano / 100);
      const c = ano % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const mes = Math.floor((h + l - 7 * m + 114) / 31);
      const dia = ((h + l - 7 * m + 114) % 31) + 1;
      return new Date(ano, mes - 1, dia);
    };

    // Adiciona feriados móveis baseados na Páscoa
    const pascoa = calcularPascoa(ano);
    const sextaSanta = addDays(pascoa, -2);
    const carnaval = addDays(pascoa, -47);
    const corpusChristi = addDays(pascoa, 60);

    feriados.push(
      { 
        data: format(carnaval, 'yyyy-MM-dd'), 
        nome: 'Carnaval' 
      },
      { 
        data: format(sextaSanta, 'yyyy-MM-dd'), 
        nome: 'Sexta-feira Santa' 
      },
      { 
        data: format(corpusChristi, 'yyyy-MM-dd'), 
        nome: 'Corpus Christi' 
      }
    );
  }

  // Converte as datas para objetos Date e adiciona propriedades necessárias
  return feriados.map(feriado => ({
    id: `feriado-${feriado.data}`,
    title: `Feriado: ${feriado.nome}`,
    start: new Date(`${feriado.data}T00:00:00`),
    end: new Date(`${feriado.data}T23:59:59`),
    tipo: '4', // ID do tipo "Feriado"
    backgroundColor: '#FF9800', // Cor do tipo "Feriado"
    allDay: true,
    isFeriadoNacional: true, // Flag para identificar feriados nacionais
    ano: parseInt(feriado.data.split('-')[0]) // Adiciona o ano para referência
  }));
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
  const [currentPageFerias, setCurrentPageFerias] = useState(1);
  const [currentPageFeriados, setCurrentPageFeriados] = useState(1);
  const eventsPerPage = 3;
  const auth = getAuth();
  const [feriadosNacionais, setFeriadosNacionais] = useState([]);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tipoEvento = tiposEvento.find(t => t.id === parseInt(formData.tipo));
    
    const dataInicio = new Date(formData.start);
    const dataFim = new Date(formData.end);

    const colaboradorSelecionado = colaboradores.find(c => c.id === formData.colaborador);
    
    const eventoAtualizado = {
      title: formData.colaborador 
        ? `${colaboradorSelecionado?.nome || colaboradorSelecionado?.nomeCompleto} - ${tipoEvento.nome}`
        : tipoEvento.nome,
      start: dataInicio.toISOString(),
      end: dataFim.toISOString(),
      colaborador: formData.colaborador,
      tipo: formData.tipo,
      observacao: formData.observacao || '',
      backgroundColor: tipoEvento.cor,
      allDay: false
    };

    try {
      let eventoId; // Variável para armazenar o ID do evento

      if (formData.id) {
        // Atualiza evento existente
        const eventoRef = doc(db, 'eventos', formData.id);
        await updateDoc(eventoRef, eventoAtualizado);
        eventoId = formData.id; // Guarda o ID do evento existente
        
        // Atualiza o estado local
        setEventos(eventos.map(evento => 
          evento.id === formData.id 
            ? { 
                ...eventoAtualizado, 
                id: formData.id,
                start: new Date(eventoAtualizado.start),
                end: new Date(eventoAtualizado.end)
              }
            : evento
        ));
      } else {
        // Cria novo evento
        const docRef = await addDoc(collection(db, 'eventos'), eventoAtualizado);
        eventoId = docRef.id; // Guarda o ID do novo evento
        
        const eventoComId = { 
          ...eventoAtualizado, 
          id: eventoId,
          start: new Date(eventoAtualizado.start),
          end: new Date(eventoAtualizado.end)
        };
        
        setEventos([...eventos, eventoComId]);
      }

      // Criar notificação se houver um colaborador selecionado
      if (formData.colaborador) {
        const colaboradorSelecionado = colaboradores.find(c => c.id === formData.colaborador);
        console.log('Dados do colaborador para notificação:', {
          colaboradorId: colaboradorSelecionado?.id,
          nome: colaboradorSelecionado?.nome,
          formDataColaborador: formData.colaborador
        });
        
        if (colaboradorSelecionado) {
          try {
            const notificationData = {
              userId: colaboradorSelecionado.id, // ID do documento do colaborador
              message: formData.id 
                ? `Um evento foi atualizado: ${tipoEvento.nome} - ${format(new Date(formData.start), 'dd/MM/yyyy')}`
                : `Um novo evento foi criado para você: ${tipoEvento.nome} - ${format(new Date(formData.start), 'dd/MM/yyyy')}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              read: false,
              referenceId: eventoId,
              type: 'event',
              createdBy: auth.currentUser?.uid || null
            };

            console.log('Criando notificação:', notificationData);
            
            const docRef = await addDoc(collection(db, 'notifications'), notificationData);
            console.log('Notificação criada com sucesso. ID:', docRef.id);
          } catch (error) {
            console.error('Erro ao criar notificação:', error);
          }
        } else {
          console.warn('Colaborador não encontrado:', formData.colaborador);
        }
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
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar o evento. Por favor, tente novamente.');
    }
  };

  const handleDelete = () => {
    setEventoToDelete(formData);
    setIsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      // Deleta o evento do Firebase
      const eventoRef = doc(db, 'eventos', eventoToDelete.id);
      await deleteDoc(eventoRef);
      
      // Atualiza o estado local removendo o evento
      setEventos(eventos.filter(evento => evento.id !== eventoToDelete.id));
      
      // Limpa os estados do modal
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
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      alert('Erro ao excluir o evento. Por favor, tente novamente.');
    }
  };

  // Função para ajustar a data para o fuso horário local
  const adjustDate = (date) => {
    if (!date) return '';
    const localDate = new Date(date);
    localDate.setMinutes(localDate.getMinutes() + localDate.getTimezoneOffset());
    return localDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'colaboradores'));
        const colaboradoresData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Colaboradores carregados:', colaboradoresData);
        setColaboradores(colaboradoresData);
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
      }
    };

    fetchColaboradores();
  }, []);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'eventos'));
        const eventosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convertendo as strings ISO para objetos Date
          start: new Date(doc.data().start),
          end: new Date(doc.data().end)
        }));
        console.log('Eventos carregados:', eventosData); // Para debug
        setEventos(eventosData);
      } catch (error) {
        console.error('Erro ao buscar eventos:', error);
      }
    };

    fetchEventos();
  }, []); // Array vazio significa que será executado apenas uma vez ao montar o componente

  useEffect(() => {
    const anoAtual = new Date().getFullYear();
    const feriadosAnoAtual = getFeriadosNacionais(anoAtual);
    const feriados2025 = getFeriadosNacionais(2025);
    
    // Combina os feriados dos dois anos
    setFeriadosNacionais([...feriadosAnoAtual, ...feriados2025]);
  }, []);

  const handleAddEvent = () => {
    const hoje = new Date();
    hoje.setHours(8, 0, 0, 0); // Define hora inicial como 8:00
    
    const fimDia = new Date(hoje);
    fimDia.setHours(17, 0, 0, 0); // Define hora final como 17:00
    
    setFormData({
      id: null,
      title: '',
      start: hoje,
      end: fimDia,
      colaborador: '',
      tipo: '',
      observacao: ''
    });
    setIsModalOpen(true);
  };

  const exportToExcel = () => {
    try {
      // Prepara os dados para exportação
      const data = eventos.map(evento => ({
        'Título': evento.title,
        'Colaborador': evento.colaborador 
          ? colaboradores.find(c => c.id === evento.colaborador)?.nome || 'Não definido'
          : 'Não definido',
        'Tipo': tiposEvento.find(t => t.id === parseInt(evento.tipo))?.nome || 'Não definido',
        'Data Início': format(new Date(evento.start), 'dd/MM/yyyy HH:mm'),
        'Data Fim': format(new Date(evento.end), 'dd/MM/yyyy HH:mm'),
        'Observação': evento.observacao || '',
        'Status': new Date(evento.end) < new Date() ? 'Concluído' : 'Pendente'
      }));

      // Cria uma nova planilha
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Escalas");

      // Ajusta a largura das colunas
      const colWidths = [
        { wch: 40 },  // Título
        { wch: 30 },  // Colaborador
        { wch: 15 },  // Tipo
        { wch: 20 },  // Data Início
        { wch: 20 },  // Data Fim
        { wch: 50 },  // Observação
        { wch: 15 },  // Status
      ];
      ws['!cols'] = colWidths;

      // Gera o arquivo e faz o download
      const fileName = `escalas_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar os dados. Por favor, tente novamente.');
    }
  };

  const paginateEvents = (eventos, currentPage) => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    return eventos.slice(startIndex, startIndex + eventsPerPage);
  };

  return (
    <div className="escalas-container">
      <div className="escalas-content">
        <div className="page-header">
          <h1 className="page-title">Escalas</h1>
          <div className="header-actions">
            <NotificationButton />
            <button className="export-button" onClick={exportToExcel}>
              <FontAwesomeIcon icon={faFileExcel} />
              Exportar para Excel
            </button>
            <button className="add-event-btn" onClick={handleAddEvent}>
              <FontAwesomeIcon icon={faCalendarAlt} /> Adicionar Evento
            </button>
          </div>
        </div>
        
        <div className="cards-container">
          <div className="card">
            <h2><FontAwesomeIcon icon={faCalendarAlt} /> Eventos de Férias</h2>
            <ul>
              {paginateEvents(
                eventos
                  .filter(evento => {
                    const hoje = new Date();
                    const eventoData = new Date(evento.start);
                    return parseInt(evento.tipo) === 1; // Filtra apenas eventos do tipo Férias (id: 1)
                  })
                  .sort((a, b) => new Date(a.start) - new Date(b.start)),
                currentPageFerias
              ).map(evento => (
                <li key={evento.id}>
                  <div className="evento-info">
                    <span className="evento-titulo">{evento.title}</span>
                    <div className="evento-datas">
                      <span>Início: {format(new Date(evento.start), 'dd/MM/yyyy HH:mm')}</span>
                      <span>Fim: {format(new Date(evento.end), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pagination">
              <button 
                onClick={() => setCurrentPageFerias(prev => Math.max(prev - 1, 1))}
                disabled={currentPageFerias === 1}
                className="pagination-btn"
              >
                Anterior
              </button>
              <span className="pagination-info">Página {currentPageFerias}</span>
              <button 
                onClick={() => setCurrentPageFerias(prev => prev + 1)}
                disabled={paginateEvents(eventos.filter(evento => 
                  parseInt(evento.tipo) === 1
                ), currentPageFerias + 1).length === 0}
                className="pagination-btn"
              >
                Próxima
              </button>
            </div>
          </div>

          <div className="card">
            <h2><FontAwesomeIcon icon={faCalendarAlt} /> Feriados</h2>
            <ul>
              {paginateEvents(
                feriadosNacionais
                  .filter(feriado => {
                    const hoje = new Date();
                    const feriadoData = new Date(feriado.start);
                    return feriadoData >= hoje;
                  })
                  .sort((a, b) => new Date(a.start) - new Date(b.start)),
                currentPageFeriados
              ).map(feriado => (
                <li key={feriado.id}>
                  <div className="evento-info">
                    <span className="evento-titulo">{feriado.title}</span>
                    <div className="evento-datas">
                      <span>{format(new Date(feriado.start), 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pagination">
              <button 
                onClick={() => setCurrentPageFeriados(prev => Math.max(prev - 1, 1))}
                disabled={currentPageFeriados === 1}
                className="pagination-btn"
              >
                Anterior
              </button>
              <span className="pagination-info">Página {currentPageFeriados}</span>
              <button 
                onClick={() => setCurrentPageFeriados(prev => prev + 1)}
                disabled={paginateEvents(feriadosNacionais.filter(feriado => {
                  const hoje = new Date();
                  const feriadoData = new Date(feriado.start);
                  return feriadoData >= hoje;
                }), currentPageFeriados + 1).length === 0}
                className="pagination-btn"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>

        <div className="timeline-container">
          <div 
            className="timeline-header" 
            onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
          >
            <div className="timeline-title">
              <h2>
                <FontAwesomeIcon icon={faCalendarAlt} /> 
                Linha do Tempo
              </h2>
              {!isTimelineExpanded && (
                <span className="expand-hint">Clique para expandir</span>
              )}
            </div>
            <button className="timeline-toggle">
              <FontAwesomeIcon 
                icon={isTimelineExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} 
                className={`toggle-icon ${isTimelineExpanded ? 'expanded' : ''}`}
              />
            </button>
          </div>
          
          <div className={`timeline ${isTimelineExpanded ? 'expanded' : ''}`}>
            <div className="timeline-scroll-container">
              {isTimelineExpanded && (
                [...eventos, ...feriadosNacionais]
                  .sort((a, b) => new Date(a.start) - new Date(b.start))
                  .filter(evento => {
                    const hoje = new Date();
                    const eventoData = new Date(evento.start);
                    const tresMesesDepois = new Date();
                    tresMesesDepois.setMonth(hoje.getMonth() + 3);
                    return eventoData >= hoje && eventoData <= tresMesesDepois;
                  })
                  .map((evento, index) => {
                    const eventoData = new Date(evento.start);
                    const hoje = new Date();
                    const diasAteEvento = Math.ceil((eventoData - hoje) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div 
                        key={evento.id} 
                        className={`timeline-item ${evento.isFeriadoNacional ? 'feriado' : ''}`}
                        style={{
                          backgroundColor: evento.backgroundColor || '#4CAF50'
                        }}
                      >
                        <div className="timeline-date">
                          <div className="date-range">
                            <span className="date">
                              {format(eventoData, 'dd/MM/yyyy')} - {format(new Date(evento.end), 'dd/MM/yyyy')}
                            </span>
                          </div>
                          <span className="days-until">
                            {diasAteEvento === 0 
                              ? 'Hoje'
                              : diasAteEvento === 1
                                ? 'Amanhã'
                                : `Em ${diasAteEvento} dias`}
                          </span>
                        </div>
                        <div className="timeline-content">
                          <h3>{evento.title}</h3>
                          {!evento.isFeriadoNacional && evento.observacao && (
                            <p className="timeline-obs">{evento.observacao}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={[...eventos, ...feriadosNacionais]}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 75px)' }}
            selectable
            onSelectSlot={handleSelect}
            onSelectEvent={(event) => {
              if (!event.isFeriadoNacional) {
                handleEventClick(event);
              }
            }}
            messages={messages}
            formats={formats}
            culture="pt-BR"
            views={['month', 'week', 'day']}
            defaultView="month"
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.backgroundColor,
                cursor: event.isFeriadoNacional ? 'default' : 'pointer',
                opacity: event.isFeriadoNacional ? 0.8 : 1
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
                    {colaboradores
                      .filter(col => col.cargo === 'Analista' || col.cargo === 'Desenvolvedor')
                      .sort((a, b) => (a.nome || a.nomeCompleto).localeCompare(b.nome || b.nomeCompleto))
                      .map(col => (
                        <option key={col.id} value={col.id}>
                          {col.nome || col.nomeCompleto} - {col.cargo}
                        </option>
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
                        const startDate = new Date(formData.start);
                        
                        // Se a data fim for diferente da data início, define hora para 23:59
                        if (format(newDate, 'yyyy-MM-dd') !== format(startDate, 'yyyy-MM-dd')) {
                          newDate.setHours(23, 59, 0);
                        } else {
                          // Se for a mesma data, mantém a hora atual ou define uma hora padrão
                          const currentEnd = formData.end || new Date();
                          newDate.setHours(currentEnd.getHours(), currentEnd.getMinutes());
                        }
                        
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