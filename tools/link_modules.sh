#!/usr/bin/env bash

#helper script to link all sd modules

MODULES=(sd-utils sd-random sd-model sd-expression-engine sd-computations sd-tree-designer)
mod_string=''

cd ..

cd ..

mod_string=''
for m in "${MODULES[@]}"
do
    cd $m
    npm link

    npm link $mod_string
    mod_string+=' '$m
    cd ..
done


cd SilverDecisions
npm link $mod_string

