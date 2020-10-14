import re
import csv

tab = re.compile(r'\t+')
remove_new_line = re.compile(r'\n')
remove_quotes = re.compile(r'\"')
remove_periods = re.compile(r'\.')
csv_file = "../resources/rf_incendiosflorestais_focoscalor_estados_1998-2017.csv"
lines = []

# open CSV file with information about forest fires. Remove any unnecessary special characters.
with open(csv_file) as file:
    line = file.readline()
    while line:
        lines.append(tab.split(remove_periods.sub("", remove_new_line.sub("", remove_quotes.sub("", line)))))
        line = file.readline()

# can change the type of file (csv or tsv), and preproess data so it is more easy to use. Also, ensure UTF-8 encoding
# to maintain special characters from the names of the states.
file_type = "csv"
with open("../resources/new_" + file_type + "." + file_type, "w+", newline='', encoding="UTF-8") as file:
    delimit_type = ","
    if file_type == "tsv":
        delimit_type = "\t"
    writer = csv.writer(file, delimiter=delimit_type)
    writer.writerow(lines[0])
    for line in lines[1:]:
        new_line = [int(x) if x.isdigit() else x for x in line[:-1]]
        aux_data = line[-1].split("/")[1:]
        if new_line[2] != "Janeiro":
            if new_line[2] == "Fevereiro":
                aux_data[0] = "02"
            if new_line[2] == "Março":
                aux_data[0] = "03"
            if new_line[2] == "Abril":
                aux_data[0] = "04"
            if new_line[2] == "Maio":
                aux_data[0] = "05"
            if new_line[2] == "Junho":
                aux_data[0] = "06"
            if new_line[2] == "Julho":
                aux_data[0] = "07"
            if new_line[2] == "Agosto":
                aux_data[0] = "08"
            if new_line[2] == "Setembro":
                aux_data[0] = "09"
            if new_line[2] == "Outubro":
                aux_data[0] = "10"
            if new_line[2] == "Novembro":
                aux_data[0] = "11"
            if new_line[2] == "Dezembro":
                aux_data[0] = "12"
        string_data = "/".join(aux_data)
        new_line.append(string_data)
        writer.writerow(new_line)
