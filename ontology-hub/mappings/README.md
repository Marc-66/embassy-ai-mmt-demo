# SKOS Mappings

Semantic mappings to industry standards and external vocabularies.

## Purpose

- Map internal terms to Schema.org for SEO
- Align with industry standards (FIBO, etc.)
- Enable cross-system interoperability

## Mapping Types

- `skos:exactMatch` - Terms are identical
- `skos:closeMatch` - Terms are very similar
- `skos:broadMatch` - Target term is broader
- `skos:narrowMatch` - Target term is narrower
- `skos:relatedMatch` - Terms are related

## Example

```turtle
@prefix : <http://kairos.example/ontology/> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix schema: <http://schema.org/> .

:Customer skos:exactMatch schema:Organization .
:customerName skos:exactMatch schema:name .
```

## Usage

These mappings are used by:
- Azure AI Search (synonym generation)
- Prompt Package (LLM context enrichment)
