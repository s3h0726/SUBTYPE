"""Extract train sections from Taiwan Railway's two published ODS layouts."""

import re
from xml.etree import ElementTree as ET
from zipfile import ZipFile

TABLE = "{urn:oasis:names:tc:opendocument:xmlns:table:1.0}"
TEXT = "{urn:oasis:names:tc:opendocument:xmlns:text:1.0}"
TRAIN = re.compile(r"(\d{2,5})(?:追)?$")
TIME = re.compile(r"\d{1,2}:[0-5]\d$")
CLASS = ("區間", "自強", "莒光", "普悠瑪", "太魯閣", "復興", "柴聯")


def name(value):
    return re.sub(r"\s+", "", value).replace("臺", "台")


def sheets(path):
    with ZipFile(path) as archive:
        root = ET.fromstring(archive.read("content.xml"))
    for sheet in root.iter(TABLE + "table"):
        grid = []
        for row in sheet.iter(TABLE + "table-row"):
            values = []
            for cell in row:
                paragraphs = cell.findall(TEXT + "p")
                value = " ".join("".join(text.itertext()) for text in paragraphs).strip()
                count = int(cell.get(TABLE + "number-columns-repeated", "1"))
                values.extend([value] * min(count, 512 - len(values)))
                if len(values) == 512:
                    break
            if any(values):
                grid.append(values)
        yield sheet.get(TABLE + "name", ""), grid


def cell(row, index):
    return row[index] if index < len(row) else ""


def record(train, train_class, origin, destination, calls, restriction, sheet):
    return {
        "trip_id": train, "service_class": train_class, "origin": name(origin), "destination": name(destination),
        "calls": calls, "operating_notes": restriction, "section": sheet, "valid_from": "2026-07-01",
    }


def extract_express(sheet, grid):
    for header, row in enumerate(grid):
        if header < 4 or row.count("↓") < 3 or any(TIME.fullmatch(value) for value in row):
            continue
        for column, arrow in enumerate(row):
            if arrow != "↓" or column < 5:
                continue
            train = cell(grid[header - 3], column)
            train_class = cell(grid[header - 4], column)
            if not TRAIN.fullmatch(train) or not train_class.startswith(CLASS):
                continue
            destination = cell(grid[header + 1], column)
            restriction = cell(grid[header + 2], column)
            calls = []
            for data in grid[header + 2:]:
                label = name(cell(data, 0))
                value = cell(data, column)
                if label and re.search(r"[一-龯]", label) and TIME.fullmatch(value):
                    calls.append([label, value])
            if len(calls) >= 2:
                yield record(train, train_class, cell(grid[header - 1], column), destination, calls, restriction, sheet)
        break


def extract_locals(sheet, grid):
    for header, row in enumerate(grid):
        for boundary, value in enumerate(row):
            if not name(value).startswith("站名"):
                continue
            start = next((index for index in range(boundary - 1, -1, -1)
                          if name(row[index]) == "車"), -1)
            following = grid[header + 1:header + 4]
            if start < 0:
                continue
            def train_number(data):
                return next((match for value in data[start + 1:boundary]
                             if (match := TRAIN.fullmatch(value))), None)
            names = []
            for column in range(boundary + 1, len(row)):
                if not row[column] and not any(cell(other, column) for other in following[:1]):
                    break
                suffix = []
                for other in following:
                    if train_number(other):
                        break
                    suffix.append(cell(other, column))
                names.append(name(row[column] + "".join(suffix)))
            if len(names) < 2:
                continue
            for data in grid[header + 1:]:
                train = train_number(data)
                train_class = cell(data, start)
                if not train or not train_class.startswith(CLASS):
                    continue
                ends = re.split(r"[－–→]", cell(data, boundary), maxsplit=1)
                if len(ends) != 2:
                    continue
                calls = [[label, cell(data, column)] for column, label in enumerate(names, boundary + 1)
                         if label and TIME.fullmatch(cell(data, column))]
                if len(calls) >= 2:
                    yield record(train[1], train_class, *ends, calls, " ".join(data[boundary + 1 + len(names):]).strip(), sheet)


def read_tra_section(path):
    trips = []
    for sheet, grid in sheets(path):
        trips.extend(extract_express(sheet, grid))
        trips.extend(extract_locals(sheet, grid))
    return trips


def compare_tra(route, trips_by_train, patterns):
    checked, exact, partial, differences = set(), set(), set(), set()
    names = {item[0]: {name(label) for label in item[1]} for item in route["station_records"]}
    for pattern in route["runtime_patterns"]:
        calls = [names.get(stop, set()) for stop in pattern["stops"]]
        for train in patterns.get(pattern["id"], ()):
            for trip in trips_by_train.get(str(train), ()):
                observed = [call[0] for call in trip["calls"]]
                checked.add(pattern["id"])
                matches = any(all(stop in aliases for stop, aliases in zip(observed, calls[start:]))
                              for start in range(len(calls) - len(observed) + 1))
                if not matches:
                    differences.add((pattern["id"], train))
                elif len(observed) == len(calls) and observed[0] == trip["origin"] and observed[-1] == trip["destination"]:
                    exact.add(pattern["id"])
                else:
                    partial.add(pattern["id"])
    return checked, exact, partial, differences
