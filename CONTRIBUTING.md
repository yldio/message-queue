## Contributing

Everyone is welcome to send patches.

If you believe you found a bug please report it as an issue first, maybe it's a known limitation or something that is supposed to behave that way.

Please remember this is an open source project, just because there's an issue there is no guarantee it will be fixed.

If you want something fixed the best alternative is a DIY.

If you have fixed something and you would like it merged to master please make sure your pull request follows these rules:

— [ ] My patch is isolated in a new branch, which name includes the issue I opened
- [ ] Includes Documentation for new functionality
- [ ] Follows the same code style as the rest of the code
- [ ] Follows the `.jshintrc` file specified
- [ ] Keeps code coverage at 100%
- [ ] Adds sufficient tests to test the new functionality, or adds new tests to identify bugs
- [ ] My patch includes no changes that do not relate to the issue reported. If you do find other things that need fixing, please do make a new pull request.

To run tests you can do:

``` sh
npm test
```

If you are developing an adapter and want to make sure you didn't break others you can do something like

``` sh
ADAPTERS=redis,amqp npm test
```

You can also run individual tests, using node. e.g.

``` sh
node debug test/lib/publish.js
```

To check for code style and jshint you can use the following scripts:

``` sh
npm run codestyle
npm run jshint
```
