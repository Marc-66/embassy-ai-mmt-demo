# SHACL Shapes

SHACL constraint definitions for validating ontology instances.

## Purpose

- Enforce data quality rules
- Validate required properties
- Define value constraints (patterns, ranges, cardinality)

## Best Practices

1. **One shape file per ontology**: `customer.shacl.ttl` for `customer.ttl`
2. **Helpful messages**: Include sh:message for every constraint
3. **Severity levels**: Use sh:severity (Violation, Warning, Info)
4. **Test constraints**: Validate with real data

## Example

```turtle
@prefix : <http://kairos.example/ontology/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

:MyClassShape a sh:NodeShape ;
    sh:targetClass :MyClass ;
    sh:property [
        sh:path :myProperty ;
        sh:minCount 1 ;
        sh:datatype xsd:string ;
        sh:pattern "^[A-Z]{3}[0-9]{6}$" ;
        sh:message "Must be in format: 3 uppercase letters + 6 digits"
    ] .
```
