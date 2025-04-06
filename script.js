const SUPABASE_URL = 'https://phxvwxnvpxuqmewonius.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeHZ3eG52cHh1cW1ld29uaXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MzM4NTQsImV4cCI6MjA1OTIwOTg1NH0.vhuck8D8qrxxHVS4X_wnGXmjFUjU1HCwx2STBxRVoM0';

async function initSupabase() {
    try {
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        return supabaseClient;
    } catch (error) {
        console.error('Erro ao conectar com Supabase:', error);
        throw error;
    }
}

// Inicializa o carrossel de depoimentos
function initTestimonials() {
    new Glide('.glide', {
        type: 'carousel',
        perView: 1,
        autoplay: 4000,
        hoverpause: true,
        gap: 30,
        breakpoints: {
            768: {
                perView: 1
            }
        }
    }).mount();
}

// Função para animar as seções ao rolar
function animateOnScroll() {
    AOS.init({
        duration: 800,
        once: true,
        easing: 'ease-in-out'
    });

    // Adiciona efeito de scroll na navbar
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            document.querySelector('.navbar').classList.add('scrolled');
        } else {
            document.querySelector('.navbar').classList.remove('scrolled');
        }

        // Mostra/oculta o botão de voltar ao topo
        if (window.scrollY > 300) {
            document.querySelector('.back-to-top').classList.add('active');
        } else {
            document.querySelector('.back-to-top').classList.remove('active');
        }
    });

    // Rolagem suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });

                // Fecha o menu mobile se estiver aberto
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            }
        });
    });

    // Botão de voltar ao topo
    document.querySelector('.back-to-top').addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Botão de scroll down
    document.querySelector('.scroll-down').addEventListener('click', function () {
        window.scrollTo({
            top: document.querySelector('#about').offsetTop - 80,
            behavior: 'smooth'
        });
    });

    // Ativa o link ativo na navegação
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', function () {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Função para criar partículas flutuantes
function createParticles() {
    const particlesContainer = document.querySelector('.hero-section');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Tamanho aleatório entre 2px e 8px
        const size = Math.random() * 6 + 2;

        // Posição aleatória
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;

        // Opacidade aleatória
        const opacity = Math.random() * 0.5 + 0.1;

        // Tempo de animação aleatório
        const duration = Math.random() * 10 + 5;
        const delay = Math.random() * 5;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.opacity = opacity;
        particle.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;

        particlesContainer.appendChild(particle);
    }
}

