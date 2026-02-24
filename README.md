# Getting started with vinext and Replicate

![screenshot of the app generating an iguana](public/screenshot.png)

This is a [vinext](https://github.com/cloudflare/vinext) starter app that uses [Replicate](https://replicate.com) to generate images with [Flux Schnell](https://replicate.com/black-forest-labs/flux-schnell). It deploys to [Cloudflare Workers](https://developers.cloudflare.com/workers/).

vinext is a drop-in replacement for Next.js built on [Vite](https://vite.dev/). It reimplements the Next.js API surface so your existing `app/` directory, route handlers, and `next/*` imports work as-is, but the build runs on Vite and deploys to Cloudflare Workers with a single command.

This project is the vinext equivalent of [replicate/getting-started-nextjs](https://github.com/replicate/getting-started-nextjs).

## Noteworthy files

- [app/page.tsx](app/page.tsx) - React client component that renders the prompt form and displays generated images
- [app/api/predictions/route.ts](app/api/predictions/route.ts) - API route that calls Replicate's API to create a prediction
- [app/api/predictions/\[id\]/route.ts](app/api/predictions/[id]/route.ts) - API route that polls Replicate's API for the prediction result
- [app/api/webhooks/route.ts](app/api/webhooks/route.ts) - API route that receives and validates webhooks from Replicate
- [worker/index.ts](worker/index.ts) - Cloudflare Worker entry point with image optimization
- [vite.config.ts](vite.config.ts) - Vite config with vinext and Cloudflare plugins
- [wrangler.jsonc](wrangler.jsonc) - Cloudflare Worker configuration

## Running the app

Install dependencies:

```
npm install
```

Create a `.dev.vars` file for local secrets (this is how Cloudflare Workers handle environment variables in development):

```
echo "REPLICATE_API_TOKEN=<your-token-here>" > .dev.vars
```

Replace `<your-token-here>` with your [Replicate API token](https://replicate.com/account/api-tokens). The `.dev.vars` file is git-ignored.

Run the development server:

```
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deploying to Cloudflare Workers

```
npm run deploy
```

This builds the app and deploys it to Cloudflare Workers. You'll need to be logged in to Cloudflare via `npx wrangler login`.

After deploying, set your Replicate API token as a secret:

```
npx wrangler secret put REPLICATE_API_TOKEN
```

## Webhooks

Webhooks provide real-time updates about your predictions. When you create a prediction, you can specify a URL that Replicate will send HTTP POST requests to as the prediction progresses.

### How webhooks work

1. The `WORKER_URL` (or `NGROK_HOST` in development) environment variable is used to construct the webhook URL when creating a prediction in [app/api/predictions/route.ts](app/api/predictions/route.ts).
2. Replicate sends POST requests to the handler in [app/api/webhooks/route.ts](app/api/webhooks/route.ts) as the prediction is updated.

### Requesting and receiving webhooks

To test webhooks in development, you need a secure tunnel so Replicate can reach your local server:

1. [Download and set up `ngrok`](https://replicate.com/docs/webhooks#testing-your-webhook-code)
2. Run ngrok: `ngrok http 5173`
3. Add the ngrok URL to `.dev.vars`: `NGROK_HOST=https://your-id.ngrok.app`
4. Leave ngrok running
5. In a separate terminal, run `npm run dev`
6. Open [localhost:5173](http://localhost:5173) and enter a prompt

For production, set `WORKER_URL` to your Worker's URL (e.g. `https://getting-started-vinext.you.workers.dev` or your custom domain):

```
npx wrangler secret put WORKER_URL
```

### Validating incoming webhooks

1. Get your signing secret:
   ```
   curl -s -X GET -H "Authorization: Bearer $REPLICATE_API_TOKEN" https://api.replicate.com/v1/webhooks/default/secret
   ```
2. Add the secret to `.dev.vars`: `REPLICATE_WEBHOOK_SIGNING_SECRET=whsec_...`
3. Now webhook requests will be validated in [app/api/webhooks/route.ts](app/api/webhooks/route.ts).

For production:
```
npx wrangler secret put REPLICATE_WEBHOOK_SIGNING_SECRET
```
