# Deployment Notes

See [README.md](./README.md) for the full deployment workflow.

Recommended production domains for this app:

- website: `nana.ibnbatoutaweb.com`
- admin: `admin.nana.ibnbatoutaweb.com`

Recommended Coolify process:

1. Deploy with generated domains first.
2. Verify both generated HTTPS URLs work.
3. Switch website to `https://nana.ibnbatoutaweb.com:3001`.
4. Switch admin to `https://admin.nana.ibnbatoutaweb.com:3101`.
5. Enable GitHub auto-deploy with `COOLIFY_WEBHOOK_PROD` and `COOLIFY_TOKEN_PROD`.
