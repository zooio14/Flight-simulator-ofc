# Flight Simulator OFC V7

Criado por Guilherme Trecenti.

Versao com tela inicial, modo livre, modo carreira, loja de avioes, mapa maior, mais aeroportos, missoes, radar de rota e camera de perseguicao mais estavel.

## Como jogar

Abra o jogo, escolha um modo e use:

- W: acelerar
- S: reduzir/frear
- Shift: turbo
- Setas: pitch e roll
- A/D: yaw
- 1: Cessna inicial
- 2: airliner medio
- 3: caca final
- L: loja de avioes
- I: esconder/mostrar informacoes
- C: camera
- Q: qualidade
- H: hitboxes
- R: reset
- N: missao aleatoria
- M: proxima missao

## Modos

- Modo livre: todos os 22 avioes ficam liberados de graca.
- Modo carreira: o jogador comeca com o Cessna velho de aeroclube, faz missoes para ganhar dinheiro e compra avioes melhores na loja.

## Melhorias principais

- 22 modelos de aviao, do Cessna velho ate o caca stealth inspirado no F-22
- Precos e progressao no modo carreira
- Loja com comprar/equipar e estatisticas de velocidade, stall e decolagem
- Mapa aumentado para 48 km x 48 km
- 22 aeroportos espalhados pelo mundo
- 18 missoes de passageiros, carga, emergencia e operacao militar
- Mini mapa circular com rota da missao
- Radar superior que orienta rota e alinhamento de pista na aproximacao
- Camera chase estavel que acompanha o rumo sem virar junto com o pitch
- HUD compacto quando as informacoes laterais sao escondidas
- Nota de pouso com bonus de missao
- Cores fixas para oceano, grama, campos, floresta, areia, pistas, ruas, rios e montanhas
- Hitboxes em camadas para predios, arvores, montanhas, terminais e torres
- Pouso pesado quebra o aviao, mas nao explode automaticamente
- Sem limitador artificial de velocidade: mergulho aumenta velocidade com gravidade e arrasto
- Stall baseado em velocidade minima especifica de cada aeronave
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
