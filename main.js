(() => {
  "use strict";

  if (!window.THREE) {
    document.getElementById("loading").innerHTML =
      "<div><h1>Erro</h1><p>Three.js não carregou. Confira a internet ou publique no GitHub Pages.</p></div>";
    return;
  }

  const MAP_SIZE = 48000;
  const HALF = MAP_SIZE / 2;
  const MINIMAP_RANGE = 16000;

  const WORLD_COLORS = {
    sky: 0x8fd3ff,
    fog: 0x9bd6ff,
    ocean: 0x287fb5,
    grass: 0x43a35b,
    field: 0x68ad5d,
    forest: 0x2f7d43,
    sand: 0xb8aa6c,
    runway: 0x242424,
    taxi: 0x303030,
    road: 0x4c4d4f,
    river: 0x2d93ca,
    mountain: 0x78806d
  };

  const QUALITY = [
    { name: "Ultra leve", pixel: 0.42, buildings: 70, trees: 150, clouds: 8, fog: 23500, particles: 24 },
    { name: "Baixa", pixel: 0.62, buildings: 140, trees: 310, clouds: 15, fog: 30000, particles: 38 },
    { name: "Alta", pixel: 0.9, buildings: 260, trees: 560, clouds: 28, fog: 39000, particles: 64 }
  ];

  const AIRCRAFT_TYPES = [
    { id: "cessna", name: "Cessna velho de aeroclube", model: "cessna", price: 0, takeoff: 98, landingMax: 180, maxSpeed: 320, thrust: 58, boost: 1.12, drag: 0.00185, lift: 17.4, control: 1.12, stallAngle: 22, stallSpeed: 72, cameraBack: 34, hitboxRadius: 7, color: 0xf3f0df, accent: 0xb43732, scale: 0.96 },
    { id: "trainer", name: "Treinador leve OFC-120", model: "cessna", price: 2400, takeoff: 92, landingMax: 185, maxSpeed: 350, thrust: 65, boost: 1.16, drag: 0.0017, lift: 18.2, control: 1.24, stallAngle: 23, stallSpeed: 68, cameraBack: 34, hitboxRadius: 7, color: 0xffffff, accent: 0x2d6fd3, scale: 1 },
    { id: "piper", name: "Monomotor turismo", model: "cessna", price: 5200, takeoff: 105, landingMax: 195, maxSpeed: 390, thrust: 72, boost: 1.18, drag: 0.00155, lift: 18.6, control: 1.22, stallAngle: 23, stallSpeed: 74, cameraBack: 35, hitboxRadius: 7, color: 0xe7eef3, accent: 0x2f8f59, scale: 1.04 },
    { id: "taildragger", name: "STOL rural", model: "cessna", price: 8200, takeoff: 78, landingMax: 175, maxSpeed: 310, thrust: 70, boost: 1.2, drag: 0.0019, lift: 20.1, control: 1.34, stallAngle: 26, stallSpeed: 58, cameraBack: 32, hitboxRadius: 7, color: 0xe8e1c8, accent: 0x4f7b39, scale: 0.98 },
    { id: "baron", name: "Bimotor executivo leve", model: "turboprop", price: 15000, takeoff: 125, landingMax: 220, maxSpeed: 510, thrust: 86, boost: 1.18, drag: 0.00125, lift: 18.9, control: 1.08, stallAngle: 23, stallSpeed: 88, cameraBack: 39, hitboxRadius: 8, color: 0xf4f5f0, accent: 0x1d4f8f, scale: 1 },
    { id: "caravan", name: "Utilitário Caravan", model: "turboprop", price: 24000, takeoff: 130, landingMax: 230, maxSpeed: 470, thrust: 92, boost: 1.16, drag: 0.00132, lift: 19.8, control: 0.98, stallAngle: 23, stallSpeed: 85, cameraBack: 42, hitboxRadius: 9, color: 0xf7f3e8, accent: 0xc18a32, scale: 1.1 },
    { id: "kingair", name: "King Air regional", model: "turboprop", price: 39000, takeoff: 145, landingMax: 245, maxSpeed: 610, thrust: 108, boost: 1.18, drag: 0.00105, lift: 19.2, control: 0.96, stallAngle: 23, stallSpeed: 98, cameraBack: 45, hitboxRadius: 10, color: 0xf0f4f8, accent: 0x274f9f, scale: 1.18 },
    { id: "pc12", name: "Turboélice premium", model: "turboprop", price: 56000, takeoff: 150, landingMax: 255, maxSpeed: 700, thrust: 118, boost: 1.18, drag: 0.00096, lift: 19.5, control: 1.02, stallAngle: 24, stallSpeed: 102, cameraBack: 45, hitboxRadius: 10, color: 0xe6eced, accent: 0x5c6570, scale: 1.2 },
    { id: "tbm", name: "Turbo rápido TBM", model: "turboprop", price: 72000, takeoff: 158, landingMax: 265, maxSpeed: 780, thrust: 132, boost: 1.2, drag: 0.00086, lift: 19.3, control: 1.08, stallAngle: 24, stallSpeed: 110, cameraBack: 45, hitboxRadius: 10, color: 0xf7f7f7, accent: 0x9c2930, scale: 1.14 },
    { id: "learjet", name: "Jato executivo antigo", model: "business", price: 98000, takeoff: 175, landingMax: 275, maxSpeed: 820, thrust: 128, boost: 1.16, drag: 0.00082, lift: 17.4, control: 0.9, stallAngle: 22, stallSpeed: 125, cameraBack: 48, hitboxRadius: 11, color: 0xf8f8f4, accent: 0x2a5c95, scale: 0.98 },
    { id: "citation", name: "Jato executivo moderno", model: "business", price: 130000, takeoff: 168, landingMax: 285, maxSpeed: 890, thrust: 142, boost: 1.18, drag: 0.00074, lift: 17.9, control: 0.96, stallAngle: 22, stallSpeed: 122, cameraBack: 49, hitboxRadius: 11, color: 0xffffff, accent: 0x40505f, scale: 1.02 },
    { id: "embraer", name: "Jato regional E-Jet", model: "regional", price: 185000, takeoff: 188, landingMax: 300, maxSpeed: 870, thrust: 150, boost: 1.15, drag: 0.00078, lift: 16.8, control: 0.8, stallAngle: 21, stallSpeed: 138, cameraBack: 54, hitboxRadius: 13, color: 0xf3f6f8, accent: 0x1976b8, scale: 1.05 },
    { id: "atr", name: "Turboélice regional ATR", model: "regional", price: 210000, takeoff: 165, landingMax: 275, maxSpeed: 620, thrust: 138, boost: 1.12, drag: 0.00102, lift: 18.9, control: 0.74, stallAngle: 21, stallSpeed: 118, cameraBack: 55, hitboxRadius: 13, color: 0xf2f2ef, accent: 0x0f7d72, scale: 1 },
    { id: "dash8", name: "Dash regional rápido", model: "regional", price: 260000, takeoff: 172, landingMax: 285, maxSpeed: 690, thrust: 148, boost: 1.14, drag: 0.00096, lift: 18.4, control: 0.76, stallAngle: 21, stallSpeed: 126, cameraBack: 56, hitboxRadius: 13, color: 0xeceff1, accent: 0xb43a2c, scale: 1.06 },
    { id: "crj", name: "Regional CRJ alongado", model: "regional", price: 330000, takeoff: 200, landingMax: 305, maxSpeed: 880, thrust: 158, boost: 1.15, drag: 0.00073, lift: 16.7, control: 0.72, stallAngle: 20, stallSpeed: 148, cameraBack: 57, hitboxRadius: 13, color: 0xf8f8f5, accent: 0x384a6b, scale: 1.08 },
    { id: "a320", name: "Airliner médio A320", model: "airliner", price: 520000, takeoff: 215, landingMax: 318, maxSpeed: 910, thrust: 170, boost: 1.14, drag: 0.00072, lift: 16.3, control: 0.66, stallAngle: 20, stallSpeed: 158, cameraBack: 62, hitboxRadius: 15, color: 0xf2f4f5, accent: 0x1a7fba, scale: 1.2 },
    { id: "boeing", name: "Jato comercial 737", model: "airliner", price: 680000, takeoff: 205, landingMax: 315, maxSpeed: 940, thrust: 184, boost: 1.16, drag: 0.00066, lift: 16.2, control: 0.72, stallAngle: 20, stallSpeed: 155, cameraBack: 64, hitboxRadius: 15, color: 0xf2f2f2, accent: 0x1c60d6, scale: 1.22 },
    { id: "widebody", name: "Widebody longo", model: "airliner", price: 980000, takeoff: 245, landingMax: 340, maxSpeed: 980, thrust: 215, boost: 1.12, drag: 0.00062, lift: 15.7, control: 0.55, stallAngle: 19, stallSpeed: 178, cameraBack: 76, hitboxRadius: 18, color: 0xf6f6f2, accent: 0x7a4ea3, scale: 1.5 },
    { id: "cargo", name: "Cargueiro pesado", model: "cargo", price: 1250000, takeoff: 260, landingMax: 330, maxSpeed: 820, thrust: 230, boost: 1.1, drag: 0.00078, lift: 16.4, control: 0.48, stallAngle: 19, stallSpeed: 182, cameraBack: 82, hitboxRadius: 19, color: 0xd8dde0, accent: 0x2f5c44, scale: 1.42 },
    { id: "f16", name: "Caça leve inspirado no F-16", model: "fighter", price: 1800000, takeoff: 135, landingMax: 255, maxSpeed: 1450, thrust: 195, boost: 1.34, drag: 0.00055, lift: 21.2, control: 1.55, stallAngle: 28, stallSpeed: 112, cameraBack: 42, hitboxRadius: 10, color: 0x909aa2, accent: 0x39424b, scale: 0.98 },
    { id: "f35", name: "Caça stealth moderno", model: "fighter", price: 2400000, takeoff: 142, landingMax: 260, maxSpeed: 1650, thrust: 220, boost: 1.38, drag: 0.0005, lift: 21.8, control: 1.7, stallAngle: 29, stallSpeed: 108, cameraBack: 43, hitboxRadius: 10, color: 0x7f8992, accent: 0x2c343c, scale: 1.02 },
    { id: "f22", name: "Caça stealth inspirado no F-22", model: "f22", price: 3200000, takeoff: 145, landingMax: 260, maxSpeed: 1900, thrust: 248, boost: 1.42, drag: 0.00048, lift: 22.8, control: 1.85, stallAngle: 30, stallSpeed: 105, cameraBack: 44, hitboxRadius: 10, color: 0x8b959d, accent: 0x303842, scale: 1.05, weapons: { missiles: 6, cannon: true } },
    { id: "f15ex", name: "Caça pesado F-15EX armado", model: "fighter", price: 2100000, takeoff: 166, landingMax: 270, maxSpeed: 2150, thrust: 300, boost: 1.4, drag: 0.00042, lift: 23.2, control: 1.55, stallAngle: 30, stallSpeed: 126, cameraBack: 47, hitboxRadius: 11, color: 0x7d858b, accent: 0x222c36, scale: 1.12, weapons: { missiles: 8, cannon: true } },
    { id: "rafale", name: "Caça naval Rafale armado", model: "fighter", price: 2450000, takeoff: 158, landingMax: 265, maxSpeed: 1980, thrust: 286, boost: 1.44, drag: 0.00039, lift: 24.2, control: 1.62, stallAngle: 31, stallSpeed: 118, cameraBack: 45, hitboxRadius: 10, color: 0x8f969c, accent: 0x343a42, scale: 1.02, weapons: { missiles: 6, cannon: true } },
    { id: "typhoon", name: "Caça Eurofighter armado", model: "fighter", price: 2850000, takeoff: 162, landingMax: 270, maxSpeed: 2280, thrust: 318, boost: 1.46, drag: 0.00037, lift: 24.8, control: 1.7, stallAngle: 31, stallSpeed: 120, cameraBack: 45, hitboxRadius: 10, color: 0x9ca3aa, accent: 0x2f3b47, scale: 1.04, weapons: { missiles: 8, cannon: true } },
    { id: "su57", name: "Caça stealth Su-57 armado", model: "fighter", price: 3400000, takeoff: 170, landingMax: 278, maxSpeed: 2400, thrust: 340, boost: 1.5, drag: 0.00035, lift: 25.4, control: 1.78, stallAngle: 32, stallSpeed: 124, cameraBack: 48, hitboxRadius: 11, color: 0x6f7a80, accent: 0x273138, scale: 1.13, weapons: { missiles: 10, cannon: true } },
    { id: "ofcx", name: "Caça experimental OFC-X armado", model: "fighter", price: 4300000, takeoff: 180, landingMax: 290, maxSpeed: 2850, thrust: 390, boost: 1.56, drag: 0.00031, lift: 26.6, control: 1.86, stallAngle: 33, stallSpeed: 128, cameraBack: 51, hitboxRadius: 12, color: 0x202b34, accent: 0x66caff, scale: 1.18, weapons: { missiles: 12, cannon: true } }
  ];

  const AIRCRAFT_TUNING = [
    ["cessna", 0, 330, 138, 86, 60, 0.52, 1.04, 0.00178],
    ["trainer", 1800, 365, 134, 82, 70, 0.64, 1.02, 0.0016],
    ["piper", 3900, 405, 148, 88, 80, 0.72, 1, 0.00146],
    ["taildragger", 6200, 330, 120, 72, 76, 0.78, 0.96, 0.00174],
    ["baron", 10500, 535, 170, 104, 99, 0.88, 0.98, 0.00113],
    ["caravan", 17000, 500, 178, 102, 105, 0.92, 0.96, 0.0012],
    ["kingair", 29000, 650, 192, 116, 124, 1.02, 0.96, 0.00096],
    ["pc12", 42000, 740, 198, 120, 134, 1.08, 0.98, 0.00086],
    ["tbm", 56000, 850, 205, 128, 150, 1.16, 1, 0.00078],
    ["learjet", 76000, 890, 225, 144, 150, 1.2, 0.98, 0.00072],
    ["citation", 98000, 940, 220, 140, 164, 1.28, 1, 0.00067],
    ["embraer", 145000, 915, 245, 156, 174, 1.34, 0.96, 0.00069],
    ["atr", 168000, 650, 215, 138, 158, 1.32, 0.94, 0.00091],
    ["dash8", 205000, 720, 225, 146, 168, 1.38, 0.95, 0.00085],
    ["crj", 260000, 930, 255, 168, 184, 1.46, 0.96, 0.00065],
    ["a320", 420000, 955, 275, 178, 196, 1.56, 0.94, 0.00062],
    ["boeing", 520000, 980, 270, 174, 210, 1.62, 0.94, 0.00058],
    ["widebody", 740000, 1010, 315, 196, 242, 1.72, 0.9, 0.00054],
    ["cargo", 920000, 860, 330, 204, 258, 1.7, 0.88, 0.00066],
    ["f16", 1250000, 1650, 185, 128, 235, 1.78, 1.06, 0.00047],
    ["f35", 1500000, 1820, 190, 124, 258, 1.9, 1.08, 0.00043],
    ["f22", 1800000, 2050, 195, 122, 288, 2.05, 1.1, 0.0004],
    ["f15ex", 2100000, 2150, 205, 130, 300, 2.12, 1.1, 0.00042],
    ["rafale", 2450000, 1980, 195, 122, 286, 2.18, 1.12, 0.00039],
    ["typhoon", 2850000, 2280, 200, 124, 318, 2.24, 1.14, 0.00037],
    ["su57", 3400000, 2400, 210, 128, 340, 2.32, 1.16, 0.00035],
    ["ofcx", 4300000, 2850, 225, 132, 390, 2.45, 1.18, 0.00031]
  ];

  AIRCRAFT_TUNING.forEach(([id, price, maxSpeed, takeoff, stallSpeed, thrust, stability, control, drag]) => {
    const type = AIRCRAFT_TYPES.find(aircraft => aircraft.id === id);
    if (!type) return;
    Object.assign(type, { price, maxSpeed, takeoff, stallSpeed, thrust, stability, control, drag });
  });

  const COMBAT_FIGHTER_IDS = ["f22", "f15ex", "rafale", "typhoon", "su57", "ofcx"];

  const AIRPORTS = [
    { id: "OFC", name: "Aeroporto Central OFC", x: 0, z: 1800, heading: 180, length: 2600 },
    { id: "ILHA", name: "Aeroporto Ilha Azul", x: -9800, z: -7600, heading: 45, length: 1900 },
    { id: "SERRA", name: "Aeroporto Serra Norte", x: 11200, z: -9000, heading: 315, length: 2100 },
    { id: "CIDADE", name: "Aeroporto Cidade Leste", x: 7200, z: 3800, heading: 90, length: 2600 },
    { id: "DESERTO", name: "Base Deserto Sul", x: -11200, z: 9600, heading: 270, length: 2300 },
    { id: "NAVAL", name: "Base Naval Costa", x: 0, z: -12200, heading: 0, length: 2200 },
    { id: "VALE", name: "Aeroporto Vale Verde", x: -10500, z: 900, heading: 135, length: 1700 },
    { id: "METRO", name: "Aeroporto Metropolitano", x: 11800, z: 800, heading: 90, length: 3000 },
    { id: "NORTE", name: "Aeroporto Norte Frio", x: -2300, z: -14500, heading: 20, length: 1800 },
    { id: "LAGO", name: "Aeroporto Lago Cristal", x: 6700, z: -13200, heading: 60, length: 1600 },
    { id: "SUL", name: "Aeroporto Sul Tropical", x: 4500, z: 12800, heading: 190, length: 2000 },
    { id: "OESTE", name: "Aeroporto Oeste Rural", x: -13500, z: 4300, heading: 260, length: 1800 },
    { id: "ARQ", name: "Pista Arquipelago", x: -14200, z: -11800, heading: 35, length: 1400 },
    { id: "PLANALTO", name: "Aeroporto Planalto Alto", x: 13600, z: 11800, heading: 320, length: 1900 },
    { id: "CAPITAL", name: "Aeroporto Capital Norte", x: -18200, z: -4200, heading: 85, length: 3300 },
    { id: "FLORESTA", name: "Aeroporto Floresta Verde", x: 19800, z: -6200, heading: 140, length: 1700 },
    { id: "MINAS", name: "Aeroporto Minas Alta", x: 3200, z: 21400, heading: 10, length: 1900 },
    { id: "PORTO", name: "Aeroporto Porto Sul", x: -6400, z: 21100, heading: 100, length: 2300 },
    { id: "GLACIAL", name: "Aeroporto Glacial Norte", x: 9200, z: -21400, heading: 45, length: 1800 },
    { id: "LITORAL", name: "Aeroporto Litoral Leste", x: 21400, z: -14500, heading: 15, length: 2100 },
    { id: "FRONTEIRA", name: "Aeroporto Fronteira Oeste", x: -21300, z: 14200, heading: 300, length: 1850 },
    { id: "BASEALTA", name: "Base Alta Militar", x: 20500, z: 19800, heading: 330, length: 2400 }
  ];

  const CITY_CENTERS = [
    { x: 1900, z: -450, radius: 3300 },
    { x: 7200, z: 3800, radius: 2500 },
    { x: 11800, z: 800, radius: 2900 },
    { x: -10500, z: 900, radius: 2100 },
    { x: -11200, z: 9600, radius: 1900 },
    { x: 4500, z: 12800, radius: 2200 },
    { x: 11200, z: -9000, radius: 2300 },
    { x: -9800, z: -7600, radius: 1800 },
    { x: -18200, z: -4200, radius: 2600 },
    { x: 19800, z: -6200, radius: 2100 },
    { x: 3200, z: 21400, radius: 1900 },
    { x: -6400, z: 21100, radius: 2300 },
    { x: 21400, z: -14500, radius: 2200 },
    { x: -21300, z: 14200, radius: 2100 },
    { x: 20500, z: 19800, radius: 1800 }
  ];

  const RURAL_CENTERS = [
    { x: -15600, z: 7200, radius: 1800 },
    { x: -7200, z: 13200, radius: 1600 },
    { x: 8600, z: 15400, radius: 1900 },
    { x: 15600, z: 6200, radius: 1700 },
    { x: -16400, z: -12600, radius: 1500 },
    { x: 14800, z: -15800, radius: 1800 },
    { x: -4200, z: -18200, radius: 1600 },
    { x: 5200, z: -5200, radius: 1500 }
  ];

  const MISSIONS = [
    { title: "Voo escola", type: "treino", from: "OFC", to: "VALE", reward: 1800, passengers: 1, text: "Instrutor a bordo para treinar navegação e pouso." },
    { title: "Buscar passageiros", type: "passageiros", from: "OFC", to: "METRO", reward: 5200, passengers: 34, text: "Embarque passageiros no terminal central e leve até o Metropolitano." },
    { title: "Linha comercial longa", type: "passageiros", from: "METRO", to: "ARQ", reward: 9800, passengers: 128, text: "Rota longa sobre o mapa novo até a pista do arquipélago." },
    { title: "Traslado executivo", type: "passageiros", from: "CIDADE", to: "PLANALTO", reward: 7600, passengers: 6, text: "Leve passageiros VIP até o aeroporto alto com pouso alinhado." },
    { title: "Conexão Lago", type: "passageiros", from: "LAGO", to: "SUL", reward: 6400, passengers: 22, text: "Voo regional entre Lago Cristal e Sul Tropical." },
    { title: "Carga expressa", type: "carga", from: "ILHA", to: "SERRA", reward: 6800, cargo: "840 kg", text: "Leve carga leve até Serra Norte com rota longa." },
    { title: "Suprimento rural", type: "carga", from: "OESTE", to: "DESERTO", reward: 7300, cargo: "1.2 t", text: "Transporte suprimentos para a base no deserto." },
    { title: "Operação militar", type: "militar", from: "NAVAL", to: "DESERTO", reward: 8600, cargo: "pacote tático", text: "Use o caça e atravesse a rota rápida em baixa resistência." },
    { title: "Interceptação de teste", type: "militar", from: "NORTE", to: "SERRA", reward: 9000, cargo: "dados de voo", text: "Voo rápido de teste para o caça stealth." },
    { title: "Resgate aeromédico", type: "emergência", from: "VALE", to: "CIDADE", reward: 8200, passengers: 2, text: "Transporte paciente e médico com pouso suave." },
    { title: "Ponte aérea capital", type: "passageiros", from: "CAPITAL", to: "METRO", reward: 11200, passengers: 156, text: "Rota movimentada entre Capital Norte e Metropolitano." },
    { title: "Turismo floresta", type: "passageiros", from: "FLORESTA", to: "LAGO", reward: 9700, passengers: 18, text: "Leve turistas para Lago Cristal sobre áreas verdes." },
    { title: "Minério urgente", type: "carga", from: "MINAS", to: "PORTO", reward: 11800, cargo: "2.4 t", text: "Leve peças e amostras da serra até o porto." },
    { title: "Correio glacial", type: "carga", from: "GLACIAL", to: "NORTE", reward: 8800, cargo: "malotes", text: "Rota curta e fria entre bases do norte." },
    { title: "Linha litoral", type: "passageiros", from: "LITORAL", to: "ARQ", reward: 13200, passengers: 74, text: "Cruze o litoral até o arquipélago." },
    { title: "Fronteira médica", type: "emergência", from: "FRONTEIRA", to: "CAPITAL", reward: 12500, passengers: 3, text: "Transporte equipe médica para a capital." },
    { title: "Treino militar avançado", type: "militar", from: "BASEALTA", to: "NAVAL", reward: 14800, cargo: "plano de voo", text: "Rota militar de alta velocidade até a base naval." },
    { title: "Volta do mundo OFC", type: "passageiros", from: "CAPITAL", to: "BASEALTA", reward: 18000, passengers: 210, text: "Grande rota do mapa expandido para aviões de alto nível." },
    {
      title: "Argolas do F-16",
      type: "argolas",
      from: "NAVAL",
      to: "NAVAL",
      reward: 24000,
      requiredAircraft: "f16",
      challenge: "rings",
      course: 12,
      rings: [
        { forward: 1200, side: 0, y: 170 },
        { forward: 2100, side: -360, y: 230 },
        { forward: 3000, side: 360, y: 310 },
        { forward: 4050, side: 0, y: 260 },
        { forward: 5200, side: -520, y: 210 },
        { forward: 6400, side: 220, y: 185 }
      ],
      text: "Passe pelas argolas em sequência com velocidade e controle."
    },
    {
      title: "Corredor furtivo F-22",
      type: "argolas",
      from: "BASEALTA",
      to: "BASEALTA",
      reward: 42000,
      requiredAircraft: "f22",
      challenge: "rings",
      course: 300,
      rings: [
        { forward: 1500, side: 0, y: 260 },
        { forward: 2600, side: 480, y: 360 },
        { forward: 3800, side: -380, y: 430 },
        { forward: 5050, side: 620, y: 360 },
        { forward: 6400, side: 0, y: 280 },
        { forward: 7600, side: -640, y: 340 },
        { forward: 9000, side: 180, y: 260 }
      ],
      text: "Use a estabilidade do F-22 ou melhor para cruzar o corredor aéreo."
    },
    {
      title: "PvP simulado F-15EX",
      type: "pvp",
      from: "DESERTO",
      to: "DESERTO",
      reward: 56000,
      requiredGroup: "combatFighter",
      challenge: "combat",
      course: 270,
      enemies: 3,
      text: "Derrube os rivais no ar usando mísseis ou canhão."
    },
    {
      title: "Patrulha armada Rafale",
      type: "pvp",
      from: "LITORAL",
      to: "LITORAL",
      reward: 68000,
      requiredGroup: "combatFighter",
      challenge: "combat",
      course: 35,
      enemies: 4,
      text: "Defenda a costa em um duelo aéreo contra rivais rápidos."
    },
    {
      title: "Interceptação Typhoon",
      type: "pvp",
      from: "NORTE",
      to: "NORTE",
      reward: 82000,
      requiredGroup: "combatFighter",
      challenge: "combat",
      course: 70,
      enemies: 5,
      text: "Intercepte uma formação rival antes que ela atravesse o setor."
    },
    {
      title: "Sombra Su-57",
      type: "pvp",
      from: "GLACIAL",
      to: "GLACIAL",
      reward: 98000,
      requiredGroup: "combatFighter",
      challenge: "combat",
      course: 225,
      enemies: 6,
      text: "Use o caça stealth para vencer rivais de alta altitude."
    },
    {
      title: "Arena final OFC-X",
      type: "pvp",
      from: "CAPITAL",
      to: "CAPITAL",
      reward: 135000,
      requiredGroup: "combatFighter",
      challenge: "combat",
      course: 180,
      enemies: 8,
      text: "Missão final: combate aéreo pesado com todos os sistemas liberados."
    }
  ];

  let qualityIndex = 2;
  let quality = QUALITY[qualityIndex];
  let aircraftIndex = 0;
  let aircraftType = AIRCRAFT_TYPES[aircraftIndex];
  let playerName = "";
  let gameStarted = false;
  let gameMode = null;
  let ownedAircraft = new Set([AIRCRAFT_TYPES[0].id]);
  let shopOpen = false;
  let hudHidden = false;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixel));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(WORLD_COLORS.sky);
  scene.fog = new THREE.Fog(WORLD_COLORS.fog, 2100, quality.fog);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 56000);

  scene.add(new THREE.HemisphereLight(0xf7fbff, 0x4a7a4c, 1.55));
  const sun = new THREE.DirectionalLight(0xfff4df, 1.85);
  sun.position.set(1200, 2200, 800);
  scene.add(sun);

  let dynamicObjects = [];
  let keys = {};
  let pressed = {};
  let cameraMode = 0;
  let activeMission = null;
  let missionIndex = -1;
  let money = 0;
  let completed = 0;
  let explosions = [];
  let projectiles = [];
  let missionObjects = [];
  let weaponCooldown = 0;
  let missileAmmo = 0;
  let cannonAmmo = 0;
  let selectedWeapon = "missile";
  let plane = null;
  let lastLanding = null;
  let showHitboxes = false;
  let hitboxHelpers = [];
  let planeHitboxHelper = null;
  let staticColliders = [];
  let dynamicColliders = [];

  const el = id => document.getElementById(id);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist2 = (x1, z1, x2, z2) => Math.hypot(x1 - x2, z1 - z2);
  const airport = id => AIRPORTS.find(a => a.id === id);
  const fmtMoney = value => "$" + Math.round(value).toLocaleString("en-US");
  const wrapDegrees = value => ((value + 540) % 360) - 180;
  const wrapRadians = value => Math.atan2(Math.sin(value), Math.cos(value));
  const lerpAngle = (from, to, amount) => from + wrapRadians(to - from) * amount;
  const ownsAircraft = type => gameMode === "free" || ownedAircraft.has(type.id);
  const fmtGameMoney = () => gameMode === "free" ? "Livre" : fmtMoney(money);
  const careerKey = name => "flight-simulator-ofc-career-" + name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const maxSpeedMS = () => aircraftType.maxSpeed / 3.6;
  const aircraftById = id => AIRCRAFT_TYPES.find(type => type.id === id);
  const ownsAircraftId = id => gameMode === "free" || ownedAircraft.has(id);
  const isCombatFighterId = id => COMBAT_FIGHTER_IDS.includes(id);
  const currentIsCombatFighter = () => isCombatFighterId(aircraftType.id);

  function bestOwnedCombatFighterIndex() {
    for (let i = COMBAT_FIGHTER_IDS.length - 1; i >= 0; i--) {
      const id = COMBAT_FIGHTER_IDS[i];
      if (ownsAircraftId(id)) return AIRCRAFT_TYPES.findIndex(type => type.id === id);
    }
    return -1;
  }

  function hasCombatFighterUnlocked() {
    return bestOwnedCombatFighterIndex() >= 0;
  }

  function missionRequirementText(mission) {
    if (mission.requiredGroup === "combatFighter") return "um dos 6 caças armados: F-22, F-15EX, Rafale, Typhoon, Su-57 ou OFC-X";
    if (mission.requiredAircraft) {
      const type = aircraftById(mission.requiredAircraft);
      return type ? type.name : mission.requiredAircraft;
    }
    return "";
  }

  function missionUnlocked(mission) {
    if (!mission) return false;
    if (mission.requiredGroup === "combatFighter") return hasCombatFighterUnlocked();
    if (mission.requiredAircraft) return ownsAircraftId(mission.requiredAircraft);
    return true;
  }

  window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();
    if (!keys[key]) pressed[key] = true;
    keys[key] = true;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  });

  window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
  });

  function down(key) {
    return !!keys[key.toLowerCase()];
  }

  function once(key) {
    key = key.toLowerCase();
    if (pressed[key]) {
      pressed[key] = false;
      return true;
    }
    return false;
  }

  const Y_AXIS = new THREE.Vector3(0, 1, 0);
  const cameraRig = {
    ready: false,
    yaw: Math.PI,
    target: new THREE.Vector3()
  };

  function resetCameraRig() {
    cameraRig.ready = false;
    cameraRig.yaw = aircraft.yaw;
    cameraRig.target.copy(aircraft.position);
  }

  function flatSurfaceMaterial(color, offsetFactor) {
    return new THREE.MeshBasicMaterial({
      color,
      polygonOffset: true,
      polygonOffsetFactor: offsetFactor,
      polygonOffsetUnits: offsetFactor
    });
  }

  function airportWorldPosition(a, localX, localY, localZ) {
    const p = new THREE.Vector3(localX, localY, localZ);
    p.applyAxisAngle(Y_AXIS, -THREE.Math.degToRad(a.heading));
    return { x: a.x + p.x, y: localY, z: a.z + p.z };
  }

  function airportLocalPosition(a, x, z) {
    const p = new THREE.Vector3(x - a.x, 0, z - a.z);
    p.applyAxisAngle(Y_AXIS, THREE.Math.degToRad(a.heading));
    return p;
  }

  function isInRunwayZone(a, x, z, margin = 0) {
    const local = airportLocalPosition(a, x, z);
    return Math.abs(local.x) <= 74 + margin && Math.abs(local.z) <= a.length / 2 + margin;
  }

  function isAirportProtected(x, z, margin = 360) {
    return AIRPORTS.some(a => isInRunwayZone(a, x, z, margin) || dist2(x, z, a.x, a.z) < margin * 1.25);
  }

  function addCollider(list, label, x, y, z, halfX, halfY, halfZ, damage = 1) {
    list.push({ label, x, y, z, halfX, halfY, halfZ, damage });
  }

  function addAirportCollider(a, label, localX, localY, localZ, halfX, halfY, halfZ, damage = 1.15) {
    const p = airportWorldPosition(a, localX, localY, localZ);
    addCollider(staticColliders, label, p.x, p.y, p.z, halfX, halfY, halfZ, damage);
  }

  function addLayeredCollider(list, label, x, z, layers, damage = 1) {
    layers.forEach(layer => {
      addCollider(list, label, x, layer.y, z, layer.halfX, layer.halfY, layer.halfZ, damage);
    });
  }

  function allColliders() {
    return staticColliders.concat(dynamicColliders);
  }

  function clearProjectiles() {
    projectiles.forEach(projectile => scene.remove(projectile));
    projectiles = [];
    weaponCooldown = 0;
  }

  function clearMissionObjects() {
    missionObjects.forEach(object => {
      if (object.userData && object.userData.shadow) scene.remove(object.userData.shadow);
      scene.remove(object);
    });
    missionObjects = [];
  }

  function resetWeaponAmmo() {
    missileAmmo = aircraftType.weapons ? aircraftType.weapons.missiles : 0;
    cannonAmmo = aircraftType.weapons ? 520 : 0;
    selectedWeapon = aircraftType.weapons ? "missile" : "cannon";
    weaponCooldown = 0;
  }

  function selectedWeaponLabel() {
    if (!aircraftType.weapons) return "--";
    return selectedWeapon === "missile"
      ? "Mísseis (" + missileAmmo + ")"
      : "Canhão (" + cannonAmmo + ")";
  }

  function cycleWeapon() {
    if (!aircraftType.weapons) {
      el("message").innerHTML = "Este avião não tem armas.";
      return;
    }

    selectedWeapon = selectedWeapon === "missile" ? "cannon" : "missile";
    el("message").innerHTML = "Arma selecionada: " + selectedWeaponLabel() + ". Espaço para atirar.";
  }

  function clearHitboxHelpers() {
    hitboxHelpers.forEach(helper => scene.remove(helper));
    hitboxHelpers = [];
    if (planeHitboxHelper) {
      scene.remove(planeHitboxHelper);
      planeHitboxHelper = null;
    }
  }

  function rebuildHitboxHelpers() {
    clearHitboxHelpers();
    if (!showHitboxes) return;

    const mat = new THREE.MeshBasicMaterial({
      color: 0xff4d4d,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });

    allColliders().forEach(collider => {
      const helper = new THREE.Mesh(
        new THREE.BoxGeometry(collider.halfX * 2, collider.halfY * 2, collider.halfZ * 2),
        mat
      );
      helper.position.set(collider.x, collider.y, collider.z);
      scene.add(helper);
      hitboxHelpers.push(helper);
    });

    planeHitboxHelper = new THREE.Mesh(
      new THREE.SphereGeometry(aircraftType.hitboxRadius, 16, 10),
      new THREE.MeshBasicMaterial({ color: 0x4dd8ff, wireframe: true, transparent: true, opacity: 0.7 })
    );
    scene.add(planeHitboxHelper);
  }

  function addStaticWorld() {
    staticColliders = [];

    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_SIZE * 2.2, MAP_SIZE * 2.2, 1, 1),
      flatSurfaceMaterial(WORLD_COLORS.ocean, 8)
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -6;
    ocean.renderOrder = 0;
    scene.add(ocean);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, 120, 120),
      flatSurfaceMaterial(WORLD_COLORS.grass, 7)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.renderOrder = 1;
    scene.add(ground);

    createTerrainPatches();
    createRoads();
    createRivers();
    AIRPORTS.forEach(createAirport);
    createMountains();
  }

  function createTerrainPatches() {
    const colors = [WORLD_COLORS.field, WORLD_COLORS.forest, WORLD_COLORS.grass, WORLD_COLORS.sand];

    for (let i = 0; i < 58; i++) {
      const patch = new THREE.Mesh(
        new THREE.PlaneGeometry(650 + Math.random() * 2100, 260 + Math.random() * 1200),
        flatSurfaceMaterial(colors[Math.floor(Math.random() * colors.length)], 6)
      );
      patch.rotation.x = -Math.PI / 2;
      patch.rotation.z = Math.random() * Math.PI;
      patch.position.set((Math.random() - 0.5) * (MAP_SIZE * 0.86), 0.35, (Math.random() - 0.5) * (MAP_SIZE * 0.86));
      patch.renderOrder = 2;
      if (!isAirportProtected(patch.position.x, patch.position.z, 520)) scene.add(patch);
    }
  }

  function createRivers() {
    const mat = flatSurfaceMaterial(WORLD_COLORS.river, 5);
    for (let i = 0; i < 5; i++) {
      const river = new THREE.Mesh(new THREE.PlaneGeometry(110, MAP_SIZE * 0.7), mat);
      river.rotation.x = -Math.PI / 2;
      river.rotation.z = (i - 2) * 0.24;
      river.position.set(-6800 + i * 3400, 0.55, -2200 + i * 1350);
      river.renderOrder = 3;
      scene.add(river);
    }
  }

  function createRoads() {
    const mat = flatSurfaceMaterial(WORLD_COLORS.road, 4);
    for (let i = -7; i <= 7; i++) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(34, MAP_SIZE * 0.82), mat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(i * 1850, 0.75, -400);
      road.renderOrder = 4;
      scene.add(road);

      const cross = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE * 0.82, 30), mat);
      cross.rotation.x = -Math.PI / 2;
      cross.position.set(400, 0.78, i * 1850);
      cross.renderOrder = 4;
      scene.add(cross);
    }
  }

  function createAirport(a) {
    const group = new THREE.Group();

    const runway = new THREE.Mesh(
      new THREE.PlaneGeometry(105, a.length, 1, 1),
      flatSurfaceMaterial(WORLD_COLORS.runway, 3)
    );
    runway.rotation.x = -Math.PI / 2;
    runway.position.y = 1.05;
    runway.renderOrder = 5;
    group.add(runway);

    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellow = new THREE.MeshBasicMaterial({ color: 0xffd34d });

    for (let z = -a.length / 2 + 80; z < a.length / 2; z += 120) {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(5, 55), white);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(0, 1.23, z);
      mark.renderOrder = 6;
      group.add(mark);
    }

    [-55, 55].forEach(x => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(3, a.length), white);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 1.24, 0);
      line.renderOrder = 6;
      group.add(line);
    });

    const taxi = new THREE.Mesh(
      new THREE.PlaneGeometry(34, a.length * 0.52),
      flatSurfaceMaterial(WORLD_COLORS.taxi, 2)
    );
    taxi.rotation.x = -Math.PI / 2;
    taxi.position.set(160, 1.1, 0);
    taxi.renderOrder = 5;
    group.add(taxi);

    const terminal = new THREE.Mesh(
      new THREE.BoxGeometry(250, 44, 90),
      new THREE.MeshLambertMaterial({ color: 0xa7b2ba })
    );
    terminal.position.set(225, 22, -165);
    group.add(terminal);

    const terminalGlass = new THREE.Mesh(
      new THREE.BoxGeometry(252, 22, 4),
      new THREE.MeshBasicMaterial({ color: 0x66caff, transparent: true, opacity: 0.45 })
    );
    terminalGlass.position.set(225, 32, -212);
    group.add(terminalGlass);

    const tower = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.BoxGeometry(24, 105, 24), new THREE.MeshLambertMaterial({ color: 0xd5dee3 }));
    stem.position.y = 52;
    const top = new THREE.Mesh(new THREE.BoxGeometry(55, 26, 55), new THREE.MeshLambertMaterial({ color: 0x7f98a8 }));
    top.position.y = 113;
    tower.add(stem, top);
    tower.position.set(145, 0, 100);
    group.add(tower);

    addAirportCollider(a, "terminal do aeroporto", 225, 21, -165, 120, 21, 41, 1.2);
    addAirportCollider(a, "terminal do aeroporto", 225, 32, -212, 121, 10, 2.4, 1.2);
    addAirportCollider(a, "torre de controle", 145, 52, 100, 11, 52, 11, 1.35);
    addAirportCollider(a, "torre de controle", 145, 113, 100, 27, 13, 27, 1.35);

    for (let i = -a.length / 2; i < a.length / 2; i += 140) {
      [-68, 68].forEach(x => {
        const light = new THREE.Mesh(new THREE.SphereGeometry(1.65, 8, 6), yellow);
        light.position.set(x, 2.2, i);
        group.add(light);
      });
    }

    group.position.set(a.x, 0, a.z);
    group.rotation.y = -THREE.Math.degToRad(a.heading);
    scene.add(group);
  }

  function createMountains() {
    const geometry = new THREE.ConeGeometry(1, 1, 6);
    const material = new THREE.MeshLambertMaterial({ color: WORLD_COLORS.mountain });
    const mountainCount = 74;
    const mesh = new THREE.InstancedMesh(geometry, material, mountainCount);
    const dummy = new THREE.Object3D();

    let placed = 0;
    let attempts = 0;

    while (placed < mountainCount && attempts < mountainCount * 14) {
      attempts++;
      const h = 200 + Math.random() * 720;
      const r = 140 + Math.random() * 420;
      const angle = Math.random() * Math.PI * 2;
      const radius = MAP_SIZE * 0.26 + Math.random() * (MAP_SIZE * 0.34);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (isAirportProtected(x, z, r + 620)) continue;

      dummy.position.set(x, h / 2, z);
      dummy.scale.set(r, h, r);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      addLayeredCollider(staticColliders, "montanha", x, z, [
        { y: h * 0.22, halfX: r * 0.58, halfY: h * 0.22, halfZ: r * 0.58 },
        { y: h * 0.58, halfX: r * 0.36, halfY: h * 0.17, halfZ: r * 0.36 },
        { y: h * 0.83, halfX: r * 0.2, halfY: h * 0.15, halfZ: r * 0.2 }
      ], 1.7);
      placed++;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  }

  function rebuildDynamicWorld() {
    dynamicObjects.forEach(object => scene.remove(object));
    dynamicObjects = [];
    dynamicColliders = [];
    clearHitboxHelpers();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixel));
    scene.fog.far = quality.fog;
    el("quality").textContent = quality.name;

    dynamicObjects.push(createBuildings(quality.buildings));
    dynamicObjects.push(createUrbanLandmarks(Math.max(5, Math.floor(quality.buildings * 0.055))));
    dynamicObjects.push(createRuralSettlements(Math.max(14, Math.floor(quality.trees * 0.075))));

    const trees = createTrees(quality.trees);
    dynamicObjects.push(trees.trunks, trees.tops);

    dynamicObjects.push(createClouds(quality.clouds));
    rebuildHitboxHelpers();
  }

  function createBuildings(count) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const baseMesh = new THREE.InstancedMesh(geometry, material, count);
    const midMesh = new THREE.InstancedMesh(geometry, material, count);
    const topMesh = new THREE.InstancedMesh(geometry, material, count);
    const group = new THREE.Group();
    group.add(baseMesh, midMesh, topMesh);
    const dummy = new THREE.Object3D();
    const buildingColors = [0xb7c4cc, 0xcfd7d2, 0xaeb8c1, 0xc5bba8, 0xb9c7af, 0xd8d4c6];

    let placed = 0;
    let midPlaced = 0;
    let topPlaced = 0;
    let attempts = 0;

    function setBuildingLayer(mesh, index, x, y, z, w, h, d, color) {
      dummy.position.set(x, y, z);
      dummy.scale.set(w, h, d);
      dummy.rotation.y = 0;
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, color);
    }

    function addBuildingColliderLayer(x, y, z, w, h, d) {
      if (h > 72) {
        const layers = Math.min(4, Math.ceil(h / 72));
        const layerH = h / layers;
        for (let i = 0; i < layers; i++) {
          addCollider(dynamicColliders, "prédio", x, y - h / 2 + layerH * (i + 0.5), z, w * 0.45, layerH * 0.5, d * 0.45, 1.25);
        }
      } else {
        addCollider(dynamicColliders, "prédio", x, y, z, w * 0.46, h * 0.5, d * 0.46, 1.25);
      }
    }

    while (placed < count && attempts < count * 12) {
      attempts++;
      const cluster = Math.random() < 0.78;
      const center = CITY_CENTERS[Math.floor(Math.random() * CITY_CENTERS.length)];
      const x = cluster ? center.x + (Math.random() - 0.5) * center.radius : (Math.random() - 0.5) * (MAP_SIZE * 0.86);
      const z = cluster ? center.z + (Math.random() - 0.5) * center.radius : (Math.random() - 0.5) * (MAP_SIZE * 0.86);
      const h = cluster ? 35 + Math.random() * 260 : 15 + Math.random() * 90;
      const w = 30 + Math.random() * 75;
      const d = 30 + Math.random() * 75;

      if (isAirportProtected(x, z, 440)) continue;

      const color = new THREE.Color(buildingColors[Math.floor(Math.random() * buildingColors.length)]);
      const tall = h > 105;
      const baseH = tall ? h * 0.46 : h * 0.76;
      const midH = tall ? h * 0.34 : h * 0.24;
      const topH = tall ? h - baseH - midH : 0;
      const baseW = w;
      const baseD = d;
      const midW = w * (tall ? 0.76 : 0.84);
      const midD = d * (tall ? 0.76 : 0.84);
      const topW = w * 0.54;
      const topD = d * 0.54;

      setBuildingLayer(baseMesh, placed, x, baseH / 2, z, baseW, baseH, baseD, color);
      addBuildingColliderLayer(x, baseH / 2, z, baseW, baseH, baseD);

      setBuildingLayer(midMesh, midPlaced, x, baseH + midH / 2, z, midW, midH, midD, color);
      addBuildingColliderLayer(x, baseH + midH / 2, z, midW, midH, midD);
      midPlaced++;

      if (tall) {
        setBuildingLayer(topMesh, topPlaced, x, baseH + midH + topH / 2, z, topW, topH, topD, color);
        addBuildingColliderLayer(x, baseH + midH + topH / 2, z, topW, topH, topD);
        topPlaced++;
      }

      placed++;
    }

    baseMesh.count = placed;
    midMesh.count = midPlaced;
    topMesh.count = topPlaced;
    [baseMesh, midMesh, topMesh].forEach(mesh => {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    scene.add(group);
    return group;
  }

  function createUrbanLandmarks(count) {
    const group = new THREE.Group();
    const matTower = new THREE.MeshLambertMaterial({ color: 0x9aa8b5 });
    const matGlass = new THREE.MeshBasicMaterial({ color: 0x5db8dd, transparent: true, opacity: 0.55 });
    const matPark = flatSurfaceMaterial(0x2f8b4c, 5);
    const matRoad = flatSurfaceMaterial(WORLD_COLORS.road, 4);

    for (let i = 0; i < count; i++) {
      const center = CITY_CENTERS[i % CITY_CENTERS.length];
      const x = center.x + (Math.random() - 0.5) * center.radius * 0.55;
      const z = center.z + (Math.random() - 0.5) * center.radius * 0.55;
      if (isAirportProtected(x, z, 560)) continue;

      const plaza = new THREE.Mesh(new THREE.PlaneGeometry(360, 260), matPark);
      plaza.rotation.x = -Math.PI / 2;
      plaza.position.set(x, 0.42, z);
      plaza.rotation.z = Math.random() * Math.PI;
      plaza.renderOrder = 3;
      group.add(plaza);

      const roadA = new THREE.Mesh(new THREE.PlaneGeometry(34, 720), matRoad);
      roadA.rotation.x = -Math.PI / 2;
      roadA.position.set(x, 0.86, z);
      roadA.rotation.z = plaza.rotation.z;
      roadA.renderOrder = 4;
      group.add(roadA);

      const height = 120 + Math.random() * 260;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(70, height, 70), matTower);
      tower.position.set(x + 110, height / 2, z - 80);
      group.add(tower);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(72, height * 0.72, 4), matGlass);
      glass.position.set(x + 110, height * 0.54, z - 116);
      group.add(glass);

      addLayeredCollider(dynamicColliders, "torre urbana", x + 110, z - 80, [
        { y: height * 0.14, halfX: 32, halfY: height * 0.14, halfZ: 32 },
        { y: height * 0.38, halfX: 30, halfY: height * 0.12, halfZ: 30 },
        { y: height * 0.62, halfX: 26, halfY: height * 0.12, halfZ: 26 },
        { y: height * 0.86, halfX: 20, halfY: height * 0.12, halfZ: 20 }
      ], 1.35);
    }

    scene.add(group);
    return group;
  }

  function createRuralSettlements(count) {
    const group = new THREE.Group();
    const houseMat = new THREE.MeshLambertMaterial({ color: 0xd7c39b });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x8c3f2c });
    const barnMat = new THREE.MeshLambertMaterial({ color: 0xa94438 });
    const siloMat = new THREE.MeshLambertMaterial({ color: 0xc9cfd1 });
    const fieldMat = flatSurfaceMaterial(WORLD_COLORS.sand, 6);

    for (let i = 0; i < count; i++) {
      const center = RURAL_CENTERS[i % RURAL_CENTERS.length];
      const x = center.x + (Math.random() - 0.5) * center.radius;
      const z = center.z + (Math.random() - 0.5) * center.radius;
      if (isAirportProtected(x, z, 460)) continue;

      const field = new THREE.Mesh(new THREE.PlaneGeometry(420, 280), fieldMat);
      field.rotation.x = -Math.PI / 2;
      field.rotation.z = Math.random() * Math.PI;
      field.position.set(x, 0.4, z);
      field.renderOrder = 2;
      group.add(field);

      const house = new THREE.Mesh(new THREE.BoxGeometry(42, 24, 34), houseMat);
      house.position.set(x - 58, 12, z - 32);
      group.add(house);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(33, 18, 4), roofMat);
      roof.position.set(x - 58, 35, z - 32);
      roof.rotation.y = Math.PI / 4;
      group.add(roof);

      const barn = new THREE.Mesh(new THREE.BoxGeometry(72, 34, 54), barnMat);
      barn.position.set(x + 54, 17, z + 42);
      group.add(barn);

      const silo = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 58, 16), siloMat);
      silo.position.set(x + 116, 29, z + 36);
      group.add(silo);

      addLayeredCollider(dynamicColliders, "casa rural", x - 58, z - 32, [
        { y: 10, halfX: 20, halfY: 10, halfZ: 16 },
        { y: 25, halfX: 18, halfY: 7, halfZ: 14 },
        { y: 38, halfX: 12, halfY: 6, halfZ: 10 }
      ], 1);
      addLayeredCollider(dynamicColliders, "celeiro", x + 54, z + 42, [
        { y: 10, halfX: 34, halfY: 10, halfZ: 25 },
        { y: 27, halfX: 32, halfY: 9, halfZ: 24 },
        { y: 43, halfX: 24, halfY: 8, halfZ: 18 }
      ], 1.08);
      addLayeredCollider(dynamicColliders, "silo", x + 116, z + 36, [
        { y: 12, halfX: 11, halfY: 12, halfZ: 11 },
        { y: 34, halfX: 11, halfY: 10, halfZ: 11 },
        { y: 55, halfX: 8, halfY: 10, halfZ: 8 }
      ], 1.16);
    }

    scene.add(group);
    return group;
  }

  function createTrees(count) {
    const trunkGeometry = new THREE.CylinderGeometry(1.2, 1.6, 10, 6);
    const topGeometry = new THREE.ConeGeometry(7, 20, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x7a5129 });
    const topMaterial = new THREE.MeshLambertMaterial({ color: 0x1f7a3a });

    const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
    const tops = new THREE.InstancedMesh(topGeometry, topMaterial, count);
    const dummy = new THREE.Object3D();

    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 14) {
      attempts++;
      const x = (Math.random() - 0.5) * (MAP_SIZE * 0.9);
      const z = (Math.random() - 0.5) * (MAP_SIZE * 0.9);

      if (isAirportProtected(x, z, 320)) continue;

      const s = 0.75 + Math.random() * 1.55;

      dummy.position.set(x, 5 * s, z);
      dummy.scale.set(s, s, s);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      trunks.setMatrixAt(placed, dummy.matrix);

      dummy.position.set(x, 20 * s, z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      tops.setMatrixAt(placed, dummy.matrix);

      addLayeredCollider(dynamicColliders, "árvore", x, z, [
        { y: 5 * s, halfX: 1.8 * s, halfY: 5 * s, halfZ: 1.8 * s },
        { y: 20 * s, halfX: 5.4 * s, halfY: 9 * s, halfZ: 5.4 * s }
      ], 0.75);
      placed++;
    }

    trunks.count = placed;
    tops.count = placed;
    trunks.instanceMatrix.needsUpdate = true;
    tops.instanceMatrix.needsUpdate = true;
    scene.add(trunks, tops);
    return { trunks, tops };
  }

  function createClouds(count) {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(1, 10, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xf6fbff, transparent: true, opacity: 0.62, depthWrite: false });

    for (let i = 0; i < count; i++) {
      const cloud = new THREE.Group();
      const puffs = 4 + Math.floor(Math.random() * 5);
      for (let j = 0; j < puffs; j++) {
        const puff = new THREE.Mesh(geometry, material);
        puff.scale.set(65 + Math.random() * 120, 14 + Math.random() * 16, 45 + Math.random() * 80);
        puff.position.set((j - puffs / 2) * 50, Math.random() * 18, Math.random() * 26);
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * (MAP_SIZE * 0.88), 680 + Math.random() * 1300, (Math.random() - 0.5) * (MAP_SIZE * 0.88));
      cloud.rotation.y = Math.random() * Math.PI;
      group.add(cloud);
    }

    scene.add(group);
    return group;
  }

  function makePlaneModel(type) {
    if (plane) {
      if (plane.userData.shadow) scene.remove(plane.userData.shadow);
      scene.remove(plane);
    }

    if (type.model === "f22" || type.model === "fighter") plane = createF22Like(type);
    else if (["airliner", "regional", "business", "cargo", "boeing"].includes(type.model)) plane = createBoeingLike(type);
    else plane = createCessnaLike(type);

    scene.add(plane);
    return plane;
  }

  function addShadow(group, radius) {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 28),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.14, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.08;
    scene.add(shadow);
    group.userData.shadow = shadow;
  }

  function createCessnaLike(type) {
    const g = new THREE.Group();
    const mainColor = type.color || 0xf7f7f7;
    const accentColor = type.accent || 0xdd2020;
    const white = new THREE.MeshLambertMaterial({ color: mainColor });
    const red = new THREE.MeshLambertMaterial({ color: accentColor });
    const dark = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const glass = new THREE.MeshBasicMaterial({ color: 0x174a78, transparent: true, opacity: 0.75 });
    const isTwin = type.model === "turboprop";
    const isStol = type.id === "taildragger";
    const scale = type.scale || 1;

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.1, 13.5), white);
    g.add(body);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.35, 10), red);
    stripe.position.y = -0.65;
    g.add(stripe);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(isTwin ? 29 : 24, 0.22, isTwin ? 4.2 : 3.6), white);
    wing.position.set(0, 0.95, -1.2);
    g.add(wing);

    const strutMat = new THREE.MeshLambertMaterial({ color: 0xd9d9d9 });
    [-1, 1].forEach(side => {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), strutMat);
      strut.position.set(side * 5.5, -0.2, -1.2);
      strut.rotation.z = side * 0.35;
      g.add(strut);
    });

    const tail = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.2, 2.1), white);
    tail.position.z = 5.5;
    g.add(tail);

    const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.38, 3.4, 2.2), red);
    rudder.position.set(0, 1.85, 5.6);
    g.add(rudder);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.45, 3.2, 22), red);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -8.25;
    g.add(nose);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.18, 18, 9), glass);
    canopy.scale.set(0.9, 0.46, 1.3);
    canopy.position.set(0, 1.12, -3.25);
    g.add(canopy);

    [-1, 1].forEach(side => {
      const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 1.15), glass);
      sideWindow.position.set(side * 1.12, 0.58, -2.6);
      g.add(sideWindow);
    });

    const props = [];
    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 6.3, 0.16), dark);
    prop.position.z = -9.85;
    g.add(prop);
    props.push(prop);

    if (isTwin) {
      const engineMat = new THREE.MeshLambertMaterial({ color: accentColor });
      [-1, 1].forEach(side => {
        const nacelle = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.05, 2.45), engineMat);
        nacelle.position.set(side * 7.25, 0.2, -2.6);
        g.add(nacelle);

        const sideProp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 5.4, 0.14), dark);
        sideProp.position.set(side * 7.25, 0.2, -4.05);
        g.add(sideProp);
        props.push(sideProp);
      });
    }

    if (isStol) {
      const gearMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      [-1, 1].forEach(side => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.5, 14), gearMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(side * 2.1, -1.65, -1.2);
        g.add(tire);
      });
    } else {
      addWheels(g, 1.2);
    }

    g.userData.props = props;
    addShadow(g, 7 * scale);
    g.scale.setScalar(scale);
    return g;
  }

  function createBoeingLike(type) {
    const g = new THREE.Group();
    const mainColor = type.color || 0xf2f2f2;
    const accentColor = type.accent || 0x1c60d6;
    const white = new THREE.MeshLambertMaterial({ color: mainColor });
    const blue = new THREE.MeshLambertMaterial({ color: accentColor });
    const dark = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const glass = new THREE.MeshBasicMaterial({ color: 0x174a78, transparent: true, opacity: 0.78 });
    const isCargo = type.model === "cargo";
    const isBusiness = type.model === "business";
    const isRegional = type.model === "regional";
    const scale = type.scale || 1.15;
    const fuselageLength = isCargo ? 29 : isBusiness ? 19 : isRegional ? 22 : 24;
    const fuselageRadius = isCargo ? 1.85 : isBusiness ? 1.2 : 1.55;
    const wingSpan = isCargo ? 41 : isBusiness ? 24 : isRegional ? 31 : 34;

    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(fuselageRadius, fuselageRadius, fuselageLength, 24), white);
    fuselage.rotation.x = Math.PI / 2;
    g.add(fuselage);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(fuselageRadius * 1.9, 0.28, fuselageLength * 0.75), blue);
    stripe.position.y = -0.25;
    g.add(stripe);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(fuselageRadius, 20, 10), white);
    nose.scale.set(1, 1, 0.75);
    nose.position.z = -fuselageLength / 2 - 0.4;
    g.add(nose);

    const tailCone = new THREE.Mesh(new THREE.ConeGeometry(fuselageRadius, 3.5, 20), white);
    tailCone.rotation.x = -Math.PI / 2;
    tailCone.position.z = fuselageLength / 2 + 1.6;
    g.add(tailCone);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(wingSpan, 0.28, isBusiness ? 3.7 : 5.2), white);
    wing.position.z = -1.5;
    wing.rotation.z = 0.04;
    g.add(wing);

    const engineMat = new THREE.MeshLambertMaterial({ color: isCargo ? 0x394148 : 0x444b55 });
    [-1, 1].forEach(side => {
      const engine = new THREE.Mesh(new THREE.CylinderGeometry(isBusiness ? 0.65 : 0.9, isBusiness ? 0.65 : 0.9, isBusiness ? 1.8 : 2.2, 18), engineMat);
      engine.rotation.x = Math.PI / 2;
      engine.position.set(side * (isBusiness ? 3.4 : 8.5), isBusiness ? 0.08 : -1.15, isBusiness ? 7.4 : -3.2);
      g.add(engine);
    });

    const tail = new THREE.Mesh(new THREE.BoxGeometry(isBusiness ? 7 : 10, 0.25, 2.8), white);
    tail.position.z = fuselageLength / 2 - 1.4;
    g.add(tail);

    const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.2, 3.2), blue);
    rudder.position.set(0, 2.8, fuselageLength / 2 - 1.4);
    g.add(rudder);

    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 0.25), glass);
    cockpit.position.set(0, 0.8, -fuselageLength / 2 + 0.5);
    g.add(cockpit);

    const windowMat = new THREE.MeshBasicMaterial({ color: 0x163d5f, transparent: true, opacity: 0.78 });
    [-1, 1].forEach(side => {
      for (let i = 0; i < 9; i++) {
        const window = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.34), windowMat);
        window.position.set(side * (fuselageRadius + 0.04), 0.72, -fuselageLength * 0.32 + i * (fuselageLength * 0.52 / 8));
        g.add(window);
      }
    });

    if (isCargo) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(fuselageRadius * 1.7, 0.06, 3.6), dark);
      door.position.set(0, -fuselageRadius - 0.04, -fuselageLength * 0.2);
      g.add(door);
    }

    const fakeProp = new THREE.Object3D();
    g.add(fakeProp);
    g.userData.prop = fakeProp;

    addWheels(g, 1.55);
    addShadow(g, 12 * scale);
    g.scale.setScalar(scale);
    return g;
  }

  function createF22Like(type) {
    const g = new THREE.Group();
    const mainColor = type.color || 0x8b959d;
    const accentColor = type.accent || 0x303842;
    const grey = new THREE.MeshLambertMaterial({ color: mainColor, side: THREE.DoubleSide });
    const panelGrey = new THREE.MeshLambertMaterial({ color: 0x69747c, side: THREE.DoubleSide });
    const darkGrey = new THREE.MeshLambertMaterial({ color: 0x48515a });
    const edgeDark = new THREE.MeshLambertMaterial({ color: accentColor });
    const glass = new THREE.MeshBasicMaterial({ color: 0x183b59, transparent: true, opacity: 0.8 });
    const scale = type.scale || 1.05;

    function planform(points, material, y) {
      const shape = new THREE.Shape();
      shape.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
      shape.closePath();
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = y;
      return mesh;
    }

    const mainPlanform = planform([
      [0, -12.2],
      [-3.2, -7.8],
      [-12.8, -3.0],
      [-8.4, 2.2],
      [-2.6, 1.2],
      [-1.5, 7.9],
      [0, 8.9],
      [1.5, 7.9],
      [2.6, 1.2],
      [8.4, 2.2],
      [12.8, -3.0],
      [3.2, -7.8]
    ], grey, 0.18);
    g.add(mainPlanform);

    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.95, 15.8), grey);
    fuselage.position.set(0, 0.35, -0.9);
    g.add(fuselage);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.55, 10.8), panelGrey);
    spine.position.set(0, 0.92, -1.8);
    g.add(spine);

    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 1.36, 5.2, 4), grey);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.z = Math.PI / 4;
    nose.position.set(0, 0.36, -11.1);
    g.add(nose);

    const noseCap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.32, 0.46), edgeDark);
    noseCap.position.set(0, 0.36, -13.82);
    g.add(noseCap);

    const leftChine = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.18, 1.15), panelGrey);
    leftChine.position.set(-3.15, 0.36, -6.6);
    leftChine.rotation.y = -0.28;
    g.add(leftChine);

    const rightChine = leftChine.clone();
    rightChine.position.x = 3.15;
    rightChine.rotation.y = 0.28;
    g.add(rightChine);

    [-1, 1].forEach(side => {
      const intake = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.65, 3.6), edgeDark);
      intake.position.set(side * 2.15, 0.18, -4.8);
      intake.rotation.y = side * 0.16;
      g.add(intake);

      const stabilizer = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.16, 2.1), grey);
      stabilizer.position.set(side * 4.8, 0.15, 5.9);
      stabilizer.rotation.y = side * 0.22;
      g.add(stabilizer);

      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 4.1, 2.6), darkGrey);
      tail.position.set(side * 2.4, 2.0, 5.6);
      tail.rotation.z = side * 0.38;
      tail.rotation.y = side * 0.12;
      g.add(tail);

      const exhaust = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.72, 1.4), edgeDark);
      exhaust.position.set(side * 0.85, 0.1, 8.2);
      g.add(exhaust);
    });

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 8), glass);
    canopy.scale.set(0.86, 0.26, 1.7);
    canopy.position.set(0, 1.17, -5.6);
    g.add(canopy);

    const bayLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 4.5), edgeDark);
    bayLine.position.set(0, -0.14, -0.2);
    g.add(bayLine);

    const noseSensor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.42), edgeDark);
    noseSensor.position.set(0, 0.7, -13.55);
    g.add(noseSensor);

    if (type.weapons) {
      const missileMat = new THREE.MeshLambertMaterial({ color: 0xe8edf0 });
      const tipMat = new THREE.MeshLambertMaterial({ color: 0xd13b32 });
      [-1, 1].forEach(side => {
        [4.8, 7.1].forEach((xBase, index) => {
          const missile = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 3.1, 12), missileMat);
          missile.rotation.x = Math.PI / 2;
          missile.position.set(side * xBase, -0.18, -2.6 + index * 2.7);
          g.add(missile);

          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.52, 12), tipMat);
          tip.rotation.x = -Math.PI / 2;
          tip.position.set(side * xBase, -0.18, -4.42 + index * 2.7);
          g.add(tip);
        });

        const rail = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.12, 0.28), edgeDark);
        rail.position.set(side * 5.7, -0.28, -1.28);
        rail.rotation.y = side * 0.08;
        g.add(rail);
      });

      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.8, 10), edgeDark);
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(0.72, 0.52, -12.8);
      g.add(cannon);
    }

    const fakeProp = new THREE.Object3D();
    g.add(fakeProp);
    g.userData.prop = fakeProp;

    addShadow(g, 10 * scale);
    g.scale.setScalar(scale);
    return g;
  }

  function addWheels(group, size) {
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x151515 });
    const wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * size, 0.45 * size, 0.35 * size, 14), wheelMat);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(-1.2 * size, -1.25 * size, -1);
    group.add(wheel1);

    const wheel2 = wheel1.clone();
    wheel2.position.x = 1.2 * size;
    group.add(wheel2);

    const wheel3 = wheel1.clone();
    wheel3.scale.set(0.7, 0.7, 0.7);
    wheel3.position.set(0, -1.18 * size, -6.1);
    group.add(wheel3);
  }

  const aircraft = {
    throttle: 0,
    health: 100,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    pitch: 0,
    yaw: Math.PI,
    roll: 0,
    angularPitch: 0,
    angularYaw: 0,
    angularRoll: 0,
    aoa: 0,
    stallPressure: 0,
    stall: false,
    crashed: false,
    exploded: false,
    onGround: true
  };

  function resetToAirport(a) {
    aircraft.throttle = 0;
    aircraft.health = 100;
    aircraft.position.set(a.x, 3, a.z);
    aircraft.velocity.set(0, 0, 0);
    aircraft.pitch = 0;
    aircraft.yaw = Math.PI - THREE.Math.degToRad(a.heading);
    aircraft.roll = 0;
    aircraft.angularPitch = 0;
    aircraft.angularYaw = 0;
    aircraft.angularRoll = 0;
    aircraft.aoa = 0;
    aircraft.stallPressure = 0;
    aircraft.stall = false;
    aircraft.crashed = false;
    aircraft.exploded = false;
    aircraft.onGround = true;
    lastLanding = null;
    clearProjectiles();
    resetWeaponAmmo();
    plane.visible = true;
    syncPlane();
    resetCameraRig();
  }

  function setShopOpen(open) {
    shopOpen = open;
    document.body.classList.toggle("shop-open", shopOpen);
    renderShop();
  }

  function setHudHidden(hidden) {
    hudHidden = hidden;
    document.body.classList.toggle("hud-hidden", hudHidden);
    const button = el("hudToggle");
    if (button) button.textContent = hudHidden ? "Mostrar info" : "Esconder info";
  }

  function careerData() {
    return {
      playerName,
      money,
      completed,
      aircraftId: aircraftType.id,
      ownedAircraft: Array.from(ownedAircraft)
    };
  }

  function saveCareer() {
    if (!playerName || gameMode !== "career") return;
    try {
      localStorage.setItem(careerKey(playerName), JSON.stringify(careerData()));
    } catch (error) {
      el("message").innerHTML = "Nao consegui salvar a carreira neste navegador.";
    }
  }

  function loadCareer(name) {
    try {
      const saved = localStorage.getItem(careerKey(name));
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  }

  function applyCareerSave(save) {
    money = Math.max(0, Number(save && save.money) || 0);
    completed = Math.max(0, Number(save && save.completed) || 0);
    const savedOwned = Array.isArray(save && save.ownedAircraft) ? save.ownedAircraft : [AIRCRAFT_TYPES[0].id];
    ownedAircraft = new Set(savedOwned.filter(id => AIRCRAFT_TYPES.some(type => type.id === id)));
    ownedAircraft.add(AIRCRAFT_TYPES[0].id);
    const savedIndex = AIRCRAFT_TYPES.findIndex(type => type.id === (save && save.aircraftId));
    aircraftIndex = savedIndex >= 0 && ownedAircraft.has(AIRCRAFT_TYPES[savedIndex].id) ? savedIndex : 0;
    aircraftType = AIRCRAFT_TYPES[aircraftIndex];
    makePlaneModel(aircraftType);
  }

  function updateProfileUi() {
    const logged = !!playerName;
    const freeButton = el("startFree");
    const careerButton = el("startCareer");
    const nameInput = el("pilotName");
    if (freeButton) freeButton.disabled = !logged;
    if (careerButton) careerButton.disabled = !logged;
    if (nameInput && logged) nameInput.value = playerName;
    el("playerLabel").textContent = logged ? playerName : "--";
    const status = el("profileStatus");
    if (status) {
      status.textContent = logged
        ? "Piloto " + playerName + " carregado. A carreira salva automaticamente."
        : "Seu modo carreira sera salvo neste navegador.";
    }
  }

  function loginPilot() {
    const input = el("pilotName");
    const raw = input ? input.value.trim() : "";
    playerName = raw || "Piloto";
    localStorage.setItem("flight-simulator-ofc-last-pilot", playerName);
    updateProfileUi();
    const saved = loadCareer(playerName);
    el("message").innerHTML = saved
      ? "Carreira de " + playerName + " encontrada. Entre no modo carreira para continuar."
      : "Piloto " + playerName + " pronto. Comece uma carreira ou jogue livre.";
  }

  function switchAircraft(index) {
    const target = AIRCRAFT_TYPES[index];
    if (!target) return;

    if (!ownsAircraft(target)) {
      el("message").innerHTML = "Esse avião ainda não foi comprado no modo carreira.";
      setShopOpen(true);
      return;
    }

    const currentAirport = activeMission ? activeMission.from : AIRPORTS[0];
    aircraftIndex = index;
    aircraftType = AIRCRAFT_TYPES[aircraftIndex];
    makePlaneModel(aircraftType);
    resetToAirport(currentAirport);
    rebuildHitboxHelpers();
    renderShop();
    saveCareer();
    el("message").innerHTML = "Aeronave trocada para: " + aircraftType.name;
  }

  function forwardVector() {
    return new THREE.Vector3(0, 0, -1)
      .applyEuler(new THREE.Euler(aircraft.pitch, aircraft.yaw, aircraft.roll, "YXZ"))
      .normalize();
  }

  function headingDegrees() {
    const fwd = forwardVector();
    return (THREE.Math.radToDeg(Math.atan2(fwd.x, -fwd.z)) + 360) % 360;
  }

  function bearingBetween(x1, z1, x2, z2) {
    return (THREE.Math.radToDeg(Math.atan2(x2 - x1, -(z2 - z1))) + 360) % 360;
  }

  function runwayHeadingError(a) {
    const heading = headingDegrees();
    const oneWay = Math.abs(wrapDegrees(heading - a.heading));
    const otherWay = Math.abs(wrapDegrees(heading - ((a.heading + 180) % 360)));
    return Math.min(oneWay, otherWay);
  }

  function runwayContact() {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const a of AIRPORTS) {
      const distance = dist2(aircraft.position.x, aircraft.position.z, a.x, a.z);
      if (distance < nearestDistance) {
        nearest = a;
        nearestDistance = distance;
      }

      if (isInRunwayZone(a, aircraft.position.x, aircraft.position.z, 90)) {
        return { airport: a, distance, onRunway: true, alignment: runwayHeadingError(a) };
      }
    }

    return {
      airport: nearest,
      distance: nearestDistance,
      onRunway: false,
      alignment: nearest ? runwayHeadingError(nearest) : 180
    };
  }

  function approachCourseForAirport(a) {
    const inbound = bearingBetween(aircraft.position.x, aircraft.position.z, a.x, a.z);
    const courseA = a.heading;
    const courseB = (a.heading + 180) % 360;
    return Math.abs(wrapDegrees(inbound - courseA)) <= Math.abs(wrapDegrees(inbound - courseB)) ? courseA : courseB;
  }

  function runwayApproachData(a) {
    const course = approachCourseForAirport(a);
    const local = airportLocalPosition(a, aircraft.position.x, aircraft.position.z);
    const reverse = Math.abs(wrapDegrees(course - a.heading)) > 90;
    return {
      course,
      lateral: reverse ? -local.x : local.x,
      along: reverse ? -local.z : local.z
    };
  }

  function approachRouteForAirport(a) {
    const course = approachCourseForAirport(a);
    const angle = THREE.Math.degToRad(course);
    const leadDistance = Math.max(2800, a.length * 1.65);
    const dirX = Math.sin(angle);
    const dirZ = -Math.cos(angle);
    return {
      course,
      x: a.x - dirX * leadDistance,
      z: a.z - dirZ * leadDistance,
      leadDistance
    };
  }

  function recordLanding(info) {
    let score = 100;

    score -= clamp(info.verticalImpact - 1.4, 0, 10) * 8.5;
    score -= clamp(info.speedKmh - aircraftType.landingMax, 0, 360) * 0.12;
    score -= info.bank * 22;
    score -= info.nose * 16;
    score -= info.alignment > 35 ? clamp(info.alignment - 35, 0, 90) * 0.35 : 0;
    if (!info.onRunway) score -= 22;
    if (info.hardHit) score -= 20;

    score = Math.round(clamp(score, 0, 100));

    let label = "Pouso suave";
    let className = "good";
    if (score < 38) {
      label = info.onRunway ? "Pouso pesado" : "Fora da pista";
      className = "bad";
    } else if (score < 70) {
      label = info.onRunway ? "Pouso ok" : "Pouso fora da pista";
      className = "warn";
    } else if (score < 90) {
      label = "Bom pouso";
    }

    lastLanding = {
      score,
      label,
      className,
      bonus: info.onRunway ? Math.round(score * 12) : Math.round(score * 4),
      airportId: info.airport ? info.airport.id : null,
      text: label + " (" + score + "/100)"
    };

    el("message").innerHTML = lastLanding.text + (info.onRunway ? ". Boa!" : ". Tente alinhar na pista.");
  }

  function handleObjectCollisions(speedKmh) {
    const planeRadius = aircraftType.hitboxRadius;
    const colliders = allColliders();

    for (const collider of colliders) {
      const hit =
        Math.abs(aircraft.position.x - collider.x) <= collider.halfX + planeRadius &&
        Math.abs(aircraft.position.y - collider.y) <= collider.halfY + planeRadius &&
        Math.abs(aircraft.position.z - collider.z) <= collider.halfZ + planeRadius;

      if (!hit) continue;

      const impactSpeed = Math.max(speedKmh, aircraft.velocity.length() * 3.6);
      const damage = Math.round((18 + impactSpeed * 0.18) * collider.damage);
      aircraft.health -= damage;
      aircraft.crashed = true;
      aircraft.position.addScaledVector(aircraft.velocity.clone().normalize(), -8);
      aircraft.position.y = Math.max(3, aircraft.position.y);
      aircraft.velocity.multiplyScalar(-0.06);
      aircraft.angularPitch = 0;
      aircraft.angularRoll = 0;
      aircraft.angularYaw = 0;

      el("message").innerHTML = "Colisão com " + collider.label + ". Aperte R para resetar.";

      if (aircraft.health <= 0 || impactSpeed > 130 || collider.label === "montanha") {
        explodePlane();
      }

      return true;
    }

    return false;
  }

  function updatePhysics(dt) {
    if (aircraft.crashed) {
      aircraft.velocity.multiplyScalar(Math.pow(0.18, dt));
      aircraft.throttle *= Math.pow(0.06, dt);
      syncPlane();
      return;
    }

    if (down("w")) aircraft.throttle += 0.82 * dt;
    if (down("s")) aircraft.throttle -= 0.92 * dt;
    aircraft.throttle = clamp(aircraft.throttle, 0, 1);

    const elevator = (down("arrowup") ? 1 : 0) - (down("arrowdown") ? 1 : 0);
    const aileron = (down("arrowleft") ? 1 : 0) - (down("arrowright") ? 1 : 0);
    const rudder = (down("a") ? 1 : 0) - (down("d") ? 1 : 0);

    const fwd = forwardVector();
    const speed = aircraft.velocity.length();
    const speedKmh = speed * 3.6;
    const horizontalSpeed = Math.hypot(aircraft.velocity.x, aircraft.velocity.z);

    const boost = down("shift") ? aircraftType.boost : 1;
    const maxAllowedSpeed = maxSpeedMS() * (down("shift") ? 1.08 : 1);
    const speedFraction = speed / Math.max(1, maxAllowedSpeed);
    const powerAvailable = clamp(1 - Math.pow(clamp(speedFraction, 0, 1.25), 3) * 0.76, 0.08, 1);
    const thrustAccel = aircraft.throttle * aircraftType.thrust * boost * powerAvailable;
    aircraft.velocity.addScaledVector(fwd, thrustAccel * dt);

    if (!aircraft.onGround && fwd.y > 0.05) {
      const climbBleed = fwd.y * (5.5 + speed * 0.09) * (1 + aircraft.stallPressure * 0.6);
      aircraft.velocity.addScaledVector(fwd, -climbBleed * dt);
    }

    const overspeed = Math.max(0, speed / maxAllowedSpeed - 0.97);
    const overspeedDrag = overspeed * overspeed * speed * 2.6;
    const inducedDrag = Math.max(0, aircraft.pitch) * Math.max(0, aircraft.pitch) * speed * 0.18;
    const drag = aircraftType.drag * speed * speed + 0.022 * speed + overspeedDrag + inducedDrag;
    if (speed > 0.01) {
      aircraft.velocity.addScaledVector(aircraft.velocity.clone().normalize(), -drag * dt);
    }
    if (speed > maxAllowedSpeed * 1.18 && fwd.y > -0.14) {
      aircraft.velocity.multiplyScalar(Math.pow(0.72, dt));
    }

    // Gravidade
    aircraft.velocity.y -= 9.81 * dt;

    const velDir = aircraft.velocity.clone().normalize();
    let aoa = Math.asin(clamp(fwd.y - velDir.y, -1, 1));
    if (speed < 8) aoa = aircraft.pitch;
    aircraft.aoa = aoa;

    const aoaDeg = THREE.Math.radToDeg(aoa);
    const absAoa = Math.abs(aoaDeg);

    // Stall por velocidade: cada aeronave tem seu limite mínimo antes de perder sustentação.
    const stallSpeedMS = aircraftType.stallSpeed / 3.6;
    const airspeedRatio = speed / stallSpeedMS;
    const belowStallSpeed = !aircraft.onGround && speed < stallSpeedMS;
    const nearStallSpeed = !aircraft.onGround && speed < stallSpeedMS * 1.18;
    const pullingHard = elevator > 0 || aircraft.pitch > 0.18;
    const hardAngle = absAoa > aircraftType.stallAngle && pullingHard;
    let stallDemand = 0;

    if (belowStallSpeed) {
      const speedDeficit = clamp((1 - airspeedRatio) / 0.42, 0, 1);
      stallDemand = 0.38 + speedDeficit * 0.62;
      if (pullingHard) stallDemand = clamp(stallDemand + 0.18, 0, 1);
    }

    if (nearStallSpeed && hardAngle) {
      const angleDemand = clamp((absAoa - aircraftType.stallAngle) / 18, 0, 1);
      stallDemand = Math.max(stallDemand, 0.32 + angleDemand * 0.48);
    }

    const stallResponse = stallDemand > aircraft.stallPressure ? 1.85 : 3.3;
    aircraft.stallPressure += (stallDemand - aircraft.stallPressure) * clamp(stallResponse * dt, 0, 1);
    aircraft.stall = aircraft.stallPressure > 0.68;

    const takeoffGate = aircraft.onGround
      ? clamp((speedKmh - aircraftType.takeoff * 0.98) / (aircraftType.takeoff * 0.18), 0, 1)
      : 1;
    const speedLift = clamp((horizontalSpeed - stallSpeedMS * 0.62) / (stallSpeedMS * 1.2), 0, 1.62);
    const angleLift = clamp(0.55 + aircraft.pitch * 1.25 + aoa * 0.95, -0.25, 1.55);
    const stallLiftPenalty = 1 - aircraft.stallPressure * 0.42;
    const liftAccel = speedLift * angleLift * aircraftType.lift * stallLiftPenalty * takeoffGate;

    aircraft.velocity.y += liftAccel * dt;
    if (aircraft.onGround && speedKmh < aircraftType.takeoff * 1.08) {
      aircraft.velocity.y = Math.min(aircraft.velocity.y, 0);
      if (speedKmh < aircraftType.takeoff * 0.92) aircraft.pitch = Math.min(aircraft.pitch, 0.12);
    }

    const authorityBase = clamp(horizontalSpeed / (stallSpeedMS * 0.9), 0.18, 1.55);
    const stallControlPenalty = 1 - aircraft.stallPressure * 0.34;
    const authority = authorityBase * aircraftType.control * stallControlPenalty;
    const stability = aircraftType.stability || 1;
    const handling = authority / stability;

    aircraft.angularPitch += elevator * 0.96 * handling * dt;
    aircraft.angularRoll += aileron * 1.42 * handling * dt;
    aircraft.angularYaw += rudder * 0.55 * handling * dt;

    aircraft.angularYaw += Math.sin(aircraft.roll) * 0.18 * handling * dt;

    const autoLevel = clamp((stability - 1) * 0.08, 0, 0.07);
    if (Math.abs(aileron) < 0.01) aircraft.angularRoll -= aircraft.roll * autoLevel * dt;
    if (Math.abs(elevator) < 0.01 && !aircraft.onGround) aircraft.angularPitch -= aircraft.pitch * autoLevel * 0.45 * dt;

    if (aircraft.stall) {
      aircraft.angularPitch -= 0.48 * dt;
      aircraft.angularRoll += Math.sin(performance.now() * 0.006) * 0.45 * dt;
      aircraft.angularYaw += Math.cos(performance.now() * 0.005) * 0.18 * dt;
    }

    aircraft.angularPitch *= Math.pow(0.1 / clamp(stability, 0.75, 1.8), dt);
    aircraft.angularRoll *= Math.pow(0.09 / clamp(stability, 0.75, 1.8), dt);
    aircraft.angularYaw *= Math.pow(0.16 / clamp(stability, 0.75, 1.8), dt);

    aircraft.pitch += aircraft.angularPitch * dt;
    aircraft.roll += aircraft.angularRoll * dt;
    aircraft.yaw += aircraft.angularYaw * dt;

    aircraft.pitch = clamp(aircraft.pitch, -0.9, 0.9);
    aircraft.roll = clamp(aircraft.roll, -1.55, 1.55);

    aircraft.position.addScaledVector(aircraft.velocity, dt);

    if (!handleObjectCollisions(speedKmh)) {
      handleGroundCollision(horizontalSpeed, speedKmh);
    }
    syncPlane();
  }

  function handleGroundCollision(horizontalSpeed, speedKmh) {
    if (aircraft.position.y >= 3) {
      aircraft.onGround = false;
      return;
    }

    const wasAirborne = !aircraft.onGround;
    const verticalImpact = Math.abs(aircraft.velocity.y);
    const bank = Math.abs(aircraft.roll);
    const nose = Math.abs(aircraft.pitch);
    const contact = runwayContact();

    const tooFast = speedKmh > aircraftType.landingMax;
    const unstableTouch = bank > 1.18 || nose > 0.95;
    const hardHit = verticalImpact > 11.5 || unstableTouch || (tooFast && (verticalImpact > 4.2 || !contact.onRunway));

    if (hardHit) {
      const damage = Math.round(verticalImpact * 7 + Math.max(0, speedKmh - aircraftType.landingMax) * 0.16 + bank * 28 + nose * 30);
      aircraft.health -= damage;
      if (wasAirborne) {
        recordLanding({
          airport: contact.airport,
          onRunway: contact.onRunway,
          alignment: contact.alignment,
          verticalImpact,
          speedKmh,
          bank,
          nose,
          hardHit: true
        });
      }

      aircraft.position.y = 3;
      aircraft.velocity.y = 0;
      aircraft.velocity.x *= 0.55;
      aircraft.velocity.z *= 0.55;
      aircraft.pitch *= 0.55;
      aircraft.roll *= 0.42;
      aircraft.onGround = true;
      aircraft.health = Math.max(5, aircraft.health);

      if (damage > 52 || verticalImpact > 18 || bank > 1.45 || nose > 1.18) {
        aircraft.crashed = true;
        aircraft.velocity.multiplyScalar(0.18);
        el("message").innerHTML = "Pouso muito pesado. O avião quebrou, mas não explodiu. Aperte R.";
      }
      return;
    }

    aircraft.position.y = 3;
    aircraft.velocity.y = 0;
    aircraft.onGround = true;

    if (wasAirborne) {
      recordLanding({
        airport: contact.airport,
        onRunway: contact.onRunway,
        alignment: contact.alignment,
        verticalImpact,
        speedKmh,
        bank,
        nose,
        hardHit: false
      });
    }

    const braking = down("s") ? 0.91 : 0.965;
    const friction = aircraft.throttle > 0.05 ? 0.992 : braking;
    aircraft.velocity.x *= friction;
    aircraft.velocity.z *= friction;

    aircraft.pitch *= 0.985;
    aircraft.roll *= 0.94;

    const rudder = (down("a") ? 1 : 0) - (down("d") ? 1 : 0);
    aircraft.yaw += rudder * clamp(horizontalSpeed / 30, 0.15, 1) * 0.024;
  }

  function explodePlane() {
    if (aircraft.exploded) return;

    aircraft.health = 0;
    aircraft.crashed = true;
    aircraft.exploded = true;
    aircraft.position.y = Math.max(3, aircraft.position.y);
    plane.visible = false;

    createExplosion(aircraft.position.clone());
    el("message").innerHTML = "BOOM! O avião explodiu. Aperte R para resetar.";
  }

  function createExplosion(position) {
    const group = new THREE.Group();
    const count = quality.particles;
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff7a00, transparent: true, opacity: 0.95 });
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.55 });

    for (let i = 0; i < count; i++) {
      const mat = i % 3 === 0 ? smokeMat : fireMat;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 10, 8, 6), mat);
      sphere.position.copy(position);
      sphere.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 85,
        28 + Math.random() * 95,
        (Math.random() - 0.5) * 85
      );
      sphere.userData.life = 1.3 + Math.random() * 1.2;
      sphere.userData.maxLife = sphere.userData.life;
      group.add(sphere);
    }

    scene.add(group);
    explosions.push(group);
  }

  function updateExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i--) {
      const group = explosions[i];
      let alive = false;

      group.children.forEach(p => {
        p.userData.life -= dt;
        if (p.userData.life > 0) {
          alive = true;
          p.userData.vel.y -= 35 * dt;
          p.position.addScaledVector(p.userData.vel, dt);
          const t = p.userData.life / p.userData.maxLife;
          p.material.opacity = t;
          p.scale.multiplyScalar(1 + dt * 1.25);
        }
      });

      if (!alive) {
        scene.remove(group);
        explosions.splice(i, 1);
      }
    }
  }

  function removeProjectile(index) {
    if (!projectiles[index]) return;
    scene.remove(projectiles[index]);
    projectiles.splice(index, 1);
  }

  function damageEnemyTarget(target, amount) {
    if (!target || !target.alive || !activeMission || activeMission.completed) return;

    target.health -= amount;
    if (target.health > 0) {
      el("message").innerHTML = "Acertou o rival. Continue atacando.";
      return;
    }

    target.alive = false;
    target.object.visible = false;
    if (target.object.userData.shadow) target.object.userData.shadow.visible = false;
    activeMission.enemiesDown++;
    createExplosion(target.object.position.clone());

    if (activeMission.enemiesDown >= activeMission.targets.length) {
      completeActiveMission("PvP simulado vencido!");
    } else {
      el("message").innerHTML =
        "Rival derrubado: " + activeMission.enemiesDown + "/" + activeMission.targets.length + ". Siga o radar.";
    }
  }

  function fireSelectedWeapon() {
    fireWeapon(selectedWeapon);
  }

  function fireWeapon(kind) {
    if (!aircraftType.weapons || aircraft.crashed || aircraft.exploded) {
      el("message").innerHTML = "Este avião não tem armas.";
      return;
    }

    if (weaponCooldown > 0) return;

    if (kind === "missile" && missileAmmo <= 0) {
      selectedWeapon = "cannon";
      el("message").innerHTML = "Sem mísseis. Arma trocada para canhão.";
      return;
    }

    const fwd = forwardVector();
    const isMissile = kind === "missile";
    const baseEuler = new THREE.Euler(aircraft.pitch, aircraft.yaw, aircraft.roll, "YXZ");
    const right = new THREE.Vector3(1, 0, 0).applyEuler(baseEuler).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyEuler(baseEuler).normalize();
    const muzzle = aircraft.position.clone()
      .addScaledVector(fwd, 18)
      .addScaledVector(right, 0.72)
      .addScaledVector(up, 0.12);

    function addShot(mesh, direction, position, speed, life, damage, radius) {
      mesh.quaternion.setFromUnitVectors(Y_AXIS, direction.clone().normalize());
      mesh.position.copy(position);
      mesh.userData.vel = direction.clone().multiplyScalar(speed).add(aircraft.velocity.clone());
      mesh.userData.life = life;
      mesh.userData.maxLife = life;
      mesh.userData.kind = kind;
      mesh.userData.damage = damage;
      mesh.userData.radius = radius;
      scene.add(mesh);
      projectiles.push(mesh);
    }

    if (isMissile) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 4.2, 12),
        new THREE.MeshBasicMaterial({ color: 0xffdf64 })
      );
      addShot(mesh, fwd, muzzle, 540, 5.2, 2, 155);
      missileAmmo--;
      weaponCooldown = 0.72;
      el("message").innerHTML = "Míssil disparado. Restam " + missileAmmo + ".";
      return;
    }

    if (cannonAmmo <= 0) {
      el("message").innerHTML = "Canhão sem munição. Resete para recarregar.";
      return;
    }

    const burst = Math.min(10, cannonAmmo);
    for (let i = 0; i < burst; i++) {
      const yawSpread = ((i % 5) - 2) * 0.0035 + (Math.random() - 0.5) * 0.002;
      const pitchSpread = (Math.floor(i / 5) - 0.5) * 0.003 + (Math.random() - 0.5) * 0.002;
      const direction = new THREE.Vector3(0, 0, -1)
        .applyEuler(new THREE.Euler(aircraft.pitch + pitchSpread, aircraft.yaw + yawSpread, aircraft.roll, "YXZ"))
        .normalize();
      const tracer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 6.2, 8),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xffe18a : 0x7ad7ff,
          transparent: true,
          opacity: 0.96
        })
      );
      const position = muzzle.clone()
        .addScaledVector(right, (i % 2 === 0 ? -0.12 : 0.12))
        .addScaledVector(direction, i * 2.2);
      addShot(tracer, direction, position, 860 + i * 8, 1.55, 0.34, 48);
    }

    cannonAmmo -= burst;
    weaponCooldown = 0.09;
    el("message").innerHTML = "Rajada do canhão: " + cannonAmmo + " balas restantes.";
  }

  function updateProjectiles(dt) {
    weaponCooldown = Math.max(0, weaponCooldown - dt);

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const shot = projectiles[i];
      shot.userData.life -= dt;
      shot.position.addScaledVector(shot.userData.vel, dt);

      if (shot.userData.kind === "missile") {
        shot.rotation.z += dt * 8;
      } else if (shot.userData.kind === "cannon" && shot.material) {
        shot.material.opacity = clamp(shot.userData.life / shot.userData.maxLife, 0.18, 0.96);
      }

      let hit = false;
      if (activeMission && activeMission.data.challenge === "combat" && !activeMission.completed) {
        for (const target of activeMission.targets) {
          if (!target.alive) continue;
          if (shot.position.distanceTo(target.object.position) < target.radius + shot.userData.radius) {
            damageEnemyTarget(target, shot.userData.damage);
            hit = true;
            break;
          }
        }
      }

      if (hit || shot.userData.life <= 0) {
        removeProjectile(i);
      }
    }
  }

  function syncPlane() {
    plane.position.copy(aircraft.position);
    plane.rotation.order = "YXZ";
    plane.rotation.y = aircraft.yaw;
    plane.rotation.x = aircraft.pitch;
    plane.rotation.z = aircraft.roll;

    if (plane.userData.props) {
      plane.userData.props.forEach(prop => {
        prop.rotation.z += 0.18 + aircraft.throttle * 1.7;
      });
    } else if (plane.userData.prop) {
      plane.userData.prop.rotation.z += 0.18 + aircraft.throttle * 1.7;
    }

    const shadow = plane.userData.shadow;
    if (shadow) {
      shadow.position.x = aircraft.position.x;
      shadow.position.z = aircraft.position.z;
      shadow.material.opacity = clamp(0.23 - aircraft.position.y / 900, 0.02, 0.19);
      shadow.scale.setScalar(clamp(1 + aircraft.position.y / 180, 1, 10));
      shadow.visible = plane.visible;
    }

    if (planeHitboxHelper) {
      planeHitboxHelper.position.copy(aircraft.position);
      planeHitboxHelper.visible = showHitboxes && plane.visible;
    }
  }

  const speedKmh = () => aircraft.velocity.length() * 3.6;
  const altitude = () => Math.max(0, aircraft.position.y - 3);

  const marker = createMarker();
  scene.add(marker);
  marker.visible = false;

  function createMarker() {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(90, 5, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    ring.rotation.x = Math.PI / 2;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(38, 135, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd000, transparent: true, opacity: 0.55 })
    );
    cone.position.y = 110;
    group.add(ring, cone);
    return group;
  }

  function missionCoursePoint(origin, course, forward, side, y) {
    const angle = THREE.Math.degToRad(course);
    const dirX = Math.sin(angle);
    const dirZ = -Math.cos(angle);
    const rightX = Math.cos(angle);
    const rightZ = Math.sin(angle);
    return new THREE.Vector3(
      origin.x + dirX * forward + rightX * side,
      y,
      origin.z + dirZ * forward + rightZ * side
    );
  }

  function createRingTarget(position, course, index) {
    const group = new THREE.Group();
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x66caff, transparent: true, opacity: 0.86 });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffd84d, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(108, 6, 12, 72), ringMat);
    const core = new THREE.Mesh(new THREE.TorusGeometry(26, 3, 8, 32), coreMat);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 8), coreMat);

    ring.rotation.y = THREE.Math.degToRad(course);
    core.rotation.y = THREE.Math.degToRad(course);
    group.add(ring, core, beacon);
    group.position.copy(position);
    group.userData.missionKind = "ring";
    group.userData.baseScale = 1;

    scene.add(group);
    missionObjects.push(group);

    return {
      kind: "ring",
      object: group,
      radius: 118,
      index,
      passed: false
    };
  }

  function createEnemyTarget(position, course, index) {
    const enemy = createF22Like({
      id: "rival",
      color: 0x5f6972,
      accent: 0xc53b32,
      scale: 0.82,
      model: "fighter"
    });

    enemy.position.copy(position);
    enemy.rotation.order = "YXZ";
    enemy.rotation.y = THREE.Math.degToRad(course + 180 + index * 7);
    enemy.userData.missionKind = "enemy";
    enemy.userData.base = position.clone();
    enemy.userData.phase = index * 1.37;
    enemy.userData.lastPosition = position.clone();

    scene.add(enemy);
    missionObjects.push(enemy);

    const target = {
      kind: "enemy",
      object: enemy,
      radius: 145,
      index,
      health: 2,
      alive: true
    };
    enemy.userData.targetRef = target;
    return target;
  }

  function buildMissionChallenge(state) {
    state.targets = [];
    state.targetIndex = 0;
    state.enemiesDown = 0;

    if (!state.data.challenge) return;

    const origin = state.from;
    const course = state.data.course || origin.heading;

    if (state.data.challenge === "rings") {
      state.targets = state.data.rings.map((ring, index) =>
        createRingTarget(missionCoursePoint(origin, course, ring.forward, ring.side, ring.y), course, index)
      );
      return;
    }

    if (state.data.challenge === "combat") {
      const count = state.data.enemies || 3;
      for (let i = 0; i < count; i++) {
        const side = (i - (count - 1) / 2) * 430 + (i % 2 === 0 ? -220 : 220);
        const forward = 2100 + i * 640;
        const y = 330 + (i % 3) * 105;
        state.targets.push(createEnemyTarget(missionCoursePoint(origin, course, forward, side, y), course, i));
      }
    }
  }

  function activeMissionTarget() {
    if (!activeMission || activeMission.completed || !activeMission.data.challenge) return null;

    if (activeMission.data.challenge === "rings") {
      return activeMission.targets[activeMission.targetIndex] || null;
    }

    if (activeMission.data.challenge === "combat") {
      return activeMission.targets.find(target => target.alive) || null;
    }

    return null;
  }

  function updateMissionMarker() {
    const target = activeMissionTarget();
    if (!target) {
      marker.visible = false;
      return;
    }

    marker.visible = true;
    marker.position.copy(target.object.position);
    marker.position.y = Math.max(12, target.object.position.y);
  }

  function updateMissionObjects(dt) {
    if (!activeMission || !activeMission.data.challenge) return;

    const now = performance.now() * 0.001;

    activeMission.targets.forEach(target => {
      if (target.kind === "ring" && !target.passed) {
        const pulse = 1 + Math.sin(now * 3.2 + target.index) * 0.045;
        target.object.scale.setScalar(pulse);
        target.object.rotation.z += dt * 0.45;
      }

      if (target.kind === "enemy" && target.alive) {
        const enemy = target.object;
        const base = enemy.userData.base;
        const phase = enemy.userData.phase;
        enemy.userData.lastPosition.copy(enemy.position);
        enemy.position.set(
          base.x + Math.sin(now * 0.72 + phase) * 360,
          base.y + Math.sin(now * 1.18 + phase) * 72,
          base.z + Math.cos(now * 0.68 + phase) * 300
        );
        const move = enemy.position.clone().sub(enemy.userData.lastPosition);
        if (move.lengthSq() > 0.001) {
          enemy.rotation.y = Math.atan2(move.x, -move.z);
          enemy.rotation.z = clamp(-move.x * 0.006, -0.55, 0.55);
        }

        if (enemy.userData.shadow) {
          enemy.userData.shadow.position.x = enemy.position.x;
          enemy.userData.shadow.position.z = enemy.position.z;
          enemy.userData.shadow.material.opacity = clamp(0.17 - enemy.position.y / 1600, 0.015, 0.13);
          enemy.userData.shadow.scale.setScalar(clamp(1 + enemy.position.y / 240, 1.1, 7));
          enemy.userData.shadow.visible = enemy.visible;
        }
      }
    });
  }

  function completeActiveMission(extraText, bonus = 0) {
    if (!activeMission || activeMission.completed) return;

    const payout = activeMission.data.reward + bonus;
    activeMission.completed = true;
    completed++;
    if (gameMode !== "free") money += payout;
    marker.visible = false;
    clearMissionObjects();
    clearProjectiles();

    el("message").innerHTML =
      (extraText ? extraText + " " : "") +
      "Missão concluída! " + missionManifest(activeMission.data) + ". Recompensa " + fmtMoney(activeMission.data.reward) +
      (bonus ? " + bônus " + fmtMoney(bonus) : "") +
      ". Aperte N ou M para outra missão.";

    saveCareer();
    renderShop();
  }

  function startMission(index) {
    missionIndex = index;
    const mission = MISSIONS[missionIndex];
    if (!mission) return;

    if (!missionUnlocked(mission)) {
      el("message").innerHTML = mission.title + " bloqueada. Desbloqueie " + missionRequirementText(mission) + ".";
      setShopOpen(true);
      return;
    }

    let autoSelected = "";
    if (mission.challenge === "combat" && !currentIsCombatFighter()) {
      const fighterIndex = bestOwnedCombatFighterIndex();
      if (fighterIndex < 0) {
        el("message").innerHTML = mission.title + " bloqueada. Compre um dos 6 caças armados para liberar PvP.";
        setShopOpen(true);
        return;
      }

      aircraftIndex = fighterIndex;
      aircraftType = AIRCRAFT_TYPES[aircraftIndex];
      makePlaneModel(aircraftType);
      autoSelected = " Equipei automaticamente " + aircraftType.name + ".";
      renderShop();
    }

    clearMissionObjects();
    clearProjectiles();

    activeMission = {
      data: mission,
      from: airport(mission.from),
      to: airport(mission.to),
      boarded: false,
      airborne: false,
      completed: false,
      targets: [],
      targetIndex: 0,
      enemiesDown: 0
    };

    resetToAirport(activeMission.from);
    buildMissionChallenge(activeMission);
    if (mission.challenge) updateMissionMarker();
    else {
      marker.visible = true;
      marker.position.set(activeMission.to.x, 12, activeMission.to.z);
    }
    el("message").innerHTML = missionBrief(activeMission) + autoSelected + " Pare no terminal e decole quando estiver pronto.";
  }

  function nextMission() {
    for (let i = 1; i <= MISSIONS.length; i++) {
      const index = (missionIndex + i + MISSIONS.length) % MISSIONS.length;
      if (missionUnlocked(MISSIONS[index])) {
        startMission(index);
        return;
      }
    }
    el("message").innerHTML = "Nenhuma missão liberada ainda. Compre aviões melhores para abrir novos desafios.";
  }

  function randomMission() {
    const available = MISSIONS
      .map((mission, index) => ({ mission, index }))
      .filter(item => missionUnlocked(item.mission));

    if (!available.length) {
      el("message").innerHTML = "Nenhuma missão liberada ainda. Compre aviões melhores para abrir novos desafios.";
      return;
    }

    startMission(available[Math.floor(Math.random() * available.length)].index);
  }

  function updateMission(dt) {
    if (!activeMission) return;

    if (activeMission.data.challenge) {
      updateMissionObjects(dt);
      updateMissionMarker();
    }

    const distance = dist2(aircraft.position.x, aircraft.position.z, activeMission.to.x, activeMission.to.z);
    const fromDistance = dist2(aircraft.position.x, aircraft.position.z, activeMission.from.x, activeMission.from.z);

    if (!activeMission.boarded && aircraft.onGround && fromDistance < 420 && aircraft.throttle < 0.12) {
      activeMission.boarded = true;
      el("message").innerHTML = missionBrief(activeMission) + " Preparação concluída. Decole e siga o radar.";
    }

    if (activeMission.boarded && altitude() > 30) activeMission.airborne = true;

    if (activeMission.data.challenge === "rings" && activeMission.boarded && activeMission.airborne && !activeMission.completed) {
      const target = activeMissionTarget();
      if (target) {
        const distanceToRing = aircraft.position.distanceTo(target.object.position);
        if (distanceToRing < target.radius) {
          target.passed = true;
          target.object.visible = false;
          activeMission.targetIndex++;

          if (activeMission.targetIndex >= activeMission.targets.length) {
            completeActiveMission("Desafio de argolas concluído!");
          } else {
            el("message").innerHTML =
              "Argola " + activeMission.targetIndex + "/" + activeMission.targets.length + " concluída. Siga para a próxima.";
          }
        }
      }
      return;
    }

    if (activeMission.data.challenge === "combat" && activeMission.boarded && activeMission.airborne && !activeMission.completed) {
      if (activeMission.enemiesDown >= activeMission.targets.length) completeActiveMission("PvP simulado vencido!");
      return;
    }

    if (activeMission.data.challenge) return;

    if (
      activeMission.boarded &&
      activeMission.airborne &&
      distance < 300 &&
      aircraft.onGround &&
      speedKmh() < aircraftType.landingMax * 1.08 &&
      !aircraft.crashed &&
      !activeMission.completed
    ) {
      const landingBonus = lastLanding && lastLanding.airportId === activeMission.to.id ? lastLanding.bonus : 0;
      completeActiveMission("Pouso registrado.", landingBonus);
    }
  }

  function missionManifest(mission) {
    if (!mission) return "--";
    if (mission.challenge === "rings") return mission.rings.length + " argolas";
    if (mission.challenge === "combat") return mission.enemies + " rivais aéreos";
    if (mission.passengers) return mission.passengers + " passageiros";
    if (mission.cargo) return "Carga: " + mission.cargo;
    return mission.type || "voo livre";
  }

  function missionBrief(missionState) {
    const mission = missionState.data;
    if (mission.challenge) {
      return mission.title + ": " + missionManifest(mission) + " saindo de " + missionState.from.name + ".";
    }
    return mission.title + ": " + missionManifest(mission) + " de " + missionState.from.name + " para " + missionState.to.name + ".";
  }

  function startGame(mode) {
    if (!playerName) loginPilot();

    gameMode = mode;
    gameStarted = true;
    cameraMode = 0;
    keys = {};
    pressed = {};
    activeMission = null;
    missionIndex = -1;
    completed = 0;
    money = 0;
    marker.visible = false;
    lastLanding = null;
    clearMissionObjects();
    clearProjectiles();

    if (gameMode === "free") {
      ownedAircraft = new Set(AIRCRAFT_TYPES.map(type => type.id));
      aircraftIndex = 0;
      aircraftType = AIRCRAFT_TYPES[0];
      makePlaneModel(aircraftType);
    } else {
      const saved = loadCareer(playerName);
      if (saved) {
        applyCareerSave(saved);
      } else {
        ownedAircraft = new Set([AIRCRAFT_TYPES[0].id]);
        aircraftIndex = 0;
        aircraftType = AIRCRAFT_TYPES[0];
        makePlaneModel(aircraftType);
      }
    }

    resetToAirport(AIRPORTS[0]);
    resetCameraRig();
    setShopOpen(false);
    renderShop();

    const startScreen = el("startScreen");
    if (startScreen) startScreen.style.display = "none";

    el("message").innerHTML = gameMode === "free"
      ? "Modo livre iniciado: todos os aviões estão liberados."
      : "Modo carreira iniciado para " + playerName + ". Progresso salvo automaticamente.";
    saveCareer();
  }

  function buyAircraft(index) {
    const type = AIRCRAFT_TYPES[index];
    if (!type) return;

    if (gameMode === "free") {
      switchAircraft(index);
      return;
    }

    if (ownedAircraft.has(type.id)) {
      switchAircraft(index);
      return;
    }

    if (money < type.price) {
      el("message").innerHTML = "Dinheiro insuficiente para comprar " + type.name + ". Faça mais missões.";
      renderShop();
      return;
    }

    money -= type.price;
    ownedAircraft.add(type.id);
    switchAircraft(index);
    el("message").innerHTML = "Compra feita: " + type.name + ". Saldo: " + fmtMoney(money) + ".";
    saveCareer();
    renderShop();
  }

  function renderShop() {
    const list = el("shopList");
    if (!list) return;

    const mode = el("shopMode");
    const bank = el("shopMoney");
    if (mode) {
      mode.textContent = gameMode === "free"
        ? "Modo livre: todos os aviões são grátis."
        : gameMode === "career"
          ? "Modo carreira: compre aviões com dinheiro das missões."
          : "Escolha um modo para começar.";
    }
    if (bank) bank.textContent = fmtGameMoney();

    list.innerHTML = "";

    AIRCRAFT_TYPES.forEach((type, index) => {
      const owned = ownsAircraft(type);
      const active = index === aircraftIndex;
      const item = document.createElement("div");
      item.className = "shop-item" + (active ? " active" : "");

      const info = document.createElement("div");
      const title = document.createElement("div");
      title.className = "shop-title";

      const swatch = document.createElement("span");
      swatch.className = "shop-color";
      swatch.style.backgroundColor = "#" + type.color.toString(16).padStart(6, "0");

      const name = document.createElement("span");
      name.textContent = (index + 1).toString().padStart(2, "0") + " - " + type.name;
      title.append(swatch, name);

      const meta = document.createElement("div");
      meta.className = "shop-meta";
      const weaponsText = type.weapons
        ? "<br>Armas: " + type.weapons.missiles + " mísseis + canhão" + (isCombatFighterId(type.id) ? " | libera PvP" : "")
        : "";
      meta.innerHTML =
        "Preço: <span class=\"shop-price\">" + (gameMode === "free" ? "Grátis" : fmtMoney(type.price)) + "</span><br>" +
        "Máx: " + type.maxSpeed + " km/h | Stall: " + type.stallSpeed + " km/h | Decolagem: " + type.takeoff + " km/h<br>" +
        "Estabilidade: " + Math.round((type.stability || 1) * 100) + "%" + weaponsText;

      info.append(title, meta);

      const action = document.createElement("button");
      action.type = "button";
      action.className = "shop-action";

      if (!gameStarted) {
        action.textContent = "Bloqueado";
        action.disabled = true;
      } else if (active) {
        action.textContent = "Em uso";
        action.disabled = true;
      } else if (owned) {
        action.textContent = "Equipar";
        action.addEventListener("click", () => switchAircraft(index));
      } else {
        action.textContent = "Comprar";
        action.disabled = money < type.price;
        action.addEventListener("click", () => buyAircraft(index));
      }

      item.append(info, action);
      list.appendChild(item);
    });
  }

  function thirdPersonCamera(dt) {
    const speed = speedKmh();
    const yawFollow = 1 - Math.pow(0.00002, dt);
    const positionFollow = 1 - Math.pow(0.00001, dt);
    const lookFollow = 1 - Math.pow(0.00008, dt);

    cameraRig.yaw = lerpAngle(cameraRig.yaw, aircraft.yaw, yawFollow);

    const backDistance = aircraftType.cameraBack + clamp(speed / 65, 0, 26);
    const height = 10 + clamp(speed / 110, 0, 14) + clamp(altitude() / 420, 0, 10);
    const side = Math.sin(aircraft.roll) * clamp(speed / 240, -3.5, 3.5);

    const desiredOffset = new THREE.Vector3(side, height, backDistance);
    desiredOffset.applyAxisAngle(Y_AXIS, cameraRig.yaw);

    const desiredPosition = plane.visible
      ? aircraft.position.clone().add(desiredOffset)
      : aircraft.position.clone().add(new THREE.Vector3(0, 80, 110));

    const forwardFlat = new THREE.Vector3(-Math.sin(cameraRig.yaw), 0, -Math.cos(cameraRig.yaw));
    const desiredTarget = aircraft.position.clone()
      .addScaledVector(forwardFlat, 70 + clamp(speed / 12, 0, 75))
      .add(new THREE.Vector3(0, 4 + clamp(speed / 150, 0, 9), 0));

    if (!cameraRig.ready || camera.position.distanceTo(desiredPosition) > 900) {
      camera.position.copy(desiredPosition);
      cameraRig.target.copy(desiredTarget);
      cameraRig.ready = true;
    } else {
      camera.position.lerp(desiredPosition, positionFollow);
      cameraRig.target.lerp(desiredTarget, lookFollow);
    }

    camera.up.set(0, 1, 0);
    camera.lookAt(cameraRig.target);
  }

  function updateCamera(dt) {
    if (cameraMode === 0) {
      thirdPersonCamera(dt);
      return;
    }

    let offset;
    if (cameraMode === 1) offset = new THREE.Vector3(0, 2.6, 9);
    else if (cameraMode === 2) offset = new THREE.Vector3(0, 115, 35);
    else offset = new THREE.Vector3(48, 22, aircraftType.cameraBack * 0.8);

    if (cameraMode === 1) offset.applyEuler(plane.rotation);
    else offset.applyAxisAngle(Y_AXIS, aircraft.yaw);

    const desired = plane.visible
      ? plane.position.clone().add(offset)
      : aircraft.position.clone().add(new THREE.Vector3(0, 80, 110));

    camera.position.lerp(desired, 1 - Math.pow(0.0005, dt));

    if (cameraMode === 1 && plane.visible) {
      const look = new THREE.Vector3(0, 1.8, -105).applyEuler(plane.rotation).add(plane.position);
      camera.lookAt(look);
    } else {
      camera.lookAt(aircraft.position.x, aircraft.position.y + 4, aircraft.position.z);
    }
  }

  function currentNav() {
    const heading = headingDegrees();

    if (!activeMission || activeMission.completed) {
      return {
        heading,
        bearing: null,
        error: 0,
        distance: 0,
        guidance: activeMission && activeMission.completed ? "Missão concluída" : "Sem missão ativa"
      };
    }

    if (activeMission.data.challenge) {
      const target = activeMissionTarget();
      if (!target) {
        return {
          mode: "challenge",
          heading,
          bearing: null,
          error: 0,
          distance: 0,
          guidance: "Alvos concluídos"
        };
      }

      const targetPosition = target.object.position;
      const bearing = bearingBetween(aircraft.position.x, aircraft.position.z, targetPosition.x, targetPosition.z);
      const error = wrapDegrees(bearing - heading);
      const distance = aircraft.position.distanceTo(targetPosition);
      const altitudeError = targetPosition.y - aircraft.position.y;
      let guidance = "Alvo aéreo: vire " + (error > 0 ? "direita " : "esquerda ") + Math.round(Math.abs(error)) + "°";

      if (target.kind === "ring") {
        guidance = "Argola " + (target.index + 1) + "/" + activeMission.targets.length;
        if (Math.abs(error) > 10) guidance += ": vire " + (error > 0 ? "direita " : "esquerda ") + Math.round(Math.abs(error)) + "°";
        if (Math.abs(altitudeError) > 60) guidance += altitudeError > 0 ? " e suba" : " e desça";
      } else if (target.kind === "enemy") {
        guidance = "PvP " + (activeMission.enemiesDown + 1) + "/" + activeMission.targets.length + ": mire e atire";
        if (Math.abs(error) > 12) guidance += " pela " + (error > 0 ? "direita" : "esquerda");
      }

      return {
        mode: "challenge",
        heading,
        bearing,
        error,
        distance,
        targetPoint: targetPosition,
        guidance
      };
    }

    const target = activeMission.to;
    const distance = dist2(aircraft.position.x, aircraft.position.z, target.x, target.z);
    const approachDistance = Math.max(3400, target.length * 2.2);
    const route = approachRouteForAirport(target);
    const routeDistance = dist2(aircraft.position.x, aircraft.position.z, route.x, route.z);

    if (distance >= approachDistance && routeDistance > 850) {
      const bearing = bearingBetween(aircraft.position.x, aircraft.position.z, route.x, route.z);
      const error = wrapDegrees(bearing - heading);
      const absError = Math.abs(error);
      let guidance = "Vá ao ponto de aproximação para alinhar com a pista";
      if (absError > 8) guidance = "Rota fácil: vire " + (error > 0 ? "direita " : "esquerda ") + Math.round(absError) + "°";

      return {
        mode: "route",
        heading,
        bearing,
        route,
        error,
        distance,
        routeDistance,
        guidance
      };
    }

    if (distance < approachDistance) {
      const approach = runwayApproachData(target);
      const headingError = wrapDegrees(approach.course - heading);
      const lateralError = clamp(approach.lateral / 520, -1, 1) * 45;
      const directorError = clamp(headingError + lateralError, -90, 90);
      let guidance = "Final: alinhe com a pista " + Math.round(approach.course).toString().padStart(3, "0") + "°";

      if (Math.abs(approach.lateral) > 260) guidance = "Centralize no eixo da pista";
      if (distance < 900) guidance = "Reduza, nivele e toque suave";

      return {
        mode: "approach",
        heading,
        bearing: approach.course,
        course: approach.course,
        lateral: approach.lateral,
        error: directorError,
        distance,
        guidance
      };
    }

    const bearing = bearingBetween(aircraft.position.x, aircraft.position.z, target.x, target.z);
    const error = wrapDegrees(bearing - heading);
    const absError = Math.abs(error);
    let guidance = "Rumo alinhado";

    if (absError > 9) guidance = "Vire " + (error > 0 ? "direita " : "esquerda ") + Math.round(absError) + "°";
    if (distance < 700) {
      guidance = "Aproxime e reduza para pouso";
    }

    return {
      heading,
      bearing,
      error,
      distance,
      guidance
    };
  }

  function drawMiniMap() {
    const canvas = el("miniMap");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 8;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = "rgba(5, 18, 28, 0.96)";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(102, 202, 255, 0.15)";
    ctx.lineWidth = 1;
    [0.35, 0.68, 1].forEach(scale => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * scale, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.stroke();

    function toRadar(x, z, clampToEdge = true) {
      const dx = x - aircraft.position.x;
      const dz = z - aircraft.position.z;
      const distance = Math.hypot(dx, dz);
      const scale = radius / MINIMAP_RANGE;
      const limit = clampToEdge && distance > MINIMAP_RANGE ? MINIMAP_RANGE / distance : 1;
      return {
        x: cx + dx * scale * limit,
        y: cy + dz * scale * limit,
        distance,
        clipped: distance > MINIMAP_RANGE
      };
    }

    if (activeMission && !activeMission.completed) {
      if (activeMission.data.challenge) {
        const target = activeMissionTarget();
        activeMission.targets.forEach(item => {
          if ((item.kind === "ring" && item.passed) || (item.kind === "enemy" && !item.alive)) return;
          const p = toRadar(item.object.position.x, item.object.position.z);
          ctx.fillStyle = item === target ? "#ffd84d" : item.kind === "enemy" ? "#ff5a52" : "#66caff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, item === target ? 6 : 3.5, 0, Math.PI * 2);
          ctx.fill();
        });

        if (target) {
          const p = toRadar(target.object.position.x, target.object.position.z);
          ctx.strokeStyle = target.kind === "enemy" ? "rgba(255, 90, 82, 0.85)" : "rgba(255, 216, 77, 0.85)";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      } else {
        const target = toRadar(activeMission.to.x, activeMission.to.z);
        const route = approachRouteForAirport(activeMission.to);
        const routePoint = toRadar(route.x, route.z);
        ctx.strokeStyle = "rgba(255, 216, 77, 0.85)";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(routePoint.x, routePoint.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        ctx.fillStyle = "#66caff";
        ctx.beginPath();
        ctx.arc(routePoint.x, routePoint.y, routePoint.clipped ? 4 : 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = activeMission.boarded ? "#ffd84d" : "#66caff";
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.clipped ? 5 : 7, 0, Math.PI * 2);
        ctx.fill();

        const runway = activeMission.to;
        const runwayPoint = toRadar(runway.x, runway.z);
        if (!runwayPoint.clipped) {
          const angle = THREE.Math.degToRad(runway.heading);
          const len = clamp(runway.length / MINIMAP_RANGE * radius, 12, 32);
          const dx = Math.sin(angle) * len;
          const dy = -Math.cos(angle) * len;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(runwayPoint.x - dx, runwayPoint.y - dy);
          ctx.lineTo(runwayPoint.x + dx, runwayPoint.y + dy);
          ctx.stroke();
        }
      }
    }

    AIRPORTS.forEach(a => {
      const p = toRadar(a.x, a.z, false);
      if (p.distance > MINIMAP_RANGE) return;
      ctx.fillStyle = activeMission && activeMission.to.id === a.id ? "#ffd84d" : "#8cffaa";
      ctx.beginPath();
      ctx.arc(p.x, p.y, activeMission && activeMission.to.id === a.id ? 4.2 : 2.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(THREE.Math.degToRad(headingDegrees()));
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5.5, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-5.5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  function updateFlightDirector() {
    const nav = currentNav();
    el("directorHeading").textContent = Math.round(nav.heading).toString().padStart(3, "0") + "°";
    el("directorTarget").textContent = nav.bearing === null
      ? "--"
      : (nav.mode === "approach" ? "Pista " : nav.mode === "route" ? "Aprox " : "Alvo ") + Math.round(nav.bearing).toString().padStart(3, "0") + "°";
    el("directorGuidance").textContent = nav.guidance;
    el("directorNeedle").style.left = 50 + clamp(nav.error / 90, -1, 1) * 46 + "%";
  }

  let fpsValue = 60;
  let fpsLast = performance.now();
  let fpsFrames = 0;

  function updateHUD() {
    fpsFrames++;
    const now = performance.now();

    if (now - fpsLast > 500) {
      fpsValue = Math.round(fpsFrames * 1000 / (now - fpsLast));
      fpsFrames = 0;
      fpsLast = now;
    }

    el("playerLabel").textContent = playerName || "--";
    el("modeLabel").textContent = !gameStarted ? "Menu" : gameMode === "free" ? "Livre" : "Carreira";
    el("aircraftName").textContent = aircraftType.name;
    el("weaponInfo").textContent = selectedWeaponLabel();
    el("fps").textContent = fpsValue;
    el("speed").textContent = Math.round(speedKmh());
    el("stallSpeed").textContent = aircraftType.stallSpeed;
    el("altitude").textContent = Math.round(altitude());
    el("throttle").textContent = Math.round(aircraft.throttle * 100);
    el("boost").textContent = down("shift") ? "On" : "Off";
    el("boost").className = down("shift") ? "warn" : "";
    el("aoa").textContent = THREE.Math.radToDeg(aircraft.aoa).toFixed(1);
    el("vertical").textContent = aircraft.velocity.y.toFixed(1);
    el("heading").textContent = Math.round(headingDegrees()).toString().padStart(3, "0");
    el("health").textContent = Math.max(0, Math.round(aircraft.health));
    updateFlightDirector();
    drawMiniMap();

    let status = gameStarted ? "Na pista" : "Menu inicial";

    const lowSpeedWarning = !aircraft.onGround && speedKmh() < aircraftType.stallSpeed * 1.18;

    if (!gameStarted) status = "Escolha um modo";
    else if (aircraft.exploded) status = "Explodiu! Aperte R";
    else if (aircraft.crashed) status = "Acidente! Aperte R";
    else if (aircraft.stall) status = "STALL abaixo de " + aircraftType.stallSpeed + " km/h";
    else if (lowSpeedWarning) status = "Velocidade baixa";
    else if (altitude() > 12) status = "Voando";
    else if (speedKmh() > aircraftType.takeoff * 0.92) status = "Pronto para decolar";

    if (Math.abs(aircraft.position.x) > HALF || Math.abs(aircraft.position.z) > HALF) {
      status += " / sobre oceano";
    }

    const statusEl = el("status");
    statusEl.textContent = status;
    statusEl.className = aircraft.crashed ? "bad" : aircraft.stall || lowSpeedWarning ? "warn" : altitude() > 12 ? "good" : "";

    const landingEl = el("landingQuality");
    landingEl.textContent = lastLanding ? lastLanding.text : "--";
    landingEl.className = lastLanding ? lastLanding.className : "";

    if (activeMission) {
      const nav = currentNav();

      el("missionTitle").textContent =
        activeMission.data.title + " — " + activeMission.from.name + " → " + activeMission.to.name;

      let missionText = activeMission.completed ? "Concluída! Aperte N/M para outra." :
        activeMission.boarded ? activeMission.data.text : "Aguardando preparação no aeroporto de origem.";

      if (!activeMission.completed && activeMission.data.challenge === "rings") {
        missionText = "Passe pelas argolas: " + activeMission.targetIndex + "/" + activeMission.targets.length + ".";
      } else if (!activeMission.completed && activeMission.data.challenge === "combat") {
        missionText = "PvP aéreo: rivais derrubados " + activeMission.enemiesDown + "/" + activeMission.targets.length + ".";
      }

      el("missionText").textContent = missionText;

      el("missionManifest").textContent = missionManifest(activeMission.data);
      el("missionDistance").textContent = Math.round(nav.distance);
      el("targetBearing").textContent = nav.bearing === null
        ? "--"
        : (nav.mode === "approach" ? "Pista " : nav.mode === "route" ? "Aprox " : "Alvo ") + Math.round(nav.bearing).toString().padStart(3, "0") + "°";
    } else {
      el("missionTitle").textContent = "Pressione N para iniciar";
      el("missionText").textContent = "Voe de um aeroporto para outro.";
      el("missionManifest").textContent = "--";
      el("missionDistance").textContent = "0";
      el("targetBearing").textContent = "--";
    }

    el("money").textContent = gameMode === "free"
      ? "Livre | Concluídas: " + completed
      : fmtMoney(money) + " | Concluídas: " + completed;

    el("compactSpeed").textContent = Math.round(speedKmh()) + " km/h";
    el("compactAircraft").textContent = aircraftType.name;
    el("compactAltitude").textContent = Math.round(altitude()) + " m";
    el("compactThrottle").textContent = Math.round(aircraft.throttle * 100) + "%";
    el("compactLanding").textContent = lastLanding ? lastLanding.text : status;
  }

  function shortcuts() {
    if (once("1")) switchAircraft(0);
    if (once("2")) switchAircraft(15);
    if (once("3")) switchAircraft(AIRCRAFT_TYPES.length - 1);
    if (once("g")) cycleWeapon();
    if (once(" ")) fireSelectedWeapon();
    if (once("l")) setShopOpen(!shopOpen);
    if (once("i")) setHudHidden(!hudHidden);

    if (once("r")) {
      if (activeMission) resetToAirport(activeMission.from);
      else resetToAirport(AIRPORTS[0]);
      el("message").innerHTML = "Avião resetado. Segure W para acelerar.";
    }

    if (once("c")) cameraMode = (cameraMode + 1) % 4;

    if (once("q")) {
      qualityIndex = (qualityIndex + 1) % QUALITY.length;
      quality = QUALITY[qualityIndex];
      rebuildDynamicWorld();
    }

    if (once("h")) {
      showHitboxes = !showHitboxes;
      rebuildHitboxHelpers();
      el("message").innerHTML = showHitboxes ? "Hitboxes visíveis." : "Hitboxes ocultas.";
    }

    if (once("n")) randomMission();
    if (once("m")) nextMission();
  }

  function setupUi() {
    const startFree = el("startFree");
    const startCareer = el("startCareer");
    const loginButton = el("loginButton");
    const pilotInput = el("pilotName");
    const shopToggle = el("shopToggle");
    const shopClose = el("shopClose");
    const hudToggle = el("hudToggle");

    const lastPilot = localStorage.getItem("flight-simulator-ofc-last-pilot");
    if (lastPilot) playerName = lastPilot;
    if (pilotInput && playerName) pilotInput.value = playerName;

    if (loginButton) loginButton.addEventListener("click", loginPilot);
    if (pilotInput) {
      pilotInput.addEventListener("keydown", event => {
        if (event.key === "Enter") loginPilot();
      });
    }
    if (startFree) startFree.addEventListener("click", () => startGame("free"));
    if (startCareer) startCareer.addEventListener("click", () => startGame("career"));
    if (shopToggle) shopToggle.addEventListener("click", () => setShopOpen(!shopOpen));
    if (shopClose) shopClose.addEventListener("click", () => setShopOpen(false));
    if (hudToggle) hudToggle.addEventListener("click", () => setHudHidden(!hudHidden));

    setHudHidden(false);
    setShopOpen(false);
    updateProfileUi();
    renderShop();
  }

  addStaticWorld();
  rebuildDynamicWorld();
  makePlaneModel(aircraftType);
  resetToAirport(AIRPORTS[0]);
  setupUi();

  let last = performance.now();

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;

    if (gameStarted) {
      shortcuts();
      updatePhysics(dt);
      updateMission(dt);
    }
    updateExplosions(dt);
    updateProjectiles(dt);
    updateCamera(dt);
    updateHUD();

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  el("loading").style.display = "none";
  requestAnimationFrame(loop);
})();
