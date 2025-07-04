#!/bin/bash
git pull
npm run build
npx cdk deploy
