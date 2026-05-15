# Estúdio de Estampas — visão e requisitos

Documento de produto para o módulo de **preparação de arte para camisetas** dentro do DevToolbox (ou subproduto no mesmo servidor).

## Objetivo

Permitir que o usuário resolva **todo o fluxo de arte para estampa** em um só lugar, sem depender de Photoshop/Illustrator para tarefas repetitivas:

1. Importar imagem
2. Redimensionar com **DPI** e tamanho real (cm/pol)
3. Remover fundo
4. Remover/substituir **cores específicas** (ex.: preto em arte para **camisa preta**)
5. Aplicar **halftone** (meio-tom para silk/efeitos)
6. Vetorizar (raster → SVG, poucas cores)
7. Exportar em **PNG, JPEG, WebP, SVG** e outros formatos de produção

## Público e casos de uso

| Caso | Necessidade |
|------|-------------|
| DTF / sublimação | PNG transparente, alta resolução, cores fiéis |
| Camisa preta | Fundo removido + **knockout da preta** da arte (não confundir com fundo) |
| Silk screen | Halftone, poucas cores, separação simplificada |
| Vinil / corte | SVG com contornos limpos, poucas cores |
| Arquivo para cliente | JPEG/WebP leve |

## Pipeline conceitual

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Importar │ → │ Ajustar  │ → │  Fundo   │ → │  Cores   │ → │ Halftone │ → │  Vetor   │
│          │   │ resize   │   │  rembg   │   │ knockout │   │ (opc.)   │   │ (opc.)   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                                    ↓
                                                            ┌──────────┐
                                                            │ Exportar │
                                                            └──────────┘
```

O usuário pode pular etapas; **presets** aplicam várias de uma vez.

## Módulos funcionais

### 1. Importar e metadados

- Upload drag-and-drop (PNG, JPEG, WebP, SVG rasterizado, TIFF futuro)
- Exibir: dimensões px, DPI embutido, tamanho em cm se DPI conhecido
- Limite de upload configurável (ex.: 25–50 MB no VPS)

### 2. Redimensionar e DPI

- Largura/altura em px, cm ou polegadas
- DPI alvo (ex.: **300** para impressão)
- Manter proporção, crop (fase 2)
- **Tecnologia:** Sharp

### 3. Remover fundo

- Remoção automática com modelo (qualidade tipo remove.bg)
- Saída PNG com canal alpha
- Refinamento manual (brush) — fase posterior
- **Tecnologia:** `rembg` (container Python no Easypanel) ou ONNX no Node

### 4. Cores — knockout e substituição

**Problema típico (camisa preta):** a arte tem preto que deve **desaparecer** na malha preta, não só o fundo da foto.

- Seletor de cor (eyedropper) + **tolerância** (delta Euclidiano em RGB/LAB)
- Ação: tornar cor **transparente** ou **substituir** (ex.: preto → branco para preview)
- Modo “remover pretos e cinzas escuros”
- Limite de paleta (ex.: máx. 4 cores para silk) — fase avançada
- **Tecnologia:** Sharp (máscaras), possivelmente ImageMagick

### 5. Halftone (meio-tom)

Para silk, vintage e degradês com poucas tintas:

- Parâmetros: densidade de pontos (LPI), ângulo, contraste, tipo AM/FM
- Preview com zoom
- **Tecnologia:** ImageMagick (`-halftone`) e/ou algoritmo custom em Node

### 6. Vetorizar

- Raster → SVG
- Opções: número de cores, suavização, modo logo vs ilustração
- Aviso UX: fotos complexas geram SVG enorme; logos funcionam melhor
- **Tecnologia:** `vtracer` ou `potrace` (CLI no container)

### 7. Exportar formatos

| Formato | Uso |
|---------|-----|
| PNG | Transparência, DTF, sublimação |
| JPEG | Mockup, arquivo leve (sem alpha) |
| WebP | Web, preview |
| SVG | Vinil, silk, edição vetorial |
| PDF | Gráfica (fase avançada) |

**Tecnologia:** Sharp para raster; SVG direto do vetorizador

## Presets planejados

| Preset | Etapas automáticas |
|--------|-------------------|
| **DTF / Sublimação** | Fundo off → resize 300 DPI → PNG |
| **Camisa preta** | Fundo off → knockout preto (tolerância configurável) → PNG |
| **Silk 1 cor** | Halftone → 1 cor → PNG/SVG alto contraste |
| **Vinil** | Fundo off → vetor poucas cores → SVG |
| **Arquivo leve** | WebP ou JPEG qualidade 85 |

## Arquitetura alvo (pós-Easypanel)

```
┌─────────────────────────────────────────────────────────┐
│  Next.js — UI /tools/estampas (ou /tools/images)        │
└───────────────────────────┬─────────────────────────────┘
                            │ multipart / JSON
┌───────────────────────────▼─────────────────────────────┐
│  API Node (Easypanel)                                    │
│  POST /api/images/resize                                 │
│  POST /api/images/remove-background                      │
│  POST /api/images/color-knockout                         │
│  POST /api/images/halftone                               │
│  POST /api/images/vectorize                              │
│  POST /api/images/convert                                │
│  POST /api/images/pipeline  (preset DTF, camisa preta)   │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
     Sharp              rembg              vtracer
   ImageMagick          (Python)           potrace
        │
        ▼
   /tmp/uploads  →  TTL 1h, cron de limpeza
```

## Privacidade e UX

- Banner claro: **“Imagens são processadas no servidor e apagadas após X minutos”** (diferente das ferramentas só no browser)
- Opcional futuro: modo “só no navegador” para compressão simples (WASM)
- Rate limit e tamanho máximo por IP (reutilizar padrão de `lib/api/security.ts`)

## Limitações conhecidas (comunicar ao usuário)

- Remoção de fundo imperfeita em cabelos/fios finos
- Vetorização de **foto** costuma ser inadequada; **logo/arte** é o caso ideal
- Halftone exige calibração com a técnica real de impressão
- Knockout de preto com tolerância alta pode remover sombras desejadas

## Referências de mercado (inspiração)

- [TinyPNG](https://tinypng.com/) — compressão (não é o foco principal do estúdio)
- Remove.bg — remover fundo
- Fluxo manual atual: Photoshop / Illustrator / Corel para halftone e separação

## Rota e nome no produto (proposta)

| Opção | Rota | Notas |
|-------|------|-------|
| A | `/tools/estampas` | Nome alinhado ao nicho |
| B | `/tools/images` | Mais genérico, sub-abas |

**Recomendação:** `/tools/estampas` com subtítulo “Estúdio de arte para camisetas”.

Implementação detalhada por fase: [roadmap.md](./roadmap.md).
