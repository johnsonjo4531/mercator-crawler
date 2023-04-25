build:
	npm run build 

release-patch:
	npm version patch && $(MAKE) push-publish

release-minor:
	npm version minor && $(MAKE) push-publish

push-publish:
	git push --all && npm publish

go:
	npm run build && node dist/examples/new-broken-example.js
