# Kairos Ontology Hub — Task Runner
# Requires: GNU make, pip, curl, git
# Windows: use the equivalent .\update-*.ps1 scripts for update targets.
#
# Usage:
#   make install           — install pinned toolkit + dev deps
#   make validate          — validate ontologies (always deterministic)
#   make project           — generate all output projections
#   make update-toolkit    — fetch latest toolkit release → update versions.lock → install
#   make update-industry   — fetch latest reference-models commit → update versions.lock
#   make update-all        — run both update targets

-include versions.lock
export TOOLKIT_VERSION REFERENCE_MODELS_REF

ONTOLOGIES  = ontology-hub/ontologies
SHAPES      = ontology-hub/shapes
CATALOG     = ontology-reference-models/catalog-v001.xml
OUTPUT      = ontology-hub/output
TOOLKIT_URL = https://github.com/Cnext-eu/kairos-ontology-toolkit.git
REF_URL     = https://github.com/Cnext-eu/kairos-ontology-referencemodels.git

.PHONY: install validate project update-toolkit update-industry update-all

# ---------------------------------------------------------------------------
# install: install exactly the pinned versions — used in CI and local dev
# ---------------------------------------------------------------------------
install:
	pip install --upgrade pip
	pip install "git+https://$(TOOLKIT_URL)@v$(TOOLKIT_VERSION)"
	pip install -r requirements.txt

# ---------------------------------------------------------------------------
# validate: deterministic validation against pinned toolkit + pinned models
# ---------------------------------------------------------------------------
validate:
	kairos-ontology validate \
	  --ontologies $(ONTOLOGIES) \
	  --shapes $(SHAPES) \
	  --catalog $(CATALOG)

# ---------------------------------------------------------------------------
# project: generate all output projections
# ---------------------------------------------------------------------------
project:
	kairos-ontology project \
	  --ontologies $(ONTOLOGIES) \
	  --catalog $(CATALOG) \
	  --output $(OUTPUT) \
	  --target all

# ---------------------------------------------------------------------------
# update-toolkit: discover the latest release tag, update versions.lock,
#                 then reinstall. Run this before opening a bump PR.
# ---------------------------------------------------------------------------
update-toolkit:
	@echo "Fetching latest kairos-ontology-toolkit version..."
	@GH_TOKEN=""; \
	if command -v gh >/dev/null 2>&1; then GH_TOKEN=$$(gh auth token 2>/dev/null || true); fi; \
	AUTH=""; [ -n "$$GH_TOKEN" ] && AUTH="-H 'Authorization: Bearer $$GH_TOKEN'"; \
	LATEST=$$(eval curl -sf $$AUTH https://api.github.com/repos/Cnext-eu/kairos-ontology-toolkit/releases/latest 2>/dev/null \
	  | grep '"tag_name"' | sed 's/.*"v\([^"]*\)".*/\1/' || true); \
	if [ -z "$$LATEST" ]; then \
	  echo "  No releases found — trying tags..."; \
	  LATEST=$$(eval curl -sf $$AUTH https://api.github.com/repos/Cnext-eu/kairos-ontology-toolkit/tags 2>/dev/null \
	    | grep '"name"' | head -1 | sed 's/.*"v\([^"]*\)".*/\1/' || true); \
	fi; \
	if [ -z "$$LATEST" ]; then \
	  echo "ERROR: could not auto-detect latest version. Run: make update-toolkit VERSION=x.y.z" >&2; exit 1; \
	fi; \
	echo "  Current : $(TOOLKIT_VERSION)"; \
	echo "  Latest  : $$LATEST"; \
	sed -i "s/^TOOLKIT_VERSION=.*/TOOLKIT_VERSION=$$LATEST/" versions.lock; \
	echo "Updated versions.lock → TOOLKIT_VERSION=$$LATEST"; \
	pip install "git+$(TOOLKIT_URL)@v$$LATEST"

# ---------------------------------------------------------------------------
# update-industry: advance submodule to its remote HEAD, record the SHA in
#                  versions.lock. Does NOT push or commit — review first.
# ---------------------------------------------------------------------------
update-industry:
	@echo "Updating reference-models submodule to remote HEAD..."
	git submodule update --init --recursive --remote
	@NEW_REF=$$(git -C ontology-reference-models rev-parse HEAD); \
	echo "  Current : $(REFERENCE_MODELS_REF)"; \
	echo "  New ref : $$NEW_REF"; \
	sed -i "s/^REFERENCE_MODELS_REF=.*/REFERENCE_MODELS_REF=$$NEW_REF/" versions.lock; \
	echo "Updated versions.lock → REFERENCE_MODELS_REF=$$NEW_REF"

# ---------------------------------------------------------------------------
# update-all: update both toolkit and reference models in one shot
# ---------------------------------------------------------------------------
update-all: update-toolkit update-industry
	@echo ""
	@echo "All dependencies updated. Review versions.lock, then commit and open a PR."