// Função para preencher os eventos
async function fillEvents(supabaseClient) {
    try {
        // Mostra o spinner
        document.querySelector('#events-container').innerHTML = '<div class="col-12 text-center"><div class="spinner"></div></div>';

        // Busca todos os eventos (após a data atual)
        const { data: eventos, error } = await supabaseClient
            .from('eventos')
            .select('*')
            .order('data_evento', { ascending: false });

        if (error) throw error;

        if (!eventos || eventos.length === 0) {
            document.querySelector('#events-container').innerHTML = '<div class="col-12 text-center"><p>Nenhum evento programado no momento</p></div>';
            return;
        }

        const container = document.getElementById('events-container');
        container.innerHTML = '';

        eventos.forEach(evento => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';

            const eventDate = new Date(evento.data_evento);
            const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedDate = eventDate.toLocaleDateString('pt-BR', options);

            col.innerHTML = `
                        <div class="event-card">
                            <img src="${evento.imagem_url}" class="event-img" alt="${evento.titulo}">
                            <div class="event-body">
                                <span class="event-date"><i class="far fa-calendar-alt me-2"></i>${formattedDate}</span>
                                <h3>${evento.titulo}</h3>
                                <p>${evento.descricao || 'Evento especial da igreja'}</p>
                                <div class="event-location">
                                    <i class="fas fa-map-marker-alt me-2"></i>${evento.local || 'Sede da Igreja'}
                                </div>
                            </div>
                        </div>`;

            container.appendChild(col);
        });

        // Preenche também a tabela de eventos no modal
        const eventsTable = document.querySelector('#events-table tbody');
        eventsTable.innerHTML = '';

        eventos.forEach(evento => {
            const eventDate = new Date(evento.data_evento);
            const formattedDate = eventDate.toLocaleDateString('pt-BR');

            const row = document.createElement('tr');
            row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${evento.titulo}</td>
                        <td>${evento.local || 'Sede da Igreja'}</td>
                        <td><button class="btn btn-sm btn-primary">Mais Info</button></td>
                    `;
            eventsTable.appendChild(row);
        });

    } catch (error) {
        console.error('Erro ao carregar os eventos:', error);
        document.querySelector('#events-container').innerHTML = '<div class="col-12 text-center"><p>Erro ao carregar os eventos</p></div>';
    }
}

// Função para preencher a galeria
async function fillGallery(supabaseClient) {
    try {
        // Mostra o spinner
        document.querySelector('#gallery-container').innerHTML = '<div class="col-12 text-center"><div class="spinner"></div></div>';

        // Busca todas as fotos da galeria
        const { data: fotos, error } = await supabaseClient
            .from('galeria')
            .select('*')
            .order('data', { ascending: false })
            .limit(6);

        if (error) throw error;

        if (!fotos || fotos.length === 0) {
            document.querySelector('#gallery-container').innerHTML = '<div class="col-12 text-center"><p>Nenhuma foto na galeria no momento</p></div>';
            return;
        }

        const container = document.getElementById('gallery-container');
        container.innerHTML = '';

        fotos.forEach((foto, index) => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';
            col.setAttribute('data-aos', 'fade-up');
            col.setAttribute('data-aos-delay', (index * 100) + 200);

            const eventDate = new Date(foto.data);
            const formattedDate = eventDate.toLocaleDateString('pt-BR');

            col.innerHTML = `
                        <div class="gallery-img-container">
                            <img src="${foto.imagem_url}" class="img-fluid rounded gallery-img" alt="${foto.titulo}">
                            <div class="gallery-img-info">
                                <div class="gallery-img-title">${foto.titulo}</div>
                                <div class="gallery-img-date"><i class="far fa-calendar-alt me-2"></i>${formattedDate}</div>
                            </div>
                        </div>`;

            container.appendChild(col);
        });

        // Preenche também o modal da galeria com todas as fotos
        const { data: todasFotos, error: errorTodas } = await supabaseClient
            .from('galeria')
            .select('*')
            .order('data', { ascending: false });

        if (!errorTodas && todasFotos && todasFotos.length > 0) {
            const modalContainer = document.getElementById('gallery-modal-container');
            modalContainer.innerHTML = '';

            todasFotos.forEach(foto => {
                const eventDate = new Date(foto.data);
                const formattedDate = eventDate.toLocaleDateString('pt-BR');

                const col = document.createElement('div');
                col.className = 'col-md-4 mb-4';

                col.innerHTML = `
                            <img src="${foto.imagem_url}" class="img-fluid rounded" alt="${foto.titulo}">
                            <div class="text-center mt-2">
                                <h5>${foto.titulo}</h5>
                                <small>${formattedDate}</small>
                            </div>`;

                modalContainer.appendChild(col);
            });
        }

    } catch (error) {
        console.error('Erro ao carregar a galeria:', error);
        document.querySelector('#gallery-container').innerHTML = '<div class="col-12 text-center"><p>Erro ao carregar a galeria</p></div>';
    }
}

// Função para preencher os depoimentos
async function fillTestimonials(supabaseClient) {
    try {
        // Mostra o spinner
        document.querySelector('#testimonials-container').innerHTML = '<div class="spinner"></div>';

        // Busca todos os depoimentos
        const { data: depoimentos, error } = await supabaseClient
            .from('depoimentos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) throw error;

        if (!depoimentos || depoimentos.length === 0) {
            document.querySelector('#testimonials-container').innerHTML = '<li class="glide__slide"><div class="testimonial-card"><div class="testimonial-content"><p>Nenhum depoimento disponível no momento</p></div></div></li>';
            return;
        }

        const container = document.getElementById('testimonials-container');
        container.innerHTML = '';

        depoimentos.forEach(depoimento => {
            const slide = document.createElement('li');
            slide.className = 'glide__slide';

            slide.innerHTML = `
                        <div class="testimonial-card">
                            <div class="testimonial-content">
                                <div class="testimonial-text">
                                    <p>${depoimento.texto}</p>
                                </div>
                                <div class="testimonial-author">
                                    <img src="${depoimento.foto_url}" alt="${depoimento.nome}">
                                    <div>
                                        <div class="testimonial-name">${depoimento.nome}</div>
                                        <div class="testimonial-role">${depoimento.tempo || 'Membro'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>`;

            container.appendChild(slide);
        });

        // Atualiza os bullets do carrossel
        const bulletsContainer = document.querySelector('.glide__bullets');
        bulletsContainer.innerHTML = '';

        depoimentos.forEach((_, index) => {
            const bullet = document.createElement('button');
            bullet.className = 'glide__bullet';
            bullet.setAttribute('data-glide-dir', `=${index}`);
            bulletsContainer.appendChild(bullet);
        });

    } catch (error) {
        console.error('Erro ao carregar os depoimentos:', error);
        document.querySelector('#testimonials-container').innerHTML = '<li class="glide__slide"><div class="testimonial-card"><div class="testimonial-content"><p>Erro ao carregar os depoimentos</p></div></div></li>';
    }
}

// Função para preencher os pastores
async function fillPastores(supabaseClient) {
    try {
        // Mostra o spinner
        document.querySelector('#pastores-container').innerHTML = '<div class="col-12 text-center"><div class="spinner"></div></div>';

        // Busca todos os contatos (pastores/obreiros)
        const { data: pastores, error } = await supabaseClient
            .from('contatos')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (!pastores || pastores.length === 0) {
            document.querySelector('#pastores-container').innerHTML = '<div class="col-12 text-center"><p>Nenhum pastor/obreiro cadastrado no momento</p></div>';
            return;
        }

        const container = document.getElementById('pastores-container');
        container.innerHTML = '';

        pastores.forEach(pastor => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';

            col.innerHTML = `
                        <div class="pastor-card">
                            <img src="${pastor.foto_url}" class="pastor-img w-100" alt="${pastor.nome}">
                            <div class="pastor-body">
                                <h3 class="pastor-name">${pastor.nome}</h3>
                                <p class="pastor-role">${pastor.cargo}</p>
                                <p>${pastor.descricao || 'Servindo a igreja com dedicação'}</p>
                                <div class="pastor-social">
                                    ${pastor.facebook ? `<a href="${pastor.facebook}" target="_blank"><i class="fab fa-facebook-f"></i></a>` : ''}
                                    ${pastor.whatsapp ? `<a href="https://wa.me/${pastor.whatsapp}" target="_blank"><i class="fab fa-whatsapp"></i></a>` : ''}
                                </div>
                            </div>
                        </div>`;

            container.appendChild(col);
        });

    } catch (error) {
        console.error('Erro ao carregar os pastores:', error);
        document.querySelector('#pastores-container').innerHTML = '<div class="col-12 text-center"><p>Erro ao carregar os pastores</p></div>';
    }
}


// Função principal
async function initializeApp() {
    try {
        console.log('Iniciando aplicação...');

        const supabaseClient = await initSupabase();

        // Preenche todas as seções
        await fillEvents(supabaseClient);
        await fillGallery(supabaseClient);
        await fillTestimonials(supabaseClient);
        await fillPastores(supabaseClient);

        // Inicializa o carrossel de depoimentos
        initTestimonials();

        // Anima as seções quando aparecem na tela
        animateOnScroll();

        // Cria partículas flutuantes
        createParticles();

    } catch (error) {
        console.error('Erro na inicialização:', error);
        if (error.code === '42P01') {
            alert('Tabela não encontrada. Verifique se criou as tabelas no Supabase.');
        } else {
            alert('Erro ao carregar os dados. Por favor, recarregue a página.');
        }
    }
}

// Inicia a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);