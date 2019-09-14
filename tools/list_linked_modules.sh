#!/usr/bin/env bash
cd ..
\ls -F node_modules | sed -n 's/@$//p' | xargs npm ls -g --depth 0
