.PHONY: help

.DEFAULT_GOAL := help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install:## Install npm dependencies
	@echo "Installing Node dependencies"
	@yarn install

docs_publish:## Copying files in docs
	@echo "Copying files in docs"
	@cp README.md docs/README.md && cp CHANGELOG.md docs/CHANGELOG.md

clean:## Clean lib
	@echo "Clean lib"
	@rm -rf lib/*
