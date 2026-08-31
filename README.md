# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### Firestore seed data

This repo includes a small idempotent seed script to ensure required reference data exists.

- `Domain` collection: `ai → { name: "AI" }`, `medical-device → { name: "Medical Device" }`

The app also auto-seeds these two Domain docs once a user is signed in (so a fresh emulator starts clean).

Run it against the emulator:

- Start emulators: `npm run emulators`
- In a separate terminal: `npm run seed:firestore`

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the Jest unit test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### Staging environment and Playwright E2E

Staging is a **separate Firebase project** (`arial-ui-staging` in `.firebaserc`) so test users and Firestore data stay out of production. Smoke tests hit Auth + Firestore + Hosting only; they do not complete wizard save, so they do not create assessments in the production Cloud Run API.

**One-time setup** (requires `gcloud` + Firebase CLI login):

```
gcloud auth login
gcloud auth application-default login
npx firebase login
npm run setup:staging
```

The script creates (or reuses) GCP project `arial-ui-staging`, links billing, enables Auth/Firestore/Functions APIs, writes `.env.staging` and `functions/.env.arial-ui-staging`, creates the E2E user (`e2e` / password in `.env.staging`), seeds `Domain/ai` and `Domain/medical-device`, and grants the staging Functions service account `roles/run.invoker` on the production Cloud Run API.

If you have more than one billing account, pass `--billing-account=XXXXXX-XXXXXX-XXXXXX` (or set `BILLING_ACCOUNT`). Then deploy:

```
npm run deploy:staging
```

If Firebase assigned a different project id, pass `--project=your-id` (the script updates `.firebaserc`).

**Run tests against staging** (assumes staging is already deployed):

```
npx playwright install chromium
npm run test:e2e
```

`playwright.config.ts` loads `.env.staging` when present (`PLAYWRIGHT_BASE_URL`, `E2E_LOGIN_NAME`, `E2E_PASSWORD`). Interactive: `npm run test:e2e:ui`.

**CI:** `.github/workflows/e2e-staging.yml` runs on `workflow_dispatch` and pushes to the `staging` branch. Add GitHub secrets `PLAYWRIGHT_BASE_URL`, `E2E_LOGIN_NAME`, and `E2E_PASSWORD`.

To generate more smoke tests from a feature, ask the agent to use the `generate-e2e-tests` skill (`.cursor/skills/generate-e2e-tests/`).

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
