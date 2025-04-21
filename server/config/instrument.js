// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "https://2421919fb8d1f4cfc00f9be69914be41@o4509169414438912.ingest.us.sentry.io/4509185905590272",
  integrations: [nodeProfilingIntegration(),
    Sentry.modulesIntegration()
  ],
 
  profilesSampleRate: 1.0,
});
