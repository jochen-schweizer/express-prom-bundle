.PHONY: coverage

test:
	npm test
lint:
	npx eslint src
	npm run dtslint-next
coverage:
	node_modules/istanbul/lib/cli.js cover \
		-i 'src/*' \
		--include-all-sources \
		--dir coverage \
		node_modules/jasme/run.js

coveralls: coverage
ifndef COVERALLS_REPO_TOKEN
	$(error COVERALLS_REPO_TOKEN is undefined)
endif
	node_modules/coveralls/bin/coveralls.js < coverage/lcov.info
