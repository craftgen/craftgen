## Deploy to Fly

You can use this repository as a jumping off point for deploying a self-hosted version of [Trigger.dev](https://trigger.dev) on Fly.io using the Trigger.dev public docker image located at `ghcr.io/triggerdotdev/trigger.dev:latest`

### Fork this repository and change the app name

You should fork this repository before starting so you can make changes and commit them. For example, you'll need to change the `app` property in the `fly.toml` file to be something other than `app = "trigger-v2-fly-demo"`.

### Install and configure the fly.io CLI

Install the Fly CLI tool:

```sh
brew install flyctl
```

Authenticate the CLI:

```sh
fly auth login
```

### Create the fly.io app and pg db

Launch the app:

```sh
fly launch
```

Follow the prompts by `fly launch` and make sure to answer them in the following way:

```sh
? Would you like to copy its configuration to the new app? Yes
? Choose an app name (leaving blank will default to 'trigger-v2-fly-demo') <enter your preferred app name here or leave blank>
? Would you like to set up a Postgresql database now? Yes
? Select configuration: Development - Single node, 1x shared CPU, 256MB RAM, 1GB disk <- feel free to pick a beefier machine
? Would you like to set up an Upstash Redis database now? No
? Would you like to deploy now? No
```

### Gather your secret environment variables

#### AUTH_GITHUB_CLIENT_ID and AUTH_GITHUB_CLIENT_SECRET (optional)

If you plan on logging in with GitHub auth, you'll need to create a GitHub OAuth app with the following configuration:

![github oauth](./assets/github-oauth.png)

Once you register the application you'll need to click on the "Generate new client secret" button:

![github generate new secret](./assets/github-generate-new-secret.png)

And then you can copy out the AUTH_GITHUB_CLIENT_ID and AUTH_GITHUB_CLIENT_SECRET:

![github copy secrets](assets/github-secrets.png)

#### RESEND_API_KEY and FROM_EMAIL, REPLY_TO_EMAIL (required)

We use [Resend.com](https://resend.com) for email sending (including the magic-link signup/login system). They have a generous free tier of 100 emails a day that should be sufficient. Signup for Resend.com and enter the required environment vars below

#### MAGIC_LINK_SECRET, SESSION_SECRET and ENCRYPTION_KEY (required)

All of these secrets should be generated 16 byte random strings, which you can easily generate (and copy into your pasteboard) with the following command:

```sh
openssl rand -hex 16 | pbcopy
```

#### DIRECT_URL (required)

This needs to match the value of `DATABASE_URL` which was printed to your terminal after the creation step above:

```sh
The following secret was added to <app name>:
  DATABASE_URL=postgres://postgres:<PASSWORD>@<fly db name>.flycast:5432/<app name>?sslmode=disable
```

#### LOGIN_ORIGIN and APP_ORIGIN (required)

Both of these secrets should be set to the base URL of your fly application. For example `https://trigger-v2-fly-demo.fly.dev`

### Set the secrets

Call the `fly secrets set` command to stage the secrets to be used on first deploy:

```sh
fly secrets set \
  ENCRYPTION_KEY=<random string> \
  MAGIC_LINK_SECRET=<random string> \
  SESSION_SECRET=<random string> \
  LOGIN_ORIGIN="https://<fly app name>.fly.dev" \
  APP_ORIGIN="https://<fly app name>.fly.dev" \
  DIRECT_URL="postgres://postgres:<PASSWORD>@<fly db name>.flycast:5432/<app name>?sslmode=disable" \
  FROM_EMAIL="Acme Inc. <hello@yourdomain.com>" \
  REPLY_TO_EMAIL="Acme Inc. <reply@yourdomain.com>" \
  RESEND_API_KEY=<your API Key> \
  AUTH_GITHUB_CLIENT_ID=<your GitHub OAuth Client ID> \
  AUTH_GITHUB_CLIENT_SECRET=<your GitHUb OAuth Client Secret>

Secrets are staged for the first deployment
```

### Deploy

Now you can deploy to fly. Here we are setting the machine VM size to use 1 dedicated CPU core with 2 GB of memory, but you can run `fly platform vm-sizes` to see other options. The below app will cost about $30/month.

```sh
fly deploy --vm-size performance-1x
```

### Visit and create an account

Once deployed, you should be able to open `https://<your fly app name>.fly.dev/` in your browser and create an account, either using GitHub or a magic email link.

### Initialize your Next.js project

Next you can easily bootstrap your Next.js project to use your self-hosted instance of Trigger.dev.

First, `cd` into your Next.js project, then run the `@trigger.dev/cli init` command to initialize your Next.js project:

```sh
npx @trigger.dev/cli@latest init -t "https://<your fly app name>.fly.dev"
```

When it asks for your development API key, head over to your self-hosted Trigger.dev dashboard and select the initial project you created when signing up, and head to the `Environments & API Keys` page to copy your `dev` API key:

![api key](./assets/api-key.png)

### Start your dev server

Run your Next.js project dev server with `npm run dev` and then in a new terminal window you will need to run the `@trigger.dev/cli dev` command to connect to your Trigger.dev instance and allow it to tunnel to your local Next.js server:

```sh
npx @trigger.dev/cli@latest dev
```

At this point you should be able to navigate to your Trigger.dev dashboard and view your registered jobs
