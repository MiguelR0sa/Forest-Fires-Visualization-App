import json

# get all information from the json file with the state ids
with open('../resources/idestados.json', 'r', encoding="UTF-8") as file:
    json_names = json.load(file)

aux_dic = {}
for names in json_names:
    aux_dic[names["id"]] = names["nome"]

region_dic = {1: "Norte", 2: "Nordeste", 3: "Sudeste", 4: "Sul", 5: "Centro-Oeste"}

# open the json file with information about the coordinates of the states and match the state ids from the previous json
# file, to the codarea present in this file here
with open('../resources/brazilstates.json', 'r', encoding="UTF-8") as file:
    json_data = json.load(file)
    geometries = json_data["objects"]["foo"]["geometries"]
    for geo in geometries:
        for item in geo["properties"]:
            if item == "codarea":
                geo["properties"][item] = aux_dic[int(geo["properties"][item])]

# update the codarea from ids to names of the states and changes the brazilstates.json. All files were obtained on the
# website present on the report.
with open('../resources/brazilstates.json', 'w', encoding="UTF-8") as file:
    json.dump(json_data, file, ensure_ascii=False)