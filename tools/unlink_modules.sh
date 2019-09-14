#!/usr/bin/env bash

#helper script to unlink all sd modules

MODULES=(sd-utils sd-random sd-model sd-expression-engine sd-computations sd-tree-designer)
mod_string=''
for m in "${MODULES[@]}"
do
	mod_string+=' '$m
done

cd ..

cd ..

for m in "${MODULES[@]}"
do
    pwd
    cd $m
    echo $m
    npm unlink $mod_string
    npm install
    cd ..
done


cd SilverDecisions
npm unlink $mod_string
npm install
