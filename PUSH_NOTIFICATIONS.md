# Mobile push notifications

AssistDesk can deliver system notifications to an opted-in browser or installed PWA while the app is closed. Delivery uses standard Web Push; the browser/device must support push, the site must use HTTPS, and users must allow notifications. On iPhone/iPad, users need iOS/iPadOS 16.4 or later and must add AssistDesk to the Home Screen before enabling alerts.

## Configure the server

Generate one VAPID key pair from the server folder and keep the private key secret:

```sh
node -e "console.log(JSON.stringify(require('web-push').generateVAPIDKeys(), null, 2))"
```

Set these environment variables on the API server (for example, Railway):

- `VAPID_PUBLIC_KEY` — generated public key
- `VAPID_PRIVATE_KEY` — generated private key; never commit or expose it to the client
- `VAPID_SUBJECT` — a valid contact such as `mailto:helpdesk@example.edu`

The app fetches the public key from `/api/push/public-key`, so no public key needs to be embedded in the client build. Keep the same VAPID key pair across deployments so existing device subscriptions remain valid. The server creates the `push_subscriptions` table during its normal non-destructive Sequelize sync.

## Enable on a device

Sign in on the phone, open the bell menu, choose **Enable phone alerts**, and allow the browser permission prompt. Each device/browser requires its own opt-in. Users can turn alerts off from the same menu. Notification previews intentionally use generic text to avoid putting ticket subjects on a lock screen; tapping an alert opens the dashboard.

If VAPID values are not configured, the enable action reports that the server is not configured yet. Browser permission can only be requested by the user, and a user who previously blocked it must re-enable it from device/browser settings.