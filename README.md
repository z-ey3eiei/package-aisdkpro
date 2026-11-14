# create-app-aisdkpro

A starter generator for ai-sdk.pro Streaming Chat. It creates a standalone Next.js app with React, TypeScript and an AI SDK chat endpoint. Use Node.js 22 or newer and npm.

## Create and run

After the package is published to npm:

```sh
npm create app-aisdkpro@latest web-app
cd web-app
npm install
npm run dev
```

Open http://localhost:3000 and provide your own OpenAI API key in the app. The key stays in page and request memory. The generated app uses npm independently of the ai-sdk.pro monorepo.

## Push and deploy

Commit the generated source and `package-lock.json` to your GitHub repository. In Coolify, configure a Node.js web application using `npm ci`, `npm run build`, and `npm start`. Set `APP_ORIGIN` to the deployed HTTPS origin. Configure a push webhook for the deployment branch if you want automatic updates.

## Package from source

```sh
npm pack
```

The bundled starter lives in `template/`. See [LICENSE](LICENSE) for the repository's MIT license and [NOTICE](NOTICE) for upstream attribution and the accompanying Apache 2.0 license.
