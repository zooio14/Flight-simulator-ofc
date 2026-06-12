export const CONFIG = {
  MAP_SIZE: 5000,
  HALF_MAP: 2500,

  qualities: [
    {
      name: "Ultra leve",
      pixelRatio: 0.45,
      fogFar: 3600,
      buildings: 20,
      trees: 35,
      clouds: 4
    },
    {
      name: "Baixa",
      pixelRatio: 0.6,
      fogFar: 4700,
      buildings: 35,
      trees: 70,
      clouds: 8
    },
    {
      name: "Alta",
      pixelRatio: 0.9,
      fogFar: 6800,
      buildings: 75,
      trees: 150,
      clouds: 16
    }
  ],

  aircraft: {
    mass: 1100,
    wingArea: 16.2,
    maxThrust: 5200,
    dragArea: 0.78,
    inducedDrag: 0.052,
    stallAngleDeg: 15
  },

  airports: [
    {
      id: "OFC",
      name: "Aeroporto Central OFC",
      position: { x: 0, z: 850 },
      runwayHeading: 180,
      runwayLength: 1600
    },
    {
      id: "ILHA",
      name: "Aeroporto Ilha Azul",
      position: { x: -1850, z: -1450 },
      runwayHeading: 45,
      runwayLength: 900
    },
    {
      id: "SERRA",
      name: "Aeroporto Serra Norte",
      position: { x: 1800, z: -1600 },
      runwayHeading: 315,
      runwayLength: 1050
    },
    {
      id: "CIDADE",
      name: "Aeroporto Cidade Leste",
      position: { x: 1450, z: 850 },
      runwayHeading: 90,
      runwayLength: 1200
    }
  ]
};
