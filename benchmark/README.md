# `compile-json-stringify` Benchmark

First update dependencies before running tests:

```sh
npm install # or npm update if already installed
```

Run tests:

```sh
node bench
```

Run specific tests:

```sh
node bench 2 # runs only test 2
node bench 1,2,3 # runs tests 1, 2, and 3 (make sure there are no spaces between the commas and numbers)
```

Compare master branch to local changes:

```sh
node bench --compare
node bench --compare 1,2
```
