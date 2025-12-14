# Ship Inspector
A utility to help track poker hands that have been played.

## Usage

### Build Common Library

```bash
cd common
npm run build
```

### Start up the server

```bash
cd server
npm run watch
```

### Start up the web app in a new terminal window

```bash
cd web
npm run start
```

### Helpful commands

#### Lint
```bash
cd web
npm run lint
```

#### Test on Server
```bash
cd server
npm test -- hand.spec.ts
```