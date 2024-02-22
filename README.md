# What is it

This project is a starting point for you to develop a Netsuite Application using TypeScript. It is a boilerplate that contains the basic structure and configuration to start a new project. It is based on the [Netsuite SuiteScript 2.0](https://developers.suitecommerce.com/section1547688820) and [SuiteScript 2.1](https://developers.suitecommerce.com/section1547688820) APIs.

This version of the boilerplate is still in development and is not ready for production use. It is a work in progress and we are still adding new features and improving the existing ones.

**Important** This project is not officially supported by Oracle Netsuite. It is a community-driven project and it is not affiliated with Oracle Netsuite.

## Usage

### How to compile the application

During development, the project is run using TypeScript directly, but to run it in production mode you'll need to compile it to JavaScript. To compile the application use the following command:

If you want to compile the files and watch for changes, use:

```sh
npm run ts:watch
```

To compile the files once, use:

```sh
npm run ts:compile
```

## Tests

The boilerplate is prepared to run tests using Jest. We usually group the tests in folders called `__tests__` (following Jest convention) for each module of the application. To run the tests use the following command:

```sh
npm run test
```
