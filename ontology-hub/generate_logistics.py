import os

def generate_logistics():
    print("--- Starting Kairos Logistics Data Orchestrator ---")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(base_dir, 'ontology-hub', 'output')
    viewer_dir = os.path.join(base_dir, 'ontologies', 'logistics')
    
    for d in [output_dir, viewer_dir]:
        if not os.path.exists(d): os.makedirs(d)

    # 1. UITGEBREIDE DATA (Klaar voor StreamSoftware & Ontologie)
    scenarios = {
        "MMT_Scenario_1": {
            "title": "Weight Analysis",
            "id": "SHIP-2024-001",
            "status": "ANOMALY DETECTED",
            "weight": "6763.9",
            "mbl": "MBL-ANT-99283",
            "hbl": "HBL-SRG-251101",
            "vessel": "MSC OSCAR",
            "voyage": "V-2024-X",
            "port_load": "SURIGAO",
            "port_discharge": "ANTWERP",
            "consignee": "GLOBAL TRADE CORP",
            "carrier": "MSC",
            "commodity": "ELECTRONICS",
            "package_type": "PALLETS",
            "package_qty": "12",
            "compliance": "YES (Structure verified)",
            "sql_match": "Found existing dossier #MMT-992",
            "verification": ["- HBL Weight: 6763.9 KGS", "- MBL/Mail: 4763.9 KGS"],
            "alert": "[!] Weight Mismatch! Diff: 2000.0 KGS.",
            "action": "Manual Review required.",
            "comment": "Check invoice versus packing list for discrepancies."
        },
        "MMT_Scenario_3": {
            "title": "Data Enrichment",
            "id": "SHIP-2024-003",
            "status": "INFO ENRICHED",
            "weight": "2450.5",
            "mbl": "MBL-ZEE-11223",
            "hbl": "HBL-KUL-529916",
            "vessel": "EVER GIVEN",
            "voyage": "EG-882",
            "port_load": "PORT KLANG",
            "port_discharge": "ZEEBRUGGE",
            "consignee": "BELGO EXPORT",
            "carrier": "EVERGREEN",
            "commodity": "TEXTILES",
            "package_type": "CONTAINER 40FT",
            "package_qty": "1",
            "compliance": "YES",
            "sql_match": "Found related booking #BK-8812",
            "verification": ["- BOL missing instructions", "- Email context extracted"],
            "alert": "None. Enrichment complete.",
            "action": "Review comments below.",
            "comment": "Customer requested delivery after 4:00 PM; Warehouse contact: Peter (+32 470 123 456)."
        }
    }

    # 2. TTL GENERATIE (Nu met alle velden voor de viewer rechts)
    ttl_content = "@prefix skos: <http://www.w3.org/2004/02/skos/core#> .\n@prefix mmt: <http://unece.org/data/mmt#> .\n@prefix kairos: <http://example.org/kairos/> .\n\nkairos:LogisticsMMTSchema a skos:ConceptScheme ;\n    skos:prefLabel 'Kairos Logistics MMT Schema' .\n\n"
    
    for name, data in scenarios.items():
        ship_uri = f"kairos:Shipment_{data['id']}"
        ttl_content += f"{ship_uri} a mmt:Shipment ;\n"
        ttl_content += f"    mmt:id '{data['id']}' ;\n"
        ttl_content += f"    mmt:grossWeight '{data['weight']} KGS' ;\n"
        ttl_content += f"    mmt:vesselName '{data['vessel']}' ;\n"
        ttl_content += f"    mmt:voyageNumber '{data['voyage']}' ;\n"
        ttl_content += f"    mmt:masterBillOfLading '{data['mbl']}' ;\n"
        ttl_content += f"    mmt:houseBillOfLading '{data['hbl']}' ;\n"
        ttl_content += f"    mmt:portOfLoading '{data['port_load']}' ;\n"
        ttl_content += f"    mmt:portOfDischarge '{data['port_discharge']}' ;\n"
        ttl_content += f"    mmt:consignee '{data['consignee']}' ;\n"
        ttl_content += f"    mmt:commodity '{data['commodity']}' ;\n"
        ttl_content += f"    mmt:package '{data['package_qty']} {data['package_type']}' ;\n"
        ttl_content += f"    kairos:auditStatus '{data['status']}' ;\n"
        ttl_content += f"    kairos:auditRecommendation '{data['action']}' ;\n"
        if data['comment']:
            ttl_content += f"    kairos:emailComment '{data['comment']}' ;\n"
        ttl_content += f"    mmt:status '{data['status']}' .\n\n"

    for path in [os.path.join(output_dir, 'mmt_shipment_schema.ttl'), os.path.join(viewer_dir, 'mmt_shipment_schema.ttl')]:
        with open(path, 'w') as f: f.write(ttl_content)

    # 3. UITGEBREIDE XML (StreamSoftware Export)
    for name, data in scenarios.items():
        xml_path = os.path.join(output_dir, f"import_{name}.xml")
        with open(xml_path, 'w') as f:
            f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
            f.write('<StreamImport xmlns:mmt="http://unece.org/data/mmt">\n')
            f.write(f'  <Header>\n    <RefID>{data["id"]}</RefID>\n    <Timestamp>2024-04-21</Timestamp>\n  </Header>\n')
            f.write('  <TransportDetails>\n')
            f.write(f'    <VesselName>{data["vessel"]}</VesselName>\n')
            f.write(f'    <VoyageNumber>{data["voyage"]}</VoyageNumber>\n')
            f.write(f'    <Carrier>{data["carrier"]}</Carrier>\n')
            f.write(f'    <POL>{data["port_load"]}</POL>\n')
            f.write(f'    <POD>{data["port_discharge"]}</POD>\n')
            f.write('  </TransportDetails>\n')
            f.write('  <GoodsDetails>\n')
            f.write(f'    <MBL>{data["mbl"]}</MBL>\n')
            f.write(f'    <HBL>{data["hbl"]}</HBL>\n')
            f.write(f'    <Description>{data["commodity"]}</Description>\n')
            f.write(f'    <GrossWeight unit="KGS">{data["weight"]}</GrossWeight>\n')
            f.write(f'    <Packaging qty="{data["package_qty"]}">{data["package_type"]}</Packaging>\n')
            f.write(f'    <Consignee>{data["consignee"]}</Consignee>\n')
            f.write('  </GoodsDetails>\n')
            f.write('  <AuditTrail>\n')
            f.write(f'    <Status>{data["status"]}</Status>\n')
            f.write(f'    <Recommendation>{data["action"]}</Recommendation>\n')
            if data['comment']: f.write(f'    <InternalRemarks>{data["comment"]}</InternalRemarks>\n')
            f.write('  </AuditTrail>\n')
            f.write('</StreamImport>')

    # 4. AUDIT REPORTS
    for name, data in scenarios.items():
        audit_path = os.path.join(output_dir, f"audit_{name}.txt")
        with open(audit_path, 'w') as f:
            f.write(f"KAIROS AI AUDIT: {data['title']}\n====================================================\n")
            f.write(f"STATUS: {data['status']}\nRECOMMENDATION: {data['action']}\n\nVERIFICATION:\n")
            for line in data['verification']: f.write(f"{line}\n")
            if data['comment']: f.write(f"\n[COMMENT]: {data['comment']}\n")
            f.write("====================================================\n")

if __name__ == "__main__":
    generate_logistics()