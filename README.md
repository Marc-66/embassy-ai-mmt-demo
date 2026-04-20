# Kairos Ontology Hub - Customer Template

> Enterprise semantic data models and domain ontologies for Customer, Product, and Order management

A production-ready ontology repository template powered by the Kairos platform, providing standardized semantic models aligned with FIBO and Schema.org standards.

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Ontology Viewer](#-ontology-viewer)
- [Repository Structure](#-repository-structure)
- [Usage](#-usage)
  - [Validation](#validation)
  - [Generating Projections](#generating-projections)
  - [Creating Releases](#creating-releases)
- [Development](#-development)
- [Output Formats](#-output-formats)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- **📦 Domain Ontologies**: Pre-built semantic models for Customer, Product, and Order domains
- **🔍 Interactive Viewer**: Web-based graph visualization for exploring ontologies
- **✅ SHACL Validation**: Automated constraint checking and quality assurance
- **🎯 Multi-Format Projections**: Generate DBT, Neo4j, Azure Search, JSON Schema outputs
- **🔗 FIBO Alignment**: Integration with Financial Industry Business Ontology standards
- **🌐 Schema.org Mappings**: SKOS-based synonym mappings for web interoperability
- **🚀 CI/CD Ready**: GitHub Actions workflows for automated validation and deployment
- **📊 LLM Context**: Optimized prompt packages for AI/LLM consumption

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.12 or higher
- **Git** for version control
- **Node.js** 18+ (for ontology viewer)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Cnext-eu/kairos-ontology-customer-template.git
   cd kairos-ontology-customer-template
   ```

2. **Install Python dependencies and toolkit**
   ```bash
   # Using make (recommended)
   make install

   # Or manually
   pip install "git+https://github.com/Cnext-eu/kairos-ontology-toolkit.git@v$(grep TOOLKIT_VERSION versions.lock | cut -d= -f2)"
   pip install -r requirements.txt
   ```

3. **Initialize reference models submodule**
   ```bash
   git submodule update --init --recursive
   ```
   
   **Optional**: Configure sparse checkout to reduce repository size
   ```bash
   git -C ontology-reference-models sparse-checkout init --cone
   git -C ontology-reference-models sparse-checkout set authoritative-ontologies derived-ontologies
   ```

4. **Validate the ontologies**
   ```bash
   kairos-ontology validate \
     --ontologies ontology-hub/ontologies \
     --shapes ontology-hub/shapes \
     --catalog ontology-reference-models/catalog-v001.xml
   ```

5. **Generate projections**
   ```bash
   kairos-ontology project \
     --ontologies ontology-hub/ontologies \
     --catalog ontology-reference-models/catalog-v001.xml \
     --output ontology-hub/output \
     --target all
   ```

---

## 🔍 Ontology Viewer

Launch an interactive web-based visualization tool to explore your ontologies in real-time.

### Features

- **Force-Directed Graph**: D3.js-powered interactive visualization
- **Auto-Discovery**: Automatically loads all `.ttl` files from `ontology-hub/ontologies`
- **Node Details**: Click any class to view properties, relationships, and data fields
- **Data Properties Table**: Tabular view of all datatype properties for each class
- **Search & Filter**: Find nodes by name, type, or URI across loaded ontologies
- **Multi-File Support**: Visualize relationships across multiple ontology files

### Launch Viewer

**Automated (Windows)**
```powershell
.\start-viewer.ps1
```

**Manual**
```bash
cd ontology-viewer
npm install
npm run build
npm start
# Open http://localhost:3000
```

---

## 📁 Repository Structure

```
.
├── ontology-hub/                        # Main ontology workspace
│   ├── ontologies/                      # Domain ontologies (Turtle/RDF)
│   │   ├── customer.ttl                 # Customer domain model
│   │   ├── product.ttl                  # Product domain model
│   │   ├── order.ttl                    # Order domain model
│   │   └── README.md
│   ├── shapes/                          # SHACL validation constraints
│   │   ├── customer.shacl.ttl
│   │   ├── product.shacl.ttl
│   │   ├── order.shacl.ttl
│   │   └── README.md
│   ├── mappings/                        # SKOS synonym mappings
│   │   ├── schema-org.ttl               # Schema.org alignments
│   │   └── README.md
│   └── output/                          # Generated projections (gitignored)
│       ├── dbt/                         # Data Build Tool SQL models
│       ├── neo4j/                       # Cypher graph schemas
│       ├── azure-search/                # Azure AI Search indexes
│       ├── a2ui/                        # JSON Schema for UIs
│       └── prompt/                      # LLM prompt contexts
├── ontology-reference-models/           # Reference ontologies submodule (sparse)
│   ├── authoritative-ontologies/        # FIBO and other authoritative ontologies
│   ├── derived-ontologies/              # Supply-chain, DCSA, MMT derived models
│   └── catalog-v001.xml                 # OASIS XML catalog for import resolution
├── ontology-viewer/                     # Interactive web viewer (Next.js)
├── .github/
│   ├── workflows/                       # CI/CD automation
│   │   ├── validate.yml                 # PR + push validation
│   │   ├── release.yml                  # Tag-triggered release
│   │   ├── project.yml                  # Projection generation
│   │   └── dependency-update.yml        # Weekly dependency bump PR
│   └── CODEOWNERS                       # Mandatory review assignments
├── Makefile                             # Task runner (install/validate/project/update-*)
├── versions.lock                        # Pinned toolkit + reference-models versions
├── pyproject.toml                       # Python project metadata
├── requirements.txt                     # Python dev dependencies
├── release.ps1                          # Automated release script
├── update-toolkit.ps1 / .sh             # Bump toolkit version in versions.lock
├── update-referencemodels.ps1           # Init/update reference-models submodule
├── start-viewer.ps1                     # Launch ontology viewer
└── README.md                            # This file
```

---

## 💻 Usage

### Validation

Validate ontologies against SHACL constraints:

```bash
kairos-ontology validate \
  --ontologies ontology-hub/ontologies \
  --shapes ontology-hub/shapes \
  --catalog ontology-reference-models/catalog-v001.xml
```

**Output**: `validation-report.json` with detailed conformance results

### Generating Projections

Generate outputs for specific platforms:

```bash
# All targets
kairos-ontology project \
  --ontologies ontology-hub/ontologies \
  --catalog ontology-reference-models/catalog-v001.xml \
  --output ontology-hub/output \
  --target all

# Specific targets
kairos-ontology project --ontologies ontology-hub/ontologies --catalog ontology-reference-models/catalog-v001.xml --output ontology-hub/output --target dbt
kairos-ontology project --ontologies ontology-hub/ontologies --catalog ontology-reference-models/catalog-v001.xml --output ontology-hub/output --target neo4j
kairos-ontology project --ontologies ontology-hub/ontologies --catalog ontology-reference-models/catalog-v001.xml --output ontology-hub/output --target azure-search
kairos-ontology project --ontologies ontology-hub/ontologies --catalog ontology-reference-models/catalog-v001.xml --output ontology-hub/output --target a2ui
```

### Creating Releases

Use the automated release workflow:

```powershell
# Interactive mode (prompts for version type)
.\release.ps1

# Direct mode
.\release.ps1 -BumpType major   # 1.0.0 -> 2.0.0
.\release.ps1 -BumpType minor   # 1.0.0 -> 1.1.0
.\release.ps1 -BumpType patch   # 1.0.0 -> 1.0.1
```

The script performs:
1. Version bump in all ontology files
2. Full validation
3. Projection generation
4. Git commit and tag
5. Optional push to remote

---

## 🛠️ Development

### Adding New Ontologies

1. **Create ontology file**
   ```bash
   # Create new .ttl file in ontology-hub/ontologies/
   touch ontology-hub/ontologies/my-domain.ttl
   ```

2. **Define SHACL constraints**
   ```bash
   # Create validation rules
   touch ontology-hub/shapes/my-domain.shacl.ttl
   ```

3. **Add SKOS mappings** (optional)
   ```bash
   # Map to Schema.org or other vocabularies
   touch ontology-hub/mappings/my-domain-mappings.ttl
   ```

4. **Validate and generate**
   ```bash
   kairos-ontology validate --ontologies ontology-hub/ontologies --shapes ontology-hub/shapes
   kairos-ontology project --ontologies ontology-hub/ontologies --output ontology-hub/output --target all
   ```

### Updating Reference Models

Update reference ontologies to a newer pinned version:

```bash
# Advance to latest remote HEAD and update versions.lock
.\update-referencemodels.ps1 -Update        # Windows
make update-industry                         # Linux / macOS

# Review the diff, then commit and open a PR
git add ontology-reference-models versions.lock
git commit -m "chore: bump reference-models to <new-sha>"
```

### Testing

```bash
# Run full validation
kairos-ontology validate --ontologies ontology-hub/ontologies --shapes ontology-hub/shapes

# Test catalog resolution
kairos-ontology catalog-test --catalog ontology-reference-models/catalog-v001.xml

# Generate test projections
kairos-ontology project --ontologies ontology-hub/ontologies --output test-output --target dbt
```

---

## 📊 Output Formats

### DBT (Data Build Tool)
SQL models and YAML schemas for data warehouses (Snowflake, BigQuery, Redshift)
- Location: `ontology-hub/output/dbt/`
- Files: `*.sql`, `schema_*.yml`

### Neo4j (Graph Database)
Cypher schema definitions for property graphs
- Location: `ontology-hub/output/neo4j/`
- Files: `*-schema.cypher`

### Azure AI Search
Index definitions and synonym maps for semantic search
- Location: `ontology-hub/output/azure-search/`
- Files: `indexes/*.json`, `synonym-maps/*.json`

### A2UI (JSON Schema)
Message schemas for UI frameworks and API contracts
- Location: `ontology-hub/output/a2ui/schemas/`
- Files: `*.schema.json`

### Prompt Packages
Compact JSON context for LLM prompts and AI agents
- Location: `ontology-hub/output/prompt/`
- Files: `*-context.json`, `*-context-detailed.json`

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch from `main`
   ```bash
   git checkout -b feature/my-new-ontology
   ```
3. **Make changes** to ontologies, shapes, or mappings
4. **Validate locally**
   ```bash
   kairos-ontology validate --ontologies ontology-hub/ontologies --shapes ontology-hub/shapes
   ```
5. **Commit** with conventional commits
   ```bash
   git commit -m "feat(customer): add loyalty program classes"
   ```
6. **Push** and create a pull request
7. **CI/CD** will automatically validate your changes

### Commit Convention

- `feat:` New features or ontology classes
- `fix:` Bug fixes or constraint corrections
- `docs:` Documentation updates
- `chore:` Maintenance tasks
- `refactor:` Code restructuring without functionality changes

---

## 🔄 CI/CD Automation

GitHub Actions workflows:

- **On Pull Request / push to main**: Validate ontologies against SHACL shapes (`validate.yml`)
- **On push to main**: Generate all output projections (`project.yml`)
- **On tag `v*.*.*`**: Validate, generate projections, and create a GitHub release (`release.yml`)
- **Weekly (Monday 08:00 UTC)**: Auto-discover latest toolkit release and latest reference-models commit, open a dependency-bump PR for review (`dependency-update.yml`)

All workflows install the toolkit at the exact version pinned in `versions.lock` — no floating `@main` references.

---

## 📝 License

This project is licensed under [MIT License](LICENSE) - see the LICENSE file for details.

---

## 🔗 Related Projects

- **[kairos-ontology-toolkit](https://github.com/Cnext-eu/kairos-ontology-toolkit)** - Validation and projection CLI tools
- **[kairos-ontology-referencemodels](https://github.com/Cnext-eu/kairos-ontology-referencemodels)** - FIBO and core reference ontologies

---

## 💬 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/Cnext-eu/kairos-ontology-customer-template/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Cnext-eu/kairos-ontology-customer-template/discussions)
- **Documentation**: [Kairos Ontology Toolkit Docs](https://github.com/Cnext-eu/kairos-ontology-toolkit)

---

**Built with ❤️ using the Kairos Ontology Platform**
