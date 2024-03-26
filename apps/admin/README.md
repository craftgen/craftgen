---
title: Directus
description: Directus 9. An Instant App & API for your SQL Database.
buttonSource: https://railway.app/new/template/_dszdt?referralCode=codedgeekery
tags:
  - directus
  - cms
  - javascript
  - typescript
  - postgresql
  - s3
---

# Directus On Railway

This example deploys a self-hosted version of [Directus](https://directus.io). 

Internally it uses a PostgreSQL database to store the data and S3 to store files.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/_dszdt?referralCode=codedgeekery)

## ✨ Features

- Directus
- Postgres
- S3
- Slugs (via inclusion of [https://github.com/dimitrov-adrian/directus-extension-wpslug-interface](https://github.com/dimitrov-adrian/directus-extension-wpslug-interface))

## 💁‍♀️ How to use

- Click the Railway button 👆
- Add the environment variables
  - If you do not add the S3 related environment variables, your images/files will not be persisted between deploys.

## 📝 Notes

- After your app is deployed, visit the `/admin` endpoint to login using the initial admin user you entered during config.
- Railway's filesystem is ephemeral which is why any changes to the filesystem are not persisted between deploys. This is why, this example uses S3 for storage.

## Credit

Originally forked from [https://github.com/azrikahar/directus-railway-starter](https://github.com/azrikahar/directus-railway-starter) with S3 and Slugs support built in off the bat.
