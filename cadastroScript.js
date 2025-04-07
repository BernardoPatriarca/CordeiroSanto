// Sistema de Login
$(document).ready(function () {
    // Mostra o modal de login ao carregar a página
    $('#loginModal').show();

    // Manipulador do formulário de login
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        const username = $('#username').val();
        const password = $('#password').val();

        // Verifica as credenciais
        if (username === 'admin' && password === 'euamojesus') {
            // Login bem-sucedido
            $('#loginModal').hide();
            $('#mainContent').show();
        } else {
            // Login falhou
            $('#loginError').show();
            $('#password').val('').focus();
        }
    });
});

// Configuração do Supabase
const SUPABASE_URL = 'https://phxvwxnvpxuqmewonius.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeHZ3eG52cHh1cW1ld29uaXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MzM4NTQsImV4cCI6MjA1OTIwOTg1NH0.vhuck8D8qrxxHVS4X_wnGXmjFUjU1HCwx2STBxRVoM0';

// Namespace para organização do código
const AdminPanel = {
    supabase: null,

    // Dados da aplicação
    data: {
        galeria: [],
        depoimentos: [],
        eventos: [],
        contatos: []
    },

    // Elementos da DOM
    elements: {
        tables: {
            galeria: null,
            depoimentos: null,
            eventos: null,
            contatos: null
        },
        counters: {
            fotos: null,
            depoimentos: null,
            eventos: null,
            contatos: null
        },
        toasts: {
            success: null,
            error: null
        }
    },

    // Inicialização da aplicação
    init: async function () {
        try {
            // 1. Inicializa os componentes visuais primeiro
            this.initToasts();
            this.initDataTables();
            this.setupSidebar();
            this.setupEventHandlers();

            // 2. Inicializa o Supabase
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

            // 3. Testa a conexão
            const { data, error } = await this.supabase
                .from('galeria')
                .select('*')
                .limit(1);

            if (error) throw error;

            // 4. Carrega os dados
            await this.loadData();

            console.log('Painel administrativo inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar o painel:', error);
            this.showErrorToast('Erro ao conectar com o banco de dados');
        }
    },

    // Inicializa os toasts
    initToasts: function () {
        this.elements.toasts.success = new bootstrap.Toast(document.getElementById('successToast'));
        this.elements.toasts.error = new bootstrap.Toast(document.getElementById('errorToast'));
    },

    // Mostra um toast de sucesso
    showSuccessToast: function (message) {
        $('#successToastMessage').text(message);
        this.elements.toasts.success.show();
    },

    // Mostra um toast de erro
    showErrorToast: function (message) {
        $('#errorToastMessage').text(message);
        this.elements.toasts.error.show();
    },

    // Configura a sidebar
    setupSidebar: function () {
        $('#sidebarCollapse').on('click', function () {
            $('.sidebar').toggleClass('active');
            $('.content').toggleClass('active');
        });

        $('a[href^="#"]').on('click', function (e) {
            e.preventDefault();
            const target = $(this).attr('href');
            $('html, body').animate({
                scrollTop: $(target).offset().top - 20
            }, 500);
        });
    },

    // Inicializa as tabelas DataTables
    initDataTables: function () {
        const portugueseTranslation = {
            "decimal": "",
            "emptyTable": "Nenhum dado disponível na tabela",
            "info": "Mostrando _START_ a _END_ de _TOTAL_ registros",
            "infoEmpty": "Mostrando 0 a 0 de 0 registros",
            "infoFiltered": "(filtrado de _MAX_ registros no total)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "Mostrar _MENU_ registros",
            "loadingRecords": "Carregando...",
            "processing": "Processando...",
            "search": "Pesquisar:",
            "zeroRecords": "Nenhum registro correspondente encontrado",
            "paginate": {
                "first": "Primeiro",
                "last": "Último",
                "next": "Próximo",
                "previous": "Anterior"
            },
            "aria": {
                "sortAscending": ": ativar para ordenar coluna ascendente",
                "sortDescending": ": ativar para ordenar coluna descendente"
            }
        };

        this.elements.tables.galeria = $('#galeriaTable').DataTable({
            responsive: true,
            language: portugueseTranslation,
            autoWidth: false,
            columnDefs: [
                { width: '50px', targets: 0 },
                { width: '120px', targets: 1 },
                { width: '150px', targets: 6 }
            ]
        });

        this.elements.tables.depoimentos = $('#depoimentosTable').DataTable({
            responsive: true,
            language: portugueseTranslation,
            autoWidth: false,
            columnDefs: [
                { width: '50px', targets: 0 },
                { width: '120px', targets: 1 },
                { width: '150px', targets: 5 }
            ]
        });

        this.elements.tables.eventos = $('#eventosTable').DataTable({
            responsive: true,
            language: portugueseTranslation,
            autoWidth: false,
            columnDefs: [
                { width: '50px', targets: 0 },
                { width: '120px', targets: 1 },
                { width: '150px', targets: 6 }
            ]
        });

        this.elements.tables.contatos = $('#contatosTable').DataTable({
            responsive: true,
            language: portugueseTranslation,
            autoWidth: false,
            columnDefs: [
                { width: '50px', targets: 0 },
                { width: '120px', targets: 1 },
                { width: '150px', targets: 6 }
            ]
        });

        this.elements.counters.fotos = $('#fotos-count');
        this.elements.counters.depoimentos = $('#depoimentos-count');
        this.elements.counters.eventos = $('#eventos-count');
        this.elements.counters.contatos = $('#contatos-count');
    },

    // Carrega dados do banco de dados
    loadData: async function () {
        try {
            // Carrega todos os dados em paralelo
            const [galeria, depoimentos, eventos, contatos] = await Promise.all([
                this.supabase.from('galeria').select('*').order('data', { ascending: false }),
                this.supabase.from('depoimentos').select('*').order('created_at', { ascending: false }),
                this.supabase.from('eventos').select('*').order('data', { ascending: true }),
                this.supabase.from('contatos').select('*').order('nome', { ascending: true })
            ]);

            // Verifica erros
            if (galeria.error) throw galeria.error;
            if (depoimentos.error) throw depoimentos.error;
            if (eventos.error) {
                console.warn('Falha ao ordenar eventos, tentando sem ordenação...');
                const { data, error: eventosError } = await this.supabase
                    .from('eventos')
                    .select('*');
                if (eventosError) throw eventosError;
                eventos.data = data;
            }
            if (contatos.error) throw contatos.error;

            // Atualiza os dados
            this.data.galeria = galeria.data || [];
            this.data.depoimentos = depoimentos.data || [];
            this.data.eventos = eventos.data || [];
            this.data.contatos = contatos.data || [];

            // Atualiza a interface
            this.updateTables();
            this.updateCounters();

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showErrorToast('Erro ao carregar dados do banco de dados');
        }
    },

    // Atualiza todas as tabelas
    updateTables: function () {
        this.updateGaleriaTable();
        this.updateDepoimentosTable();
        this.updateEventosTable();
        this.updateContatosTable();
    },

    // Atualiza a tabela de galeria
    updateGaleriaTable: function () {
        const table = this.elements.tables.galeria;
        table.clear();

        this.data.galeria.forEach(foto => {
            const imgTag = foto.imagem_url
                ? `<img src="${foto.imagem_url}" class="img-thumbnail" alt="${foto.titulo}" style="max-width: 100px;">`
                : '<i class="fas fa-image fa-2x text-muted"></i>';

            const statusBadge = foto.destaque
                ? '<span class="badge bg-success">Destaque</span>'
                : '<span class="badge bg-secondary">Normal</span>';

            table.row.add([
                foto.id,
                imgTag,
                foto.titulo || '-',
                foto.data ? this.formatDate(foto.data) : '-',
                foto.evento || '-',
                statusBadge,
                this.createActionButtons('foto', foto.id)
            ]);
        });

        table.draw();
    },

    // Atualiza a tabela de depoimentos
    updateDepoimentosTable: function () {
        const table = this.elements.tables.depoimentos;
        table.clear();

        this.data.depoimentos.forEach(depoimento => {
            const imgTag = depoimento.foto_url
                ? `<img src="${depoimento.foto_url}" class="img-thumbnail" alt="${depoimento.nome}" style="max-width: 100px;">`
                : '<i class="fas fa-user-circle fa-2x text-muted"></i>';

            table.row.add([
                depoimento.id,
                imgTag,
                depoimento.nome || '-',
                depoimento.tempo || '-',
                depoimento.texto ? (depoimento.texto.length > 50 ? depoimento.texto.substring(0, 50) + '...' : depoimento.texto) : '-',
                this.createActionButtons('depoimento', depoimento.id)
            ]);
        });

        table.draw();
    },

    // Atualiza a tabela de eventos
    updateEventosTable: function () {
        const table = this.elements.tables.eventos;
        table.clear();

        this.data.eventos.forEach(evento => {
            const imgTag = evento.imagem_url
                ? `<img src="${evento.imagem_url}" class="img-thumbnail" alt="${evento.titulo}" style="max-width: 100px;">`
                : '<i class="fas fa-calendar fa-2x text-muted"></i>';

            const dataEvento = evento.data || evento.data_inicio;
            const dataFim = evento.data_fim;

            table.row.add([
                evento.id,
                imgTag,
                evento.titulo || '-',
                dataEvento ? this.formatDateTime(dataEvento) : '-',
                dataFim ? this.formatDateTime(dataFim) : '-',
                this.getEventoStatus(dataEvento, dataFim),
                this.createActionButtons('evento', evento.id)
            ]);
        });

        table.draw();
    },

    // Atualiza a tabela de contatos
    updateContatosTable: function () {
        const table = this.elements.tables.contatos;
        table.clear();

        this.data.contatos.forEach(contato => {
            const imgTag = contato.foto_url
                ? `<img src="${contato.foto_url}" class="img-thumbnail" alt="${contato.nome}" style="max-width: 100px;">`
                : '<i class="fas fa-user fa-2x text-muted"></i>';

            table.row.add([
                contato.id,
                imgTag,
                contato.nome || '-',
                contato.cargo || '-',
                contato.email || '-',
                contato.responsabilidades ? (contato.responsabilidades.length > 20 ? contato.responsabilidades.substring(0, 20) + '...' : contato.responsabilidades) : '-',
                this.createActionButtons('contato', contato.id)
            ]);
        });

        table.draw();
    },

    // Cria botões de ação para as tabelas
    createActionButtons: function (type, id) {
        return `
            <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-primary edit-${type}" data-id="${id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-item" data-type="${type}" data-id="${id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    },

    // Atualiza os contadores
    updateCounters: function () {
        this.elements.counters.fotos.text(this.data.galeria.length);
        this.elements.counters.depoimentos.text(this.data.depoimentos.filter(d => d.aprovado).length);
        this.elements.counters.eventos.text(this.data.eventos.length);
        this.elements.counters.contatos.text(this.data.contatos.length);
    },

    // Determina o status do evento
    getEventoStatus: function (dataInicio, dataFim) {
        if (!dataInicio) return '<span class="badge bg-secondary">Sem data</span>';

        const now = new Date();
        const inicio = new Date(dataInicio);
        const fim = dataFim ? new Date(dataFim) : null;

        if (fim && fim < now) {
            return '<span class="badge bg-secondary">Encerrado</span>';
        } else if (inicio > now) {
            return '<span class="badge bg-primary">Agendado</span>';
        } else {
            return '<span class="badge bg-success">Em andamento</span>';
        }
    },

    // Configura os manipuladores de eventos
    setupEventHandlers: function () {
        this.setupAddButtons();
        this.setupEditButtons();
        this.setupDeleteButtons();
        this.setupSaveButtons();
        this.setupUrlPreviews();
    },

    // Configura botões de adição
    setupAddButtons: function () {
        $('#addFotoBtn').on('click', () => {
            $('#fotoModalTitle').text('Adicionar Foto');
            $('#fotoForm')[0].reset();
            $('#fotoId').val('');
            $('#fotoImagemUrl').val('');
            $('#fotoImagemPreview').attr('src', '').removeClass('show');
            $('#fotoModal').modal('show');
        });

        $('#addDepoimentoBtn').on('click', () => {
            $('#depoimentoModalTitle').text('Adicionar Depoimento');
            $('#depoimentoForm')[0].reset();
            $('#depoimentoId').val('');
            $('#depoimentoFotoUrl').val('');
            $('#depoimentoFotoPreview').attr('src', '').removeClass('show');
            $('#depoimentoModal').modal('show');
        });

        $('#addEventoBtn').on('click', () => {
            $('#eventoModalTitle').text('Adicionar Evento');
            $('#eventoForm')[0].reset();
            $('#eventoId').val('');
            $('#eventoImagemUrl').val('');
            $('#eventoImagemPreview').attr('src', '').removeClass('show');
            $('#eventoModal').modal('show');
        });

        $('#addContatoBtn').on('click', () => {
            $('#contatoModalTitle').text('Adicionar Contato');
            $('#contatoForm')[0].reset();
            $('#contatoId').val('');
            $('#contatoFotoUrl').val('');
            $('#contatoFotoPreview').attr('src', '').removeClass('show');
            $('#contatoModal').modal('show');
        });
    },

    // Configura botões de edição
    setupEditButtons: function () {
        $(document).on('click', '.edit-foto', async (e) => {
            const id = $(e.currentTarget).data('id');

            try {
                const { data: foto, error } = await this.supabase
                    .from('galeria')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (foto) {
                    $('#fotoModalTitle').text('Editar Foto');
                    $('#fotoId').val(foto.id);
                    $('#fotoTitulo').val(foto.titulo);
                    $('#fotoData').val(foto.data);
                    $('#fotoEvento').val(foto.evento);
                    $('#fotoDestaque').prop('checked', foto.destaque);
                    $('#fotoImagemUrl').val(foto.imagem_url || '');

                    if (foto.imagem_url) {
                        $('#fotoImagemPreview').attr('src', foto.imagem_url).addClass('show');
                    } else {
                        $('#fotoImagemPreview').attr('src', '').removeClass('show');
                    }

                    $('#fotoModal').modal('show');
                }
            } catch (error) {
                console.error('Erro ao carregar foto:', error);
                this.showErrorToast('Erro ao carregar dados da foto');
            }
        });

        $(document).on('click', '.edit-depoimento', async (e) => {
            const id = $(e.currentTarget).data('id');

            try {
                const { data: depoimento, error } = await this.supabase
                    .from('depoimentos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (depoimento) {
                    $('#depoimentoModalTitle').text('Editar Depoimento');
                    $('#depoimentoId').val(depoimento.id);
                    $('#depoimentoNome').val(depoimento.nome);
                    $('#depoimentoTempo').val(depoimento.tempo);
                    $('#depoimentoTexto').val(depoimento.texto);
                    $('#depoimentoAprovado').prop('checked', depoimento.aprovado);
                    $('#depoimentoFotoUrl').val(depoimento.foto_url || '');

                    if (depoimento.foto_url) {
                        $('#depoimentoFotoPreview').attr('src', depoimento.foto_url).addClass('show');
                    } else {
                        $('#depoimentoFotoPreview').attr('src', '').removeClass('show');
                    }

                    $('#depoimentoModal').modal('show');
                }
            } catch (error) {
                console.error('Erro ao carregar depoimento:', error);
                this.showErrorToast('Erro ao carregar dados do depoimento');
            }
        });

        $(document).on('click', '.edit-evento', async (e) => {
            const id = $(e.currentTarget).data('id');

            try {
                const { data: evento, error } = await this.supabase
                    .from('eventos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (evento) {
                    $('#eventoModalTitle').text('Editar Evento');
                    $('#eventoId').val(evento.id);
                    $('#eventoTitulo').val(evento.titulo);
                    $('#eventoDescricao').val(evento.descricao);
                    $('#eventoLocal').val(evento.local);
                    $('#eventoImagemUrl').val(evento.imagem_url || '');

                    const dataEvento = evento.data || evento.data_inicio;
                    const dataFim = evento.data_fim;

                    if (dataEvento) {
                        const dataInicio = new Date(dataEvento);
                        $('#eventoDataInicio').val(dataInicio.toISOString().slice(0, 16));
                    }

                    if (dataFim) {
                        const dataFimDate = new Date(dataFim);
                        $('#eventoDataFim').val(dataFimDate.toISOString().slice(0, 16));
                    } else {
                        $('#eventoDataFim').val('');
                    }

                    if (evento.imagem_url) {
                        $('#eventoImagemPreview').attr('src', evento.imagem_url).addClass('show');
                    } else {
                        $('#eventoImagemPreview').attr('src', '').removeClass('show');
                    }

                    $('#eventoModal').modal('show');
                }
            } catch (error) {
                console.error('Erro ao carregar evento:', error);
                this.showErrorToast('Erro ao carregar dados do evento');
            }
        });

        $(document).on('click', '.edit-contato', async (e) => {
            const id = $(e.currentTarget).data('id');

            try {
                const { data: contato, error } = await this.supabase
                    .from('contatos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (contato) {
                    $('#contatoModalTitle').text('Editar Contato');
                    $('#contatoId').val(contato.id);
                    $('#contatoNome').val(contato.nome);
                    $('#contatoCargo').val(contato.cargo);
                    $('#contatoEmail').val(contato.email);
                    $('#contatoResponsabilidade').val(contato.responsabilidades);
                    $('#contatoWhatsapp').val(contato.whatsapp);
                    $('#contatoInstagram').val(contato.instagram);
                    $('#contatoFacebook').val(contato.facebook);
                    $('#contatoFotoUrl').val(contato.foto_url || '');

                    if (contato.foto_url) {
                        $('#contatoFotoPreview').attr('src', contato.foto_url).addClass('show');
                    } else {
                        $('#contatoFotoPreview').attr('src', '').removeClass('show');
                    }

                    $('#contatoModal').modal('show');
                }
            } catch (error) {
                console.error('Erro ao carregar contato:', error);
                this.showErrorToast('Erro ao carregar dados do contato');
            }
        });
    },

    // Configura botões de exclusão
    setupDeleteButtons: function () {
        $(document).on('click', '.delete-item', (e) => {
            const id = $(e.currentTarget).data('id');
            const type = $(e.currentTarget).data('type');

            $('#itemToDeleteId').val(id);
            $('#itemToDeleteType').val(type);
            $('#confirmModal').modal('show');
        });

        $('#confirmDeleteBtn').on('click', async () => {
            const id = $('#itemToDeleteId').val();
            const type = $('#itemToDeleteType').val();

            try {
                let error;
                let successMessage = '';

                if (type === 'foto') {
                    const { error: deleteError } = await this.supabase
                        .from('galeria')
                        .delete()
                        .eq('id', id);
                    error = deleteError;
                    successMessage = 'Foto excluída com sucesso!';
                } else if (type === 'depoimento') {
                    const { error: deleteError } = await this.supabase
                        .from('depoimentos')
                        .delete()
                        .eq('id', id);
                    error = deleteError;
                    successMessage = 'Depoimento excluído com sucesso!';
                } else if (type === 'evento') {
                    const { error: deleteError } = await this.supabase
                        .from('eventos')
                        .delete()
                        .eq('id', id);
                    error = deleteError;
                    successMessage = 'Evento excluído com sucesso!';
                } else if (type === 'contato') {
                    const { error: deleteError } = await this.supabase
                        .from('contatos')
                        .delete()
                        .eq('id', id);
                    error = deleteError;
                    successMessage = 'Contato excluído com sucesso!';
                }

                if (error) throw error;

                await this.loadData();
                $('#confirmModal').modal('hide');
                this.showSuccessToast(successMessage);

            } catch (error) {
                console.error('Erro ao excluir:', error);
                this.showErrorToast('Erro ao excluir item');
            }
        });
    },

    // Configura botões de salvamento
    setupSaveButtons: function () {
        // Salvar foto
        $('#saveFotoBtn').on('click', async () => {
            const id = $('#fotoId').val();
            const fotoData = {
                titulo: $('#fotoTitulo').val(),
                data: $('#fotoData').val(),
                evento: $('#fotoEvento').val(),
                destaque: $('#fotoDestaque').is(':checked'),
                imagem_url: $('#fotoImagemUrl').val() || null
            };

            if (!fotoData.titulo || !fotoData.data) {
                this.showErrorToast('Preencha todos os campos obrigatórios!');
                return;
            }

            try {
                let error;

                if (id) {
                    const { error: updateError } = await this.supabase
                        .from('galeria')
                        .update(fotoData)
                        .eq('id', id);
                    error = updateError;
                } else {
                    const { error: insertError } = await this.supabase
                        .from('galeria')
                        .insert(fotoData);
                    error = insertError;
                }

                if (error) throw error;

                await this.loadData();
                $('#fotoModal').modal('hide');
                this.showSuccessToast(id ? 'Foto atualizada com sucesso!' : 'Foto adicionada com sucesso!');

            } catch (error) {
                console.error('Erro ao salvar foto:', error);
                this.showErrorToast('Erro ao salvar foto');
            }
        });

        // Salvar depoimento
        $('#saveDepoimentoBtn').on('click', async () => {
            const id = $('#depoimentoId').val();
            const depoimentoData = {
                nome: $('#depoimentoNome').val(),
                tempo: $('#depoimentoTempo').val(),
                texto: $('#depoimentoTexto').val(),
                aprovado: $('#depoimentoAprovado').is(':checked'),
                foto_url: $('#depoimentoFotoUrl').val() || null
            };

            if (!depoimentoData.nome || !depoimentoData.tempo || !depoimentoData.texto) {
                this.showErrorToast('Preencha todos os campos obrigatórios!');
                return;
            }

            try {
                let error;

                if (id) {
                    const { error: updateError } = await this.supabase
                        .from('depoimentos')
                        .update(depoimentoData)
                        .eq('id', id);
                    error = updateError;
                } else {
                    const { error: insertError } = await this.supabase
                        .from('depoimentos')
                        .insert(depoimentoData);
                    error = insertError;
                }

                if (error) throw error;

                await this.loadData();
                $('#depoimentoModal').modal('hide');
                this.showSuccessToast(id ? 'Depoimento atualizado com sucesso!' : 'Depoimento adicionado com sucesso!');

            } catch (error) {
                console.error('Erro ao salvar depoimento:', error);
                this.showErrorToast('Erro ao salvar depoimento');
            }
        });

        // Salvar evento
        $('#saveEventoBtn').on('click', async () => {
            const id = $('#eventoId').val();
            const eventoData = {
                titulo: $('#eventoTitulo').val(),
                descricao: $('#eventoDescricao').val(),
                local: $('#eventoLocal').val(),
                data: $('#eventoDataInicio').val(),
                data_fim: $('#eventoDataFim').val() || null,
                imagem_url: $('#eventoImagemUrl').val() || null
            };

            if (!eventoData.titulo || !eventoData.data) {
                this.showErrorToast('Preencha todos os campos obrigatórios!');
                return;
            }

            try {
                let error;

                if (id) {
                    const { error: updateError } = await this.supabase
                        .from('eventos')
                        .update(eventoData)
                        .eq('id', id);
                    error = updateError;
                } else {
                    const { error: insertError } = await this.supabase
                        .from('eventos')
                        .insert(eventoData);
                    error = insertError;
                }

                if (error) throw error;

                await this.loadData();
                $('#eventoModal').modal('hide');
                this.showSuccessToast(id ? 'Evento atualizado com sucesso!' : 'Evento adicionado com sucesso!');

            } catch (error) {
                console.error('Erro ao salvar evento:', error);
                this.showErrorToast('Erro ao salvar evento');
            }
        });

        // Salvar contato
        $('#saveContatoBtn').on('click', async () => {
            const id = $('#contatoId').val();
            const contatoData = {
                nome: $('#contatoNome').val(),
                cargo: $('#contatoCargo').val(),
                email: $('#contatoEmail').val(),
                foto_url: $('#contatoFotoUrl').val() || null,
                responsabilidades: $('#contatoResponsabilidade').val(),
                whatsapp: $('#contatoWhatsapp').val(),
                instagram: $('#contatoInstagram').val(),
                facebook: $('#contatoFacebook').val()
            };

            if (!contatoData.nome) {
                this.showErrorToast('Preencha todos os campos obrigatórios!');
                return;
            }

            try {
                let error;

                if (id) {
                    const { error: updateError } = await this.supabase
                        .from('contatos')
                        .update(contatoData)
                        .eq('id', id);
                    error = updateError;
                } else {
                    const { error: insertError } = await this.supabase
                        .from('contatos')
                        .insert(contatoData);
                    error = insertError;
                }

                if (error) throw error;

                await this.loadData();
                $('#contatoModal').modal('hide');
                this.showSuccessToast(id ? 'Contato atualizado com sucesso!' : 'Contato adicionado com sucesso!');

            } catch (error) {
                console.error('Erro ao salvar contato:', error);
                this.showErrorToast('Erro ao salvar contato');
            }
        });
    },

    // Configura preview de URLs de imagens
    setupUrlPreviews: function () {
        // Foto
        $('#fotoImagemUrl').on('input', function () {
            const url = $(this).val();
            if (url) {
                $('#fotoImagemPreview').attr('src', url).addClass('show');
            } else {
                $('#fotoImagemPreview').attr('src', '').removeClass('show');
            }
        });

        // Depoimento
        $('#depoimentoFotoUrl').on('input', function () {
            const url = $(this).val();
            if (url) {
                $('#depoimentoFotoPreview').attr('src', url).addClass('show');
            } else {
                $('#depoimentoFotoPreview').attr('src', '').removeClass('show');
            }
        });

        // Evento
        $('#eventoImagemUrl').on('input', function () {
            const url = $(this).val();
            if (url) {
                $('#eventoImagemPreview').attr('src', url).addClass('show');
            } else {
                $('#eventoImagemPreview').attr('src', '').removeClass('show');
            }
        });

        // Contato
        $('#contatoFotoUrl').on('input', function () {
            const url = $(this).val();
            if (url) {
                $('#contatoFotoPreview').attr('src', url).addClass('show');
            } else {
                $('#contatoFotoPreview').attr('src', '').removeClass('show');
            }
        });
    },

    // Formata data
    formatDate: function (dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    },

    // Formata data e hora
    formatDateTime: function (dateTimeString) {
        if (!dateTimeString) return '-';
        const date = new Date(dateTimeString);
        return date.toLocaleString('pt-BR');
    }
};

// Inicialização segura com verificação de dependências
$(document).ready(() => {
    if (window.supabase && window.bootstrap && window.$) {
        // Inicializa o painel apenas após o login
        $('#loginForm').on('submit', function (e) {
            e.preventDefault();

            const username = $('#username').val();
            const password = $('#password').val();

            if (username === 'admin' && password === 'euamojesus') {
                $('#loginModal').hide();
                $('#mainContent').show();
                AdminPanel.init();
            } else {
                $('#loginError').show();
                $('#password').val('').focus();
            }
        });
    } else {
        console.error('Dependências não carregadas:', {
            supabase: !!window.supabase,
            bootstrap: !!window.bootstrap,
            jquery: !!window.$
        });
        alert('Erro ao carregar as dependências. Recarregue a página.');
    }
});