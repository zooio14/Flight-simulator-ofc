# Flight Simulator OFC V9

Criado por Guilherme Trecenti.

Versao com login de piloto, carreira salva no navegador, modo livre, loja de avioes, mapa maior, cidades urbanas e rurais, fisica de voo melhorada, radar com rota de aproximacao, camera terceira pessoa, cacas armados, missoes PvP e desafios de argolas.

## Como jogar

Abra o jogo, coloque o nome do piloto, escolha um modo e use:

- W: acelerar
- S: reduzir/frear
- Shift: turbo
- Setas: pitch e roll
- A/D: yaw
- 1: Cessna inicial
- 2: airliner medio
- 3: caca final
- Espaco: atirar com a arma selecionada
- G: alternar entre misseis e canhao
- L: loja de avioes
- I: esconder/mostrar informacoes
- C: camera
- Q: qualidade
- H: hitboxes
- R: reset
- N: missao aleatoria
- M: proxima missao

## Modos

- Modo livre: todos os 27 avioes ficam liberados de graca.
- Modo carreira: o jogador comeca com o Cessna velho de aeroclube, faz missoes para ganhar dinheiro e compra avioes melhores na loja.

## Melhorias principais

- 27 modelos de aviao, do Cessna velho ate cacas armados de alto desempenho
- 6 cacas armados para PvP: F-22, F-15EX, Rafale, Typhoon, Su-57 e OFC-X
- Precos rebalanceados: avioes baratos sao mais dificeis e avioes caros ficam mais estaveis
- Carreira salva automaticamente por nome de piloto no navegador
- Loja com comprar/equipar e estatisticas de velocidade, stall e decolagem
- Mapa aumentado para 48 km x 48 km
- 22 aeroportos espalhados pelo mundo
- Cidades urbanas com torres, parques e ruas
- Vilas rurais com casas, celeiros, silos e campos
- 25 missoes: passageiros, carga, emergencia, operacao militar, argolas e PvP simulado
- Missoes PvP so liberam quando o jogador desbloqueia qualquer um dos 6 cacas armados
- Missoes de argolas usam checkpoints 3D no ceu guiados pelo radar
- Sistema de armas com Espaco para atirar e G para alternar entre misseis e canhao
- Mini mapa circular com rota ate um ponto de aproximacao antes da pista
- Radar superior que orienta o jeito mais facil de chegar alinhado para pousar
- Camera terceira pessoa presa atras do aviao, com suavizacao por rumo
- HUD compacto quando as informacoes laterais sao escondidas
- Nota de pouso com bonus de missao
- Cores fixas para oceano, grama, campos, floresta, areia, pistas, ruas, rios e montanhas, com camadas separadas para evitar piscadas
- Hitboxes com mais camadas para predios, arvores, montanhas, terminais, torres, casas, celeiros e silos
- Pouso pesado quebra o aviao, mas nao explode automaticamente
- Fisica melhorada: nariz para cima perde energia, mergulho ganha velocidade, arrasto segura a velocidade maxima
- Decolagem mais dificil: o aviao precisa passar da velocidade certa para sair do chao
- Stall baseado em velocidade minima especifica de cada aeronave, um pouco mais exigente
- Modelos 3D com escala e cores por aeronave

## Rodar localmente

```bash
cd /Users/guilhermetrecenti/Documents/Codex/2026-06-15/voce-tem-acesso-ao-meu-repositorio/work/Flight-simulator-ofc
python3 -m http.server 8080
```

Depois abra:

```text
http://localhost:8080
```

## Como subir no GitHub Pages

Envie para a raiz do repositorio:

- index.html
- style.css
- main.js

Depois ative:

Settings -> Pages -> Deploy from a branch -> main -> /(root)
