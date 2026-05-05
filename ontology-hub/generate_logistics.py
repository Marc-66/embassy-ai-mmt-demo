import lxml.etree as ET
from datetime import datetime
import psycopg2  # Of pyodbc voor SQL Server

# --- CONFIGURATIE ---
DB_CONFIG = {
    "dbname": "ils_database",
    "user": "admin",
    "password": "password",
    "host": "localhost"
}

def check_existing_dossier(reference):
    """
    Controleert in de SQL database of de referentie (bijv. Bol.com order) al bestaat.
    Geeft (ActionCode, DossierID) terug.
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # We zoeken op de externe referentie in de ILS dossiers tabel
        query = "SELECT dossier_id FROM dossiers WHERE external_reference = %s LIMIT 1;"
        cur.execute(query, (reference,))
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if result:
            return "M", result[0]  # M = Modify (Bestaat al)
        else:
            return "C", None       # C = Create (Nieuw dossier)
            
    except Exception as e:
        print(f"Database error: {e}")
        return "C", None  # Default naar Create bij fout, of stop het proces

def generate_logistics_xml(output_file, data):
    """
    Genereert de XML voor ILS Dossiers conform Source 2.
    """
    # 1. Bepaal of het een nieuw dossier is of een update
    action_code, internal_id = check_existing_dossier(data['order_ref'])
    
    # 2. Bouw de XML Structuur
    root = ET.Element("Dossiers")
    dossier = ET.SubElement(root, "Dossier")
    
    # ProcessArea (Verplicht: actie bepaalt importgedrag)[cite: 2]
    process_area = ET.SubElement(dossier, "ProcessArea")
    ET.SubElement(process_area, "action").text = action_code
    if internal_id:
        ET.SubElement(process_area, "internalId").text = str(internal_id)
    
    # DataArea
    data_area = ET.SubElement(dossier, "DataArea")
    
    # GeneralData[cite: 2]
    gen_data = ET.SubElement(data_area, "GeneralData")
    ET.SubElement(gen_data, "dossierType").text = "IMPORT"
    ET.SubElement(gen_data, "dossierDate").text = datetime.now().strftime("%Y-%m-%d")
    ET.SubElement(gen_data, "externalReference").text = str(data['order_ref'])[:35]
    
    # Goods sectie (Producten toevoegen)[cite: 2]
    goods = ET.SubElement(data_area, "Goods")
    for i, item in enumerate(data['items'], 1):
        goods_item = ET.SubElement(goods, "GoodsItem")
        ET.SubElement(goods_item, "sequenceNumber").text = str(i)
        ET.SubElement(goods_item, "productCode").text = str(item['sku'])[:35] # Max 35
        ET.SubElement(goods_item, "quantity").text = str(item['qty'])
        
        # Fysieke details (Format Decimal 12,3)
        if 'weight' in item:
            ET.SubElement(goods_item, "grossWeight").text = f"{item['weight']:.3f}"

    # 3. Opslaan naar bestand
    tree = ET.ElementTree(root)
    tree.write(output_file, encoding="utf-8", xml_declaration=True, pretty_print=True)
    print(f"XML gegenereerd: {output_file} met actie: {action_code}")

# --- VOORBEELD AANROEP ---
if __name__ == "__main__":
    # Deze data komt normaal uit je MMT-parser (mail/document)
    order_data = {
        "order_ref": "BOL-2024-9988",  # De unieke sleutel voor de SQL-check
        "items": [
            {"sku": "ART-001", "qty": 10, "weight": 5.5},
            {"sku": "ART-002", "qty": 1, "weight": 0.750}
        ]
    }
    
    generate_logistics_xml("ils_import_order.xml", order_data)