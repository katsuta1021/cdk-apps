#!/bin/bash
git pull
npm run build
npx cdk synth
npx cdk deploy
