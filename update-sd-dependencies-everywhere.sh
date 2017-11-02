#!/usr/bin/env bash

#helper script to update versions of all silver decisions modules, requires all modules to be located in one common parent directory

MODULES=(sd-utils sd-random sd-model sd-expression-engine sd-computations sd-tree-designer)
mod_string=''
for m in "${MODULES[@]}"
do
	mod_string+=' '$m
done

ncu $mod_string -u
npm update $mod_string

cd ..

for m in "${MODULES[@]}"
do
    cd $m
	ncu $mod_string -u
    npm update $mod_string
    cd ..
done


