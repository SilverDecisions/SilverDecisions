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
                            allok = False
        else:
            print("\tmissing key: " + path + "/" + key)
            allok = False

    for key in b:
        if not key in a:
            print("\textra key:   " + path + "/" + key)
            allok = False

    return allok

strict = False
if len(sys.argv) > 1:
    if sys.argv[1] == "-s":
        strict = True
        print("Strict checking of translations mode\n")

with open("en.json") as data_file:  
    ref = json.load(data_file)

for fname in glob.glob("*.json"):
    with open(fname) as data_file:
        test = json.load(data_file)
        print("Testing language file:", fname)
        print("Result:" , list_differences(ref, test), "\n")

