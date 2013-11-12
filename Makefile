
test:
	@DEBUG=modella:mongo ./node_modules/.bin/mocha \
		-w \
		--reporter spec

.PHONY: test
