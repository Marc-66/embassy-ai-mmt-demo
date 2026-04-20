# Ontologies

This directory contains your domain-specific ontologies.

## Structure

- `*.ttl` - Turtle format ontology files
- `extensions/` - Customer-specific extensions to reference ontologies

## Naming Conventions

- Use lowercase with hyphens: `customer-management.ttl`
- One ontology per business domain
- Import FIBO ontologies where appropriate

## Best Practices

1. **Use FIBO Foundation**: Import and extend FIBO when possible
2. **Document**: Include rdfs:label and rdfs:comment for all classes/properties
3. **Versioning**: Use owl:versionInfo for each ontology
4. **SKOS Labels**: Add skos:altLabel for synonyms (enables synonym mapping)
5. **Namespace**: Use consistent namespace prefix

## Example

```turtle
@prefix : <http://kairos.example/ontology/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix fibo-fnd-org: <https://spec.edmcouncil.org/fibo/ontology/FND/Organizations/Organizations/> .

:MyOntology a owl:Ontology ;
    rdfs:label "My Domain Ontology"@en ;
    owl:versionInfo "1.0.0" ;
    owl:imports fibo-fnd-org: .
```
