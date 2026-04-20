import os

def generate_efs():
    print("--- Starting EFS Generation for Kairos Project ---")
    
    # Pad naar de lib en output mappen
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(base_dir, 'ontology-hub', 'output')
    
    # Maak de output map aan als deze niet bestaat
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    # De logica voor het genereren van de embassy schem.ttl
    # Hier komt de core mapping logica die je hebt gebouwd
    output_file = os.path.join(output_dir, 'embassy_schem.ttl')
    
    try:
        with open(output_file, 'w') as f:
            f.write("@prefix skos: <http://www.w3.org/2004/02/skos/core#> .\n")
            f.write("@prefix kairos: <http://example.org/kairos/> .\n\n")
            f.write("kairos:EmbassySchema a skos:ConceptScheme ;\n")
            f.write("    skos:prefLabel 'Embassy Schema' ;\n")
            f.write("    skos:definition 'Generated schema for the Kairos ontology hub' .\n")
        
        print(f"Successfully generated: {output_file}")
    except Exception as e:
        print(f"Error during generation: {e}")

if __name__ == "__main__":
    generate_efs()