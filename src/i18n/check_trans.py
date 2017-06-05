import json
import sys
import glob

def list_differences(a, b, path=""):
    allok = True
    for key in a:
        if key in b:
            val_a = a[key]
            val_b = b[key]
            if type(val_a) != type(val_b):
                print("\twrong value: " + path + "/" + key)
                allok = False
            else:
                if isinstance(val_a, dict):
                    if not list_differences(val_a, val_b, path + "/" + key):
                        allok = False
                else:
                    if strict:
                        if val_a == val_b:
                            print("\tmissing translation: " + path + "/" + key)
                            print("\t\toriginal:    " + val_a)
                            print("\t\ttranslation: " + val_a)
                            allok = False
        else:
            print("\tmissing key: " + path + "/" + key)
            allok = False

    for key in b:
        if not key in a:
            print("\textra key:   " + path + "/" + key)
            allok = False

    return allok

help = False
fname_list = glob.glob("*.json")
strict = False
if len(sys.argv) > 1:
    if sys.argv[1] == "-s":
        strict = True
        print("Strict checking of translations mode\n")
        if len(sys.argv) > 2:
            fname_list = [sys.argv[2]]
            print("Checking only ", fname_list[0], "\n")
    elif sys.argv[1] == "-m":
        print("Minimal checking of translations mode\n")
        if len(sys.argv) > 2:
            fname_list = [sys.argv[2]]
            print("Checking only ", fname_list[0], "\n")
    else:
        help = True
else:
    help = True
if len(sys.argv) > 3:
    help = True

if help:
    print("usage: python check_trans.py -(m|s) [filename]")
    print("one option must be chosen:")
    print("    -m: minimal checking")
    print("    -s: strict checking")
    print("if [filename] is given only one file is checked")
    print("otherwise all JSON files are checked")
    exit(1)

with open("en.json") as data_file:  
    ref = json.load(data_file)

for fname in fname_list:
    if fname == "en.json":
        continue
    with open(fname) as data_file:
        test = json.load(data_file)
        print("Testing language file:", fname)
        print("Result:" , list_differences(ref, test), "\n")

